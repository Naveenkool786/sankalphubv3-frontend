'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Loader2, FlaskConical } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createLabPartner } from '@/lib/actions/testing'
import type { LabPartner } from '@/lib/types/testing'

export default function LabPartnersPage() {
  const [labs, setLabs] = useState<LabPartner[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ lab_name: '', lab_code: '', accreditation: '', country: '', city: '', contact_name: '', contact_email: '', turnaround_days: '7' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    (async () => {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data } = await (supabase.from('lab_partners') as any).select('*').order('lab_name')
      if (data) setLabs(data)
    })()
  }, [saving])

  const handleSubmit = async () => {
    if (!form.lab_name) { toast.error('Lab name is required'); return }
    setSaving(true)
    const result = await createLabPartner({
      lab_name: form.lab_name, lab_code: form.lab_code || undefined,
      accreditation: form.accreditation || undefined,
      country: form.country || undefined, city: form.city || undefined,
      contact_name: form.contact_name || undefined,
      contact_email: form.contact_email || undefined,
      turnaround_days: parseInt(form.turnaround_days) || 7,
    })
    setSaving(false)
    if (result.success) {
      toast.success('Lab partner added')
      setForm({ lab_name: '', lab_code: '', accreditation: '', country: '', city: '', contact_name: '', contact_email: '', turnaround_days: '7' })
      setShowForm(false)
    } else toast.error('Failed', { description: result.error })
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FlaskConical className="w-5 h-5" style={{ color: '#D4A843' }} /> Lab Partners
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{labs.length} registered labs</p>
        </div>
        <Button size="sm" className="gap-1.5" style={{ backgroundColor: '#D4A843' }} onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Add Lab
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-5 mb-6 space-y-3">
          <h3 className="text-sm font-semibold">New Lab Partner</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] text-muted-foreground">Lab Name *</label><Input className="h-9 text-sm" value={form.lab_name} onChange={e => set('lab_name', e.target.value)} placeholder="SGS, Intertek, BV..." /></div>
            <div><label className="text-[10px] text-muted-foreground">Lab Code</label><Input className="h-9 text-sm" value={form.lab_code} onChange={e => set('lab_code', e.target.value)} placeholder="SGS-BLR" /></div>
            <div><label className="text-[10px] text-muted-foreground">Accreditation</label><Input className="h-9 text-sm" value={form.accreditation} onChange={e => set('accreditation', e.target.value)} placeholder="ISO 17025, OEKO-TEX" /></div>
            <div><label className="text-[10px] text-muted-foreground">Turnaround Days</label><Input type="number" className="h-9 text-sm" value={form.turnaround_days} onChange={e => set('turnaround_days', e.target.value)} /></div>
            <div><label className="text-[10px] text-muted-foreground">Country</label><Input className="h-9 text-sm" value={form.country} onChange={e => set('country', e.target.value)} /></div>
            <div><label className="text-[10px] text-muted-foreground">City</label><Input className="h-9 text-sm" value={form.city} onChange={e => set('city', e.target.value)} /></div>
            <div><label className="text-[10px] text-muted-foreground">Contact Name</label><Input className="h-9 text-sm" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} /></div>
            <div><label className="text-[10px] text-muted-foreground">Contact Email</label><Input className="h-9 text-sm" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} /></div>
          </div>
          <Button size="sm" className="gap-1" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Save Lab
          </Button>
        </div>
      )}

      {labs.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No lab partners registered yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {labs.map(lab => (
            <div key={lab.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{lab.lab_name}</span>
                  {lab.lab_code && <Badge variant="secondary" className="text-[10px]">{lab.lab_code}</Badge>}
                  {lab.accreditation && <Badge variant="secondary" className="text-[10px]">{lab.accreditation}</Badge>}
                  <Badge className={lab.is_active ? 'bg-green-100 text-green-700 text-[10px]' : 'bg-gray-100 text-gray-600 text-[10px]'}>
                    {lab.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {[lab.city, lab.country].filter(Boolean).join(', ')} · {lab.turnaround_days}d turnaround
                  {lab.contact_name && ` · ${lab.contact_name}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
