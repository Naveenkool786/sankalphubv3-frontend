# SankalpHub — Projects Module: Full Rewrite Brief (V3 Frontend)
**For: Claude Code + Sub-Agents**
**Date:** April 2, 2026
**Scope:** Replace popup modal with full wizard + projects board with images + PDF/Excel export + global 9px placeholders
**Mode:** Rewrite the projects module. Keep all existing routes. No other modules touched.

> ⚠️ **WORKING DIRECTORY: V3 Frontend ONLY**
> All work is in `/var/www/Master_Sankalphub/V3.0_Frontend/`
> Database column: `org_id` (NOT organization_id) in profiles table

---

## PLATFORM CONTEXT

| Item | Detail |
|---|---|
| **Framework** | Next.js 15.2.1, React 19.2.4, TypeScript, Tailwind CSS |
| **DB** | Supabase — `jirhyxpcbfeelgiyxqdi.supabase.co` |
| **Storage** | Supabase Storage (for product images) |
| **Export** | jsPDF + SheetJS (xlsx) |
| **AI extraction** | Claude API (`claude-sonnet-4-20250514`) |
| **Routes** | `/projects` (board) + `/projects/new` (wizard) |

---

## TASK ASSIGNMENT

| Task | Agent | Description |
|---|---|---|
| Task 1 | Sub-Agent 1 | Global 9px placeholder CSS + Supabase schema |
| Task 2 | Sub-Agent 2 | 4-step project creation wizard at `/projects/new` |
| Task 3 | Sub-Agent 3 | Projects board at `/projects` with image cards |
| Task 4 | Sub-Agent 1 | PDF + Excel export functions |
| Task 5 | Sub-Agent 1 | AI file extraction API route |

---

## TASK 1 — GLOBAL 9PX PLACEHOLDERS + SCHEMA

**Agent:** Sub-Agent 1

### Step 1 — Global placeholder CSS

Find the global CSS file:
```bash
find . -name "globals.css" -o -name "global.css" | grep -v node_modules | head -3
```

Add these rules at the bottom:
```css
/* SankalpHub — Global placeholder size */
::placeholder {
  font-size: 9px !important;
  color: var(--muted-foreground) !important;
  opacity: 0.7;
}
select option:first-child {
  font-size: 9px;
}
input::placeholder,
textarea::placeholder {
  font-size: 9px !important;
}
```

### Step 2 — Supabase schema

Run in Supabase SQL Editor:

```sql
-- Add product_image_url and status to projects if not exists
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS product_image_url TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS season TEXT,
  ADD COLUMN IF NOT EXISTS product_type TEXT,
  ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'pcs',
  ADD COLUMN IF NOT EXISTS po_number TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS buyer TEXT,
  ADD COLUMN IF NOT EXISTS aql_level TEXT DEFAULT '2.5',
  ADD COLUMN IF NOT EXISTS inspection_type TEXT DEFAULT 'final',
  ADD COLUMN IF NOT EXISTS sample_size INT,
  ADD COLUMN IF NOT EXISTS lot_size INT,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS expected_delivery DATE,
  ADD COLUMN IF NOT EXISTS inspection_date DATE,
  ADD COLUMN IF NOT EXISTS shipment_date DATE,
  ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS description TEXT;

-- status values: draft | confirmed | in_production | in_inspection | completed | delayed | cancelled
-- priority values: high | medium | low

-- Supabase Storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy
CREATE POLICY IF NOT EXISTS "project_images_upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-images');

CREATE POLICY IF NOT EXISTS "project_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-images');
```

### Acceptance Criteria — Task 1
- [ ] Global CSS: all placeholders render at 9px across entire platform
- [ ] Projects table has all new columns
- [ ] Supabase Storage bucket `project-images` exists and is public

---

## TASK 2 — 4-STEP PROJECT CREATION WIZARD

**Agent:** Sub-Agent 2

**File:** `app/(dashboard)/projects/new/page.tsx`

This page REPLACES the popup modal. Remove all modal/dialog code from the projects list page that currently opens "Create New Project".

Update the "+ New Project" button to navigate to `/projects/new` instead of opening a modal.

---

### WIZARD LAYOUT — CRITICAL REQUIREMENT

**The left and right containers on every step must be equal height.**

Use this exact grid on every step that has two columns:
```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 300px',
  gap: '14px',
  alignItems: 'stretch',  // ← forces equal height
}}>
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    {/* Left card — stretches to fill full height */}
    <div style={{ flex: 1, ... }}>
      {/* form fields */}
    </div>
  </div>
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    {/* Right card — stretches to fill full height */}
    <div style={{ flex: 1, ... }}>
      {/* upload zone */}
    </div>
  </div>
</div>
```

Both cards use `flex: 1` so they always match height regardless of content.

---

### STEP 1 — Project Basics + Upload

**Left card — Project basics:**
```
Project name *        → text input
Season               → select (Summer 2026 / Winter 2026 / Spring 2027 / AW26 / SS27)
Category *           → select (Garments / Footwear / Gloves / Headwear / Accessories)
Product type         → text input
Description          → textarea
Product image        → image upload (JPG/PNG/WebP, max 5MB)
                       Shows preview after upload
                       Stored in Supabase Storage: project-images/{projectId}/cover.jpg
```

**Product image upload spec:**
```tsx
// Image upload inside Step 1 left card, below Description
<div>
  <label>Product image</label>
  {imagePreview ? (
    <div style={{ position: 'relative', height: '120px', borderRadius: '8px', overflow: 'hidden' }}>
      <img src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <button onClick={() => setImagePreview(null)}>Remove</button>
    </div>
  ) : (
    <div onClick={() => fileInputRef.current?.click()}
      style={{
        border: '1.5px dashed var(--border)',
        borderRadius: '8px',
        padding: '16px',
        textAlign: 'center',
        cursor: 'pointer',
        background: 'var(--muted)',
      }}>
      <p style={{ fontSize: '11px' }}>Click to upload product image</p>
      <p style={{ fontSize: '9px', color: 'var(--muted-foreground)' }}>JPG, PNG, WebP · max 5MB</p>
    </div>
  )}
  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
    onChange={handleImageUpload} />
</div>
```

**Right card — Upload & auto-fill (ONLY on Step 1):**

The drag-and-drop zone for PO documents. This card must match the height of the left card exactly.

```
Title: "Upload & auto-fill"  [AI badge]

Drop zone:
- Accepts: Excel (.xlsx/.xls), PDF, Word (.docx), CSV
- On drop/select: calls /api/projects/extract-from-file
- Shows extracted fields as rows: [dot] [key] [value] [Use button]
- "Fill all fields →" button fills ALL form fields at once
- After fill: shows green tick "8 fields filled" confirmation

Supported file types shown as colored badges:
Excel (blue), PDF (green), Word (purple), CSV (amber)

Hint text (9px):
"AI reads your PO or tech pack and fills project name,
factory, sizes, PO number, delivery date, AQL level"
```

**State management:**
```typescript
const [formData, setFormData] = useState({
  // Step 1
  name: '',
  season: '',
  category: '',
  productType: '',
  description: '',
  productImageFile: null as File | null,
  productImageUrl: '',
  // Step 2
  factoryId: '',
  factoryName: '',
  poNumber: '',
  quantity: '',
  unit: 'pcs',
  country: '',
  buyer: '',
  sizes: { XS: '', S: '', M: '', L: '', XL: '', XXL: '' },
  // Step 3
  startDate: '',
  expectedDelivery: '',
  inspectionDate: '',
  shipmentDate: '',
  aqlLevel: '2.5',
  inspectionType: 'final',
  sampleSize: '',
  lotSize: '',
  priority: 'medium',
  notes: '',
  // Meta
  status: 'confirmed',
  tags: [] as string[],
})
```

---

### STEP 2 — Factory & Production (review/confirm auto-filled)

**Single full-width layout** (no two-column — upload is gone from Step 2):

```
Factory & production details
├── Assigned factory *    → select from org's factories
├── PO number            → text
├── Quantity *           → number
├── Unit                 → select (pcs / pairs / sets / dozens)
├── Country              → text
├── Buyer / Brand        → text

Size breakdown
├── 6 inputs: XS / S / M / L / XL / XXL  (3-column grid)
└── Auto-total: "Total: X pcs" (calculated live)

Total calculation:
const total = Object.values(sizes).reduce((sum, v) => sum + (parseInt(v) || 0), 0)
```

Subtitle on this step: "Review and confirm — fields pre-filled from your uploaded file"

---

### STEP 3 — Timeline & QC Settings

**Single full-width layout:**

```
Timeline
├── Start date           → date input
├── Expected delivery *  → date input
├── Inspection date      → date input
└── Shipment date        → date input

QC settings
├── AQL level *          → select (AQL 2.5 — standard / AQL 1.0 — strict / AQL 4.0 — relaxed)
├── Inspection type      → select (Final / Pre-production / During production / Loading check)
├── Sample size          → number (auto-calculated from AQL + lot size if blank)
├── Lot size             → number
├── Inspector            → select (Assign later / Internal / Third-party agency)
└── Priority             → 3 button toggle (High / Medium / Low)
                           High: #FCEBEB bg / #791F1F text
                           Medium: #FAEEDA bg / #633806 text (default selected)
                           Low: secondary bg / tertiary text

Notes
└── textarea
```

---

### STEP 4 — Review & Save

**Two-column layout with equal height cards:**

**Left card — Project summary:**
Show all entered data as key-value rows:
```
Project name     Summer Collection 2026
Season           Summer 2026
Category         Garments — Jackets
Factory          Tiger Exports Ltd.
Quantity         5,000 pcs
PO number        PO-2026-001
Country          India
Delivery         June 30, 2026
AQL level        2.5 — Standard
Inspection       Final inspection
Priority         [Medium badge]
Sizes            S·500 M·1,500 L·1,500 XL·1,000 XXL·500
```

If product image was uploaded, show it as a small 60px thumbnail next to "Product image" row.

**Right card — Save & export (equal height to left):**
```
[Green tick icon]
"Ready to create"
"All required fields complete"

[Create project →]  ← green button, full width

[Download PDF]  [Export Excel]  ← side by side

[Save as draft]  ← outline button

Checklist:
• Factory will be notified
• Inspection can be started immediately
• All details editable after saving
```

---

### WIZARD STEPPER

```tsx
// 4 steps with connecting lines
// Circle states: default (gray border) | active (#BA7517) | done (#1D9E75 + checkmark)
// Line states: default (gray) | done (#1D9E75)
// Step labels: 10px, matching state color
const steps = ['Basics', 'Factory', 'Timeline & QC', 'Review & save']
```

---

### Wizard Actions on submit

**Save as draft:**
```typescript
await supabase.from('projects').insert({
  ...formData,
  org_id: orgId,
  status: 'draft',
  created_by: user.id,
})
router.push('/projects')
```

**Create project:**
```typescript
// 1. Upload image to Supabase Storage if exists
let imageUrl = ''
if (formData.productImageFile) {
  const { data } = await supabase.storage
    .from('project-images')
    .upload(`${orgId}/${Date.now()}-cover.jpg`, formData.productImageFile)
  imageUrl = supabase.storage.from('project-images').getPublicUrl(data.path).data.publicUrl
}

// 2. Create project
const { data: project } = await supabase.from('projects').insert({
  org_id: orgId,
  name: formData.name,
  season: formData.season,
  category: formData.category,
  product_type: formData.productType,
  description: formData.description,
  product_image_url: imageUrl,
  factory_id: formData.factoryId,
  po_number: formData.poNumber,
  quantity: parseInt(formData.quantity),
  unit: formData.unit,
  country: formData.country,
  buyer: formData.buyer,
  sizes: formData.sizes,
  start_date: formData.startDate || null,
  expected_delivery: formData.expectedDelivery,
  inspection_date: formData.inspectionDate || null,
  shipment_date: formData.shipmentDate || null,
  aql_level: formData.aqlLevel,
  inspection_type: formData.inspectionType,
  sample_size: parseInt(formData.sampleSize) || null,
  lot_size: parseInt(formData.lotSize) || null,
  priority: formData.priority,
  notes: formData.notes,
  status: 'confirmed',
  created_by: user.id,
}).select().single()

router.push('/projects')
```

### Acceptance Criteria — Task 2
- [ ] `/projects/new` loads as full page — no popup
- [ ] "+" button on projects page navigates to `/projects/new`
- [ ] All 4 steps render correctly
- [ ] Left and right cards on Step 1 and Step 4 are EQUAL HEIGHT
- [ ] Upload zone only on Step 1 — not on Steps 2, 3, 4
- [ ] Product image upload shows preview in Step 1
- [ ] Stepper shows correct states as user progresses
- [ ] Back buttons work on every step
- [ ] Save as draft saves with status = 'draft'
- [ ] Create project saves all data + image + redirects to `/projects`
- [ ] All placeholders render at 9px

---

## TASK 3 — PROJECTS BOARD

**Agent:** Sub-Agent 3

**File:** `app/(dashboard)/projects/page.tsx`

---

### Board layout

```
Page header:
[Projects]                                    [+ New project]
[X projects · Y in production · Z drafts]

Filter tabs:
[All] [Draft] [Confirmed] [In production] [In inspection] [Completed] [Delayed]

Search + view toggle:
[Search projects...] [grid icon] [list icon]

Cards grid:
3 columns, generous gap
```

---

### Project card spec

**Card structure (top to bottom):**

```
┌─────────────────────────────────────┐  ← colored left border
│  [Product image — 130px height]     │
│  [Status pill — top left]           │
│  [... menu — top right]             │
├─────────────────────────────────────│
│  Project name (13px, font-weight 500)│
│  [Priority badge] [Category badge]  │
│  [PO number badge]                  │
│  Progress label ····· XX%           │
│  [Progress bar — 3px, color by status]│
│  Factory name · Quantity            │
│  Due date (red if overdue)          │
└─────────────────────────────────────┘
```

**Product image area (130px height):**
```tsx
{project.product_image_url ? (
  <div style={{ position: 'relative', height: '130px', overflow: 'hidden' }}>
    <img
      src={project.product_image_url}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
    {/* Hover overlay */}
    <div className="img-overlay" style={{
      position: 'absolute', inset: 0,
      background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: 0, transition: 'opacity .2s',
    }}>
      <button style={{ fontSize: '10px', padding: '4px 12px', borderRadius: '6px',
        background: '#fff', color: '#111', border: 'none', cursor: 'pointer' }}>
        Change image
      </button>
    </div>
  </div>
) : (
  <div style={{
    height: '130px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '6px',
    background: 'var(--muted)', cursor: 'pointer',
  }}
    onClick={() => handleImageUpload(project.id)}>
    {/* Camera icon */}
    <svg width="24" height="24" .../>
    <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>
      Click to upload image
    </span>
  </div>
)}
```

**Left border color by status:**
```typescript
const statusBorderColor = {
  draft: '#888780',
  confirmed: '#1D9E75',
  in_production: '#378ADD',
  in_inspection: '#C9A96E',
  completed: '#1D9E75',
  delayed: '#E24B4A',
  cancelled: '#888780',
}
```

**Progress bar color + value:**
```typescript
const progressColor = {
  draft: '#888780',
  confirmed: '#1D9E75',
  in_production: '#378ADD',
  in_inspection: '#C9A96E',
  completed: '#1D9E75',
  delayed: '#E24B4A',
}

// Progress value — calculate from inspections or use dummy 0 if none
const progressPct = project.status === 'completed' ? 100
  : project.status === 'in_inspection' ? 80
  : project.status === 'in_production' ? 50
  : 0
```

**"..." menu per card:**
```
View project
Edit project
Change image / Upload image
────────────
Download PDF
Export Excel
────────────
Delete project (red)

For drafts:
Continue editing
Confirm project
────────────
Download PDF
Export Excel
────────────
Discard draft (red)
```

**Due date color:**
```typescript
const isOverdue = project.expected_delivery &&
  new Date(project.expected_delivery) < new Date() &&
  project.status !== 'completed'
// isOverdue → color: '#E24B4A', fontWeight: 500, text: "MMM DD — Late"
// normal → color: 'var(--muted-foreground)', text: "MMM DD, YYYY"
```

---

### Image upload on existing projects

When user clicks "Upload image" or "Click to upload image":
```typescript
const handleImageUpload = async (projectId: string) => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    // Upload to Supabase Storage
    const { data } = await supabase.storage
      .from('project-images')
      .upload(`${orgId}/${projectId}/cover.jpg`, file, { upsert: true })
    const url = supabase.storage.from('project-images')
      .getPublicUrl(data!.path).data.publicUrl
    // Update project record
    await supabase.from('projects')
      .update({ product_image_url: url })
      .eq('id', projectId)
    // Refresh the board
    refetchProjects()
  }
  input.click()
}
```

### Acceptance Criteria — Task 3
- [ ] Projects board shows card grid with 3 columns
- [ ] Cards with images show product photo in top 130px
- [ ] Cards without images show "Click to upload image" placeholder
- [ ] Hover on image card shows "Change image" overlay
- [ ] Status badge on top-left of image area
- [ ] "..." menu works with all options
- [ ] Filter tabs filter correctly by status
- [ ] Delayed projects show due date in red
- [ ] Image upload from card works — photo appears immediately
- [ ] "+ New project" button goes to `/projects/new`

---

## TASK 4 — PDF + EXCEL EXPORT

**Agent:** Sub-Agent 1

Install libraries:
```bash
npm install jspdf jspdf-autotable xlsx
```

### PDF export function

**File:** `lib/export/projectPdf.ts`

```typescript
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportProjectPDF(project: Project): void {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.setTextColor('#BA7517')
  doc.text('SankalpHub', 14, 20)
  doc.setFontSize(10)
  doc.setTextColor('#888')
  doc.text('Production Intelligence Platform', 14, 27)

  // Project title
  doc.setFontSize(16)
  doc.setTextColor('#111')
  doc.text(project.name, 14, 42)

  doc.setFontSize(10)
  doc.setTextColor('#666')
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 50)

  // Project details table
  autoTable(doc, {
    startY: 58,
    head: [['Field', 'Details']],
    body: [
      ['Project Name', project.name],
      ['Season', project.season || '—'],
      ['Category', project.category],
      ['Product Type', project.product_type || '—'],
      ['Factory', project.factory_name || '—'],
      ['PO Number', project.po_number || '—'],
      ['Quantity', `${project.quantity?.toLocaleString()} ${project.unit}`],
      ['Country', project.country || '—'],
      ['Buyer', project.buyer || '—'],
      ['Status', project.status],
      ['Priority', project.priority],
      ['AQL Level', project.aql_level],
      ['Inspection Type', project.inspection_type],
      ['Expected Delivery', project.expected_delivery || '—'],
      ['Inspection Date', project.inspection_date || '—'],
    ],
    headStyles: { fillColor: '#BA7517' },
    alternateRowStyles: { fillColor: '#FAFAF8' },
  })

  // Size breakdown if exists
  const sizes = project.sizes || {}
  const sizeEntries = Object.entries(sizes).filter(([_, v]) => v && parseInt(String(v)) > 0)
  if (sizeEntries.length > 0) {
    const currentY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(12)
    doc.setTextColor('#111')
    doc.text('Size Breakdown', 14, currentY)
    autoTable(doc, {
      startY: currentY + 6,
      head: [sizeEntries.map(([k]) => k)],
      body: [sizeEntries.map(([_, v]) => v.toLocaleString())],
      headStyles: { fillColor: '#C9A96E' },
    })
  }

  // Notes
  if (project.notes) {
    const notesY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(12)
    doc.text('Notes', 14, notesY)
    doc.setFontSize(10)
    doc.setTextColor('#666')
    doc.text(project.notes, 14, notesY + 8, { maxWidth: 180 })
  }

  // Footer
  doc.setFontSize(8)
  doc.setTextColor('#aaa')
  doc.text('Generated by SankalpHub — sankalphub.in', 14, 285)

  doc.save(`${project.name.replace(/\s+/g, '-')}-project.pdf`)
}
```

### Excel export function

**File:** `lib/export/projectExcel.ts`

```typescript
import * as XLSX from 'xlsx'

export function exportProjectExcel(project: Project): void {
  const wb = XLSX.utils.book_new()

  // Project details sheet
  const details = [
    ['SankalpHub — Project Export'],
    ['Generated', new Date().toLocaleDateString('en-IN')],
    [],
    ['Field', 'Value'],
    ['Project Name', project.name],
    ['Season', project.season || ''],
    ['Category', project.category],
    ['Product Type', project.product_type || ''],
    ['Factory', project.factory_name || ''],
    ['PO Number', project.po_number || ''],
    ['Quantity', project.quantity || 0],
    ['Unit', project.unit],
    ['Country', project.country || ''],
    ['Buyer', project.buyer || ''],
    ['Status', project.status],
    ['Priority', project.priority],
    ['AQL Level', project.aql_level],
    ['Inspection Type', project.inspection_type],
    ['Expected Delivery', project.expected_delivery || ''],
    ['Inspection Date', project.inspection_date || ''],
    ['Shipment Date', project.shipment_date || ''],
    ['Notes', project.notes || ''],
  ]

  const ws1 = XLSX.utils.aoa_to_sheet(details)
  ws1['!cols'] = [{ wch: 22 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, ws1, 'Project Details')

  // Sizes sheet if exists
  const sizes = project.sizes || {}
  const sizeEntries = Object.entries(sizes).filter(([_, v]) => v && parseInt(String(v)) > 0)
  if (sizeEntries.length > 0) {
    const total = sizeEntries.reduce((s, [_, v]) => s + parseInt(String(v)), 0)
    const sizeData = [
      ['Size', 'Quantity'],
      ...sizeEntries.map(([k, v]) => [k, parseInt(String(v))]),
      ['TOTAL', total],
    ]
    const ws2 = XLSX.utils.aoa_to_sheet(sizeData)
    ws2['!cols'] = [{ wch: 10 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Size Breakdown')
  }

  XLSX.writeFile(wb, `${project.name.replace(/\s+/g, '-')}-project.xlsx`)
}
```

### Acceptance Criteria — Task 4
- [ ] Download PDF generates a clean PDF with all project data
- [ ] Export Excel generates xlsx with two sheets (Details + Sizes)
- [ ] Both work from Step 4 of wizard (before saving)
- [ ] Both work from "..." menu on project cards (after saving)
- [ ] File names use project name (slugified)

---

## TASK 5 — AI FILE EXTRACTION API ROUTE

**Agent:** Sub-Agent 1

**File:** `app/api/projects/extract-from-file/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type

    const client = new Anthropic()

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: mimeType as 'application/pdf',
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Extract the following fields from this purchase order or tech pack document. 
              Return ONLY a JSON object with these exact keys (use null if not found):
              {
                "projectName": string or null,
                "poNumber": string or null,
                "factoryName": string or null,
                "quantity": number or null,
                "unit": string or null,
                "country": string or null,
                "buyer": string or null,
                "deliveryDate": string (YYYY-MM-DD) or null,
                "aqlLevel": string or null,
                "category": string or null,
                "sizes": { "XS": number, "S": number, "M": number, "L": number, "XL": number, "XXL": number } or null
              }
              Return only the JSON, no explanation.`,
            },
          ],
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = text.replace(/```json|```/g, '').trim()
    const extracted = JSON.parse(clean)

    return NextResponse.json({ success: true, data: extracted })
  } catch (error) {
    console.error('Extraction error:', error)
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 })
  }
}
```

**Install Anthropic SDK if not already:**
```bash
npm install @anthropic-ai/sdk
```

**Add to Vercel environment variables:**
```
ANTHROPIC_API_KEY = (get from console.anthropic.com)
```

**Frontend — call the extraction API:**
```typescript
const handleFileExtraction = async (file: File) => {
  setExtracting(true)
  const fd = new FormData()
  fd.append('file', file)

  const res = await fetch('/api/projects/extract-from-file', {
    method: 'POST',
    body: fd,
  })
  const { data } = await res.json()

  setExtractedFields(data)
  setExtracting(false)
}

const fillAllFields = () => {
  if (!extractedFields) return
  setFormData(prev => ({
    ...prev,
    name: extractedFields.projectName || prev.name,
    poNumber: extractedFields.poNumber || prev.poNumber,
    quantity: extractedFields.quantity?.toString() || prev.quantity,
    unit: extractedFields.unit || prev.unit,
    country: extractedFields.country || prev.country,
    buyer: extractedFields.buyer || prev.buyer,
    expectedDelivery: extractedFields.deliveryDate || prev.expectedDelivery,
    aqlLevel: extractedFields.aqlLevel || prev.aqlLevel,
    sizes: extractedFields.sizes || prev.sizes,
  }))
}
```

### Acceptance Criteria — Task 5
- [ ] `/api/projects/extract-from-file` accepts POST with file
- [ ] Returns structured JSON with extracted fields
- [ ] Frontend shows extracted fields as rows with "Use" buttons
- [ ] "Fill all fields" populates all matching form fields at once
- [ ] After fill, shows green tick confirmation
- [ ] Extraction failure shows friendly error (doesn't crash wizard)
- [ ] `ANTHROPIC_API_KEY` documented as required env var

---

## BUILD & DEPLOY

```bash
cd /var/www/Master_Sankalphub/V3.0_Frontend

# Install dependencies
npm install jspdf jspdf-autotable xlsx @anthropic-ai/sdk

# Build check
npm run build 2>&1 | tail -30

if [ $? -eq 0 ]; then
  git add -A
  git commit -m "feat: projects module rewrite — wizard, board with images, PDF/Excel export, AI file extraction"
  git push origin main
  echo "DEPLOYED"
else
  echo "BUILD FAILED"
  npm run build 2>&1 | grep -E "Error|error" | head -20
fi
```

---

## FINAL VERIFICATION CHECKLIST

**Global:**
- [ ] All placeholders platform-wide render at 9px
- [ ] No popup modals for project creation anywhere

**Wizard `/projects/new`:**
- [ ] Loads as full dedicated page
- [ ] Step 1: left and right cards equal height
- [ ] Step 1: product image upload with preview
- [ ] Step 1: drag & drop file extraction working
- [ ] Step 1: "Fill all fields" populates Steps 2 and 3 data
- [ ] Step 2: no upload zone — only factory/production fields
- [ ] Step 2: size grid with live total calculation
- [ ] Step 3: no upload zone — only timeline/QC fields
- [ ] Step 4: left and right cards equal height
- [ ] Step 4: product image thumbnail shown in summary
- [ ] Step 4: Download PDF works
- [ ] Step 4: Export Excel works
- [ ] Create project saves all data + image to Supabase
- [ ] Save as draft saves with status = 'draft'

**Projects board `/projects`:**
- [ ] Cards show product image (130px) or upload placeholder
- [ ] Click placeholder → file picker → image uploads → appears on card
- [ ] Hover on image → "Change image" overlay appears
- [ ] Status left border color matches status
- [ ] Filter tabs work correctly
- [ ] "..." menu: view, edit, change image, download PDF, export excel, delete
- [ ] Delayed projects show red due date
- [ ] "+ New project" navigates to `/projects/new`

**Exports:**
- [ ] PDF includes project details table + sizes + notes
- [ ] Excel includes two sheets: details + size breakdown
- [ ] Both available before saving (Step 4) and after (card menu)

---

*SankalpHub V3 — Projects Module Full Rewrite*
*Wizard + Board + Image Upload + PDF/Excel + AI Extraction*
*9px placeholders platform-wide*
*April 2, 2026*
