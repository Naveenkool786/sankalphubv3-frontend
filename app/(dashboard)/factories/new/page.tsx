'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, ArrowRight, Check, Camera, Upload, Loader2, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { BackButton } from '@/components/ui/BackButton'

/* ── Constants ── */
const STEPS = ['Factory details', 'Capacity & QC', 'Review & save']
const CATEGORIES = ['Garments', 'Footwear', 'Gloves', 'Headwear', 'Accessories']
const CERT_OPTIONS = ['ISO 9001', 'GOTS', 'OEKO-TEX', 'BSCI', 'SA8000', 'WRAP', 'GRS', 'SEDEX']
const AQL_OPTIONS = [
  { value: '2.5', label: 'AQL 2.5 \u2014 Standard' },
  { value: '1.0', label: 'AQL 1.0 \u2014 Strict' },
  { value: '4.0', label: 'AQL 4.0 \u2014 Relaxed' },
]
const INSPECTION_PREFS = ['Final inspection', 'Pre-production', 'During production', 'All']

interface ExtractedData {
  name?: string | null
  country?: string | null
  city?: string | null
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  totalLines?: number | null
  certifications?: string[] | null
}

export default function NewFactoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractedFields, setExtractedFields] = useState<ExtractedData | null>(null)
  const [orgId, setOrgId] = useState('')
  const [userId, setUserId] = useState('')
  const [draftId, setDraftId] = useState<string | null>(null)
  const [savedDraft, setSavedDraft] = useState<any>(null)

  const [form, setForm] = useState({
    name: '', code: '', country: '', city: '',
    contactName: '', contactEmail: '', contactPhone: '',
    website: '', notes: '', status: 'active' as 'active' | 'inactive',
    photoFile: null as File | null, photoPreview: '',
    totalLines: '', maxCapacity: '',
    categories: [] as string[],
    certifications: [] as string[],
    aqlDefault: '2.5',
    inspectionPreference: 'final',
  })

  const set = (key: keyof typeof form, value: any) => setForm(f => ({ ...f, [key]: value }))
  const toggleItem = (key: 'categories' | 'certifications', item: string) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(item) ? f[key].filter(x => x !== item) : [...f[key], item],
    }))
  }

  function getSupabase() {
    return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  }

  // Load org context
  useEffect(() => {
    (async () => {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
      const oid = (profile as any)?.org_id
      if (oid) setOrgId(oid)
    })()
  }, [])

  /* ── localStorage auto-save (every 10s) ── */
  useEffect(() => {
    const interval = setInterval(() => {
      if (form.name) {
        localStorage.setItem('factory-wizard-draft', JSON.stringify({ form, step, savedAt: new Date().toISOString() }))
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [form, step])

  /* ── Restore draft from localStorage on mount ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem('factory-wizard-draft')
      if (raw) {
        const draft = JSON.parse(raw)
        if (draft?.form?.name) setSavedDraft(draft)
      }
    } catch { localStorage.removeItem('factory-wizard-draft') }
  }, [])

  /* ── Restore draft from Supabase via ?draftId= ── */
  useEffect(() => {
    const did = searchParams.get('draftId')
    if (!did) return
    (async () => {
      const supabase = getSupabase()
      const { data } = await (supabase.from('factories') as any).select('*').eq('id', did).single()
      if (data) {
        setDraftId(data.id)
        setSavedDraft(null) // don't show localStorage banner
        localStorage.removeItem('factory-wizard-draft')
        setForm({
          name: data.name || '', code: data.code || '', country: data.country || '', city: data.city || '',
          contactName: data.contact_name || '', contactEmail: data.contact_email || '', contactPhone: data.contact_phone || '',
          website: data.website || '', notes: data.notes || '', status: 'active',
          photoFile: null, photoPreview: data.photo_url || '',
          totalLines: data.total_lines?.toString() || '', maxCapacity: data.max_capacity?.toString() || '',
          categories: data.categories || [], certifications: data.certifications || [],
          aqlDefault: data.aql_default || '2.5', inspectionPreference: data.inspection_preference || 'final',
        })
      }
    })()
  }, [searchParams])

  /* ── Save draft to Supabase (silent) ── */
  const saveDraftToSupabase = useCallback(async () => {
    if (!form.name || !orgId) return
    try {
      const supabase = getSupabase()
      const draftData: any = {
        org_id: orgId, name: form.name || 'Untitled factory', code: form.code || null,
        country: form.country || null, city: form.city || null,
        contact_name: form.contactName || null, contact_email: form.contactEmail || null,
        contact_phone: form.contactPhone || null, website: form.website || null,
        notes: form.notes || null, status: 'inactive',
        total_lines: parseInt(form.totalLines) || null, max_capacity: parseInt(form.maxCapacity) || null,
        categories: form.categories.length > 0 ? form.categories : null,
        certifications: form.certifications.length > 0 ? form.certifications.join(', ') : null,
        aql_default: form.aqlDefault || null, created_by: userId,
      }
      if (draftId) {
        await (supabase.from('factories') as any).update(draftData).eq('id', draftId)
      } else {
        const { data } = await (supabase.from('factories') as any).insert(draftData).select('id').single()
        if (data) setDraftId(data.id)
      }
    } catch { /* silent */ }
  }, [form, orgId, userId, draftId])

  /* ── Save draft on beforeunload ── */
  useEffect(() => {
    const handleUnload = () => saveDraftToSupabase()
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [saveDraftToSupabase])

  /* ── Photo upload ── */
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    set('photoFile', file)
    set('photoPreview', URL.createObjectURL(file))
  }

  /* ── AI extraction ── */
  const handleDocExtraction = async (file: File) => {
    setExtracting(true)
    setExtractedFields(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/factories/extract-from-file', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.data) {
        setExtractedFields(json.data)
      } else {
        toast.error('Could not read file \u2014 fill in manually')
      }
    } catch {
      toast.error('File extraction failed')
    } finally {
      setExtracting(false)
    }
  }

  const applySingleField = (key: string, val: any) => {
    if (key === 'totalLines') { set('totalLines', String(val)); return }
    if (key === 'certifications' && Array.isArray(val)) { set('certifications', val); return }
    if (key in form) set(key as keyof typeof form, String(val))
    toast.success(`${key} applied`)
  }

  const applyAllFields = () => {
    if (!extractedFields) return
    let count = 0
    const e = extractedFields
    if (e.name) { set('name', e.name); count++ }
    if (e.country) { set('country', e.country); count++ }
    if (e.city) { set('city', e.city); count++ }
    if (e.contactName) { set('contactName', e.contactName); count++ }
    if (e.contactEmail) { set('contactEmail', e.contactEmail); count++ }
    if (e.contactPhone) { set('contactPhone', e.contactPhone); count++ }
    if (e.totalLines) { set('totalLines', String(e.totalLines)); count++ }
    if (e.certifications) { set('certifications', e.certifications); count++ }
    toast.success(`${count} fields filled`)
  }

  /* ── Save ── */
  const handleSave = async (asDraft: boolean) => {
    if (!form.name.trim()) { toast.error('Factory name is required'); return }
    if (!form.country.trim()) { toast.error('Country is required'); return }
    if (!form.contactName.trim()) { toast.error('Contact name is required'); return }
    if (!form.contactEmail.trim()) { toast.error('Contact email is required'); return }
    setSaving(true)

    try {
      const supabase = getSupabase()

      // Upload photo
      let photoUrl = ''
      if (form.photoFile && orgId) {
        const ext = form.photoFile.name.split('.').pop()
        const path = `${orgId}/${Date.now()}.${ext}`
        const { data: uploadData } = await supabase.storage.from('factory-photos').upload(path, form.photoFile, { upsert: true })
        if (uploadData) {
          photoUrl = supabase.storage.from('factory-photos').getPublicUrl(uploadData.path).data.publicUrl
        }
      }

      // Save factory (update draft or insert new)
      const factoryData: any = {
        org_id: orgId,
        name: form.name.trim(),
        code: form.code.trim() || null,
        country: form.country.trim(),
        city: form.city.trim() || null,
        contact_name: form.contactName.trim(),
        contact_email: form.contactEmail.trim(),
        contact_phone: form.contactPhone.trim() || null,
        website: form.website.trim() || null,
        notes: form.notes.trim() || null,
        status: asDraft ? 'inactive' : form.status,
        photo_url: photoUrl || form.photoPreview || null,
        total_lines: parseInt(form.totalLines) || null,
        max_capacity: parseInt(form.maxCapacity) || null,
        categories: form.categories.length > 0 ? form.categories : null,
        certifications: form.certifications.length > 0 ? form.certifications.join(', ') : null,
        aql_default: form.aqlDefault || null,
        inspection_preference: form.inspectionPreference || null,
        created_by: userId,
      }

      let error: any = null
      if (draftId) {
        const res = await (supabase.from('factories') as any).update(factoryData).eq('id', draftId)
        error = res.error
      } else {
        const res = await (supabase.from('factories') as any).insert(factoryData)
        error = res.error
      }

      if (error) throw new Error(error.message)
      localStorage.removeItem('factory-wizard-draft')
      toast.success(asDraft ? 'Draft saved' : 'Factory added')
      router.push('/factories')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  /* ── Shared styles ── */
  const cardStyle: React.CSSProperties = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }
  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)', fontSize: '13px', outline: 'none' }
  const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 500, color: 'var(--muted-foreground)', display: 'block', marginBottom: '5px' }

  /* ── Navigation ── */
  const goNext = () => {
    if (step === 1) {
      if (!form.name.trim()) { toast.error('Factory name is required'); return }
      if (!form.country.trim()) { toast.error('Country is required'); return }
    }
    saveDraftToSupabase() // fire-and-forget
    if (step < 3) setStep(step + 1)
  }
  const goBack = () => { if (step > 1) setStep(step - 1) }

  return (
    <div className="p-6 lg:p-8 ">
      <BackButton href="/factories" label="Back to Factories" />

      <h1 className="text-xl font-bold text-foreground mb-1">Add Factory</h1>
      <p className="text-sm text-muted-foreground mb-6">Set up a new manufacturing partner</p>

      {/* ── Draft restore banner ── */}
      {savedDraft && !draftId && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', background: '#FAEEDA', border: '0.5px solid #C9A96E',
          borderRadius: '8px', marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#633806" strokeWidth="2" strokeLinecap="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#633806' }}>
                Unsaved draft found &mdash; {savedDraft.form?.name}
              </span>
              <span style={{ fontSize: '10px', color: '#854F0B', marginLeft: '8px' }}>
                Saved {new Date(savedDraft.savedAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button onClick={() => {
              setForm(savedDraft.form)
              setStep(savedDraft.step || 1)
              setSavedDraft(null)
            }}
              style={{ fontSize: '11px', padding: '5px 14px', borderRadius: '7px', background: '#BA7517', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' }}>
              Continue draft &rarr;
            </button>
            <button onClick={() => {
              localStorage.removeItem('factory-wizard-draft')
              setSavedDraft(null)
            }}
              style={{ fontSize: '11px', padding: '5px 14px', borderRadius: '7px', background: 'transparent', color: '#633806', border: '0.5px solid #C9A96E', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Start fresh
            </button>
          </div>
        </div>
      )}

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
                <div style={{ flex: 1, height: '2px', marginInline: '8px', background: done ? '#1D9E75' : 'var(--border)', borderRadius: '1px', marginBottom: '18px' }} />
              )}
            </div>
          )
        })}
      </div>

      {/* ══════════════ STEP 1 — Factory Details ══════════════ */}
      {step === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'stretch' }}>
          {/* Left — Form */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 600 }}>Factory Basics</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={labelStyle}>Factory name *</label><input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Tiger Exports Ltd." required /></div>
                <div><label style={labelStyle}>Factory code</label><input style={inputStyle} value={form.code} onChange={e => set('code', e.target.value)} placeholder="FAC-001" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={labelStyle}>Country *</label><input style={inputStyle} value={form.country} onChange={e => set('country', e.target.value)} placeholder="India" required /></div>
                <div><label style={labelStyle}>City</label><input style={inputStyle} value={form.city} onChange={e => set('city', e.target.value)} placeholder="Noida" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={labelStyle}>Contact name *</label><input style={inputStyle} value={form.contactName} onChange={e => set('contactName', e.target.value)} placeholder="Full name" required /></div>
                <div><label style={labelStyle}>Contact email *</label><input style={inputStyle} type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="contact@factory.com" required /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={labelStyle}>Contact phone</label><input style={inputStyle} type="tel" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} placeholder="+91 98765 43210" /></div>
                <div><label style={labelStyle}>Website</label><input style={inputStyle} type="url" value={form.website} onChange={e => set('website', e.target.value)} placeholder="www.factory.com" /></div>
              </div>
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea style={{ ...inputStyle, minHeight: '50px', resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes..." />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <div className="flex gap-2">
                  {[
                    { v: 'active' as const, label: 'Active', bg: '#1D9E75', color: '#fff' },
                    { v: 'inactive' as const, label: 'Inactive', bg: 'var(--muted)', color: 'var(--muted-foreground)' },
                  ].map(s => (
                    <button key={s.v} type="button" onClick={() => set('status', s.v)}
                      style={{
                        padding: '5px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        border: form.status === s.v ? 'none' : '1px solid var(--border)',
                        background: form.status === s.v ? s.bg : 'transparent',
                        color: form.status === s.v ? s.color : 'var(--muted-foreground)',
                      }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right — Photo + AI upload */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Photo */}
              {form.photoPreview ? (
                <div style={{ position: 'relative', height: '130px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
                  <img src={form.photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => { set('photoFile', null); set('photoPreview', '') }}
                    style={{ position: 'absolute', top: '6px', right: '6px', fontSize: '10px', padding: '3px 8px', borderRadius: '5px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
              ) : (
                <div onClick={() => photoInputRef.current?.click()}
                  style={{ flex: 1, minHeight: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1.5px dashed var(--border)', borderRadius: '10px', cursor: 'pointer', background: 'var(--muted)', padding: '16px', transition: 'border-color .15s' }}>
                  <Building2 className="w-7 h-7" style={{ color: '#BA7517' }} />
                  <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--foreground)' }}>Upload factory photo</span>
                  <span style={{ fontSize: '9px', color: 'var(--muted-foreground)' }}>JPG, PNG, WebP &middot; max 5MB</span>
                </div>
              )}
              <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoSelect} />

              {/* AI auto-fill zone */}
              {extractedFields ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 500 }}>Extracted from file</span>
                    <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '5px', background: '#EEEDFE', color: '#3C3489', fontWeight: 500 }}>AI</span>
                  </div>
                  {Object.entries(extractedFields).filter(([, v]) => v != null).map(([key, val]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: 'var(--background)', borderRadius: '6px', marginBottom: '3px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1D9E75', flexShrink: 0 }} />
                      <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', width: '80px', flexShrink: 0 }}>{key}</div>
                      <div style={{ fontSize: '11px', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{Array.isArray(val) ? val.join(', ') : String(val)}</div>
                      <button style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '5px', background: '#E1F5EE', color: '#085041', border: 'none', cursor: 'pointer' }}
                        onClick={() => applySingleField(key, val)}>Use</button>
                    </div>
                  ))}
                  <button onClick={applyAllFields}
                    style={{ width: '100%', height: '30px', marginTop: '6px', borderRadius: '7px', background: '#1D9E75', color: '#fff', border: 'none', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}>
                    Fill all fields &rarr;
                  </button>
                </div>
              ) : (
                <div style={{ flex: 1, minHeight: '140px', border: '1.5px dashed var(--border)', borderRadius: '10px', padding: '16px', textAlign: 'center', cursor: extracting ? 'default' : 'pointer', background: 'var(--muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'border-color .15s' }}
                  onClick={() => !extracting && docInputRef.current?.click()}>
                  {extracting ? (
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#BA7517' }} />
                  ) : (
                    <Upload className="w-6 h-6" style={{ color: '#BA7517' }} />
                  )}
                  <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--foreground)' }}>
                    {extracting ? 'Extracting...' : 'Upload & auto-fill'}
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                    Drop vendor assessment or compliance doc &mdash; AI fills factory details
                  </div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {[
                      { label: 'Excel', bg: '#E6F1FB', color: '#0C447C' },
                      { label: 'PDF', bg: '#E1F5EE', color: '#085041' },
                      { label: 'Word', bg: '#EEEDFE', color: '#3C3489' },
                    ].map(t => (
                      <span key={t.label} style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '5px', fontWeight: 500, background: t.bg, color: t.color }}>{t.label}</span>
                    ))}
                  </div>
                </div>
              )}
              <input ref={docInputRef} type="file" accept=".xlsx,.xls,.pdf,.docx,.csv" style={{ display: 'none' }}
                onChange={e => { const file = e.target.files?.[0]; if (file) handleDocExtraction(file) }} />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ STEP 2 — Capacity & QC ══════════════ */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Production Capacity</h2>
            <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '16px' }}>Set production capacity and quality control defaults</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div><label style={labelStyle}>Production lines *</label><input style={inputStyle} type="number" value={form.totalLines} onChange={e => set('totalLines', e.target.value)} placeholder="4" /></div>
              <div><label style={labelStyle}>Max capacity (pcs/month)</label><input style={inputStyle} type="number" value={form.maxCapacity} onChange={e => set('maxCapacity', e.target.value)} placeholder="10000" /></div>
            </div>

            <label style={labelStyle}>Product categories</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {CATEGORIES.map(c => (
                <button key={c} type="button" onClick={() => toggleItem('categories', c)}
                  style={{
                    padding: '5px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                    border: form.categories.includes(c) ? '1.5px solid #C9A96E' : '1px solid var(--border)',
                    background: form.categories.includes(c) ? '#FAEEDA' : 'transparent',
                    color: form.categories.includes(c) ? '#633806' : 'var(--muted-foreground)',
                  }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Certifications</h2>
            <div className="flex flex-wrap gap-2">
              {CERT_OPTIONS.map(c => (
                <button key={c} type="button" onClick={() => toggleItem('certifications', c)}
                  style={{
                    padding: '5px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                    border: form.certifications.includes(c) ? '1.5px solid #1D9E75' : '1px solid var(--border)',
                    background: form.certifications.includes(c) ? '#E1F5EE' : 'transparent',
                    color: form.certifications.includes(c) ? '#085041' : 'var(--muted-foreground)',
                  }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>QC Defaults</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Default AQL level</label>
                <select style={{ ...inputStyle, appearance: 'auto' as any }} value={form.aqlDefault} onChange={e => set('aqlDefault', e.target.value)}>
                  {AQL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Inspection preference</label>
                <select style={{ ...inputStyle, appearance: 'auto' as any }} value={form.inspectionPreference} onChange={e => set('inspectionPreference', e.target.value)}>
                  {INSPECTION_PREFS.map(p => <option key={p} value={p.toLowerCase().replace(/ /g, '_')}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ STEP 3 — Review & Save ══════════════ */}
      {step === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'stretch' }}>
          {/* Left — Summary */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ ...cardStyle, flex: 1 }}>
              <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '14px' }}>Factory Summary</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  ['Factory name', form.name],
                  ['Factory code', form.code],
                  ['Country / City', [form.country, form.city].filter(Boolean).join(' \u00B7 ')],
                  ['Contact', [form.contactName, form.contactEmail, form.contactPhone].filter(Boolean).join(' \u00B7 ')],
                  ['Website', form.website],
                  ['Production lines', form.totalLines ? `${form.totalLines} lines${form.maxCapacity ? ` \u00B7 ${parseInt(form.maxCapacity).toLocaleString()} pcs/month capacity` : ''}` : ''],
                  ['AQL default', AQL_OPTIONS.find(o => o.value === form.aqlDefault)?.label || form.aqlDefault],
                  ['Status', form.status],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="flex items-start gap-3" style={{ fontSize: '12px' }}>
                    <span style={{ color: 'var(--muted-foreground)', minWidth: '110px', flexShrink: 0 }}>{label}</span>
                    <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>
                      {label === 'Status' ? (
                        <span style={{ padding: '1px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 600, background: value === 'active' ? '#E1F5EE' : 'var(--muted)', color: value === 'active' ? '#085041' : 'var(--muted-foreground)' }}>
                          {value === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      ) : value}
                    </span>
                  </div>
                ))}

                {/* Categories */}
                {form.categories.length > 0 && (
                  <div className="flex items-start gap-3" style={{ fontSize: '12px' }}>
                    <span style={{ color: 'var(--muted-foreground)', minWidth: '110px', flexShrink: 0 }}>Categories</span>
                    <div className="flex flex-wrap gap-1">
                      {form.categories.map(c => (
                        <span key={c} style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: '#FAEEDA', color: '#633806', fontWeight: 500 }}>{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {form.certifications.length > 0 && (
                  <div className="flex items-start gap-3" style={{ fontSize: '12px' }}>
                    <span style={{ color: 'var(--muted-foreground)', minWidth: '110px', flexShrink: 0 }}>Certifications</span>
                    <div className="flex flex-wrap gap-1">
                      {form.certifications.map(c => (
                        <span key={c} style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: '#E1F5EE', color: '#085041', fontWeight: 500 }}>{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photo thumbnail */}
                {form.photoPreview && (
                  <div className="flex items-start gap-3" style={{ fontSize: '12px' }}>
                    <span style={{ color: 'var(--muted-foreground)', minWidth: '110px', flexShrink: 0 }}>Factory photo</span>
                    <img src={form.photoPreview} alt="Factory" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right — Actions */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 className="w-5 h-5" style={{ color: '#1D9E75' }} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Ready to add</p>
                <p style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Factory will be available for project assignment</p>
              </div>

              <button disabled={saving} onClick={() => handleSave(false)}
                style={{ width: '100%', padding: '10px', background: saving ? '#888' : '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Adding...' : 'Add factory \u2192'}
              </button>

              <button disabled={saving} onClick={() => handleSave(true)}
                style={{ width: '100%', padding: '8px', background: 'transparent', color: 'var(--muted-foreground)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                Save as draft
              </button>

              <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', textAlign: 'left', width: '100%', marginTop: '4px' }}>
                <p>&bull; Factory visible to brand team immediately</p>
                <p>&bull; Can be assigned to projects after saving</p>
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
        {step < 3 && (
          <button onClick={goNext}
            style={{ padding: '9px 20px', background: '#BA7517', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Continue <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
