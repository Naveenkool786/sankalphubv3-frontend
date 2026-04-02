'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Check, Upload, FileText, Sparkles, ArrowLeft, ArrowRight, Camera, Loader2, Download, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { exportProjectPDF } from '@/lib/export/projectPdf'
import { exportProjectExcel } from '@/lib/export/projectExcel'

/* ── Types ── */
interface FormData {
  name: string
  season: string
  category: string
  productType: string
  description: string
  productImageFile: File | null
  productImagePreview: string
  factoryId: string
  factoryName: string
  poNumber: string
  quantity: string
  unit: string
  country: string
  buyerBrand: string
  sizes: Record<string, string>
  startDate: string
  expectedDelivery: string
  inspectionDate: string
  shipmentDate: string
  aqlLevel: string
  inspectionType: string
  sampleSize: string
  lotSize: string
  priority: string
  notes: string
  status: string
  tags: string[]
}

interface ExtractedField { key: string; label: string; value: string }

const STEPS = ['Basics', 'Factory', 'Timeline & QC', 'Review & save']
const SEASONS = ['Summer 2026', 'Winter 2026', 'Spring 2027', 'AW26', 'SS27']
const CATEGORIES = ['Garments', 'Footwear', 'Gloves', 'Headwear', 'Accessories']
const UNITS = ['pcs', 'pairs', 'sets', 'dozens']
const AQL_OPTIONS = [
  { value: '2.5', label: 'AQL 2.5 \u2014 Standard' },
  { value: '1.0', label: 'AQL 1.0 \u2014 Strict' },
  { value: '4.0', label: 'AQL 4.0 \u2014 Relaxed' },
]
const INSPECTION_TYPES = ['Final', 'Pre-production', 'During production', 'Loading check']
const SIZE_KEYS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export default function NewProjectPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([])
  const [fillCount, setFillCount] = useState(0)
  const [factories, setFactories] = useState<{ id: string; name: string }[]>([])
  const [factoriesLoaded, setFactoriesLoaded] = useState(false)

  const [form, setForm] = useState<FormData>({
    name: '', season: '', category: '', productType: '', description: '',
    productImageFile: null, productImagePreview: '',
    factoryId: '', factoryName: '', poNumber: '', quantity: '', unit: 'pcs',
    country: '', buyerBrand: '',
    sizes: { XS: '', S: '', M: '', L: '', XL: '', XXL: '' },
    startDate: '', expectedDelivery: '', inspectionDate: '', shipmentDate: '',
    aqlLevel: '2.5', inspectionType: 'final', sampleSize: '', lotSize: '',
    priority: 'medium', notes: '', status: 'confirmed', tags: [],
  })

  const set = (key: keyof FormData, value: any) => setForm(f => ({ ...f, [key]: value }))
  const setSize = (k: string, v: string) => setForm(f => ({ ...f, sizes: { ...f.sizes, [k]: v } }))
  const sizeTotal = Object.values(form.sizes).reduce((s, v) => s + (parseInt(v) || 0), 0)

  function getSupabase() {
    return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  }

  /* ── Load factories on Step 2 ── */
  const loadFactories = useCallback(async () => {
    if (factoriesLoaded) return
    try {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
      const orgId = (profile as any)?.org_id
      if (!orgId) return
      const { data } = await (supabase.from('factories') as any).select('id, name').eq('org_id', orgId).eq('is_active', true).order('name')
      if (data) setFactories(data)
      setFactoriesLoaded(true)
    } catch { /* silent */ }
  }, [factoriesLoaded])

  /* ── Image upload handler ── */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    set('productImageFile', file)
    set('productImagePreview', URL.createObjectURL(file))
  }

  /* ── AI file extraction ── */
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setExtracting(true)
    setExtractedFields([])
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/projects/extract-from-file', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.data) {
        const fields: ExtractedField[] = []
        const d = json.data
        if (d.projectName) fields.push({ key: 'name', label: 'Project Name', value: d.projectName })
        if (d.poNumber) fields.push({ key: 'poNumber', label: 'PO Number', value: d.poNumber })
        if (d.factoryName) fields.push({ key: 'factoryName', label: 'Factory', value: d.factoryName })
        if (d.quantity) fields.push({ key: 'quantity', label: 'Quantity', value: String(d.quantity) })
        if (d.unit) fields.push({ key: 'unit', label: 'Unit', value: d.unit })
        if (d.country) fields.push({ key: 'country', label: 'Country', value: d.country })
        if (d.buyer) fields.push({ key: 'buyerBrand', label: 'Buyer', value: d.buyer })
        if (d.deliveryDate) fields.push({ key: 'expectedDelivery', label: 'Delivery', value: d.deliveryDate })
        if (d.aqlLevel) fields.push({ key: 'aqlLevel', label: 'AQL', value: d.aqlLevel })
        if (d.category) fields.push({ key: 'category', label: 'Category', value: d.category })
        if (d.season) fields.push({ key: 'season', label: 'Season', value: d.season })
        setExtractedFields(fields)
      } else {
        toast.error('Could not extract fields from file')
      }
    } catch {
      toast.error('File extraction failed')
    } finally {
      setExtracting(false)
    }
  }

  const fillAllFields = () => {
    let count = 0
    for (const f of extractedFields) {
      if (f.key === 'factoryName') { set('factoryName', f.value); count++; continue }
      if (f.key in form && f.value) { set(f.key as keyof FormData, f.value); count++ }
    }
    setFillCount(count)
    toast.success(`${count} fields filled`)
  }

  /* ── Save project ── */
  const handleSave = async (asDraft: boolean) => {
    if (!form.name.trim()) { toast.error('Project name is required'); return }
    setSaving(true)
    try {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Not authenticated'); setSaving(false); return }
      const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
      const orgId = (profile as any)?.org_id
      if (!orgId) { toast.error('No organization found'); setSaving(false); return }

      // Upload image if exists
      let imageUrl = ''
      if (form.productImageFile) {
        const { data } = await supabase.storage
          .from('project-images')
          .upload(`${orgId}/${Date.now()}-cover.jpg`, form.productImageFile, { upsert: true })
        if (data) {
          imageUrl = supabase.storage.from('project-images').getPublicUrl(data.path).data.publicUrl
        }
      }

      await (supabase.from('projects') as any).insert({
        org_id: orgId,
        name: form.name.trim(),
        season: form.season || null,
        product_category: form.category || null,
        product_type: form.productType || null,
        description: form.description || null,
        product_image_url: imageUrl || null,
        factory_id: form.factoryId || null,
        po_number: form.poNumber || null,
        quantity: parseInt(form.quantity) || null,
        unit: form.unit || 'pcs',
        country: form.country || null,
        buyer_brand: form.buyerBrand || null,
        sizes: Object.values(form.sizes).some(v => v) ? form.sizes : null,
        start_date: form.startDate || null,
        expected_delivery: form.expectedDelivery || null,
        deadline: form.expectedDelivery || null,
        inspection_date: form.inspectionDate || null,
        shipment_date: form.shipmentDate || null,
        aql_level: form.aqlLevel || null,
        inspection_type: form.inspectionType || null,
        sample_size: parseInt(form.sampleSize) || null,
        lot_size: parseInt(form.lotSize) || null,
        priority: form.priority || 'medium',
        notes: form.notes || null,
        status: asDraft ? 'draft' : 'confirmed',
        created_by: user.id,
      })

      toast.success(asDraft ? 'Draft saved' : 'Project created')
      router.push('/projects')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  /* ── Export from review ── */
  const getExportData = () => ({
    name: form.name,
    season: form.season,
    product_category: form.category,
    product_type: form.productType,
    factory_name: form.factoryName || factories.find(f => f.id === form.factoryId)?.name,
    po_number: form.poNumber,
    quantity: parseInt(form.quantity) || null,
    unit: form.unit,
    country: form.country,
    buyer_brand: form.buyerBrand,
    status: form.status,
    priority: form.priority,
    aql_level: form.aqlLevel,
    inspection_type: form.inspectionType,
    expected_delivery: form.expectedDelivery,
    inspection_date: form.inspectionDate,
    shipment_date: form.shipmentDate,
    sizes: form.sizes,
    notes: form.notes,
  })

  /* ── Shared styles ── */
  const cardStyle: React.CSSProperties = {
    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', background: 'var(--input)', border: '1px solid var(--border)',
    borderRadius: '8px', color: 'var(--foreground)', fontSize: '13px', outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: 500, color: 'var(--muted-foreground)', display: 'block', marginBottom: '5px',
  }
  const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'auto' as any }

  /* ── Navigation ── */
  const goNext = () => {
    if (step === 1 && !form.name.trim()) { toast.error('Project name is required'); return }
    if (step === 2) { loadFactories() }
    if (step < 4) setStep(step + 1)
    if (step === 1) loadFactories() // preload for step 2
  }
  const goBack = () => { if (step > 1) setStep(step - 1) }

  return (
    <div className="p-6 lg:p-8 max-w-[960px] mx-auto">
      {/* Back link */}
      <button onClick={() => router.push('/projects')} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
      </button>

      <h1 className="text-xl font-bold text-foreground mb-1">Create New Project</h1>
      <p className="text-sm text-muted-foreground mb-6">Fill in project details across 4 steps.</p>

      {/* ── Stepper ── */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((label, i) => {
          const num = i + 1
          const done = step > num
          const active = step === num
          return (
            <div key={label} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : undefined }}>
              <div className="flex flex-col items-center" style={{ minWidth: '56px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 600,
                  background: done ? '#1D9E75' : active ? '#BA7517' : 'transparent',
                  border: done || active ? 'none' : '2px solid var(--border)',
                  color: done || active ? '#fff' : 'var(--muted-foreground)',
                }}>
                  {done ? <Check className="w-3.5 h-3.5" /> : num}
                </div>
                <span style={{
                  fontSize: '10px', marginTop: '4px', fontWeight: 500,
                  color: done ? '#1D9E75' : active ? '#BA7517' : 'var(--muted-foreground)',
                }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: '2px', marginInline: '8px',
                  background: done ? '#1D9E75' : 'var(--border)',
                  borderRadius: '1px', marginBottom: '18px',
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* ══════════════ STEP 1 — Basics + Upload ══════════════ */}
      {step === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '14px', alignItems: 'stretch' }}>
          {/* Left — Form */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Project Basics</h2>

              <div>
                <label style={labelStyle}>Project name *</label>
                <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Summer Collection 2026" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Season</label>
                  <select style={selectStyle} value={form.season} onChange={e => set('season', e.target.value)}>
                    <option value="">Select season</option>
                    {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Category *</label>
                  <select style={selectStyle} value={form.category} onChange={e => set('category', e.target.value)}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Product type</label>
                <input style={inputStyle} value={form.productType} onChange={e => set('productType', e.target.value)} placeholder="e.g. Winter Jacket, Polo Shirt" />
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief product description" />
              </div>

              {/* Product image */}
              <div>
                <label style={labelStyle}>Product image</label>
                {form.productImagePreview ? (
                  <div style={{ position: 'relative', height: '120px', borderRadius: '8px', overflow: 'hidden' }}>
                    <img src={form.productImagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => { set('productImageFile', null); set('productImagePreview', '') }}
                      style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '6px', padding: '3px 10px', fontSize: '10px', cursor: 'pointer' }}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <div onClick={() => fileInputRef.current?.click()}
                    style={{ border: '1.5px dashed var(--border)', borderRadius: '8px', padding: '16px', textAlign: 'center', cursor: 'pointer', background: 'var(--muted)' }}>
                    <Camera className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--muted-foreground)' }} />
                    <p style={{ fontSize: '11px', color: 'var(--foreground)' }}>Click to upload product image</p>
                    <p style={{ fontSize: '9px', color: 'var(--muted-foreground)' }}>JPG, PNG, WebP &middot; max 5MB</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
              </div>
            </div>
          </div>

          {/* Right — AI Upload */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="flex items-center gap-2 mb-3">
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Upload &amp; auto-fill</h2>
                <span style={{ fontSize: '9px', background: '#EEEDFE', color: '#534AB7', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>AI</span>
              </div>

              {extractedFields.length > 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {extractedFields.map(f => (
                    <div key={f.key} className="flex items-center gap-2" style={{ fontSize: '11px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1D9E75', flexShrink: 0 }} />
                      <span style={{ color: 'var(--muted-foreground)', minWidth: '60px' }}>{f.label}</span>
                      <span style={{ color: 'var(--foreground)', flex: 1, fontWeight: 500 }}>{f.value}</span>
                    </div>
                  ))}
                  {fillCount > 0 ? (
                    <div className="flex items-center gap-2 mt-2" style={{ fontSize: '11px', color: '#1D9E75' }}>
                      <Check className="w-3.5 h-3.5" /> {fillCount} fields filled
                    </div>
                  ) : (
                    <button onClick={fillAllFields}
                      style={{ marginTop: 'auto', width: '100%', padding: '8px', background: '#BA7517', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      Fill all fields &rarr;
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  onClick={() => !extracting && docInputRef.current?.click()}>
                  <div style={{ border: '1.5px dashed var(--border)', borderRadius: '10px', padding: '24px 16px', textAlign: 'center', cursor: extracting ? 'default' : 'pointer', width: '100%' }}>
                    {extracting ? (
                      <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" style={{ color: '#BA7517' }} />
                    ) : (
                      <Upload className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--muted-foreground)' }} />
                    )}
                    <p style={{ fontSize: '11px', color: 'var(--foreground)' }}>
                      {extracting ? 'Extracting fields...' : 'Drop PO or tech pack'}
                    </p>
                    <p style={{ fontSize: '9px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
                      Excel, PDF, Word, CSV
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                    {[
                      { label: 'Excel', color: '#185FA5', bg: '#E6F1FB' },
                      { label: 'PDF', color: '#1D6B3D', bg: '#E1F5EE' },
                      { label: 'Word', color: '#534AB7', bg: '#EEEDFE' },
                      { label: 'CSV', color: '#854F0B', bg: '#FAEEDA' },
                    ].map(b => (
                      <span key={b.label} style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '4px', background: b.bg, color: b.color, fontWeight: 600 }}>{b.label}</span>
                    ))}
                  </div>
                  <p style={{ fontSize: '9px', color: 'var(--muted-foreground)', textAlign: 'center', lineHeight: '1.5', marginTop: '4px', padding: '0 4px' }}>
                    AI reads your PO or tech pack and fills project name, factory, sizes, PO number, delivery date, AQL level
                  </p>
                </div>
              )}
              <input ref={docInputRef} type="file" accept=".xlsx,.xls,.pdf,.docx,.csv" style={{ display: 'none' }} onChange={handleDocUpload} />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ STEP 2 — Factory & Production ══════════════ */}
      {step === 2 && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>Factory &amp; Production Details</h2>
          <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '18px' }}>Review and confirm &mdash; fields pre-filled from your uploaded file</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Assigned factory *</label>
              <select style={selectStyle} value={form.factoryId} onChange={e => { set('factoryId', e.target.value); set('factoryName', factories.find(f => f.id === e.target.value)?.name || '') }}>
                <option value="">Select factory</option>
                {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>PO number</label>
              <input style={inputStyle} value={form.poNumber} onChange={e => set('poNumber', e.target.value)} placeholder="PO-2026-001" />
            </div>
            <div>
              <label style={labelStyle}>Quantity *</label>
              <input style={inputStyle} type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="5000" />
            </div>
            <div>
              <label style={labelStyle}>Unit</label>
              <select style={selectStyle} value={form.unit} onChange={e => set('unit', e.target.value)}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Country</label>
              <input style={inputStyle} value={form.country} onChange={e => set('country', e.target.value)} placeholder="India" />
            </div>
            <div>
              <label style={labelStyle}>Buyer / Brand</label>
              <input style={inputStyle} value={form.buyerBrand} onChange={e => set('buyerBrand', e.target.value)} placeholder="Brand name" />
            </div>
          </div>

          {/* Size breakdown */}
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginTop: '20px', marginBottom: '10px' }}>Size Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {SIZE_KEYS.map(k => (
              <div key={k}>
                <label style={labelStyle}>{k}</label>
                <input style={inputStyle} type="number" value={form.sizes[k]} onChange={e => setSize(k, e.target.value)} placeholder="0" />
              </div>
            ))}
          </div>
          {sizeTotal > 0 && (
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', marginTop: '8px' }}>
              Total: {sizeTotal.toLocaleString()} pcs
            </p>
          )}
        </div>
      )}

      {/* ══════════════ STEP 3 — Timeline & QC ══════════════ */}
      {step === 3 && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '18px' }}>Timeline &amp; QC Settings</h2>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            {[
              { key: 'startDate', label: 'Start date' },
              { key: 'expectedDelivery', label: 'Expected delivery *' },
              { key: 'inspectionDate', label: 'Inspection date' },
              { key: 'shipmentDate', label: 'Shipment date' },
            ].map(f => (
              <div key={f.key}>
                <label style={labelStyle}>{f.label}</label>
                <input style={inputStyle} type="date" value={(form as any)[f.key]} onChange={e => set(f.key as keyof FormData, e.target.value)} />
              </div>
            ))}
          </div>

          {/* QC */}
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '10px' }}>QC Settings</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>AQL level *</label>
              <select style={selectStyle} value={form.aqlLevel} onChange={e => set('aqlLevel', e.target.value)}>
                {AQL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Inspection type</label>
              <select style={selectStyle} value={form.inspectionType} onChange={e => set('inspectionType', e.target.value)}>
                {INSPECTION_TYPES.map(t => <option key={t} value={t.toLowerCase().replace(/ /g, '_')}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Sample size</label>
              <input style={inputStyle} type="number" value={form.sampleSize} onChange={e => set('sampleSize', e.target.value)} placeholder="Auto-calculated" />
            </div>
            <div>
              <label style={labelStyle}>Lot size</label>
              <input style={inputStyle} type="number" value={form.lotSize} onChange={e => set('lotSize', e.target.value)} placeholder="Enter lot size" />
            </div>
          </div>

          {/* Priority */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Priority</label>
            <div className="flex gap-2">
              {[
                { v: 'high', label: 'High', bg: '#FCEBEB', color: '#791F1F' },
                { v: 'medium', label: 'Medium', bg: '#FAEEDA', color: '#633806' },
                { v: 'low', label: 'Low', bg: 'var(--muted)', color: 'var(--muted-foreground)' },
              ].map(p => (
                <button key={p.v} type="button" onClick={() => set('priority', p.v)}
                  style={{
                    padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    border: form.priority === p.v ? '2px solid var(--foreground)' : '1px solid var(--border)',
                    background: p.bg, color: p.color,
                  }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes for this project" />
          </div>
        </div>
      )}

      {/* ══════════════ STEP 4 — Review & Save ══════════════ */}
      {step === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '14px', alignItems: 'stretch' }}>
          {/* Left — Summary */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ ...cardStyle, flex: 1 }}>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '14px' }}>Project Summary</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  ['Project name', form.name],
                  ['Season', form.season],
                  ['Category', form.category],
                  ['Product type', form.productType],
                  ['Factory', form.factoryName || factories.find(f => f.id === form.factoryId)?.name || '\u2014'],
                  ['Quantity', form.quantity ? `${parseInt(form.quantity).toLocaleString()} ${form.unit}` : '\u2014'],
                  ['PO number', form.poNumber],
                  ['Country', form.country],
                  ['Buyer / Brand', form.buyerBrand],
                  ['Expected delivery', form.expectedDelivery],
                  ['AQL level', AQL_OPTIONS.find(o => o.value === form.aqlLevel)?.label || form.aqlLevel],
                  ['Inspection type', form.inspectionType],
                  ['Priority', form.priority],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="flex items-start gap-3" style={{ fontSize: '12px' }}>
                    <span style={{ color: 'var(--muted-foreground)', minWidth: '120px', flexShrink: 0 }}>{label}</span>
                    <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
                {/* Sizes */}
                {sizeTotal > 0 && (
                  <div className="flex items-start gap-3" style={{ fontSize: '12px' }}>
                    <span style={{ color: 'var(--muted-foreground)', minWidth: '120px', flexShrink: 0 }}>Sizes</span>
                    <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>
                      {Object.entries(form.sizes).filter(([, v]) => v && parseInt(v) > 0).map(([k, v]) => `${k}\u00B7${v}`).join('  ')}
                    </span>
                  </div>
                )}
                {/* Image thumbnail */}
                {form.productImagePreview && (
                  <div className="flex items-start gap-3" style={{ fontSize: '12px' }}>
                    <span style={{ color: 'var(--muted-foreground)', minWidth: '120px', flexShrink: 0 }}>Product image</span>
                    <img src={form.productImagePreview} alt="Product" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right — Actions */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check className="w-5 h-5" style={{ color: '#1D9E75' }} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Ready to create</p>
                <p style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>All required fields complete</p>
              </div>

              <button disabled={saving} onClick={() => handleSave(false)}
                style={{ width: '100%', padding: '10px', background: saving ? '#888' : '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Creating...' : 'Create project \u2192'}
              </button>

              <div className="flex gap-2 w-full">
                <button onClick={() => exportProjectPDF(getExportData())}
                  style={{ flex: 1, padding: '8px', background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Download className="w-3 h-3" /> PDF
                </button>
                <button onClick={() => exportProjectExcel(getExportData())}
                  style={{ flex: 1, padding: '8px', background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <FileSpreadsheet className="w-3 h-3" /> Excel
                </button>
              </div>

              <button disabled={saving} onClick={() => handleSave(true)}
                style={{ width: '100%', padding: '8px', background: 'transparent', color: 'var(--muted-foreground)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                Save as draft
              </button>

              <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', textAlign: 'left', width: '100%', marginTop: '4px' }}>
                <p>&bull; Factory will be notified</p>
                <p>&bull; Inspection can be started immediately</p>
                <p>&bull; All details editable after saving</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation Buttons ── */}
      <div className="flex justify-between mt-6">
        {step > 1 ? (
          <button onClick={goBack}
            style={{ padding: '9px 20px', background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        ) : <div />}
        {step < 4 && (
          <button onClick={goNext}
            style={{ padding: '9px 20px', background: '#BA7517', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Continue <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
