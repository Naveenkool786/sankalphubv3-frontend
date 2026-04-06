'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Ship, Plane, Package, Truck, TrainFront, Plus, Search, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SHIPPING_MODE_CONFIG, SHIPMENT_STATUS_CONFIG, type Shipment, type ShippingMode } from '@/lib/types/logistics'

interface Props { shipments: Shipment[]; canManage: boolean }

const MODE_ICONS: Record<string, React.ReactNode> = {
  sea_fcl: <Ship className="w-4 h-4" />,
  sea_lcl: <Ship className="w-4 h-4" />,
  air: <Plane className="w-4 h-4" />,
  courier: <Package className="w-4 h-4" />,
  rail: <TrainFront className="w-4 h-4" />,
  road: <Truck className="w-4 h-4" />,
}

export function ShipmentListClient({ shipments, canManage }: Props) {
  const [search, setSearch] = useState('')
  const [modeFilter, setModeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = shipments.filter(s => {
    const matchSearch = !search || [s.shipment_number, s.carrier_name, s.origin_country, s.destination_country, s.projects?.name].some(v => v?.toLowerCase().includes(search.toLowerCase()))
    const matchMode = modeFilter === 'all' || s.shipping_mode === modeFilter
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchSearch && matchMode && matchStatus
  })

  const inTransitCount = shipments.filter(s => s.status === 'in_transit').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Ship className="w-5 h-5" style={{ color: '#D4A843' }} /> Logistics & Shipping
            {inTransitCount > 0 && <Badge className="bg-purple-100 text-purple-700 text-[10px]">{inTransitCount} in transit</Badge>}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{shipments.length} shipments</p>
        </div>
        {canManage && (
          <Link href="/logistics/new">
            <Button size="sm" className="gap-1.5" style={{ backgroundColor: '#D4A843' }}>
              <Plus className="w-4 h-4" /> New Shipment
            </Button>
          </Link>
        )}
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 h-9 text-sm" placeholder="Search shipment, carrier, route..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="h-9 px-3 rounded-lg border border-border bg-background text-sm" value={modeFilter} onChange={e => setModeFilter(e.target.value)}>
          <option value="all">All Modes</option>
          {Object.entries(SHIPPING_MODE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="h-9 px-3 rounded-lg border border-border bg-background text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          {Object.entries(SHIPMENT_STATUS_CONFIG).filter(([k]) => k !== 'cancelled').map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Ship className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No shipments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => {
            const modeCfg = SHIPPING_MODE_CONFIG[s.shipping_mode] || SHIPPING_MODE_CONFIG.courier
            const statusCfg = SHIPMENT_STATUS_CONFIG[s.status] || SHIPMENT_STATUS_CONFIG.booking
            return (
              <Link key={s.id} href={`/logistics/${s.id}`} className="block">
                <div className="bg-card rounded-xl border border-border p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: modeCfg.bg, color: modeCfg.color }}>
                        {MODE_ICONS[s.shipping_mode]}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-foreground">{s.shipment_number}</span>
                        <p className="text-[10px] text-muted-foreground">{modeCfg.label}</p>
                      </div>
                      <Badge style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }} className="text-[10px]">{statusCfg.label}</Badge>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-mono">{s.total_cartons} ctns · {s.total_pieces} pcs</p>
                      {s.carrier_name && <p className="text-muted-foreground">{s.carrier_name}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{[s.origin_port, s.origin_country].filter(Boolean).join(', ') || 'Origin'}</span>
                    <ArrowRight className="w-3 h-3 flex-shrink-0" />
                    <span className="font-medium text-foreground">{[s.destination_port, s.destination_country].filter(Boolean).join(', ') || 'Destination'}</span>
                    <span className="ml-auto">ETD: {s.estimated_departure || '—'} · ETA: {s.estimated_arrival || '—'}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
