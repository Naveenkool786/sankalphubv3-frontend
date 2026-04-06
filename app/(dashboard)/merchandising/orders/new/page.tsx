'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Loader2, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createOrderBooking } from '@/lib/actions/merchandising'

export default function NewOrderPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [styles, setStyles] = useState<{ id: string; style_number: string; style_name: string; season_id: string }[]>([])
  const [colorways, setColorways] = useState<{ id: string; color_name: string; color_code: string }[]>([])

  const [form, setForm] = useState({
    style_id: '', colorway_id: '', buyer_name: '', buyer_po_number: '',
    delivery_date: '', total_units: '', unit_price: '', notes: '',
    s: '', m: '', l: '', xl: '', xxl: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    (async () => {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data } = await (supabase.from('styles') as any).select('id, style_number, style_name, season_id').eq('status', 'active').order('style_number')
      if (data) setStyles(data)
    })()
  }, [])

  useEffect(() => {
    if (!form.style_id) { setColorways([]); return }
    (async () => {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data } = await (supabase.from('colorways') as any).select('id, color_name, color_code').eq('style_id', form.style_id).order('sort_order')
      if (data) setColorways(data)
    })()
  }, [form.style_id])

  const handleSubmit = async () => {
    if (!form.style_id || !form.buyer_name || !form.total_units) { toast.error('Style, buyer, and units required'); return }
    const sizeBreakdown: Record<string, number> = {}
    if (form.s) sizeBreakdown['S'] = parseInt(form.s)
    if (form.m) sizeBreakdown['M'] = parseInt(form.m)
    if (form.l) sizeBreakdown['L'] = parseInt(form.l)
    if (form.xl) sizeBreakdown['XL'] = parseInt(form.xl)
    if (form.xxl) sizeBreakdown['XXL'] = parseInt(form.xxl)

    const selectedStyle = styles.find(s => s.id === form.style_id)

    setSaving(true)
    const result = await createOrderBooking({
      style_id: form.style_id,
      season_id: selectedStyle?.season_id || undefined,
      colorway_id: form.colorway_id || undefined,
      buyer_name: form.buyer_name,
      buyer_po_number: form.buyer_po_number || undefined,
      delivery_date: form.delivery_date || undefined,
      size_breakdown: Object.keys(sizeBreakdown).length > 0 ? sizeBreakdown : undefined,
      total_units: parseInt(form.total_units),
      unit_price: parseFloat(form.unit_price) || undefined,
      notes: form.notes || undefined,
    })
    setSaving(false)
    if (result.success) { toast.success('Order booked'); router.push('/merchandising/orders') }
    else toast.error('Failed', { description: result.error })
  }

  const selCls = 'w-full h-9 px-3 rounded-lg border border-border bg-background text-sm'

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
      <h1 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2"><ShoppingBag className="w-5 h-5" style={{ color: '#D4A843' }} /> Book Order</h1>
      <p className="text-sm text-muted-foreground mb-6">Book a buyer order for a style</p>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><Label className="text-xs text-muted-foreground">Style *</Label>
            <select className={selCls} value={form.style_id} onChange={e => set('style_id', e.target.value)}>
              <option value="">Select style</option>{styles.map(s => <option key={s.id} value={s.id}>{s.style_number} — {s.style_name}</option>)}
            </select></div>
          <div><Label className="text-xs text-muted-foreground">Colorway</Label>
            <select className={selCls} value={form.colorway_id} onChange={e => set('colorway_id', e.target.value)}>
              <option value="">All colors</option>{colorways.map(c => <option key={c.id} value={c.id}>{c.color_code} — {c.color_name}</option>)}
            </select></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label className="text-xs text-muted-foreground">Buyer Name *</Label><Input className="h-9 text-sm" value={form.buyer_name} onChange={e => set('buyer_name', e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">Buyer PO #</Label><Input className="h-9 text-sm" value={form.buyer_po_number} onChange={e => set('buyer_po_number', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><Label className="text-xs text-muted-foreground">Total Units *</Label><Input type="number" className="h-9 text-sm" value={form.total_units} onChange={e => set('total_units', e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">Unit Price</Label><Input type="number" step="0.01" className="h-9 text-sm" value={form.unit_price} onChange={e => set('unit_price', e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">Delivery Date</Label><Input type="date" className="h-9 text-sm" value={form.delivery_date} onChange={e => set('delivery_date', e.target.value)} /></div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Size Breakdown</Label>
          <div className="grid grid-cols-5 gap-2 mt-1">
            {['s', 'm', 'l', 'xl', 'xxl'].map(sz => (
              <div key={sz}><label className="text-[10px] text-muted-foreground uppercase">{sz}</label>
                <Input type="number" className="h-8 text-xs" value={(form as any)[sz]} onChange={e => set(sz, e.target.value)} /></div>
            ))}
          </div>
        </div>
        <div><Label className="text-xs text-muted-foreground">Notes</Label>
          <textarea className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm min-h-[60px] resize-vertical" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
        <Button className="w-full gap-2" onClick={handleSubmit} disabled={saving || !form.style_id || !form.buyer_name} style={{ backgroundColor: '#D4A843' }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />} {saving ? 'Booking...' : 'Book Order'}
        </Button>
      </div>
    </div>
  )
}
