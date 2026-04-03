# SankalpHub — Add Factory: Popup → Full Page Wizard Brief (V3 Frontend)
**For: Claude Code**
**Date:** April 3, 2026
**Scope:** Replace "Add Factory" popup modal with a full page 3-step wizard at `/factories/new`
**Mode:** Single focused task. Touch only the factories module. Nothing else.

> ⚠️ **WORKING DIRECTORY: V3 Frontend ONLY**
> All work is in `/var/www/Master_Sankalphub/V3.0_Frontend/`
> Always use `org_id` (NOT organization_id) in all Supabase queries

---

## WHAT TO DO

The "Add Factory" button currently opens a popup modal. This needs to become a full dedicated page at `/factories/new` — exactly the same pattern as `/projects/new`.

**Three steps:**
1. Find and remove the popup modal from `/factories`
2. Update "+ Add factory" button to navigate to `/factories/new`
3. Build the 3-step wizard at `/factories/new`

---

## STEP 1 — REMOVE THE POPUP

```bash
# Find the factories page and modal
find . -path "*factories*" -name "*.tsx" | grep -v node_modules | grep -v .next

# Find modal/dialog references in factories
grep -rn "Dialog\|Modal\|modal\|dialog\|open.*factory\|setOpen" \
  app/\(dashboard\)/factories/ --include="*.tsx" | grep -v node_modules
```

- Remove all modal/dialog state (`useState` for open/close)
- Remove the modal component and its imports
- Keep the factories board grid and all card logic intact

Update the "+ Add factory" button:
```tsx
// BEFORE (opens modal):
<button onClick={() => setOpen(true)}>+ Add factory</button>

// AFTER (navigates to wizard):
import { useRouter } from 'next/navigation'
const router = useRouter()
<button onClick={() => router.push('/factories/new')}>+ Add factory</button>
```

---

## STEP 2 — CREATE THE WIZARD PAGE

**File:** `app/(dashboard)/factories/new/page.tsx`

---

### Page header
```
← Factories (back link)
Add factory
Set up a new manufacturing partner
```

### Stepper — 3 steps
```
[1 Factory details] ─── [2 Capacity & QC] ─── [3 Review & save]

Circle states:
- default: gray border, gray text
- active:  #BA7517 fill, white text
- done:    #1D9E75 fill, white checkmark SVG
Line states:
- default: var(--border)
- done:    #1D9E75
```

---

## STEP 1 — Factory details (TWO COLUMN — equal height)

### CRITICAL — Equal height containers
```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 280px',
  gap: '14px',
  alignItems: 'stretch',   // ← forces equal height
}}>
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <div style={{ flex: 1, /* card */ }}>...</div>
  </div>
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <div style={{ flex: 1, /* card */ }}>...</div>
  </div>
</div>
```

### Left card — Factory basics
```
Factory name *       text input,    placeholder "Tiger Exports Ltd."
Factory code         text input,    placeholder "FAC-001"
Country *            text input,    placeholder "India"
City                 text input,    placeholder "Noida"
Contact name *       text input,    placeholder "Full name"
Contact email *      email input,   placeholder "contact@factory.com"
Contact phone        tel input,     placeholder "+91 98765 43210"
Website              url input,     placeholder "www.factory.com"
Notes                textarea,      placeholder "Additional notes..."
Status toggle        Active / Inactive (default: Active)
                     Active:   #1D9E75 bg · white text
                     Inactive: var(--muted) bg · muted text
```

### Right card — Factory photo + AI auto-fill (equal height to left)

**Factory photo upload (top of right card):**
```tsx
{photoPreview ? (
  <div style={{ position: 'relative', height: '130px',
    borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
    <img src={photoPreview}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    <button
      onClick={() => setPhotoPreview(null)}
      style={{ position: 'absolute', top: '6px', right: '6px',
        fontSize: '10px', padding: '3px 8px', borderRadius: '5px',
        background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
        cursor: 'pointer' }}>
      Remove
    </button>
  </div>
) : (
  <div
    onClick={() => photoInputRef.current?.click()}
    style={{ height: '130px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '6px',
      border: '1.5px dashed var(--border)', borderRadius: '8px',
      cursor: 'pointer', background: 'var(--muted)', marginBottom: '10px' }}>
    {/* Building/factory SVG icon */}
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="#BA7517" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
    <span style={{ fontSize: '11px', fontWeight: 500,
      color: 'var(--foreground)' }}>Upload factory photo</span>
    <span style={{ fontSize: '9px', color: 'var(--muted-foreground)' }}>
      JPG, PNG, WebP · max 5MB
    </span>
  </div>
)}
<input ref={photoInputRef} type="file" accept="image/*"
  style={{ display: 'none' }}
  onChange={e => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }} />
```

**AI auto-fill drop zone (below photo, fills remaining height):**
```tsx
<div style={{ flex: 1, border: '1.5px dashed var(--border)',
  borderRadius: '8px', padding: '14px', textAlign: 'center',
  cursor: 'pointer', background: 'var(--muted)',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', gap: '6px' }}
  onDragOver={e => { e.preventDefault(); setDragging(true) }}
  onDragLeave={() => setDragging(false)}
  onDrop={e => { e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0]
    if (file) handleDocExtraction(file) }}
  onClick={() => docInputRef.current?.click()}>

  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="#BA7517" strokeWidth="1.5" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
  <div style={{ fontSize: '11px', fontWeight: 500,
    color: 'var(--foreground)' }}>
    Upload & auto-fill
  </div>
  <div style={{ fontSize: '9px', color: 'var(--muted-foreground)',
    lineHeight: 1.5, textAlign: 'center' }}>
    Drop vendor assessment or compliance doc — AI fills factory details
  </div>
  <div style={{ display: 'flex', gap: '4px', marginTop: '4px',
    flexWrap: 'wrap', justifyContent: 'center' }}>
    {['Excel','PDF','Word'].map(t => (
      <span key={t} style={{ fontSize: '9px', padding: '2px 6px',
        borderRadius: '5px', fontWeight: 500,
        background: t==='Excel'?'#E6F1FB':t==='PDF'?'#E1F5EE':'#EEEDFE',
        color: t==='Excel'?'#0C447C':t==='PDF'?'#085041':'#3C3489' }}>
        {t}
      </span>
    ))}
  </div>
</div>

{/* Extracted fields panel — shown after AI reads file */}
{extractedFields && (
  <div style={{ marginTop: '10px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: '8px' }}>
      <span style={{ fontSize: '11px', fontWeight: 500 }}>
        Extracted from file
      </span>
      <span style={{ fontSize: '9px', padding: '2px 6px',
        borderRadius: '5px', background: '#EEEDFE', color: '#3C3489',
        fontWeight: 500 }}>
        AI
      </span>
    </div>
    {Object.entries(extractedFields)
      .filter(([_, v]) => v)
      .map(([key, val]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center',
          gap: '6px', padding: '4px 8px',
          background: 'var(--background)', borderRadius: '6px',
          marginBottom: '3px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%',
            background: '#1D9E75', flexShrink: 0 }} />
          <div style={{ fontSize: '10px', color: 'var(--muted-foreground)',
            width: '80px', flexShrink: 0 }}>
            {key}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 500, flex: 1,
            overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap' }}>
            {String(val)}
          </div>
          <button style={{ fontSize: '9px', padding: '2px 6px',
            borderRadius: '5px', background: '#E1F5EE', color: '#085041',
            border: 'none', cursor: 'pointer' }}
            onClick={() => applySingleField(key, val)}>
            Use
          </button>
        </div>
      ))
    }
    <button
      onClick={applyAllFields}
      style={{ width: '100%', height: '30px', marginTop: '6px',
        borderRadius: '7px', background: '#1D9E75', color: '#fff',
        border: 'none', fontSize: '11px', fontWeight: 500,
        cursor: 'pointer' }}>
      Fill all fields →
    </button>
  </div>
)}
```

---

## STEP 2 — Capacity & QC (SINGLE COLUMN — no upload zone)

Subtitle: "Set production capacity and quality control defaults"

### Card: Production capacity
```
Production lines *   number input,  placeholder "4"
Max capacity (pcs)   number input,  placeholder "10000"
Product categories   multi-select checkboxes or toggle pills:
                     [Garments] [Footwear] [Gloves] [Headwear] [Accessories]
                     Selected: #FAEEDA bg, #633806 text, #C9A96E border
```

### Card: Certifications
```
Certifications       clickable toggle pills — click to select/deselect:
[ISO 9001] [GOTS] [OEKO-TEX] [BSCI] [SA8000] [WRAP] [GRS] [SEDEX]
Selected: #E1F5EE bg, #085041 text, #1D9E75 border
```

### Card: QC defaults
```
Default AQL level    select (AQL 2.5 — standard / AQL 1.0 — strict / AQL 4.0 — relaxed)
Inspection preference select (Final inspection / Pre-production / During production / All)
```

---

## STEP 3 — Review & save (TWO COLUMN — equal height)

### Left card — Summary
```
Factory name         Tiger Exports Ltd.
Factory code         FAC-001
Country / City       India · Noida
Contact              Ashish · ashish@mti.com · +91 98765 43210
Production lines     4 lines · 10,000 pcs/month capacity
Categories           [Garments] [Footwear] pills
Certifications       [ISO 9001] [BSCI] [WRAP] pills
AQL default          2.5 — Standard
Status               [Active] green pill
```

If factory photo was uploaded — show 60px square thumbnail next to "Factory name" row.

### Right card — Save options (equal height to left)
```
[Building icon]
"Ready to add"
"Factory will be available for project assignment"

[Add factory →]   ← #1D9E75 green, full width

[Save as draft]   ← outline, full width

• Factory visible to brand team immediately
• Can be assigned to projects after saving
• All details editable after saving
```

---

## FORM STATE

```typescript
const [formData, setFormData] = useState({
  // Step 1
  name: '',
  code: '',
  country: '',
  city: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  website: '',
  notes: '',
  status: 'active' as 'active' | 'inactive',
  photoFile: null as File | null,
  photoPreview: '',
  // Step 2
  totalLines: '',
  maxCapacity: '',
  categories: [] as string[],
  certifications: [] as string[],
  aqlDefault: '2.5',
  inspectionPreference: 'final',
})
```

---

## SAVE ACTION

```typescript
const handleSave = async (saveAsDraft = false) => {
  setSaving(true)
  try {
    // 1. Upload factory photo if provided
    let photoUrl = ''
    if (formData.photoFile) {
      const ext = formData.photoFile.name.split('.').pop()
      const path = `${orgId}/${Date.now()}.${ext}`
      const { data: uploadData } = await supabase.storage
        .from('factory-photos')
        .upload(path, formData.photoFile, { upsert: true })
      if (uploadData) {
        photoUrl = supabase.storage
          .from('factory-photos')
          .getPublicUrl(uploadData.path).data.publicUrl
      }
    }

    // 2. Save factory to Supabase
    const { error } = await supabase.from('factories').insert({
      org_id: orgId,
      name: formData.name,
      code: formData.code || null,
      country: formData.country,
      city: formData.city || null,
      contact_name: formData.contactName,
      contact_email: formData.contactEmail,
      contact_phone: formData.contactPhone || null,
      website: formData.website || null,
      notes: formData.notes || null,
      status: saveAsDraft ? 'inactive' : formData.status,
      photo_url: photoUrl || null,
      total_lines: parseInt(formData.totalLines) || null,
      max_capacity: parseInt(formData.maxCapacity) || null,
      categories: formData.categories,
      certifications: formData.certifications,
      aql_default: formData.aqlDefault,
      inspection_preference: formData.inspectionPreference,
      created_by: user.id,
    })

    if (error) throw error
    router.push('/factories')
  } catch (err: any) {
    setError(err.message)
  } finally {
    setSaving(false)
  }
}
```

---

## AI EXTRACTION API FOR FACTORY DOCS

**File:** `app/api/factories/extract-from-file/route.ts`

Same pattern as projects extraction. Reads vendor assessment or compliance docs and extracts factory details:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    const client = new Anthropic()
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: file.type as any,
              data: base64,
            },
          },
          {
            type: 'text',
            text: `Extract factory details from this vendor assessment or compliance document.
Return ONLY valid JSON, no markdown, no explanation:
{
  "name": string|null,
  "country": string|null,
  "city": string|null,
  "contactName": string|null,
  "contactEmail": string|null,
  "contactPhone": string|null,
  "totalLines": number|null,
  "certifications": string[]|null
}`,
          },
        ],
      }],
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const clean = text.replace(/```json|```/g, '').trim()
    return NextResponse.json({ success: true, data: JSON.parse(clean) })
  } catch (err) {
    console.error('Factory extraction error:', err)
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 })
  }
}
```

**Frontend extraction call:**
```typescript
const handleDocExtraction = async (file: File) => {
  setExtracting(true)
  const fd = new FormData()
  fd.append('file', file)
  try {
    const res = await fetch('/api/factories/extract-from-file', {
      method: 'POST',
      body: fd,
    })
    const { data } = await res.json()
    setExtractedFields(data)
  } catch {
    setExtractionError('Could not read file — fill in manually')
  } finally {
    setExtracting(false)
  }
}

const applyAllFields = () => {
  if (!extractedFields) return
  setFormData(prev => ({
    ...prev,
    name:          extractedFields.name          || prev.name,
    country:       extractedFields.country       || prev.country,
    city:          extractedFields.city          || prev.city,
    contactName:   extractedFields.contactName   || prev.contactName,
    contactEmail:  extractedFields.contactEmail  || prev.contactEmail,
    contactPhone:  extractedFields.contactPhone  || prev.contactPhone,
    totalLines:    extractedFields.totalLines?.toString() || prev.totalLines,
    certifications: extractedFields.certifications || prev.certifications,
  }))
}
```

---

## BUILD & DEPLOY

```bash
cd /var/www/Master_Sankalphub/V3.0_Frontend

# Verify no popup remains in factories
grep -rn "Dialog\|Modal\|setOpen\|isOpen" \
  app/\(dashboard\)/factories/ --include="*.tsx" | grep -v node_modules

npm run build 2>&1 | tail -20

if [ $? -eq 0 ]; then
  git add -A
  git commit -m "feat: add factory — replace popup with 3-step wizard at /factories/new"
  git push origin main
  echo "DEPLOYED"
else
  echo "BUILD FAILED"
  npm run build 2>&1 | grep -E "Error|error|×" | head -20
fi
```

---

## VERIFICATION CHECKLIST

- [ ] No popup appears when clicking "+ Add factory"
- [ ] "+ Add factory" navigates to `/factories/new`
- [ ] Breadcrumb "← Factories" navigates back
- [ ] Stepper shows 3 steps with correct states
- [ ] Step 1: left and right cards are EQUAL HEIGHT
- [ ] Step 1: factory photo upload shows preview (130px)
- [ ] Step 1: drag & drop doc extraction works
- [ ] Step 1: extracted fields show with "Use" buttons
- [ ] Step 1: "Fill all fields" populates form
- [ ] Step 2: category pills toggle on/off
- [ ] Step 2: certification pills toggle on/off
- [ ] Step 3: left and right cards are EQUAL HEIGHT
- [ ] Step 3: photo thumbnail shown if uploaded
- [ ] "Add factory" saves to Supabase + uploads photo
- [ ] After save → redirects to `/factories`
- [ ] New factory appears on board immediately
- [ ] All placeholders are 9px

---

*SankalpHub V3 — Add Factory Wizard*
*Replace popup with /factories/new full page wizard*
*April 3, 2026*
