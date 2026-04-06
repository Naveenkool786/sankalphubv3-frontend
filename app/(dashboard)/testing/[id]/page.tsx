import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { TestingDetailClient } from './_components/TestingDetailClient'

export default async function TestingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const [{ data: request }, { data: results }] = await Promise.all([
    (supabase.from('test_requests') as any).select('*, lab_partners(lab_name), projects(name)').eq('id', id).single(),
    (supabase.from('test_results') as any).select('*').eq('test_request_id', id).order('created_at'),
  ])

  if (!request) return <div className="p-6 lg:p-8 text-center text-muted-foreground">Test request not found.</div>

  return (
    <div className="p-6 lg:p-8">
      <TestingDetailClient request={request} results={(results ?? []) as any[]} canManage={canManage(ctx.role)} />
    </div>
  )
}
