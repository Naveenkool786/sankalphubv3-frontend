import { getUserContext, canManage } from '@/lib/getUserContext'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { FactoriesClient } from './_components/FactoriesClient'

export default async function FactoriesPage() {
  const ctx = await getUserContext()

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const admin = serviceKey
    ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
    : null
  const supabase = admin ?? await createClient()

  const [{ data: factories }, { data: inspections }, { data: projects }, { data: orders }] = await Promise.all([
    (supabase.from('factories') as any).select('*').eq('org_id', ctx.orgId).order('created_at', { ascending: false }),
    (supabase.from('inspections') as any).select('id, factory_id, result').eq('org_id', ctx.orgId),
    (supabase.from('projects') as any).select('id, name, factory_id, status').eq('org_id', ctx.orgId),
    (supabase.from('orders') as any).select('id, factory_id, status').eq('org_id', ctx.orgId),
  ])

  // Calculate pass rates + active orders per factory
  const factoryStats: Record<string, { total: number; passed: number; activeOrders: number }> = {}
  for (const insp of (inspections ?? []) as any[]) {
    if (!insp.factory_id) continue
    if (!factoryStats[insp.factory_id]) factoryStats[insp.factory_id] = { total: 0, passed: 0, activeOrders: 0 }
    factoryStats[insp.factory_id].total++
    if (insp.result === 'pass') factoryStats[insp.factory_id].passed++
  }
  for (const order of (orders ?? []) as any[]) {
    if (!order.factory_id) continue
    if (!factoryStats[order.factory_id]) factoryStats[order.factory_id] = { total: 0, passed: 0, activeOrders: 0 }
    if (['confirmed', 'in_production', 'in_inspection'].includes(order.status)) {
      factoryStats[order.factory_id].activeOrders++
    }
  }

  const enrichedFactories = ((factories ?? []) as any[]).map((f: any) => {
    const stats = factoryStats[f.id]
    const passRate = f.pass_rate || (stats && stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0)
    const activeOrders = stats?.activeOrders ?? 0
    return { ...f, passRate, activeOrders, status: f.status || (f.is_active ? 'active' : 'inactive') }
  })

  return (
    <div className="p-6 lg:p-8">
      <FactoriesClient
        factories={enrichedFactories}
        projects={(projects ?? []) as any[]}
        userRole={ctx.role}
        orgId={ctx.orgId}
      />
    </div>
  )
}
