import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { FEATURE_FLAGS } from '@/lib/feature-flags'
import { ComplianceDashboardClient } from './_components/ComplianceDashboardClient'

export default async function CompliancePage() {
  if (!FEATURE_FLAGS.COMPLIANCE_ENABLED) {
    return (
      <div className="p-6 lg:p-8 text-center">
        <div className="bg-card rounded-xl border border-border p-12 max-w-lg mx-auto">
          <h2 className="text-lg font-bold mb-2">Compliance & Certifications</h2>
          <p className="text-sm text-muted-foreground mb-4">This module is a paid add-on. Contact us to enable it.</p>
        </div>
      </div>
    )
  }

  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const now = new Date().toISOString().split('T')[0]
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  const in60 = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]

  const [{ data: audits }, { data: certs }, { data: metrics }, { data: recentAudits }] = await Promise.all([
    (supabase.from('factory_audits') as any).select('id, status, next_audit_date, factories!inner(org_id)').eq('factories.org_id', ctx.orgId).neq('status', 'closed'),
    (supabase.from('product_certifications') as any).select('id, status, expiry_date, projects!inner(org_id)').eq('projects.org_id', ctx.orgId),
    (supabase.from('sustainability_metrics') as any).select('esg_score, factories!inner(org_id)').eq('factories.org_id', ctx.orgId).not('esg_score', 'is', null),
    (supabase.from('factory_audits') as any).select('*, factories!inner(name, org_id)').eq('factories.org_id', ctx.orgId).order('created_at', { ascending: false }).limit(5),
  ])

  const upcomingAudits = (audits ?? []).filter((a: any) => a.next_audit_date && a.next_audit_date <= in30).length
  const expiringCerts = (certs ?? []).filter((c: any) => c.expiry_date && c.expiry_date <= in60 && c.expiry_date >= now).length
  const openCARs = (audits ?? []).filter((a: any) => a.status === 'corrective_action_required').length
  const avgESG = (metrics ?? []).length > 0 ? Math.round((metrics ?? []).reduce((s: number, m: any) => s + (m.esg_score || 0), 0) / (metrics ?? []).length) : 0

  return (
    <div className="p-6 lg:p-8">
      <ComplianceDashboardClient
        upcomingAudits={upcomingAudits}
        expiringCerts={expiringCerts}
        openCARs={openCARs}
        avgESG={avgESG}
        recentAudits={(recentAudits ?? []) as any[]}
        canManage={canManage(ctx.role)}
      />
    </div>
  )
}
