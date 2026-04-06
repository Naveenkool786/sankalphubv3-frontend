'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle, XCircle, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { INVOICE_STATUS_CONFIG, MATCH_STATUS_CONFIG, type Invoice } from '@/lib/types/purchasing'
import { formatMoney, getCurrencySymbol } from '@/lib/types/costing'
import { updateInvoiceMatch, updateInvoiceStatus } from '@/lib/actions/purchasing'

interface Props { invoice: Invoice; canManage: boolean }

export function InvoiceDetailClient({ invoice, canManage }: Props) {
  const sCfg = INVOICE_STATUS_CONFIG[invoice.status] || INVOICE_STATUS_CONFIG.pending
  const mCfg = MATCH_STATUS_CONFIG[invoice.match_status] || MATCH_STATUS_CONFIG.unmatched
  const sym = getCurrencySymbol(invoice.currency)

  const [receiptAmount, setReceiptAmount] = useState(String(invoice.receipt_amount || ''))
  const [savingMatch, setSavingMatch] = useState(false)
  const [statusLoading, setStatusLoading] = useState('')

  const poAmount = invoice.po_amount || 0
  const invoiceAmount = invoice.invoice_amount || 0
  const receiptAmt = parseFloat(receiptAmount) || 0

  const handleMatch = async () => {
    if (!receiptAmount) { toast.error('Enter receipt amount'); return }
    setSavingMatch(true)
    const result = await updateInvoiceMatch(invoice.id, { receipt_amount: receiptAmt })
    setSavingMatch(false)
    if (result.success) toast.success('Match updated')
    else toast.error('Failed', { description: result.error })
  }

  const handleStatus = async (status: string) => {
    setStatusLoading(status)
    const result = await updateInvoiceStatus(invoice.id, status)
    setStatusLoading('')
    if (result.success) toast.success(`Status updated`)
    else toast.error('Failed', { description: result.error })
  }

  const matchIcon = invoice.match_status === 'matched'
    ? <CheckCircle2 className="w-5 h-5 text-green-600" />
    : invoice.match_status === 'partial_match'
    ? <AlertTriangle className="w-5 h-5 text-orange-500" />
    : invoice.match_status === 'mismatch'
    ? <XCircle className="w-5 h-5 text-red-600" />
    : null

  return (
    <div>
      <Link href="/purchasing/invoices" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Invoices
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">{invoice.invoice_number}</h1>
            <Badge style={{ backgroundColor: sCfg.bg, color: sCfg.color }}>{sCfg.label}</Badge>
            <Badge style={{ backgroundColor: mCfg.bg, color: mCfg.color }}>{mCfg.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {invoice.supplier_name} {invoice.purchase_orders?.po_number ? `· PO: ${invoice.purchase_orders.po_number}` : ''}
          </p>
        </div>
        <span className="text-lg font-bold font-mono">{formatMoney(invoiceAmount, invoice.currency)}</span>
      </div>

      {/* Status actions */}
      {canManage && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {invoice.status === 'matched' && (
            <Button size="sm" className="text-xs gap-1 bg-green-600 hover:bg-green-700" onClick={() => handleStatus('approved')} disabled={!!statusLoading}>
              Approve for Payment
            </Button>
          )}
          {invoice.status === 'approved' && (
            <Button size="sm" className="text-xs gap-1" onClick={() => handleStatus('paid')} disabled={!!statusLoading} style={{ backgroundColor: '#D4A843' }}>
              Mark Paid
            </Button>
          )}
          {['pending', 'matched'].includes(invoice.status) && (
            <Button size="sm" variant="outline" className="text-xs text-red-600" onClick={() => handleStatus('disputed')} disabled={!!statusLoading}>
              Dispute
            </Button>
          )}
        </div>
      )}

      {/* 3-Way Match Panel */}
      <div className="bg-card rounded-xl border border-border p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold">3-Way Match</h3>
          {matchIcon}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* PO Amount */}
          <div className={cn(
            'rounded-xl border-2 p-4 text-center',
            invoice.match_status === 'matched' ? 'border-green-200 bg-green-50/50' : 'border-border'
          )}>
            <p className="text-[10px] text-muted-foreground font-medium mb-1">1. PO Amount</p>
            <p className="text-lg font-bold font-mono">{poAmount > 0 ? `${sym}${poAmount.toFixed(2)}` : '—'}</p>
            {invoice.purchase_orders?.po_number && (
              <p className="text-[10px] text-muted-foreground mt-1">{invoice.purchase_orders.po_number}</p>
            )}
          </div>

          {/* Receipt Amount */}
          <div className={cn(
            'rounded-xl border-2 p-4 text-center',
            invoice.match_status === 'matched' ? 'border-green-200 bg-green-50/50' : 'border-border'
          )}>
            <p className="text-[10px] text-muted-foreground font-medium mb-1">2. Receipt Amount</p>
            {canManage ? (
              <div className="flex items-center gap-1 justify-center">
                <span className="text-sm">{sym}</span>
                <input
                  type="number" step="0.01"
                  className="w-28 h-9 px-2 rounded-lg border border-border bg-background text-center font-mono text-sm"
                  value={receiptAmount}
                  onChange={e => setReceiptAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            ) : (
              <p className="text-lg font-bold font-mono">{receiptAmt > 0 ? `${sym}${receiptAmt.toFixed(2)}` : '—'}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">Goods received value</p>
          </div>

          {/* Invoice Amount */}
          <div className={cn(
            'rounded-xl border-2 p-4 text-center',
            invoice.match_status === 'matched' ? 'border-green-200 bg-green-50/50' : invoice.match_status === 'mismatch' ? 'border-red-200 bg-red-50/50' : 'border-border'
          )}>
            <p className="text-[10px] text-muted-foreground font-medium mb-1">3. Invoice Amount</p>
            <p className="text-lg font-bold font-mono">{sym}{invoiceAmount.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{invoice.invoice_number}</p>
          </div>
        </div>

        {/* Variance */}
        {poAmount > 0 && (
          <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">PO vs Invoice Variance</span>
              <span className={cn('font-mono font-semibold', Math.abs(invoiceAmount - poAmount) > poAmount * 0.02 ? 'text-red-600' : 'text-green-600')}>
                {sym}{(invoiceAmount - poAmount).toFixed(2)} ({poAmount > 0 ? ((Math.abs(invoiceAmount - poAmount) / poAmount) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tolerance (2%)</span>
              <span className="font-mono">{sym}{(poAmount * 0.02).toFixed(2)}</span>
            </div>
          </div>
        )}

        {canManage && (
          <div className="mt-3">
            <Button size="sm" className="gap-1.5" onClick={handleMatch} disabled={savingMatch} style={{ backgroundColor: '#D4A843' }}>
              {savingMatch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Run Match
            </Button>
          </div>
        )}
      </div>

      {/* Invoice Details */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold mb-3">Invoice Details</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ['Invoice Date', invoice.invoice_date],
            ['Due Date', invoice.due_date],
            ['Supplier', invoice.supplier_name],
            ['Currency', invoice.currency],
            ['Payment Ref', invoice.payment_reference],
          ].map(([label, value]) => (
            <div key={label as string} className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-foreground">{value || '—'}</span>
            </div>
          ))}
        </div>
        {invoice.notes && <p className="text-xs text-muted-foreground mt-3">{invoice.notes}</p>}
      </div>
    </div>
  )
}
