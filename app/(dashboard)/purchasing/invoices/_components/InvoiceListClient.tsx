'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Receipt, Plus, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { INVOICE_STATUS_CONFIG, MATCH_STATUS_CONFIG, type Invoice } from '@/lib/types/purchasing'
import { formatMoney } from '@/lib/types/costing'
import { createInvoice } from '@/lib/actions/purchasing'

interface Props { invoices: Invoice[]; pos: { id: string; po_number: string; supplier_name: string; total_amount: number }[]; canManage: boolean }

export function InvoiceListClient({ invoices, pos, canManage }: Props) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ purchase_order_id: '', invoice_number: '', supplier_name: '', invoice_amount: '', invoice_date: '', due_date: '', notes: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const filtered = invoices.filter(inv => {
    if (!search) return true
    return [inv.invoice_number, inv.supplier_name, inv.purchase_orders?.po_number].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  })

  const handleCreate = async () => {
    if (!form.invoice_number || !form.supplier_name || !form.invoice_amount) { toast.error('Fill required fields'); return }
    setSaving(true)
    const result = await createInvoice({
      purchase_order_id: form.purchase_order_id || undefined,
      invoice_number: form.invoice_number,
      supplier_name: form.supplier_name,
      invoice_amount: parseFloat(form.invoice_amount),
      invoice_date: form.invoice_date || undefined,
      due_date: form.due_date || undefined,
      notes: form.notes || undefined,
    })
    setSaving(false)
    if (result.success) {
      toast.success('Invoice created')
      setForm({ purchase_order_id: '', invoice_number: '', supplier_name: '', invoice_amount: '', invoice_date: '', due_date: '', notes: '' })
      setShowForm(false)
    } else toast.error('Failed', { description: result.error })
  }

  const handlePOChange = (poId: string) => {
    set('purchase_order_id', poId)
    const po = pos.find(p => p.id === poId)
    if (po) set('supplier_name', po.supplier_name)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Receipt className="w-5 h-5" style={{ color: '#D4A843' }} /> Invoices
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{invoices.length} invoices</p>
        </div>
        {canManage && (
          <Button size="sm" className="gap-1.5" style={{ backgroundColor: '#D4A843' }} onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" /> New Invoice
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-5 mb-6 space-y-3">
          <h3 className="text-sm font-semibold">New Invoice</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground">Link to PO</label>
              <select className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" value={form.purchase_order_id} onChange={e => handlePOChange(e.target.value)}>
                <option value="">No PO</option>
                {pos.map(p => <option key={p.id} value={p.id}>{p.po_number} — {p.supplier_name}</option>)}
              </select>
            </div>
            <div><label className="text-[10px] text-muted-foreground">Invoice Number *</label>
              <Input className="h-9 text-sm" value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)} placeholder="INV-001" />
            </div>
            <div><label className="text-[10px] text-muted-foreground">Supplier Name *</label>
              <Input className="h-9 text-sm" value={form.supplier_name} onChange={e => set('supplier_name', e.target.value)} />
            </div>
            <div><label className="text-[10px] text-muted-foreground">Invoice Amount *</label>
              <Input type="number" step="0.01" className="h-9 text-sm" value={form.invoice_amount} onChange={e => set('invoice_amount', e.target.value)} />
            </div>
            <div><label className="text-[10px] text-muted-foreground">Invoice Date</label>
              <Input type="date" className="h-9 text-sm" value={form.invoice_date} onChange={e => set('invoice_date', e.target.value)} />
            </div>
            <div><label className="text-[10px] text-muted-foreground">Due Date</label>
              <Input type="date" className="h-9 text-sm" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
          </div>
          <Button size="sm" className="gap-1" onClick={handleCreate} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Save Invoice
          </Button>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9 h-9 text-sm" placeholder="Search invoice, supplier, PO..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No invoices found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inv => {
            const sCfg = INVOICE_STATUS_CONFIG[inv.status] || INVOICE_STATUS_CONFIG.pending
            const mCfg = MATCH_STATUS_CONFIG[inv.match_status] || MATCH_STATUS_CONFIG.unmatched
            return (
              <Link key={inv.id} href={`/purchasing/invoices/${inv.id}`} className="block">
                <div className="bg-card rounded-xl border border-border p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{inv.invoice_number}</span>
                      <Badge style={{ backgroundColor: sCfg.bg, color: sCfg.color }} className="text-[10px]">{sCfg.label}</Badge>
                      <Badge style={{ backgroundColor: mCfg.bg, color: mCfg.color }} className="text-[10px]">{mCfg.label}</Badge>
                    </div>
                    <span className="text-sm font-mono font-semibold">{formatMoney(inv.invoice_amount, inv.currency)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {inv.supplier_name} {inv.purchase_orders?.po_number ? `· PO: ${inv.purchase_orders.po_number}` : ''} {inv.due_date ? `· Due: ${inv.due_date}` : ''}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
