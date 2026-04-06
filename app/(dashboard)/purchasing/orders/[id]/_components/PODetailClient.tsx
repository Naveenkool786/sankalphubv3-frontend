'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PO_STATUS_CONFIG, PO_STATUS_ORDER, type PurchaseOrder, type POItem } from '@/lib/types/purchasing'
import { formatMoney, getCurrencySymbol } from '@/lib/types/costing'
import { updatePOStatus } from '@/lib/actions/purchasing'

interface Props { po: PurchaseOrder; items: POItem[]; canManage: boolean }

const NEXT_STATUS: Record<string, { label: string; next: string }> = {
  draft: { label: 'Submit for Approval', next: 'pending_approval' },
  pending_approval: { label: 'Approve', next: 'approved' },
  approved: { label: 'Send to Supplier', next: 'sent_to_supplier' },
  sent_to_supplier: { label: 'Mark Acknowledged', next: 'acknowledged' },
  acknowledged: { label: 'Mark In Production', next: 'in_production' },
  in_production: { label: 'Mark Shipped', next: 'shipped' },
  shipped: { label: 'Mark Received', next: 'received' },
}

export function PODetailClient({ po, items, canManage }: Props) {
  const statusCfg = PO_STATUS_CONFIG[po.status] || PO_STATUS_CONFIG.draft
  const sym = getCurrencySymbol(po.currency)
  const [statusLoading, setStatusLoading] = useState('')
  const currentOrder = PO_STATUS_CONFIG[po.status]?.order ?? 0

  const handleStatus = async (status: string) => {
    setStatusLoading(status)
    const result = await updatePOStatus(po.id, status)
    setStatusLoading('')
    if (result.success) toast.success(`Status updated`)
    else toast.error('Failed', { description: result.error })
  }

  const nextAction = NEXT_STATUS[po.status]

  return (
    <div>
      <Link href="/purchasing/orders" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Purchase Orders
      </Link>

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">{po.po_number}</h1>
            <Badge style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {[po.supplier_name, po.projects?.name, po.factories?.name].filter(Boolean).join(' · ')}
          </p>
        </div>
        <span className="text-lg font-bold font-mono">{formatMoney(po.total_amount, po.currency)}</span>
      </div>

      {/* Status tracker */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-[700px]">
          {PO_STATUS_ORDER.map((s, i) => {
            const cfg = PO_STATUS_CONFIG[s]
            const isActive = s === po.status
            const isDone = cfg.order < currentOrder
            const isCancelled = po.status === 'cancelled'
            return (
              <div key={s} className="flex items-center flex-1">
                <div className={cn(
                  'flex-1 text-center px-1 py-1.5 rounded text-[9px] font-medium transition-colors',
                  isActive ? 'ring-2 ring-offset-1' : '',
                  isDone ? 'bg-green-100 text-green-700' : isActive ? 'bg-blue-100 text-blue-700' : 'bg-muted/50 text-muted-foreground',
                  isCancelled && 'bg-red-50 text-red-400'
                )} style={isActive ? { '--tw-ring-color': cfg.color } as React.CSSProperties : {}}>
                  {cfg.label}
                </div>
                {i < PO_STATUS_ORDER.length - 1 && <div className={cn('w-3 h-0.5 flex-shrink-0', isDone ? 'bg-green-400' : 'bg-border')} />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Action buttons */}
      {canManage && nextAction && po.status !== 'cancelled' && (
        <div className="flex gap-2 mb-4">
          <Button size="sm" className="text-xs gap-1" onClick={() => handleStatus(nextAction.next)} disabled={!!statusLoading} style={{ backgroundColor: '#D4A843' }}>
            {statusLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null} {nextAction.label}
          </Button>
          {po.status !== 'received' && (
            <Button size="sm" variant="outline" className="text-xs text-red-600" onClick={() => handleStatus('cancelled')} disabled={!!statusLoading}>Cancel PO</Button>
          )}
        </div>
      )}

      <Tabs defaultValue="items">
        <TabsList className="bg-muted/50 mb-4">
          <TabsTrigger value="items">Items ({items.length})</TabsTrigger>
          <TabsTrigger value="info">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Description</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Style</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Color</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Size</th>
                    <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Qty</th>
                    <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Received</th>
                    <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Price</th>
                    <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-muted/20">
                      <td className="px-3 py-2 font-medium">{item.description}</td>
                      <td className="px-3 py-2 text-muted-foreground">{item.style_number || '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{item.color || '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{item.size || '—'}</td>
                      <td className="px-3 py-2 text-right">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">{item.received_qty || 0}</td>
                      <td className="px-3 py-2 text-right font-mono">{sym}{Number(item.unit_price).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">{sym}{Number(item.total_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/30">
                    <td colSpan={7} className="px-3 py-2.5 text-right font-semibold">Total</td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold">{formatMoney(po.total_amount, po.currency)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="info">
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ['Supplier', po.supplier_name],
                ['Project', po.projects?.name],
                ['Factory', po.factories?.name],
                ['Currency', po.currency],
                ['Subtotal', po.subtotal ? `${sym}${Number(po.subtotal).toFixed(2)}` : null],
                ['Tax', po.tax_amount ? `${sym}${Number(po.tax_amount).toFixed(2)}` : '0'],
                ['Discount', po.discount_amount ? `${sym}${Number(po.discount_amount).toFixed(2)}` : '0'],
                ['Payment Terms', po.payment_terms],
                ['Delivery Terms', po.delivery_terms],
                ['Ship By', po.ship_by_date],
                ['Delivery Address', po.delivery_address],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{value || '—'}</span>
                </div>
              ))}
            </div>
            {po.notes && <p className="text-xs text-muted-foreground mt-3">{po.notes}</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
