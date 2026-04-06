'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { STATUS_CONFIG, PRIORITY_CONFIG, type ProductionOrder } from '@/lib/types/production'
import { differenceInDays } from 'date-fns'

interface Props {
  orders: ProductionOrder[]
  factories: { id: string; name: string }[]
  canManage: boolean
}

export function ProductionListClient({ orders, factories, canManage }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [factoryFilter, setFactoryFilter] = useState('all')

  const filtered = useMemo(() => {
    let list = orders
    if (statusFilter !== 'all') list = list.filter(o => o.status === statusFilter)
    if (factoryFilter !== 'all') list = list.filter(o => o.factory_id === factoryFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(o =>
        o.order_number.toLowerCase().includes(q) ||
        (o.style_number ?? '').toLowerCase().includes(q) ||
        (o.style_name ?? '').toLowerCase().includes(q) ||
        (o.factories?.name ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [orders, statusFilter, factoryFilter, search])

  const delayedCount = orders.filter(o => {
    if (!o.ex_factory_date || o.status === 'shipped' || o.status === 'cancelled') return false
    return new Date(o.ex_factory_date) < new Date()
  }).length

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6" style={{ color: '#D4A843' }} />
            Production Tracking
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {orders.length} orders{delayedCount > 0 && <span className="text-red-500 ml-1">· {delayedCount} delayed</span>}
          </p>
        </div>
        {canManage && (
          <Link href="/production/new">
            <Button className="gap-1.5" style={{ backgroundColor: '#D4A843' }}>
              <Plus className="w-4 h-4" /> New Order
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="Search by order, style, factory..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="h-9 px-3 rounded-lg border border-border bg-background text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select className="h-9 px-3 rounded-lg border border-border bg-background text-sm" value={factoryFilter} onChange={e => setFactoryFilter(e.target.value)}>
          <option value="all">All factories</option>
          {factories.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No production orders found</p>
          {canManage && <p className="text-xs text-muted-foreground mt-1">Create your first production order to start tracking.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.planning
            const priorityCfg = PRIORITY_CONFIG[order.priority] || PRIORITY_CONFIG.normal
            const isDelayed = order.ex_factory_date && new Date(order.ex_factory_date) < new Date() && order.status !== 'shipped' && order.status !== 'cancelled'
            const delayDays = isDelayed ? differenceInDays(new Date(), new Date(order.ex_factory_date!)) : 0

            return (
              <div
                key={order.id}
                onClick={() => router.push(`/production/${order.id}`)}
                className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 cursor-pointer hover:border-[#D4A843]/40 hover:shadow-sm transition-all"
              >
                {/* Order info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{order.order_number}</span>
                    <Badge style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }} className="text-[10px]">{statusCfg.label}</Badge>
                    {order.priority !== 'normal' && (
                      <Badge style={{ backgroundColor: priorityCfg.bg, color: priorityCfg.color }} className="text-[10px]">{priorityCfg.label}</Badge>
                    )}
                    {isDelayed && (
                      <Badge className="text-[10px] bg-red-500/10 text-red-600">{delayDays}d late</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {[order.style_name, order.factories?.name, order.category].filter(Boolean).join(' · ')}
                  </p>
                </div>

                {/* Quantity */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-foreground">{order.total_quantity.toLocaleString()} {order.unit}</p>
                  {order.ex_factory_date && (
                    <p className="text-[11px] text-muted-foreground">
                      Ex-factory: {new Date(order.ex_factory_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
