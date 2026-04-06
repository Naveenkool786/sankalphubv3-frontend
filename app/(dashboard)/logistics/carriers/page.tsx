'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Loader2, Ship } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createCarrier } from '@/lib/actions/logistics'
import { CARRIER_TYPE_CONFIG, type Carrier, type CarrierType } from '@/lib/types/logistics'

export default function CarriersPage() {
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ carrier_name: '', carrier_code: '', carrier_type: '', contact_name: '', contact_email: '', contact_phone: '', website: '', tracking_url_template: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    (async () => {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data } = await (supabase.from('carriers') as any).select('*').order('carrier_name')
      if (data) setCarriers(data)
    })()
  }, [saving])

  const handleSubmit = async () => {
    if (!form.carrier_name) { toast.error('Carrier name is required'); return }
    setSaving(true)
    const result = await createCarrier({
      carrier_name: form.carrier_name,
      carrier_code: form.carrier_code || undefined,
      carrier_type: form.carrier_type || undefined,
      contact_name: form.contact_name || undefined,
      contact_email: form.contact_email || undefined,
      contact_phone: form.contact_phone || undefined,
      website: form.website || undefined,
      tracking_url_template: form.tracking_url_template || undefined,
    })
    setSaving(false)
    if (result.success) {
      toast.success('Carrier added')
      setForm({ carrier_name: '', carrier_code: '', carrier_type: '', contact_name: '', contact_email: '', contact_phone: '', website: '', tracking_url_template: '' })
      setShowForm(false)
    } else toast.error('Failed', { description: result.error })
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Ship className="w-5 h-5" style={{ color: '#D4A843' }} /> Carriers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{carriers.length} registered carriers</p>
        </div>
        <Button size="sm" className="gap-1.5" style={{ backgroundColor: '#D4A843' }} onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Add Carrier
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-5 mb-6 space-y-3">
          <h3 className="text-sm font-semibold">New Carrier</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] text-muted-foreground">Carrier Name *</label><Input className="h-9 text-sm" value={form.carrier_name} onChange={e => set('carrier_name', e.target.value)} placeholder="Maersk, DHL, MSC..." /></div>
            <div><label className="text-[10px] text-muted-foreground">Code</label><Input className="h-9 text-sm" value={form.carrier_code} onChange={e => set('carrier_code', e.target.value)} placeholder="MAEU" /></div>
            <div><label className="text-[10px] text-muted-foreground">Type</label>
              <select className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" value={form.carrier_type} onChange={e => set('carrier_type', e.target.value)}>
                <option value="">Select type</option>
                {Object.entries(CARRIER_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div><label className="text-[10px] text-muted-foreground">Contact Name</label><Input className="h-9 text-sm" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} /></div>
            <div><label className="text-[10px] text-muted-foreground">Email</label><Input className="h-9 text-sm" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} /></div>
            <div><label className="text-[10px] text-muted-foreground">Phone</label><Input className="h-9 text-sm" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} /></div>
            <div><label className="text-[10px] text-muted-foreground">Website</label><Input className="h-9 text-sm" value={form.website} onChange={e => set('website', e.target.value)} /></div>
            <div><label className="text-[10px] text-muted-foreground">Tracking URL Template</label><Input className="h-9 text-sm" value={form.tracking_url_template} onChange={e => set('tracking_url_template', e.target.value)} placeholder="https://track.example.com/{tracking_number}" /></div>
          </div>
          <Button size="sm" className="gap-1" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Save Carrier
          </Button>
        </div>
      )}

      {carriers.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No carriers registered yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {carriers.map(c => (
            <div key={c.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{c.carrier_name}</span>
                  {c.carrier_code && <Badge variant="secondary" className="text-[10px]">{c.carrier_code}</Badge>}
                  {c.carrier_type && <Badge variant="secondary" className="text-[10px]">{CARRIER_TYPE_CONFIG[c.carrier_type as CarrierType]?.label || c.carrier_type}</Badge>}
                  <Badge className={c.is_active ? 'bg-green-100 text-green-700 text-[10px]' : 'bg-gray-100 text-gray-600 text-[10px]'}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {[c.contact_name, c.contact_email, c.contact_phone].filter(Boolean).join(' · ') || 'No contact info'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
