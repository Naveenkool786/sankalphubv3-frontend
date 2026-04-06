'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Send, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { QUOTATION_STATUS_CONFIG, type Quotation, type QuotationItem } from '@/lib/types/purchasing'
import { formatMoney, getCurrencySymbol } from '@/lib/types/costing'
import { updateQuotationStatus } from '@/lib/actions/purchasing'

interface Props { quotation: Quotation; items: QuotationItem[]; canManage: boolean }

export function QuotationDetailClient({ quotation, items, canManage }: Props) {
  const cfg = QUOTATION_STATUS_CONFIG[quotation.status] || QUOTATION_STATUS_CONFIG.draft
  const sym = getCurrencySymbol(quotation.currency)
  const [statusLoading, setStatusLoading] = useState('')

  const handleStatus = async (status: string) => {
    setStatusLoading(status)
    const result = await updateQuotationStatus(quotation.id, status)
    setStatusLoading('')
    if (result.success) toast.success(`Status updated to ${status.replace(/_/g, ' ')}`)
    else toast.error('Failed', { description: result.error })
  }

  return (
    <div>
      <Link href="/purchasing/quotations" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Quotations
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">{quotation.quotation_number}</h1>
            <Badge style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {[quotation.supplier_name, quotation.projects?.name, quotation.factories?.name].filter(Boolean).join(' · ')}
          </p>
        </div>
        <span className="text-lg font-bold font-mono">{formatMoney(quotation.total_amount, quotation.currency)}</span>
      </div>

      {canManage && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {quotation.status === 'draft' && (
            <Button size="sm" className="text-xs gap-1" onClick={() => handleStatus('sent')} disabled={!!statusLoading}>
              {statusLoading === 'sent' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Mark Sent
            </Button>
          )}
          {['received', 'under_review', 'negotiating'].includes(quotation.status) && (
            <>
              <Button size="sm" className="text-xs gap-1 bg-green-600 hover:bg-green-700" onClick={() => handleStatus('accepted')} disabled={!!statusLoading}>
                <CheckCircle2 className="w-3 h-3" /> Accept
              </Button>
              <Button size="sm" variant="outline" className="text-xs gap-1 text-red-600" onClick={() => handleStatus('rejected')} disabled={!!statusLoading}>
                <XCircle className="w-3 h-3" /> Reject
              </Button>
            </>
          )}
          {quotation.status === 'sent' && (
            <Button size="sm" variant="outline" className="text-xs" onClick={() => handleStatus('received')} disabled={!!statusLoading}>Mark Received</Button>
          )}
        </div>
      )}

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">Supplier Info</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{quotation.supplier_name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Contact</span><span>{quotation.supplier_contact || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{quotation.supplier_email || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Factory</span><span>{quotation.factories?.name || '—'}</span></div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">Terms</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Currency</span><span>{quotation.currency}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Valid Until</span><span>{quotation.valid_until || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span>{quotation.payment_terms || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{quotation.delivery_terms || '—'}</span></div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Line Items ({items.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Description</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Style #</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Qty</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Unit</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Unit Price</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium">{item.description}</td>
                  <td className="px-3 py-2 text-muted-foreground">{item.style_number || '—'}</td>
                  <td className="px-3 py-2 text-right">{item.quantity}</td>
                  <td className="px-3 py-2 text-muted-foreground">{item.unit}</td>
                  <td className="px-3 py-2 text-right font-mono">{sym}{Number(item.unit_price).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold">{sym}{Number(item.total_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/30">
                <td colSpan={5} className="px-3 py-2.5 text-right font-semibold">Total</td>
                <td className="px-3 py-2.5 text-right font-mono font-bold">{formatMoney(quotation.total_amount, quotation.currency)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {quotation.notes && (
        <div className="bg-card rounded-xl border border-border p-4 mt-4">
          <h3 className="text-xs font-semibold text-muted-foreground mb-1">Notes</h3>
          <p className="text-xs text-foreground">{quotation.notes}</p>
        </div>
      )}
    </div>
  )
}
