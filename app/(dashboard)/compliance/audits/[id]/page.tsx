import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { AuditDetailClient } from './_components/AuditDetailClient'

export default async function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const { data: audit } = await (supabase.from('factory_audits') as any).select('*, factories(name)').eq('id', id).single()
  if (!audit) return <div className="p-6 lg:p-8 text-center text-muted-foreground">Audit not found.</div>

  return (
    <div className="p-6 lg:p-8">
      <AuditDetailClient audit={audit} canManage={canManage(ctx.role)} />
    </div>
  )
}
