import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { SamplingListClient } from './_components/SamplingListClient'

export default async function SamplingPage() {
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const [{ data: samples }, { data: factories }] = await Promise.all([
    (supabase.from('sample_requests') as any)
      .select('*, factories(name), projects(name)')
      .order('created_at', { ascending: false }),
    (supabase.from('factories') as any)
      .select('id, name').eq('is_active', true).order('name'),
  ])

  return (
    <div className="p-6 lg:p-8">
      <SamplingListClient
        samples={(samples ?? []) as any[]}
        factories={(factories ?? []) as any[]}
        canManage={canManage(ctx.role)}
      />
    </div>
  )
}
