'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, ArrowRight, Loader2, Ship, Plane, Package, Truck, TrainFront, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { createShipment } from '@/lib/actions/logistics'
import { SHIPPING_MODE_CONFIG, INCOTERMS, CONTAINER_SIZES, type ShippingMode } from '@/lib/types/logistics'

const MODE_ICONS: Record<string, React.ReactNode> = {
  sea_fcl: <Ship className="w-6 h-6" />,
  sea_lcl: <Ship className="w-6 h-6" />,
  air: <Plane className="w-6 h-6" />,
  courier: <Package className="w-6 h-6" />,
  rail: <TrainFront className="w-6 h-6" />,
  road: <Truck className="w-6 h-6" />,
}

export default function NewShipmentPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [carriers, setCarriers] = useState<{ id: string; carrier_name: string }[]>([])

  const [form, setForm] = useState({
    project_id: '', shipping_mode: '' as ShippingMode | '',
    carrier_name: '', carrier_booking_ref: '',
    vessel_name: '', voyage_number: '', container_number: '', container_size: '',
    incoterm: '',
    origin_country: '', origin_port: '', origin_address: '',
    destination_country: '', destination_port: '', destination_address: '',
    estimated_departure: '', estimated_arrival: '',
    total_cartons: '', total_pieces: '',
    gross_weight_kg: '', net_weight_kg: '', volume_cbm: '',
    notes: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    (async () => {
      const ctx = await (await fetch('/api/user/context')).json()
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const [{ data: p }, { data: c }] = await Promise.all([
        (supabase.from('projects') as any).select('id, name').eq('org_id', ctx.orgId).order('name'),
        (supabase.from('carriers') as any).select('id, carrier_name').eq('is_active', true).order('carrier_name'),
      ])
      if (p) setProjects(p)
      if (c) setCarriers(c)
    })()
  }, [])

  const isSea = form.shipping_mode === 'sea_fcl' || form.shipping_mode === 'sea_lcl'

  const handleSubmit = async () => {
    if (!form.shipping_mode) { toast.error('Select shipping mode'); return }
    setSaving(true)
    const result = await createShipment({
      project_id: form.project_id || undefined,
      shipping_mode: form.shipping_mode as ShippingMode,
      carrier_name: form.carrier_name || undefined,
      carrier_booking_ref: form.carrier_booking_ref || undefined,
      vessel_name: form.vessel_name || undefined,
      voyage_number: form.voyage_number || undefined,
      container_number: form.container_number || undefined,
      container_size: form.container_size || undefined,
      incoterm: form.incoterm || undefined,
      origin_country: form.origin_country || undefined,
      origin_port: form.origin_port || undefined,
      origin_address: form.origin_address || undefined,
      destination_country: form.destination_country || undefined,
      destination_port: form.destination_port || undefined,
      destination_address: form.destination_address || undefined,
      estimated_departure: form.estimated_departure || undefined,
      estimated_arrival: form.estimated_arrival || undefined,
      total_cartons: parseInt(form.total_cartons) || undefined,
      total_pieces: parseInt(form.total_pieces) || undefined,
      gross_weight_kg: parseFloat(form.gross_weight_kg) || undefined,
      net_weight_kg: parseFloat(form.net_weight_kg) || undefined,
      volume_cbm: parseFloat(form.volume_cbm) || undefined,
      notes: form.notes || undefined,
    })
    setSaving(false)
    if (result.success) {
      toast.success('Shipment created')
      router.push(`/logistics/${result.id}`)
    } else toast.error('Failed', { description: result.error })
  }

  const selCls = 'w-full h-9 px-3 rounded-lg border border-border bg-background text-sm'
  const steps = ['Details', 'Route', 'Cargo', 'Review']

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>
      <h1 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
        <Ship className="w-5 h-5" style={{ color: '#D4A843' }} /> New Shipment
      </h1>
      <p className="text-sm text-muted-foreground mb-6">Book a new shipment</p>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-6">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <button
              onClick={() => i + 1 < step && setStep(i + 1)}
              className={cn(
                'flex-1 text-center py-2 rounded text-xs font-medium transition-colors',
                i + 1 === step ? 'bg-[#D4A843] text-white' : i + 1 < step ? 'bg-green-100 text-green-700' : 'bg-muted/50 text-muted-foreground'
              )}
            >
              {i + 1 < step ? <Check className="w-3 h-3 inline mr-1" /> : null}{s}
            </button>
            {i < steps.length - 1 && <div className={cn('w-3 h-0.5 flex-shrink-0', i + 1 < step ? 'bg-green-400' : 'bg-border')} />}
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        {/* Step 1: Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground font-semibold">Shipping Mode *</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(Object.entries(SHIPPING_MODE_CONFIG) as [ShippingMode, typeof SHIPPING_MODE_CONFIG[ShippingMode]][]).map(([k, v]) => (
                  <button key={k} onClick={() => set('shipping_mode', k)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-colors text-xs font-medium',
                      form.shipping_mode === k ? 'border-[#D4A843] bg-[#D4A843]/10' : 'border-border hover:bg-muted/30'
                    )}>
                    <div style={{ color: v.color }}>{MODE_ICONS[k]}</div>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs text-muted-foreground">Project</Label>
                <select className={selCls} value={form.project_id} onChange={e => set('project_id', e.target.value)}>
                  <option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div><Label className="text-xs text-muted-foreground">Carrier</Label>
                <select className={selCls} value={form.carrier_name} onChange={e => set('carrier_name', e.target.value)}>
                  <option value="">Select carrier</option>{carriers.map(c => <option key={c.id} value={c.carrier_name}>{c.carrier_name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs text-muted-foreground">Booking Reference</Label>
                <Input className="h-9 text-sm" value={form.carrier_booking_ref} onChange={e => set('carrier_booking_ref', e.target.value)} />
              </div>
              <div><Label className="text-xs text-muted-foreground">Incoterm</Label>
                <select className={selCls} value={form.incoterm} onChange={e => set('incoterm', e.target.value)}>
                  <option value="">Select</option>{INCOTERMS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>
            {isSea && (
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs text-muted-foreground">Vessel Name</Label>
                  <Input className="h-9 text-sm" value={form.vessel_name} onChange={e => set('vessel_name', e.target.value)} />
                </div>
                <div><Label className="text-xs text-muted-foreground">Voyage #</Label>
                  <Input className="h-9 text-sm" value={form.voyage_number} onChange={e => set('voyage_number', e.target.value)} />
                </div>
                <div><Label className="text-xs text-muted-foreground">Container #</Label>
                  <Input className="h-9 text-sm" value={form.container_number} onChange={e => set('container_number', e.target.value)} />
                </div>
                <div><Label className="text-xs text-muted-foreground">Container Size</Label>
                  <select className={selCls} value={form.container_size} onChange={e => set('container_size', e.target.value)}>
                    <option value="">Select</option>{CONTAINER_SIZES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Route */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Origin</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs text-muted-foreground">Country</Label><Input className="h-9 text-sm" value={form.origin_country} onChange={e => set('origin_country', e.target.value)} placeholder="China, Bangladesh..." /></div>
              <div><Label className="text-xs text-muted-foreground">Port / Airport</Label><Input className="h-9 text-sm" value={form.origin_port} onChange={e => set('origin_port', e.target.value)} placeholder="Shanghai, Chittagong..." /></div>
            </div>
            <div><Label className="text-xs text-muted-foreground">Address</Label><Input className="h-9 text-sm" value={form.origin_address} onChange={e => set('origin_address', e.target.value)} /></div>
            <h3 className="text-sm font-semibold pt-2">Destination</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs text-muted-foreground">Country</Label><Input className="h-9 text-sm" value={form.destination_country} onChange={e => set('destination_country', e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">Port / Airport</Label><Input className="h-9 text-sm" value={form.destination_port} onChange={e => set('destination_port', e.target.value)} /></div>
            </div>
            <div><Label className="text-xs text-muted-foreground">Address</Label><Input className="h-9 text-sm" value={form.destination_address} onChange={e => set('destination_address', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs text-muted-foreground">ETD (Estimated Departure)</Label><Input type="date" className="h-9 text-sm" value={form.estimated_departure} onChange={e => set('estimated_departure', e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">ETA (Estimated Arrival)</Label><Input type="date" className="h-9 text-sm" value={form.estimated_arrival} onChange={e => set('estimated_arrival', e.target.value)} /></div>
            </div>
          </div>
        )}

        {/* Step 3: Cargo */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs text-muted-foreground">Total Cartons</Label><Input type="number" className="h-9 text-sm" value={form.total_cartons} onChange={e => set('total_cartons', e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">Total Pieces</Label><Input type="number" className="h-9 text-sm" value={form.total_pieces} onChange={e => set('total_pieces', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label className="text-xs text-muted-foreground">Gross Weight (kg)</Label><Input type="number" step="0.01" className="h-9 text-sm" value={form.gross_weight_kg} onChange={e => set('gross_weight_kg', e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">Net Weight (kg)</Label><Input type="number" step="0.01" className="h-9 text-sm" value={form.net_weight_kg} onChange={e => set('net_weight_kg', e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">Volume (CBM)</Label><Input type="number" step="0.001" className="h-9 text-sm" value={form.volume_cbm} onChange={e => set('volume_cbm', e.target.value)} /></div>
            </div>
            <div><Label className="text-xs text-muted-foreground">Notes</Label>
              <textarea className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm min-h-[60px] resize-vertical" value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Review Shipment</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ['Mode', form.shipping_mode ? SHIPPING_MODE_CONFIG[form.shipping_mode as ShippingMode]?.label : ''],
                ['Carrier', form.carrier_name],
                ['Incoterm', form.incoterm],
                ['Origin', [form.origin_port, form.origin_country].filter(Boolean).join(', ')],
                ['Destination', [form.destination_port, form.destination_country].filter(Boolean).join(', ')],
                ['ETD', form.estimated_departure],
                ['ETA', form.estimated_arrival],
                ['Cartons', form.total_cartons],
                ['Pieces', form.total_pieces],
                ['Weight', form.gross_weight_kg ? `${form.gross_weight_kg} kg` : ''],
                ['Volume', form.volume_cbm ? `${form.volume_cbm} CBM` : ''],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t border-border">
          {step > 1 ? (
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="w-3 h-3" /> Back
            </Button>
          ) : <div />}
          {step < 4 ? (
            <Button size="sm" className="text-xs gap-1" onClick={() => {
              if (step === 1 && !form.shipping_mode) { toast.error('Select shipping mode'); return }
              setStep(step + 1)
            }} style={{ backgroundColor: '#D4A843' }}>
              Next <ArrowRight className="w-3 h-3" />
            </Button>
          ) : (
            <Button size="sm" className="text-xs gap-2" onClick={handleSubmit} disabled={saving} style={{ backgroundColor: '#D4A843' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ship className="w-4 h-4" />}
              {saving ? 'Creating...' : 'Create Shipment'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
