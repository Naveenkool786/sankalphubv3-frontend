import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import Link from 'next/link'
import { ShoppingBag, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ORDER_STATUS_CONFIG, type OrderBookingStatus } from '@/lib/types/merchandising'

export default async function OrdersPage() {
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const { data: orders } = await (supabase.from('order_bookings') as any)
    .select('*, styles(style_number, style_name), colorways(color_name, color_code)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" style={{ color: '#D4A843' }} /> Order Bookings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{(orders ?? []).length} orders</p>
        </div>
        {canManage(ctx.role) && (
          <Link href="/merchandising/orders/new"><Button size="sm" className="gap-1.5" style={{ backgroundColor: '#D4A843' }}><Plus className="w-4 h-4" /> Book Order</Button></Link>
        )}
      </div>
      {(orders ?? []).length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><p className="text-sm text-muted-foreground">No orders yet</p></div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Style</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Buyer</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">PO #</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Color</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Units</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Value</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Delivery</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {(orders ?? []).map((o: any) => {
                  const cfg = ORDER_STATUS_CONFIG[o.status as OrderBookingStatus] || ORDER_STATUS_CONFIG.booked
                  return (
                    <tr key={o.id} className="hover:bg-muted/20">
                      <td className="px-3 py-2"><Link href={`/merchandising/styles/${o.style_id}`} className="hover:underline"><span className="font-mono font-semibold">{o.styles?.style_number}</span> <span className="text-muted-foreground">{o.styles?.style_name}</span></Link></td>
                      <td className="px-3 py-2 font-medium">{o.buyer_name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{o.buyer_po_number || '—'}</td>
                      <td className="px-3 py-2">{o.colorways?.color_name || '—'}</td>
                      <td className="px-3 py-2 text-right">{o.total_units}</td>
                      <td className="px-3 py-2 text-right font-mono">{o.total_value ? `$${Number(o.total_value).toFixed(2)}` : '—'}</td>
                      <td className="px-3 py-2">{o.delivery_date || '—'}</td>
                      <td className="px-3 py-2"><Badge style={{ backgroundColor: cfg.bg, color: cfg.color }} className="text-[10px]">{cfg.label}</Badge></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
