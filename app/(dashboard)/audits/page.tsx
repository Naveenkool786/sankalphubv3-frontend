import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { AuditListClient } from './_components/AuditListClient'
import { seedAuditTemplates } from '@/lib/actions/audits'

export default async function AuditsPage() {
  await seedAuditTemplates()
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const { data: audits } = await (supabase.from('factory_audits_v2') as any)
    .select('*, factories!inner(name, city, country, org_id), audit_templates(template_name, standard)')
    .eq('factories.org_id', ctx.orgId)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 lg:p-8">
      <AuditListClient audits={(audits ?? []) as any[]} canManage={canManage(ctx.role)} />
    </div>
  )
}
