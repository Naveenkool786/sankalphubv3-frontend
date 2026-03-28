import { Factory } from 'lucide-react'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { createClient } from '@/lib/supabase/server'
import { FactoriesClient } from './_components/FactoriesClient'

export default async function FactoriesPage() {
  const ctx = await getUserContext()
  const supabase = await createClient()

  const [{ data: factories }, { data: inspections }, { data: projects }] = await Promise.all([
    (supabase.from('factories') as any).select('*').eq('org_id', ctx.orgId).order('created_at', { ascending: false }),
    (supabase.from('inspections') as any).select('id, factory_id, result').eq('org_id', ctx.orgId),
    (supabase.from('projects') as any).select('id, name, factory_id, status').eq('org_id', ctx.orgId),
  ])

  // Calculate pass rates per factory
  const factoryStats: Record<string, { total: number; passed: number }> = {}
  for (const insp of (inspections ?? []) as any[]) {
    if (!insp.factory_id) continue
    if (!factoryStats[insp.factory_id]) factoryStats[insp.factory_id] = { total: 0, passed: 0 }
    factoryStats[insp.factory_id].total++
    if (insp.result === 'pass') factoryStats[insp.factory_id].passed++
  }

  const enrichedFactories = ((factories ?? []) as any[]).map((f: any) => {
    const stats = factoryStats[f.id]
    const passRate = stats && stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : null
    const totalInspections = stats?.total ?? 0
    return { ...f, passRate, totalInspections }
  })

  return (
    <div className="p-6 lg:p-8">
      <FactoriesClient
        factories={enrichedFactories}
        projects={(projects ?? []) as any[]}
        userRole={ctx.role}
      />
    </div>
  )
}
