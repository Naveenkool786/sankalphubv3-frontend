import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { FEATURE_FLAGS } from '@/lib/feature-flags'
import { TestingListClient } from './_components/TestingListClient'

export default async function TestingPage() {
  if (!FEATURE_FLAGS.TESTING_LAB_ENABLED) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FFF8E1' }}>
            <span className="text-2xl">🔬</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Testing & Lab Management</h2>
          <p className="text-sm text-muted-foreground mb-6">Track fabric and garment testing across physical, chemical, colorfastness, and performance tests with certified lab partners.</p>
          <p className="text-lg font-bold mb-4" style={{ color: '#D4A843' }}>$79/month add-on</p>
          <a href="/demo" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#D4A843' }}>Contact Us</a>
        </div>
      </div>
    )
  }

  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const [{ data: requests }, { data: labs }] = await Promise.all([
    (supabase.from('test_requests') as any).select('*, lab_partners(lab_name), projects!inner(name, org_id)').eq('projects.org_id', ctx.orgId).order('created_at', { ascending: false }),
    (supabase.from('lab_partners') as any).select('id, lab_name').eq('is_active', true).order('lab_name'),
  ])

  return (
    <div className="p-6 lg:p-8">
      <TestingListClient
        requests={(requests ?? []) as any[]}
        labs={(labs ?? []) as any[]}
        canManage={canManage(ctx.role)}
      />
    </div>
  )
}
