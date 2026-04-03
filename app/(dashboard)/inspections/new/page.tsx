'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, ArrowRight, Check, Camera, Upload, Loader2, Plus, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { BackButton } from '@/components/ui/BackButton'
import { getSampleSize, getAQLLimits, calculateAQL } from '@/lib/inspection/aql-engine'
import { getChecklistForCategory, getTotalItemCount, type ChecklistSection } from '@/lib/inspection/checklists'
import { exportInspectionPDF } from '@/lib/export/inspectionPdf'

/* ── Constants ── */
const STEP_LABELS = ['Setup', 'Category', 'Photos', 'Checklist', 'Defects', 'AQL', 'Report']
const CATEGORIES = ['Garments', 'Footwear', 'Gloves', 'Headwear', 'Accessories']
const AQL_OPTIONS = [
  { value: '2.5', label: 'AQL 2.5 \u2014 Standard' },
  { value: '1.0', label: 'AQL 1.0 \u2014 Strict' },
  { value: '4.0', label: 'AQL 4.0 \u2014 Relaxed' },
]
const INSPECTION_TYPES = [
  { value: 'final', label: 'Final inspection' },
  { value: 'pre_production', label: 'Pre-production' },
  { value: 'during_production', label: 'During production' },
  { value: 'loading', label: 'Loading check' },
]
const DECISIONS = [
  'Pass \u2014 approve shipment',
  'Fail \u2014 reject shipment',
  'Fail \u2014 100% re-inspection required',
  'Fail \u2014 conditional acceptance with corrective actions',
  'Hold \u2014 pending further review',
]
const PHOTO_SPECS = [
  { name: 'Buyer approved sample', ai: 'AI uses this as reference to compare all production photos' },
  { name: 'Production \u2014 front view', ai: 'AI compares against buyer sample \u2014 flags colour, construction differences' },
  { name: 'Production \u2014 back view', ai: 'AI checks back seam quality and construction' },
  { name: 'Inside lining', ai: 'AI checks lining quality, labels and care instructions' },
]

/* ── Types ── */
interface Photo { name: string; url: string; captured: boolean; file?: File }
interface CheckItem { section: string; sectionIdx: number; number: number; question: string; result: 'pending' | 'pass' | 'fail' | 'na'; photoUrl: string; notes: string }
interface Defect { name: string; severity: 'critical' | 'major' | 'minor'; location: string; source: 'manual' | 'ai_detected'; quantity: number; notes: string }
interface AIDefect { name: string; severity: string; location: string; confidence: number }

export default function NewInspectionPage() {
  const router = useRouter()
  const signatureRef = useRef<HTMLCanvasElement>(null)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [orgId, setOrgId] = useState('')
  const [userId, setUserId] = useState('')
  const [projects, setProjects] = useState<any[]>([])
  const [factories, setFactories] = useState<any[]>([])

  /* ── Form state ── */
  const [form, setForm] = useState({
    projectId: '', factoryId: '', factoryName: '',
    auditorName: '', auditorType: 'brand_inspector', auditorContact: '',
    inspectionDate: new Date().toISOString().split('T')[0], inspectionType: 'final',
    category: '', productType: '', styleRef: '', colour: '',
    aqlLevel: '2.5', lotSize: 0, sampleSize: 125, inspectionLevel: 'normal_2',
    selectedSections: [0, 1, 2, 3, 4] as number[],
    inspectorDecision: '', inspectorComments: '', inspectorSignature: '',
  })

  const [photos, setPhotos] = useState<Photo[]>(PHOTO_SPECS.map(p => ({ name: p.name, url: '', captured: false })))
  const [checkItems, setCheckItems] = useState<CheckItem[]>([])
  const [activeCheckIdx, setActiveCheckIdx] = useState(0)
  const [defects, setDefects] = useState<Defect[]>([])
  const [aiDefects, setAIDefects] = useState<Record<number, AIDefect[]>>({})
  const [analysing, setAnalysing] = useState<Record<number, boolean>>({})
  const [defectSearch, setDefectSearch] = useState('')
  const [manualDefect, setManualDefect] = useState({ name: '', severity: 'major' as Defect['severity'], location: '', quantity: 1, notes: '' })
  const [isDrawing, setIsDrawing] = useState(false)

  const set = (key: keyof typeof form, value: any) => setForm(f => ({ ...f, [key]: value }))

  function getSupabase() {
    return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  }

  // Defect counts
  const defectCounts = {
    critical: defects.filter(d => d.severity === 'critical').reduce((s, d) => s + d.quantity, 0),
    major: defects.filter(d => d.severity === 'major').reduce((s, d) => s + d.quantity, 0),
    minor: defects.filter(d => d.severity === 'minor').reduce((s, d) => s + d.quantity, 0),
  }

  // AQL calculation
  const aqlResult = calculateAQL(defectCounts.critical, defectCounts.major, defectCounts.minor, form.sampleSize, form.aqlLevel)

  // Auto-calculate sample size when lot size changes
  useEffect(() => {
    if (form.lotSize > 0) {
      const ss = getSampleSize(form.lotSize, form.inspectionLevel)
      set('sampleSize', ss)
    }
  }, [form.lotSize, form.inspectionLevel])

  // Load org context via server API (bypasses RLS), then load projects + factories
  useEffect(() => {
    (async () => {
      const res = await fetch('/api/user/context')
      if (!res.ok) return
      const ctx = await res.json()
      if (ctx.user_id) setUserId(ctx.user_id)
      if (!ctx.org_id) return
      setOrgId(ctx.org_id)
      const supabase = getSupabase()
      const [{ data: projs }, { data: facts }] = await Promise.all([
        (supabase.from('projects') as any).select('id, name, factory_id, product_category, po_number, quantity, aql_level, factories(name)').eq('org_id', ctx.org_id).order('name'),
        (supabase.from('factories') as any).select('id, name').eq('org_id', ctx.org_id).eq('is_active', true).order('name'),
      ])
      if (projs) setProjects(projs)
      if (facts) setFactories(facts)
    })()
  }, [])

  // Build checklist when category changes
  useEffect(() => {
    if (!form.category) return
    const sections = getChecklistForCategory(form.category)
    const items: CheckItem[] = []
    sections.forEach((s, si) => {
      if (!form.selectedSections.includes(si)) return
      s.items.forEach(item => {
        items.push({ section: s.section, sectionIdx: si, number: item.number, question: item.question, result: 'pending', photoUrl: '', notes: '' })
      })
    })
    setCheckItems(items)
    setActiveCheckIdx(0)
  }, [form.category, form.selectedSections])

  /* ── Project select auto-fill ── */
  const handleProjectSelect = (projectId: string) => {
    const proj = projects.find(p => p.id === projectId)
    if (proj) {
      setForm(f => ({
        ...f, projectId, factoryId: proj.factory_id || '', factoryName: proj.factories?.name || '',
        category: proj.product_category?.toLowerCase() || '', aqlLevel: proj.aql_level || '2.5',
        lotSize: proj.quantity || 0,
      }))
    }
  }

  /* ── Photo capture ── */
  const handlePhotoCapture = async (index: number, file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error('Photo must be under 10MB'); return }
    const url = URL.createObjectURL(file)
    setPhotos(prev => prev.map((p, i) => i === index ? { ...p, url, captured: true, file } : p))
    // Trigger AI analysis
    analysePhotoWithAI(index, file)
  }

  const analysePhotoWithAI = async (photoIndex: number, file: File) => {
    setAnalysing(prev => ({ ...prev, [photoIndex]: true }))
    try {
      const fd = new FormData()
      fd.append('photo', file)
      fd.append('category', form.category || 'garments')
      fd.append('photoType', PHOTO_SPECS[photoIndex].name)
      fd.append('defectLibrary', '') // could load from qc-data
      const res = await fetch('/api/inspections/analyse-photo', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.data?.defects?.length > 0) {
        setAIDefects(prev => ({ ...prev, [photoIndex]: json.data.defects }))
      }
    } catch { /* silent */ }
    finally { setAnalysing(prev => ({ ...prev, [photoIndex]: false })) }
  }

  /* ── Checklist actions ── */
  const handleCheckResult = (idx: number, result: 'pass' | 'fail' | 'na') => {
    setCheckItems(prev => prev.map((item, i) => i === idx ? { ...item, result } : item))
    if (idx < checkItems.length - 1) setActiveCheckIdx(idx + 1)
  }

  /* ── Defect actions ── */
  const addDefect = (d: Defect) => setDefects(prev => [...prev, d])
  const removeDefect = (idx: number) => setDefects(prev => prev.filter((_, i) => i !== idx))

  const addManualDefect = () => {
    if (!manualDefect.name) { toast.error('Defect name required'); return }
    addDefect({ ...manualDefect, source: 'manual' })
    setManualDefect({ name: '', severity: 'major', location: '', quantity: 1, notes: '' })
  }

  /* ── Signature canvas ── */
  const initSignature = useCallback(() => {
    const canvas = signatureRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return
      const rect = canvas.getBoundingClientRect()
      const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left
      const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    const start = (e: MouseEvent | TouchEvent) => {
      setIsDrawing(true)
      const rect = canvas.getBoundingClientRect()
      const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left
      const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
    const stop = () => {
      setIsDrawing(false)
      set('inspectorSignature', canvas.toDataURL())
    }

    canvas.onmousedown = start; canvas.onmousemove = draw; canvas.onmouseup = stop; canvas.onmouseleave = stop
    canvas.ontouchstart = start; canvas.ontouchmove = draw; canvas.ontouchend = stop
  }, [isDrawing])

  useEffect(() => { if (step === 7) initSignature() }, [step, initSignature])

  /* ── Submit ── */
  const handleSubmit = async (asDraft: boolean) => {
    if (!asDraft && !form.projectId) { toast.error('Select a project'); return }
    setSaving(true)
    try {
      const supabase = getSupabase()

      // Upload photos to Supabase Storage
      const photoUrls: Record<string, string> = {}
      for (let i = 0; i < photos.length; i++) {
        if (photos[i].file) {
          const path = `${orgId}/${Date.now()}-photo-${i}.jpg`
          const { data } = await supabase.storage.from('inspection-photos').upload(path, photos[i].file!, { upsert: true })
          if (data) {
            const url = supabase.storage.from('inspection-photos').getPublicUrl(data.path).data.publicUrl
            const keys = ['photo_buyer_sample', 'photo_front', 'photo_back', 'photo_lining']
            photoUrls[keys[i]] = url
          }
        }
      }

      // Save inspection
      const { data: saved, error } = await (supabase.from('inspections') as any).insert({
        org_id: orgId,
        project_id: form.projectId || null,
        factory_id: form.factoryId || null,
        inspection_type: form.inspectionType,
        aql_level: form.aqlLevel,
        status: asDraft ? 'draft' : 'submitted',
        result: asDraft ? 'pending' : aqlResult.overallResult,
        inspection_date: form.inspectionDate,
        auditor_name: form.auditorName || null,
        auditor_type: form.auditorType,
        quantity_inspected: form.sampleSize,
        sample_size: form.sampleSize,
        defects_found: defects.length,
        critical_defects: defectCounts.critical,
        major_defects: defectCounts.major,
        minor_defects: defectCounts.minor,
        category: form.category || null,
        product_type: form.productType || null,
        style_ref: form.styleRef || null,
        colour: form.colour || null,
        lot_size: form.lotSize || null,
        inspection_level: form.inspectionLevel,
        critical_allowed: 0,
        major_allowed: aqlResult.limits.major.accept,
        minor_allowed: aqlResult.limits.minor.accept,
        aql_result: asDraft ? null : aqlResult.overallResult,
        inspector_decision: form.inspectorDecision || null,
        inspector_comments: form.inspectorComments || null,
        inspector_signature: form.inspectorSignature || null,
        submitted_at: asDraft ? null : new Date().toISOString(),
        created_by: userId,
        ...photoUrls,
      }).select().single()

      if (error) throw new Error(error.message)

      // Save checklist items
      if (saved && checkItems.length > 0) {
        await (supabase.from('inspection_checklist_items') as any).insert(
          checkItems.map(item => ({
            inspection_id: saved.id, section: item.section,
            item_number: item.number, question: item.question,
            result: item.result === 'pending' ? null : item.result,
            photo_url: item.photoUrl || null, notes: item.notes || null,
          }))
        )
      }

      // Save defects
      if (saved && defects.length > 0) {
        await (supabase.from('defect_records') as any).insert(
          defects.map(d => ({
            org_id: orgId, inspection_id: saved.id,
            description: d.name, severity: d.severity,
            location: d.location || null, source: d.source,
            quantity: d.quantity, notes: d.notes || null,
          }))
        )
      }

      toast.success(asDraft ? 'Draft saved' : 'Inspection submitted')
      router.push('/inspections')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  /* ── Styles ── */
  const cardStyle: React.CSSProperties = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }
  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)', fontSize: '13px', outline: 'none' }
  const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 500, color: 'var(--muted-foreground)', display: 'block', marginBottom: '5px' }
  const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'stretch' }

  /* ── Step validation ── */
  const canProceed = (s: number) => {
    if (s === 1) return !!form.projectId && !!form.factoryId && !!form.auditorName && !!form.inspectionDate
    if (s === 3) return photos.every(p => p.captured)
    if (s === 4) return checkItems.every(i => i.result !== 'pending')
    return true
  }

  const goNext = () => { if (step < 7 && canProceed(step)) setStep(step + 1); else if (!canProceed(step)) toast.error('Complete all required fields') }
  const goBack = () => { if (step > 1) setStep(step - 1) }

  // Completion checklist for step 1
  const step1Complete = [
    { label: 'Project selected', done: !!form.projectId },
    { label: 'Factory confirmed', done: !!form.factoryId },
    { label: 'Inspector name entered', done: !!form.auditorName },
    { label: 'Date selected', done: !!form.inspectionDate },
  ]

  // Checklist sections for step 2
  const checklistSections = form.category ? getChecklistForCategory(form.category) : []
  const totalCheckItems = getTotalItemCount(checklistSections.filter((_, i) => form.selectedSections.includes(i)))

  // Section progress for step 4
  const sectionProgress = (sectionName: string) => {
    const items = checkItems.filter(i => i.section === sectionName)
    const done = items.filter(i => i.result !== 'pending').length
    return { done, total: items.length }
  }

  const limits = getAQLLimits(form.sampleSize, form.aqlLevel)

  return (
    <div className="p-6 lg:p-8 ">
      <BackButton href="/inspections" label="Back to Inspections" />

      <h1 className="text-xl font-bold text-foreground mb-1">New Inspection</h1>
      <p className="text-sm text-muted-foreground mb-6">7-step quality inspection workflow</p>

      {/* ── Stepper ── */}
      <div className="flex items-center gap-0 mb-8 overflow-x-auto">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1; const done = step > num; const active = step === num
          return (
            <div key={label} className="flex items-center" style={{ flex: i < STEP_LABELS.length - 1 ? 1 : undefined }}>
              <div className="flex flex-col items-center" style={{ minWidth: '40px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 600, background: done ? '#1D9E75' : active ? '#BA7517' : 'transparent',
                  border: done || active ? 'none' : '2px solid var(--border)', color: done || active ? '#fff' : 'var(--muted-foreground)',
                }}>
                  {done ? <Check className="w-3 h-3" /> : num}
                </div>
                <span style={{ fontSize: '9px', marginTop: '3px', fontWeight: 500, color: done ? '#1D9E75' : active ? '#BA7517' : 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{label}</span>
              </div>
              {i < STEP_LABELS.length - 1 && <div style={{ flex: 1, height: '2px', marginInline: '4px', background: done ? '#1D9E75' : 'var(--border)', borderRadius: '1px', marginBottom: '16px' }} />}
            </div>
          )
        })}
      </div>

      {/* ═══════ STEP 1 — Setup ═══════ */}
      {step === 1 && (
        <div style={twoCol}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 600 }}>Inspection Details</h2>
              <div><label style={labelStyle}>Project *</label>
                <select style={{ ...inputStyle, appearance: 'auto' as any }} value={form.projectId} onChange={e => handleProjectSelect(e.target.value)}>
                  <option value="">Select project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.factories?.name ? ` \u2014 ${p.factories.name}` : ''}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Inspection date *</label><input style={inputStyle} type="date" value={form.inspectionDate} onChange={e => set('inspectionDate', e.target.value)} /></div>
              <div><label style={labelStyle}>Inspection type *</label>
                <select style={{ ...inputStyle, appearance: 'auto' as any }} value={form.inspectionType} onChange={e => set('inspectionType', e.target.value)}>
                  {INSPECTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Factory *</label>
                <select style={{ ...inputStyle, appearance: 'auto' as any }} value={form.factoryId} onChange={e => set('factoryId', e.target.value)}>
                  <option value="">Select factory</option>
                  {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 600 }}>Inspector Details</h2>
              <div><label style={labelStyle}>Inspector name *</label><input style={inputStyle} value={form.auditorName} onChange={e => set('auditorName', e.target.value)} placeholder="Full name" /></div>
              <div><label style={labelStyle}>Inspector type</label>
                <select style={{ ...inputStyle, appearance: 'auto' as any }} value={form.auditorType} onChange={e => set('auditorType', e.target.value)}>
                  <option value="brand_inspector">Brand inspector</option>
                  <option value="third_party">Third-party agency</option>
                  <option value="internal_qc">Internal QC</option>
                </select>
              </div>
              <div><label style={labelStyle}>Contact</label><input style={inputStyle} type="tel" value={form.auditorContact} onChange={e => set('auditorContact', e.target.value)} placeholder="+91 98765 43210" /></div>
              {/* Completion checklist — fills remaining height */}
              <div style={{ flex: 1, padding: '12px 14px', background: 'var(--muted)', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>Completion checklist</p>
                {step1Complete.map(c => (
                  <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.done ? '#1D9E75' : 'transparent', border: c.done ? 'none' : '1.5px solid var(--border)' }}>
                      {c.done && <Check className="w-2 h-2 text-white" />}
                    </div>
                    <span style={{ color: c.done ? '#1D9E75' : 'var(--muted-foreground)' }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ STEP 2 — Category & AQL ═══════ */}
      {step === 2 && (
        <div style={twoCol}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Product Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={labelStyle}>Category *</label>
                <select style={{ ...inputStyle, appearance: 'auto' as any }} value={form.category} onChange={e => set('category', e.target.value.toLowerCase())}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Product type</label><input style={inputStyle} value={form.productType} onChange={e => set('productType', e.target.value)} placeholder="e.g. Jackets, Sneakers" /></div>
              <div><label style={labelStyle}>Style / SKU</label><input style={inputStyle} value={form.styleRef} onChange={e => set('styleRef', e.target.value)} placeholder="Style reference" /></div>
              <div><label style={labelStyle}>Colour / Variant</label><input style={inputStyle} value={form.colour} onChange={e => set('colour', e.target.value)} placeholder="Colour" /></div>
            </div>
          </div>
          <div style={cardStyle}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>AQL Settings</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={labelStyle}>AQL level *</label>
                <select style={{ ...inputStyle, appearance: 'auto' as any }} value={form.aqlLevel} onChange={e => set('aqlLevel', e.target.value)}>
                  {AQL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Lot size</label><input style={inputStyle} type="number" value={form.lotSize || ''} onChange={e => set('lotSize', parseInt(e.target.value) || 0)} placeholder="Total quantity" /></div>
              <div><label style={labelStyle}>Sample size (auto-calculated)</label><input style={inputStyle} type="number" value={form.sampleSize} readOnly /></div>
            </div>
            {/* AQL summary */}
            <div style={{ marginTop: '12px', padding: '10px', background: 'var(--muted)', borderRadius: '8px', fontSize: '11px' }}>
              <p style={{ fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                AQL {form.aqlLevel} &middot; Lot {form.lotSize.toLocaleString()} &middot; Sample {form.sampleSize} pcs
              </p>
              <p style={{ color: 'var(--muted-foreground)' }}>
                Critical: accept 0 &middot; Major: accept &le;{limits.major.accept} &middot; Minor: accept &le;{limits.minor.accept}
              </p>
            </div>
            {/* Checklist sections */}
            {checklistSections.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>Checklist sections ({totalCheckItems} items)</p>
                {checklistSections.map((s, i) => (
                  <div key={s.section} onClick={() => setForm(f => ({
                    ...f, selectedSections: f.selectedSections.includes(i)
                      ? f.selectedSections.filter(x => x !== i)
                      : [...f.selectedSections, i],
                  }))}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', marginBottom: '3px', background: 'var(--muted)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: form.selectedSections.includes(i) ? '#1D9E75' : '#888' }} />
                    <span style={{ fontSize: '11px', flex: 1 }}>{s.section}</span>
                    <span style={{ fontSize: '9px', color: 'var(--muted-foreground)' }}>{s.items.length} checks</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ STEP 3 — Photos ═══════ */}
      {step === 3 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {photos.map((photo, i) => (
              <div key={i} style={{ ...cardStyle, padding: '16px' }}>
                {photo.captured ? (
                  <div style={{ position: 'relative', height: '140px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px', border: '2px solid #1D9E75' }}>
                    <img src={photo.url} alt={photo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '4px', right: '4px', background: '#1D9E75', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                ) : (
                  <label style={{ height: '140px', border: '1.5px dashed var(--border)', borderRadius: '8px', cursor: 'pointer', background: 'var(--muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '10px' }}>
                    <Camera className="w-6 h-6" style={{ color: 'var(--muted-foreground)' }} />
                    <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>Tap to capture</span>
                    <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoCapture(i, f) }} />
                  </label>
                )}
                <p style={{ fontSize: '12px', fontWeight: 500, marginBottom: '2px' }}>{photo.name}</p>
                <p style={{ fontSize: '9px', color: photo.captured ? '#1D9E75' : 'var(--muted-foreground)' }}>
                  {photo.captured ? '\u2713 Captured' : 'Not captured'}
                </p>
                {photo.captured && (
                  <div className="flex gap-2 mt-2">
                    <label style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '6px', background: 'var(--muted)', cursor: 'pointer', color: 'var(--foreground)' }}>
                      Retake
                      <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoCapture(i, f) }} />
                    </label>
                    <button onClick={() => setPhotos(prev => prev.map((p, idx) => idx === i ? { ...p, url: '', captured: false, file: undefined } : p))}
                      style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '6px', background: '#FCEBEB', color: '#791F1F', border: 'none', cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                )}
                {/* AI results */}
                {analysing[i] && <div style={{ marginTop: '8px', fontSize: '10px', color: '#BA7517' }}><Loader2 className="w-3 h-3 inline animate-spin mr-1" />Analysing...</div>}
                {aiDefects[i] && aiDefects[i].length > 0 && (
                  <div style={{ marginTop: '8px', padding: '8px', background: '#EEEDFE', borderRadius: '6px' }}>
                    <p style={{ fontSize: '9px', fontWeight: 600, color: '#3C3489', marginBottom: '4px' }}>AI detected defects</p>
                    {aiDefects[i].map((d, di) => (
                      <div key={di} className="flex items-center gap-2" style={{ fontSize: '10px', marginBottom: '3px' }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: d.severity === 'critical' ? '#E24B4A' : d.severity === 'major' ? '#BA7517' : '#1D9E75' }} />
                        <span style={{ flex: 1 }}>{d.name}</span>
                        <button onClick={() => { addDefect({ name: d.name, severity: d.severity as Defect['severity'], location: d.location, source: 'ai_detected', quantity: 1, notes: '' }); toast.success('Added') }}
                          style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', background: '#E1F5EE', color: '#085041', border: 'none', cursor: 'pointer' }}>Add</button>
                      </div>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: '9px', color: '#534AB7', marginTop: '6px', fontStyle: 'italic' }}>{PHOTO_SPECS[i].ai}</p>
              </div>
            ))}
          </div>
          {!photos.every(p => p.captured) && (
            <p style={{ fontSize: '11px', color: '#BA7517', textAlign: 'center', marginTop: '12px' }}>
              {photos.filter(p => !p.captured).length} photo{photos.filter(p => !p.captured).length !== 1 ? 's' : ''} remaining &mdash; capture all to proceed
            </p>
          )}
        </div>
      )}

      {/* ═══════ STEP 4 — Checklist ═══════ */}
      {step === 4 && (
        <div style={twoCol}>
          {/* Left — section list */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Checklist</h2>
            {checklistSections.filter((_, i) => form.selectedSections.includes(i)).map(s => {
              const prog = sectionProgress(s.section)
              return (
                <div key={s.section} style={{ marginBottom: '12px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: prog.done === prog.total && prog.total > 0 ? '#1D9E75' : 'var(--foreground)' }}>
                      {prog.done === prog.total && prog.total > 0 && <Check className="w-3 h-3 inline mr-1" />}
                      {s.section}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--muted-foreground)' }}>{prog.done}/{prog.total}</span>
                  </div>
                  {checkItems.filter(item => item.section === s.section).map((item, idx) => {
                    const globalIdx = checkItems.indexOf(item)
                    const isActive = globalIdx === activeCheckIdx
                    return (
                      <div key={globalIdx} onClick={() => setActiveCheckIdx(globalIdx)}
                        style={{
                          padding: '6px 8px', borderRadius: '6px', marginBottom: '3px', cursor: 'pointer',
                          border: isActive ? '1.5px solid #BA7517' : '1px solid transparent',
                          background: item.result === 'pass' ? '#f0fdf4' : item.result === 'fail' ? '#fef2f2' : isActive ? 'var(--muted)' : 'transparent',
                        }}>
                        <span style={{ fontSize: '11px', color: item.result === 'pass' ? '#1D9E75' : item.result === 'fail' ? '#E24B4A' : 'var(--foreground)' }}>
                          {item.result === 'pass' ? '\u2713 ' : item.result === 'fail' ? '\u2717 ' : `${item.number}. `}{item.question}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
          {/* Right — active item */}
          <div style={cardStyle}>
            {checkItems[activeCheckIdx] && (
              <>
                <p style={{ fontSize: '9px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>
                  {checkItems[activeCheckIdx].section} &middot; Item {checkItems[activeCheckIdx].number}
                </p>
                <h3 style={{ fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>{checkItems[activeCheckIdx].question}</h3>
                <div className="flex gap-2 mb-4">
                  <button onClick={() => handleCheckResult(activeCheckIdx, 'pass')}
                    style={{ flex: 1, height: '36px', borderRadius: '8px', background: '#E1F5EE', border: '1.5px solid #1D9E75', color: '#085041', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                    Yes &mdash; Pass
                  </button>
                  <button onClick={() => handleCheckResult(activeCheckIdx, 'fail')}
                    style={{ flex: 1, height: '36px', borderRadius: '8px', background: '#FCEBEB', border: '1.5px solid #E24B4A', color: '#791F1F', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                    No &mdash; Fail
                  </button>
                </div>
                <div><label style={labelStyle}>Notes (optional)</label>
                  <input style={inputStyle} value={checkItems[activeCheckIdx].notes}
                    onChange={e => setCheckItems(prev => prev.map((item, i) => i === activeCheckIdx ? { ...item, notes: e.target.value } : item))}
                    placeholder="Optional notes" />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══════ STEP 5 — Defect Log ═══════ */}
      {step === 5 && (
        <div style={twoCol}>
          {/* Left — defect list */}
          <div style={cardStyle}>
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontSize: '14px', fontWeight: 600 }}>Defect Log</h2>
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '5px', background: 'var(--muted)', color: 'var(--foreground)', fontWeight: 500 }}>{defects.length} defects</span>
            </div>
            {/* Counters */}
            <div className="flex gap-2 mb-3">
              {[
                { label: 'Critical', count: defectCounts.critical, bg: '#FCEBEB', color: '#791F1F' },
                { label: 'Major', count: defectCounts.major, bg: '#FAEEDA', color: '#633806' },
                { label: 'Minor', count: defectCounts.minor, bg: '#E1F5EE', color: '#085041' },
              ].map(c => (
                <div key={c.label} style={{ flex: 1, textAlign: 'center', padding: '6px', borderRadius: '6px', background: c.bg }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: c.color }}>{c.count}</div>
                  <div style={{ fontSize: '9px', color: c.color }}>{c.label}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '9px', color: 'var(--muted-foreground)', marginBottom: '8px' }}>
              AQL {form.aqlLevel} limits: Critical 0 &middot; Major &le;{limits.major.accept} &middot; Minor &le;{limits.minor.accept}
            </p>
            {defectCounts.critical > 0 && <div style={{ padding: '6px 8px', background: '#FCEBEB', borderRadius: '6px', fontSize: '10px', color: '#791F1F', marginBottom: '6px' }}>Critical defect detected &mdash; will fail on submit</div>}
            {defectCounts.major > limits.major.accept && <div style={{ padding: '6px 8px', background: '#FCEBEB', borderRadius: '6px', fontSize: '10px', color: '#791F1F', marginBottom: '6px' }}>Major defects exceed AQL limit ({defectCounts.major}/{limits.major.accept})</div>}
            {/* Defect rows */}
            {defects.map((d, i) => (
              <div key={i} style={{ padding: '6px 8px', background: 'var(--muted)', borderRadius: '6px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: d.severity === 'critical' ? '#E24B4A' : d.severity === 'major' ? '#BA7517' : '#1D9E75', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '11px', fontWeight: 500 }}>{d.name}</span>
                  <div style={{ fontSize: '9px', color: 'var(--muted-foreground)' }}>{d.location || '\u2014'} &middot; qty {d.quantity} &middot; {d.source === 'ai_detected' ? 'AI' : 'Manual'}</div>
                </div>
                <button onClick={() => removeDefect(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
          {/* Right — add defect */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Add Defect</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><label style={labelStyle}>Defect name *</label><input style={inputStyle} value={manualDefect.name} onChange={e => setManualDefect(d => ({ ...d, name: e.target.value }))} placeholder="Search defect library..." /></div>
              <div>
                <label style={labelStyle}>Severity *</label>
                <div className="flex gap-2">
                  {(['critical', 'major', 'minor'] as const).map(s => (
                    <button key={s} type="button" onClick={() => setManualDefect(d => ({ ...d, severity: s }))}
                      style={{
                        flex: 1, padding: '6px', borderRadius: '7px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                        border: manualDefect.severity === s ? '1.5px solid' : '1px solid var(--border)',
                        borderColor: manualDefect.severity === s ? (s === 'critical' ? '#E24B4A' : s === 'major' ? '#BA7517' : '#1D9E75') : undefined,
                        background: manualDefect.severity === s ? (s === 'critical' ? '#FCEBEB' : s === 'major' ? '#FAEEDA' : '#E1F5EE') : 'transparent',
                        color: manualDefect.severity === s ? (s === 'critical' ? '#791F1F' : s === 'major' ? '#633806' : '#085041') : 'var(--muted-foreground)',
                      }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div><label style={labelStyle}>Location</label><input style={inputStyle} value={manualDefect.location} onChange={e => setManualDefect(d => ({ ...d, location: e.target.value }))} placeholder="e.g. left sleeve seam" /></div>
              <div><label style={labelStyle}>Quantity</label><input style={inputStyle} type="number" min={1} value={manualDefect.quantity} onChange={e => setManualDefect(d => ({ ...d, quantity: parseInt(e.target.value) || 1 }))} /></div>
              <button onClick={addManualDefect}
                style={{ width: '100%', padding: '10px', background: '#BA7517', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Add defect &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ STEP 6 — AQL Result ═══════ */}
      {step === 6 && (
        <div style={twoCol}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>AQL Breakdown</h2>
            <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '12px' }}>
              Lot: {form.lotSize.toLocaleString()} &middot; Sample: {form.sampleSize} &middot; AQL {form.aqlLevel} &middot; {form.inspectionLevel.replace('_', ' ')}
            </div>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Severity', 'Found', 'Allowed', 'Result'].map(h => (
                    <th key={h} style={{ padding: '8px', textAlign: 'left', fontWeight: 600, fontSize: '11px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { sev: 'Critical', found: defectCounts.critical, allowed: '0', result: aqlResult.criticalResult },
                  { sev: 'Major', found: defectCounts.major, allowed: `\u2264${limits.major.accept}`, result: aqlResult.majorResult },
                  { sev: 'Minor', found: defectCounts.minor, allowed: `\u2264${limits.minor.accept}`, result: aqlResult.minorResult },
                ].map(r => (
                  <tr key={r.sev} style={{ background: r.result === 'fail' ? '#fef2f2' : '#f0fdf4' }}>
                    <td style={{ padding: '8px' }}>{r.sev}</td>
                    <td style={{ padding: '8px', fontWeight: 600 }}>{r.found}</td>
                    <td style={{ padding: '8px' }}>{r.allowed}</td>
                    <td style={{ padding: '8px', fontWeight: 600, color: r.result === 'pass' ? '#1D9E75' : '#E24B4A' }}>{r.result.toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={cardStyle}>
            {/* Overall result */}
            <div style={{
              textAlign: 'center', padding: '20px', borderRadius: '10px', marginBottom: '16px',
              background: aqlResult.overallResult === 'pass' ? '#E1F5EE' : '#FCEBEB',
              border: `1.5px solid ${aqlResult.overallResult === 'pass' ? '#1D9E75' : '#E24B4A'}`,
            }}>
              <div style={{ fontSize: '18px', fontWeight: 500, color: aqlResult.overallResult === 'pass' ? '#1D9E75' : '#E24B4A' }}>
                Inspection {aqlResult.overallResult === 'pass' ? 'Passed' : 'Failed'}
              </div>
              <div style={{ fontSize: '11px', color: aqlResult.overallResult === 'pass' ? '#085041' : '#791F1F' }}>
                {aqlResult.overallResult === 'pass' ? 'All defects within AQL limits' : 'Defects exceed AQL limits'}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={labelStyle}>Inspector decision *</label>
                <select style={{ ...inputStyle, appearance: 'auto' as any }} value={form.inspectorDecision} onChange={e => set('inspectorDecision', e.target.value)}>
                  <option value="">Select decision</option>
                  {DECISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Comments</label>
                <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.inspectorComments} onChange={e => set('inspectorComments', e.target.value)} placeholder="Inspector comments..." />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ STEP 7 — Review & Submit ═══════ */}
      {step === 7 && (
        <div style={twoCol}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '14px' }}>Inspection Summary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              {[
                ['Date', form.inspectionDate],
                ['Project', projects.find(p => p.id === form.projectId)?.name || '\u2014'],
                ['Factory', form.factoryName || factories.find(f => f.id === form.factoryId)?.name || '\u2014'],
                ['Inspector', `${form.auditorName} \u00B7 ${form.auditorType.replace('_', ' ')}`],
                ['Category', form.category],
                ['Sample', `${form.sampleSize} / ${form.lotSize.toLocaleString()} pcs`],
                ['AQL Level', form.aqlLevel],
                ['Defects', `${defects.length} (${defectCounts.critical} critical, ${defectCounts.major} major, ${defectCounts.minor} minor)`],
                ['Result', aqlResult.overallResult.toUpperCase()],
                ['Decision', form.inspectorDecision || '\u2014'],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-3">
                  <span style={{ color: 'var(--muted-foreground)', minWidth: '100px', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontWeight: 500, color: label === 'Result' ? (aqlResult.overallResult === 'pass' ? '#1D9E75' : '#E24B4A') : 'var(--foreground)' }}>{value}</span>
                </div>
              ))}
            </div>
            {/* Signature */}
            <div style={{ marginTop: '16px' }}>
              <label style={labelStyle}>Inspector signature</label>
              <canvas ref={signatureRef}
                style={{ border: '1.5px dashed var(--border)', borderRadius: '8px', width: '100%', height: '80px', cursor: 'crosshair', background: 'var(--muted)', touchAction: 'none' }}
              />
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', textAlign: 'center' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: aqlResult.overallResult === 'pass' ? '#E1F5EE' : '#FCEBEB',
              }}>
                <Check className="w-6 h-6" style={{ color: aqlResult.overallResult === 'pass' ? '#1D9E75' : '#E24B4A' }} />
              </div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: 600, color: aqlResult.overallResult === 'pass' ? '#1D9E75' : '#E24B4A' }}>
                  {aqlResult.overallResult === 'pass' ? 'Passed' : 'Failed'}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Ready to submit</p>
              </div>

              <button disabled={saving} onClick={() => handleSubmit(false)}
                style={{ width: '100%', padding: '10px', background: saving ? '#888' : '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Submitting...' : 'Submit inspection \u2192'}
              </button>

              <div className="flex gap-2 w-full">
                <button onClick={() => exportInspectionPDF({
                  inspection_no: 'DRAFT', inspection_date: form.inspectionDate,
                  project_name: projects.find(p => p.id === form.projectId)?.name,
                  factory_name: form.factoryName || factories.find(f => f.id === form.factoryId)?.name,
                  auditor_name: form.auditorName, auditor_type: form.auditorType, category: form.category,
                  sample_size: form.sampleSize, lot_size: form.lotSize, aql_level: form.aqlLevel,
                  aql_result: aqlResult.overallResult, inspector_decision: form.inspectorDecision,
                  inspector_comments: form.inspectorComments,
                  critical_defects: defectCounts.critical, major_defects: defectCounts.major, minor_defects: defectCounts.minor,
                  critical_allowed: 0, major_allowed: limits.major.accept, minor_allowed: limits.minor.accept,
                }, defects.map(d => ({ defect_name: d.name, severity: d.severity, location: d.location, source: d.source, quantity: d.quantity })))}
                  style={{ flex: 1, padding: '8px', background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}>
                  PDF
                </button>
              </div>

              <button disabled={saving} onClick={() => handleSubmit(true)}
                style={{ width: '100%', padding: '8px', background: 'transparent', color: 'var(--muted-foreground)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                Save as draft
              </button>

              <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', textAlign: 'left', width: '100%' }}>
                <p>&bull; Factory notified automatically</p>
                <p>&bull; Brand dashboard updated</p>
                <p>&bull; PDF stored in project records</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <div className="flex justify-between mt-6">
        {step > 1 ? (
          <button onClick={goBack} style={{ padding: '9px 20px', background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        ) : <div />}
        {step < 7 && (
          <button onClick={goNext} style={{ padding: '9px 20px', background: canProceed(step) ? '#BA7517' : '#888', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: canProceed(step) ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Continue <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
