import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { SamplingDetailClient } from './_components/SamplingDetailClient'

export default async function SamplingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const [{ data: sample }, { data: comments }, { data: measurements }] = await Promise.all([
    (supabase.from('sample_requests') as any).select('*, factories(name), projects(name)').eq('id', id).single(),
    (supabase.from('sample_comments') as any).select('*, profiles:created_by(full_name)').eq('sample_request_id', id).order('created_at', { ascending: false }),
    (supabase.from('sample_measurements') as any).select('*').eq('sample_request_id', id).order('size').order('point_of_measure'),
  ])

  if (!sample) return <div className="p-6 lg:p-8 text-center text-muted-foreground">Sample request not found.</div>

  return (
    <div className="p-6 lg:p-8">
      <SamplingDetailClient
        sample={sample}
        comments={(comments ?? []) as any[]}
        measurements={(measurements ?? []) as any[]}
        canManage={canManage(ctx.role)}
        userRole={ctx.role}
      />
    </div>
  )
}
