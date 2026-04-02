import { getUserContext } from '@/lib/getUserContext'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { FileSearch, Plus, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const RESULT_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  approved:    { bg: '#E1F5EE', color: '#085041', label: 'Approved' },
  conditional: { bg: '#FAEEDA', color: '#633806', label: 'Conditional' },
  failed:      { bg: '#FCEBEB', color: '#791F1F', label: 'Failed' },
}

export default async function AuditHistoryPage({ searchParams }: { searchParams: Promise<{ factoryId?: string }> }) {
  const params = await searchParams
  const ctx = await getUserContext()

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const admin = serviceKey ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey) : null
  const supabase = admin ?? await createClient()

  let query = (supabase.from('factory_audits') as any)
    .select('*, factories(name)')
    .eq('org_id', ctx.orgId)
    .order('audit_date', { ascending: false })

  if (params.factoryId) {
    query = query.eq('factory_id', params.factoryId)
  }

  const { data: audits } = await query
  const auditList = (audits ?? []) as any[]

  // Get factory name for filter header
  let filterFactoryName = ''
  if (params.factoryId && auditList.length > 0) {
    filterFactoryName = auditList[0]?.factories?.name || ''
  }

  return (
    <div className="p-6 lg:p-8 max-w-[900px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileSearch className="w-6 h-6 text-primary" />
            Factory Audits
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filterFactoryName ? `Audit history for ${filterFactoryName}` : `${auditList.length} audit${auditList.length !== 1 ? 's' : ''} across all factories`}
          </p>
        </div>
        <div className="flex gap-2">
          {filterFactoryName && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/audits/factory">View all</Link>
            </Button>
          )}
          <Button size="sm" asChild>
            <Link href={params.factoryId ? `/audits/factory/new?factoryId=${params.factoryId}` : '/audits/factory/new'}>
              <Plus className="w-4 h-4 mr-1.5" /> New Audit
            </Link>
          </Button>
        </div>
      </div>

      {auditList.length === 0 ? (
        <div className="text-center py-16">
          <FileSearch className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No audits yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Start your first factory audit to track compliance scores.</p>
          <Button asChild>
            <Link href="/audits/factory/new"><Plus className="w-4 h-4 mr-1.5" /> New Audit</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {auditList.map((audit: any) => {
            const rs = RESULT_STYLE[audit.result] || RESULT_STYLE.failed
            return (
              <div key={audit.id} className="flex items-center gap-4 p-3.5 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
                {/* Score */}
                <div style={{
                  width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', fontWeight: 600,
                  background: rs.bg, color: rs.color,
                }}>
                  {audit.total_score}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-foreground truncate">{audit.factories?.name || 'Unknown'}</span>
                    <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, background: rs.bg, color: rs.color }}>
                      {rs.label}
                    </span>
                    {audit.status === 'draft' && (
                      <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', background: 'var(--muted)', color: 'var(--muted-foreground)' }}>Draft</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {audit.audit_type?.replace('_', ' ')} &middot; {new Date(audit.audit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} &middot; {audit.auditor_name}
                  </div>
                </div>

                {/* Report link */}
                {audit.report_url && (
                  <a href={audit.report_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Report
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
