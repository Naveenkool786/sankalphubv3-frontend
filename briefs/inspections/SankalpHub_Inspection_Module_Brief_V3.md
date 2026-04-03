# SankalpHub — Inspection Module: Full Brief (V3 Frontend)
**For: Claude Code + Sub-Agents**
**Date:** April 3, 2026
**Scope:** Complete inspection workflow — 7-step wizard, AI defect detection, AQL engine, PDF report
**Mode:** New module. Route: `/inspections` (list) + `/inspections/new` (wizard)
**Priority:** CRITICAL PATH — most important feature in the platform

> ⚠️ **WORKING DIRECTORY: V3 Frontend ONLY**
> All work is in `/var/www/Master_Sankalphub/V3.0_Frontend/`
> Always use `org_id` (NOT organization_id) in all Supabase queries
> Responsive: works on desktop AND mobile — no cut-off, no blocked UI

---

## OVERVIEW

The inspection module is a 7-step wizard at `/inspections/new`.
No popups. Full dedicated pages. Two-column layout on desktop, single column on mobile.
Each step must be 100% complete before proceeding — Next button locked until all required fields done.

| Step | Route segment | What happens |
|---|---|---|
| 1 | Setup | Project, factory, inspector, date, inspection type |
| 2 | Category & AQL | Product category, AQL level, sample size, checklist template selection |
| 3 | Product photos | 4 mandatory photos — buyer sample, front, back, lining |
| 4 | Checklist | Section-by-section checklist with Yes/No + photo per item |
| 5 | Defect log | Manual + AI defect logging connected to defect library |
| 6 | AQL result | Auto-calculated pass/fail on submit |
| 7 | Review & submit | Summary, signature, PDF/Excel export, submit |

---

## TASK ASSIGNMENT

| Task | Agent | Description |
|---|---|---|
| Task 1 | Sub-Agent 1 | Supabase schema — inspections, defects, photos tables |
| Task 2 | Sub-Agent 2 | Steps 1 + 2 — Setup and Category/AQL |
| Task 3 | Sub-Agent 2 | Step 3 — Product photo capture (2×2 grid) |
| Task 4 | Sub-Agent 3 | Step 4 — Checklist with photo + Yes/No per item |
| Task 5 | Sub-Agent 3 | Step 5 — Defect log (manual + AI) |
| Task 6 | Sub-Agent 1 | Step 6 — AQL engine calculation |
| Task 7 | Sub-Agent 1 | Step 7 — Review, PDF report, submit |
| Task 8 | Sub-Agent 1 | AI defect detection API route |
| Task 9 | Sub-Agent 2 | Inspections list page `/inspections` |

---

## TASK 1 — SUPABASE SCHEMA

**Agent:** Sub-Agent 1

```sql
-- ─── INSPECTIONS TABLE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inspections (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID REFERENCES organizations(id) ON DELETE CASCADE,
  inspection_number     TEXT UNIQUE,
  project_id            UUID REFERENCES projects(id),
  factory_id            UUID REFERENCES factories(id),
  inspector_name        TEXT NOT NULL,
  inspector_type        TEXT DEFAULT 'brand_inspector',
  -- inspector_type: brand_inspector | third_party | internal_qc
  inspection_date       DATE NOT NULL,
  inspection_type       TEXT DEFAULT 'final',
  -- inspection_type: final | pre_production | during_production | loading
  category              TEXT NOT NULL,
  -- category: garments | footwear | gloves | headwear | accessories
  product_type          TEXT,
  style_ref             TEXT,
  colour                TEXT,
  aql_level             TEXT DEFAULT '2.5',
  lot_size              INTEGER,
  sample_size           INTEGER,
  inspection_level      TEXT DEFAULT 'normal_2',
  -- Photos
  photo_buyer_sample    TEXT,
  photo_front           TEXT,
  photo_back            TEXT,
  photo_lining          TEXT,
  -- AQL results (calculated on submit)
  critical_found        INTEGER DEFAULT 0,
  major_found           INTEGER DEFAULT 0,
  minor_found           INTEGER DEFAULT 0,
  critical_allowed      INTEGER DEFAULT 0,
  major_allowed         INTEGER DEFAULT 0,
  minor_allowed         INTEGER DEFAULT 0,
  aql_result            TEXT,
  -- aql_result: pass | fail | pending
  inspector_decision    TEXT,
  inspector_comments    TEXT,
  inspector_signature   TEXT,
  -- Status
  status                TEXT DEFAULT 'draft',
  -- status: draft | in_progress | submitted | approved | rejected
  submitted_at          TIMESTAMPTZ,
  created_by            UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Auto-generate inspection number
CREATE OR REPLACE FUNCTION generate_inspection_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.inspection_number := 'INS-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
    LPAD(nextval('inspection_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS inspection_seq START 1;

CREATE TRIGGER set_inspection_number
  BEFORE INSERT ON inspections
  FOR EACH ROW
  WHEN (NEW.inspection_number IS NULL)
  EXECUTE FUNCTION generate_inspection_number();

-- ─── INSPECTION CHECKLIST ITEMS ────────────────────────────────
CREATE TABLE IF NOT EXISTS inspection_checklist_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id   UUID REFERENCES inspections(id) ON DELETE CASCADE,
  section         TEXT NOT NULL,
  item_number     INTEGER NOT NULL,
  question        TEXT NOT NULL,
  result          TEXT,
  -- result: pass | fail | na
  photo_url       TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── INSPECTION DEFECTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inspection_defects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id   UUID REFERENCES inspections(id) ON DELETE CASCADE,
  defect_name     TEXT NOT NULL,
  defect_code     TEXT,
  severity        TEXT NOT NULL,
  -- severity: critical | major | minor
  location        TEXT,
  source          TEXT DEFAULT 'manual',
  -- source: manual | ai_detected
  photo_url       TEXT,
  notes           TEXT,
  quantity        INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_defects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_inspections" ON inspections FOR ALL
USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_checklist_items" ON inspection_checklist_items FOR ALL
USING (inspection_id IN (
  SELECT id FROM inspections WHERE org_id = (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
));

CREATE POLICY "org_inspection_defects" ON inspection_defects FOR ALL
USING (inspection_id IN (
  SELECT id FROM inspections WHERE org_id = (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
));

CREATE POLICY "super_admin_inspections" ON inspections FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Storage bucket for inspection photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-photos', 'inspection-photos', false)
ON CONFLICT (id) DO NOTHING;
```

---

## TASK 2 — STEP 1 & 2: SETUP + CATEGORY/AQL

**Agent:** Sub-Agent 2
**File:** `app/(dashboard)/inspections/new/page.tsx`

---

### LAYOUT RULE — applies to ALL steps

```tsx
// Desktop: two columns side by side
// Mobile: single column stacked
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '14px',
  alignItems: 'start',
}}>
  <div>left content</div>
  <div>right content</div>
</div>
```

---

### STEPPER COMPONENT

7 steps. Shows at top of every step.
Progress bar fills proportionally: step 1 = 14%, 2 = 28%, 3 = 43%, 4 = 57%, 5 = 71%, 6 = 85%, 7 = 100%

```
[1 Setup] ─── [2 Category] ─── [3 Photos] ─── [4 Checklist] ─── [5 Defects] ─── [6 AQL] ─── [7 Report]

Circle states:
- default: gray border, gray text
- active:  #BA7517 fill, white text
- done:    #1D9E75 fill, white checkmark
Line states:
- default: var(--border)
- done:    #1D9E75
```

---

### STEP 1 — Setup (two column)

**Left card — Inspection details:**
```
Project *             select — from org's projects (shows project name + factory)
                      On select → auto-fills factory, PO number, quantity from project
Inspection number     text — auto-generated (INS-2026-0001), read-only display
Inspection date *     date input
Inspection type *     select (Final inspection / Pre-production / During production / Loading check)
Factory *             select — auto-filled from project, or manual select
```

**Right card — Inspector details + completion checklist:**
```
Inspector name *      text input
Inspector type        select (Brand inspector / Third-party agency / Internal QC)
Contact               tel input

Completion checklist (live — turns green as user fills fields):
○ Project selected
○ Factory confirmed
○ Inspector name entered
○ Date selected

All 4 must be green before Next unlocks
```

Auto-fill from project on project select:
```typescript
const handleProjectSelect = async (projectId: string) => {
  const { data: project } = await supabase
    .from('projects')
    .select('*, factories(name, city, country)')
    .eq('id', projectId)
    .single()

  if (project) {
    setFormData(prev => ({
      ...prev,
      projectId,
      factoryId: project.factory_id,
      factoryName: project.factory_name || project.factories?.name,
      poNumber: project.po_number,
      quantity: project.quantity,
      category: project.category,
      aqlLevel: project.aql_level || '2.5',
    }))
  }
}
```

---

### STEP 2 — Category & AQL (two column)

**Left card — Product details:**
```
Category *            select (Garments / Footwear / Gloves / Headwear / Accessories)
                      Auto-filled from project if set
Product type          text — e.g. Jackets, Sneakers, Work gloves
Style / SKU           text
Colour / Variant      text
```

**Right card — AQL settings + checklist template:**

AQL settings:
```
AQL level *           select (AQL 2.5 — standard / AQL 1.0 — strict / AQL 4.0 — relaxed)
Lot size              number (auto-filled from project quantity)
Sample size           number (auto-calculated — see formula below)
Inspection level      select (Normal II / Tightened I / Reduced III)
```

AQL sample size auto-calculation:
```typescript
// ISO 2859-1 sample size code letters
const getSampleSize = (lotSize: number, level: string): number => {
  if (level === 'normal_2') {
    if (lotSize <= 150)    return 13
    if (lotSize <= 280)    return 20
    if (lotSize <= 500)    return 32
    if (lotSize <= 1200)   return 50
    if (lotSize <= 3200)   return 80
    if (lotSize <= 10000)  return 125
    if (lotSize <= 35000)  return 200
    return 315
  }
  // Add tightened and reduced as needed
  return 125 // default
}

// Accept/reject numbers for AQL 2.5 Normal II
const getAQLLimits = (sampleSize: number, aqlLevel: string) => {
  if (aqlLevel === '2.5') {
    if (sampleSize <= 50)  return { major: { accept: 3, reject: 4 }, minor: { accept: 7, reject: 8 } }
    if (sampleSize <= 80)  return { major: { accept: 5, reject: 6 }, minor: { accept: 10, reject: 11 } }
    if (sampleSize <= 125) return { major: { accept: 7, reject: 8 }, minor: { accept: 14, reject: 15 } }
    if (sampleSize <= 200) return { major: { accept: 10, reject: 11 }, minor: { accept: 21, reject: 22 } }
  }
  if (aqlLevel === '1.0') {
    if (sampleSize <= 125) return { major: { accept: 3, reject: 4 }, minor: { accept: 7, reject: 8 } }
  }
  return { major: { accept: 7, reject: 8 }, minor: { accept: 14, reject: 15 } }
}
// Critical: ALWAYS 0 accepted regardless of AQL level
```

Show live AQL summary below inputs:
```
AQL 2.5 · Lot 5,000 · Sample 125 pcs
Critical: accept 0 · Major: accept ≤7 · Minor: accept ≤14
```

Checklist template sections (clickable to include/exclude):
```
[● Workmanship & construction]    8 checks   [Included]
[● Measurements & sizing]         6 checks   [Included]
[● Fabric & material quality]     5 checks   [Included]
[● Trims, labels & packaging]     4 checks   [Included]
[● Safety & compliance]           3 checks   [Included]

Total: 26 checklist items across 5 sections
```

Each section row: tap to toggle included/excluded. Green dot = included, gray = excluded.

---

## TASK 3 — STEP 3: PRODUCT PHOTOS (2×2 GRID)

**Agent:** Sub-Agent 2

### CRITICAL: 2×2 grid layout — single container, full width

```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '14px',
}}>
  {photos.map((photo, i) => (
    <PhotoCard key={i} photo={photo} index={i} />
  ))}
</div>
```

On mobile (< 600px): single column — `gridTemplateColumns: '1fr'`

### 4 required photos — in this exact order:

| # | Name | Purpose |
|---|---|---|
| 0 | Buyer approved sample | Reference photo — AI uses this to compare |
| 1 | Production — front view | AI analyses against buyer sample |
| 2 | Production — back view | AI checks back seam and construction |
| 3 | Inside lining | AI checks labels, care instructions, lining quality |

### PhotoCard component — states:

**Pending state:**
```
[Camera icon + "Tap to capture" + "JPG · PNG · HEIC"]   ← dashed border, gray
[Photo name]
[Not captured]
[Capture photo button — #BA7517]
──────────────────────────────
Photo guidelines (4 bullet points, specific to this photo)
──────────────────────────────
AI notice (purple) — what AI will do with this photo
```

**Captured state:**
```
[Camera icon + "Photo captured" — green tick overlay]    ← solid #1D9E75 border
[Photo name]
[✓ Captured]
[Retake] [Delete]  ← side by side
──────────────────────────────
Photo guidelines (turned green)
──────────────────────────────
AI analysis results (purple panel):
  - [dot] [defect name] [severity badge] [Add] [Skip]
  - Multiple detected defects listed
  - "Added defects will pre-load into Step 5 defect log"
```

### Photo guidelines per photo:

**Photo 0 — Buyer approved sample:**
- Place approved sample on clean neutral surface
- Full garment visible — no cropping
- Even lighting — no harsh shadows
- Camera directly above — no angle
- AI note: "AI uses this as reference to compare all production photos"

**Photo 1 — Production front view:**
- Production sample flat — front side up
- All front details visible — collar, buttons, zips
- Same lighting and surface as approved sample
- Camera perpendicular — no angle
- AI note: "AI compares against buyer sample — flags colour, construction differences"

**Photo 2 — Production back view:**
- Flip garment — back side fully visible
- Back seams, vent and label area clear
- Same flat lay position as front
- Even lighting — no reflections
- AI note: "AI checks back seam quality and construction"

**Photo 3 — Inside lining:**
- Open garment fully — lining spread flat
- Care label and size label clearly visible
- Lining seams and stitching in focus
- Bright lighting — torch if needed
- AI note: "AI checks lining quality, labels and care instructions"

### Photo upload handler:

```typescript
const handlePhotoCapture = async (index: number, file: File) => {
  // 1. Upload to Supabase Storage
  const path = `${orgId}/${inspectionId}/photo-${index}-${Date.now()}.jpg`
  const { data } = await supabase.storage
    .from('inspection-photos')
    .upload(path, file, { upsert: true })

  const url = supabase.storage.from('inspection-photos')
    .getPublicUrl(data!.path).data.publicUrl

  // 2. Update photo state
  setPhotos(prev => prev.map((p, i) =>
    i === index ? { ...p, url, captured: true } : p
  ))

  // 3. Call AI analysis API
  analysePhotoWithAI(index, file, url)
}
```

### Next button rule:
All 4 photos captured → Next button unlocks. Otherwise: "X photos remaining — capture all to proceed"

---

## TASK 4 — STEP 4: CHECKLIST

**Agent:** Sub-Agent 3

### Layout: two columns
- Left: checklist items (scrollable on mobile)
- Right: active item detail — photo capture + Yes/No + notes

### Checklist sections and items per category

#### GARMENTS checklist:

**Section 1 — Workmanship & construction (8 items)**
1. Seams are straight and even throughout
2. No loose or exposed threads
3. Zipper operates smoothly without snagging
4. Buttons are securely attached with no movement
5. Lining is properly sewn and aligned
6. Pocket openings are correctly positioned and secure
7. Collar/cuff shape is correct and symmetrical
8. Overall appearance matches approved sample

**Section 2 — Measurements & sizing (6 items)**
1. Chest measurement within ±1cm tolerance
2. Length measurement within ±1cm tolerance
3. Sleeve length within ±0.5cm tolerance
4. Shoulder width within ±0.5cm tolerance
5. Waist/hip measurement within tolerance
6. Size label matches actual measurements

**Section 3 — Fabric & material (5 items)**
1. Fabric colour matches approved standard
2. No shade variation between panels
3. No fabric defects — holes, pulls, snags
4. Fabric weight and hand feel matches spec
5. Fabric construction is correct

**Section 4 — Trims, labels & packaging (4 items)**
1. All labels present — size, care, brand, country of origin
2. Label placement correct per spec
3. Packaging matches approved standard
4. Barcode/price tag present and scannable

**Section 5 — Safety & compliance (3 items)**
1. No sharp edges or points that could cause injury
2. Care instructions meet destination market requirements
3. No prohibited substances — lead, azo dyes etc.

#### FOOTWEAR checklist (different sections):
**Construction:** Upper stitching, sole bonding, toe box shape, heel height, insole fit, outsole grip
**Materials:** Upper material matches spec, lining material, insole cushioning, outsole durability
**Sizing:** Length correct, width correct, left/right pair matched, size marking correct
**Trims:** Laces/buckles secure, labels present, packaging correct

#### GLOVES checklist:
**Construction:** Palm seam strength, finger seam quality, cuff stitching, lining attachment
**Materials:** Outer material, grip surface, padding if applicable
**Sizing:** Hand length, finger length, cuff width, size label

#### HEADWEAR checklist:
**Construction:** Crown shape, brim/peak stability, sweatband attachment, closure mechanism
**Materials:** Fabric quality, stiffening materials, embroidery/print quality
**Sizing:** Head circumference, depth, adjustability

#### ACCESSORIES checklist:
**Construction:** Seam strength, hardware attachment, lining quality, closure function
**Materials:** Material quality, hardware finish, colour fastness
**Sizing:** Dimensions per spec, hardware sizing

---

### Checklist item states:

```typescript
type ChecklistItemState = 'pending' | 'active' | 'pass' | 'fail' | 'na'
```

**Pending:** gray number badge, gray text, no action shown
**Active (current item):** amber number badge, amber border, Yes/No buttons shown
**Pass:** green tick circle, green border, green text "Passed — photo taken"
**Fail:** red cross circle, red border, red text "Failed — defect logged"

### Yes/No buttons:
```tsx
<div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
  <button
    onClick={() => handleItemResult(item.id, 'pass')}
    style={{
      flex: 1, height: '36px', borderRadius: '8px',
      background: '#E1F5EE', border: '1.5px solid #1D9E75',
      color: '#085041', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
    }}>
    Yes — Pass
  </button>
  <button
    onClick={() => handleItemResult(item.id, 'fail')}
    style={{
      flex: 1, height: '36px', borderRadius: '8px',
      background: '#FCEBEB', border: '1.5px solid #E24B4A',
      color: '#791F1F', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
    }}>
    No — Fail
  </button>
</div>
```

When "No — Fail" is clicked → immediately prompt to log defect:
```
"Item failed — add to defect log?"
[Add defect →]  [Skip for now]
```

### Right panel — active item:
```
Current item: "Zipper operates smoothly"
Section: Workmanship & construction · Item 3 of 8

[Photo capture zone — tap to capture]
After capture → shows AI analysis panel

[Yes — Pass]  [No — Fail]

Notes: text input (optional)
```

### Section completion:
Each section shows a progress indicator: "3/8 done"
All items in section complete → section header turns green with checkmark
All sections complete → Next button unlocks

---

## TASK 5 — STEP 5: DEFECT LOG

**Agent:** Sub-Agent 3

### Layout: two columns
- Left: defect log list
- Right: add defect panel (manual + AI)

### Left panel — defect log:

Header: "Defect log" + badge "X defects logged"

Each defect row:
```
[severity dot] [defect name]           [severity badge]
               [location · item ref · source badge]
               [quantity: 1] [edit] [delete]
```

Source badge: "AI detected" (purple) or "Manual" (gray)

Severity dot colors:
- Critical: `#E24B4A`
- Major: `#BA7517`
- Minor: `#1D9E75`

Defect counter (3 boxes — always visible at top):
```
[Critical: X]  [Major: X]  [Minor: X]
Red bg          Amber bg    Green bg
```

AQL limit reminder:
```
AQL 2.5 limits: Critical 0 · Major ≤7 · Minor ≤14
```

Warning banner if limits exceeded:
```typescript
if (criticalCount > 0) {
  // Red banner: "Critical defect detected — will fail on submit"
}
if (majorCount > majorAllowed) {
  // Red banner: "Major defects exceed AQL limit (X/7) — will fail"
}
```

### Right panel — add defect:

**Two tabs: [AI Suggestions] [Add Manually]**

**AI Suggestions tab:**
Shows defects detected from photos in Step 3 and Step 4.
Each suggestion:
```
[severity dot] [defect name from defect library]  [severity badge]
[detected in: Photo 1 — front view]
[Add to log →]   [Skip]
```

After adding → moves to "Added" section with green tick.

**Add Manually tab:**
```
Defect name *     searchable select from defect library
                  (94 defects across all categories — from lib/qc-data/)
Severity *        [Critical] [Major] [Minor] toggle buttons
Location          text input — e.g. "left sleeve seam"
Quantity          number input, default 1
Photo             optional — camera/upload
Notes             textarea

[Add defect →]   button
```

### Connecting to defect library:

The defect library is already in `lib/qc-data/` JSON files.
Load defects by category on Step 2 category selection:

```typescript
const defectsByCategory: Record<string, string[]> = {
  garments: [
    'Seam breakage', 'Puckering', 'Skipped stitches', 'Uneven seam allowance',
    'Open seam', 'Colour shading', 'Colour bleeding', 'Fabric hole',
    'Fabric snag', 'Measurement deviation', 'Label missing', 'Label incorrect',
    'Zipper defect', 'Button missing', 'Button loose', 'Lining defect',
    // ... all 94 defects
  ],
  footwear: ['Sole delamination', 'Upper stitching defect', ...],
  gloves: ['Palm seam open', 'Finger seam weak', ...],
  headwear: ['Crown shape incorrect', 'Brim uneven', ...],
  accessories: ['Hardware defect', 'Seam open', ...],
}
```

---

## TASK 6 — STEP 6: AQL CALCULATION

**Agent:** Sub-Agent 1

### AQL engine — calculated automatically on entering this step

```typescript
const calculateAQL = (
  criticalFound: number,
  majorFound: number,
  minorFound: number,
  sampleSize: number,
  aqlLevel: string
) => {
  const limits = getAQLLimits(sampleSize, aqlLevel)

  const criticalResult = criticalFound === 0 ? 'pass' : 'fail'
  const majorResult    = majorFound <= limits.major.accept ? 'pass' : 'fail'
  const minorResult    = minorFound <= limits.minor.accept ? 'pass' : 'fail'

  const overallResult = (
    criticalResult === 'pass' &&
    majorResult    === 'pass' &&
    minorResult    === 'pass'
  ) ? 'pass' : 'fail'

  return { criticalResult, majorResult, minorResult, overallResult, limits }
}
```

### Layout: two columns

**Left card — AQL breakdown table:**
```
Lot size:          5,000 pcs
Sample size:       125 pcs
AQL level:         2.5
Inspection level:  Normal II

┌──────────┬─────────┬─────────┬────────┐
│ Severity │  Found  │ Allowed │ Result │
├──────────┼─────────┼─────────┼────────┤
│ Critical │    1    │    0    │  FAIL  │
│ Major    │    2    │   ≤7    │  PASS  │
│ Minor    │    1    │  ≤14    │  PASS  │
└──────────┴─────────┴─────────┴────────┘
```

Row colors: fail row = red bg, pass row = green bg

**Right card — Overall result + inspector decision:**

```tsx
// Pass state:
<div style={{
  textAlign: 'center',
  padding: '20px',
  background: '#E1F5EE',
  borderRadius: '10px',
  border: '1.5px solid #1D9E75',
}}>
  <div style={{ fontSize: '18px', fontWeight: 500, color: '#1D9E75' }}>
    Inspection Passed
  </div>
  <div style={{ fontSize: '11px', color: '#085041' }}>
    All defects within AQL 2.5 limits
  </div>
</div>

// Fail state:
<div style={{
  background: '#FCEBEB',
  border: '1.5px solid #E24B4A',
  // ...
}}>
  <div style={{ color: '#E24B4A' }}>Inspection Failed</div>
  <div>Reason: {failReason}</div>
</div>
```

Inspector decision:
```
Decision *    select:
              Pass — approve shipment
              Fail — reject shipment
              Fail — 100% re-inspection required
              Fail — conditional acceptance with corrective actions
              Hold — pending further review

Comments      textarea
```

---

## TASK 7 — STEP 7: REVIEW & SUBMIT

**Agent:** Sub-Agent 1

### Layout: two columns

**Left card — Full inspection summary:**
```
Inspection ID     INS-2026-0001
Date              Apr 3, 2026
Project           Summer Collection 2026
Factory           Tiger Exports Ltd.
Inspector         Naveen Kumar · Brand inspector
Category          Garments — Jackets
Sample            125 / 5,000 pcs
AQL Level         2.5 — Standard
Defects found     4 (1 critical, 2 major, 1 minor)
Result            [Failed badge]
Decision          Fail — reject shipment
```

Defect summary table:
```
Severity   Count   Status vs AQL
Critical   1       FAIL (0 allowed)
Major      2       PASS (≤7 allowed)
Minor      1       PASS (≤14 allowed)
```

**Signature zone:**
```tsx
<canvas
  ref={signatureRef}
  style={{
    border: '1.5px dashed var(--border)',
    borderRadius: '8px',
    width: '100%',
    height: '80px',
    cursor: 'crosshair',
    background: 'var(--muted)',
    touchAction: 'none',
  }}
/>
// Touch and mouse drawing — saves as base64 image
```

**Right card — Submit options:**
```
[Submit inspection →]   green, full width
[Download PDF]  [Export Excel]   side by side
[Save as draft]   outline

After submit:
• Factory notified automatically
• Brand dashboard updated
• PDF stored in project records
• AQL result recorded in project status
```

---

## TASK 8 — AI DEFECT DETECTION API

**Agent:** Sub-Agent 1
**File:** `app/api/inspections/analyse-photo/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('photo') as File
    const category = formData.get('category') as string
    const photoType = formData.get('photoType') as string
    const defectLibrary = formData.get('defectLibrary') as string
    // defectLibrary = JSON stringified list of defect names for this category

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    const client = new Anthropic()

    const systemPrompt = `You are a quality inspection expert for ${category} manufacturing.
You analyse photos of garments/products and identify visible defects.
You ONLY report defects that are clearly visible in the photo.
You match defects to the provided defect library.
Always respond with valid JSON only.`

    const userPrompt = `Analyse this ${photoType} photo of a ${category} product.
    
Available defect library for ${category}:
${defectLibrary}

Identify any visible defects. For each defect found:
- Match to the closest defect name from the library above
- Assign severity: critical (structural failure/safety), major (visible/functional issue), minor (cosmetic)
- Note the location on the garment

Return ONLY this JSON structure, no markdown:
{
  "defects": [
    {
      "name": "defect name from library",
      "severity": "critical|major|minor",
      "location": "e.g. left side seam",
      "confidence": 0.0-1.0
    }
  ],
  "overall_quality": "good|acceptable|poor",
  "notes": "brief overall observation"
}

If no defects are visible, return: {"defects": [], "overall_quality": "good", "notes": "No visible defects"}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
              data: base64,
            },
          },
          { type: 'text', text: userPrompt },
        ],
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)

    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error('Photo analysis error:', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
```

**Frontend — call after each photo capture:**
```typescript
const analysePhotoWithAI = async (
  photoIndex: number,
  file: File,
  category: string
) => {
  setAnalysing(prev => ({ ...prev, [photoIndex]: true }))

  const defectLibrary = getDefectsForCategory(category)
    .map(d => d.name).join(', ')

  const photoTypeNames = [
    'buyer approved sample',
    'production front view',
    'production back view',
    'inside lining',
  ]

  const fd = new FormData()
  fd.append('photo', file)
  fd.append('category', category)
  fd.append('photoType', photoTypeNames[photoIndex])
  fd.append('defectLibrary', defectLibrary)

  try {
    const res = await fetch('/api/inspections/analyse-photo', {
      method: 'POST',
      body: fd,
    })
    const { data } = await res.json()

    if (data?.defects?.length > 0) {
      setAIDefects(prev => ({
        ...prev,
        [photoIndex]: data.defects,
      }))
    }
  } catch (err) {
    console.error('AI analysis failed silently:', err)
    // Never show error to user — AI is optional enhancement
  } finally {
    setAnalysing(prev => ({ ...prev, [photoIndex]: false }))
  }
}
```

---

## TASK 9 — INSPECTIONS LIST PAGE

**Agent:** Sub-Agent 2
**File:** `app/(dashboard)/inspections/page.tsx`

### Page header:
```
[Inspections]                              [+ New inspection]
[X inspections · Y passed · Z failed]
```

### Filter tabs:
```
[All] [Draft] [In progress] [Passed] [Failed] [Submitted]
```

### Inspection card (list view — not grid):

```
INS-2026-0001   Summer Collection 2026           [Failed badge]
Apr 3, 2026     Tiger Exports Ltd. · 125/5,000   AQL 2.5
Naveen Kumar    4 defects: 1 critical, 2 major   [View] [PDF]
```

Each row: click → view inspection detail page
"+ New inspection" → `/inspections/new`

---

## RESPONSIVE RULES

Every step must work on both desktop and mobile:

```css
/* Two column on desktop */
.inspection-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 14px;
}

/* Photo grid */
.photo-grid-2x2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

/* Mobile — single column */
@media (max-width: 600px) {
  .photo-grid-2x2 {
    grid-template-columns: 1fr;
  }
}

/* All inputs 44px minimum height on mobile for tap targets */
@media (max-width: 600px) {
  button, input, select {
    min-height: 44px;
  }
  .yn-btn {
    height: 44px;
    font-size: 14px;
  }
}
```

---

## FORM STATE

```typescript
const [inspection, setInspection] = useState({
  // Step 1
  projectId: '', factoryId: '', factoryName: '',
  inspectorName: '', inspectorType: 'brand_inspector',
  inspectorContact: '', inspectionDate: '', inspectionType: 'final',
  // Step 2
  category: '', productType: '', styleRef: '', colour: '',
  aqlLevel: '2.5', lotSize: 0, sampleSize: 125,
  inspectionLevel: 'normal_2', selectedSections: [0,1,2,3,4],
  // Step 3
  photos: [
    { name: 'Buyer approved sample', url: '', captured: false },
    { name: 'Production — front view', url: '', captured: false },
    { name: 'Production — back view', url: '', captured: false },
    { name: 'Inside lining', url: '', captured: false },
  ],
  // Step 4
  checklistItems: [] as ChecklistItem[],
  // Step 5
  defects: [] as Defect[],
  // Step 6
  aqlResult: 'pending' as 'pass' | 'fail' | 'pending',
  inspectorDecision: '', inspectorComments: '',
  // Step 7
  inspectorSignature: '',
  status: 'draft' as string,
})
```

---

## SUBMIT ACTION

```typescript
const handleSubmit = async () => {
  setSubmitting(true)
  try {
    // 1. Calculate final AQL
    const aql = calculateAQL(
      defectCounts.critical, defectCounts.major, defectCounts.minor,
      inspection.sampleSize, inspection.aqlLevel
    )

    // 2. Save inspection record
    const { data: saved } = await supabase
      .from('inspections')
      .upsert({
        ...inspectionData,
        critical_found: defectCounts.critical,
        major_found:    defectCounts.major,
        minor_found:    defectCounts.minor,
        critical_allowed: 0,
        major_allowed:    aql.limits.major.accept,
        minor_allowed:    aql.limits.minor.accept,
        aql_result:       aql.overallResult,
        status:           'submitted',
        submitted_at:     new Date().toISOString(),
      })
      .select().single()

    // 3. Save checklist items
    await supabase.from('inspection_checklist_items')
      .insert(checklistItems.map(item => ({
        inspection_id: saved.id,
        section: item.section,
        item_number: item.number,
        question: item.question,
        result: item.result,
        photo_url: item.photoUrl,
        notes: item.notes,
      })))

    // 4. Save defects
    await supabase.from('inspection_defects')
      .insert(defects.map(d => ({
        inspection_id: saved.id,
        defect_name: d.name,
        severity: d.severity,
        location: d.location,
        source: d.source,
        photo_url: d.photoUrl,
        quantity: d.quantity,
        notes: d.notes,
      })))

    // 5. Update project status
    await supabase.from('projects')
      .update({
        status: aql.overallResult === 'pass' ? 'audited' : 'under_review',
        audit_score: calculateOverallScore(defectCounts, inspection.sampleSize),
      })
      .eq('id', inspection.projectId)

    // 6. Create notifications
    await createNotification({
      organizationId: orgId,
      eventType: aql.overallResult === 'pass' ? 'inspection_passed' : 'inspection_failed',
      soundCategory: aql.overallResult === 'pass' ? 'inspection_pass' : 'inspection_fail',
      title: `Inspection ${aql.overallResult === 'pass' ? 'passed' : 'failed'}`,
      detail: `${saved.inspection_number} · ${inspection.factoryName}`,
      link: `/inspections/${saved.id}`,
      isCritical: aql.overallResult === 'fail',
    })

    router.push(`/inspections/${saved.id}`)
  } catch (err: any) {
    setError(err.message)
  } finally {
    setSubmitting(false)
  }
}
```

---

## PDF REPORT GENERATION

**File:** `lib/export/inspectionPdf.ts`

```typescript
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportInspectionPDF(inspection: any, defects: any[]): void {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(18); doc.setTextColor('#BA7517')
  doc.text('SankalpHub', 14, 18)
  doc.setFontSize(9); doc.setTextColor('#999')
  doc.text('Inspection Report', 14, 25)

  // Result banner
  const resultColor = inspection.aql_result === 'pass' ? '#1D9E75' : '#E24B4A'
  doc.setFontSize(16); doc.setTextColor(resultColor)
  doc.text(
    inspection.aql_result === 'pass' ? '✓ PASSED' : '✗ FAILED',
    14, 40
  )

  // Inspection details
  autoTable(doc, {
    startY: 48,
    head: [['Field', 'Details']],
    body: [
      ['Inspection ID', inspection.inspection_number],
      ['Date', inspection.inspection_date],
      ['Project', inspection.project_name],
      ['Factory', inspection.factory_name],
      ['Inspector', `${inspection.inspector_name} · ${inspection.inspector_type}`],
      ['Category', inspection.category],
      ['Sample size', `${inspection.sample_size} / ${inspection.lot_size} pcs`],
      ['AQL Level', inspection.aql_level],
      ['Result', inspection.aql_result?.toUpperCase()],
      ['Decision', inspection.inspector_decision],
    ],
    headStyles: { fillColor: [186, 117, 23] },
  })

  // AQL summary
  const y = (doc as any).lastAutoTable.finalY + 10
  autoTable(doc, {
    startY: y,
    head: [['Severity', 'Found', 'Allowed', 'Result']],
    body: [
      ['Critical', inspection.critical_found, '0',
        inspection.critical_found === 0 ? 'PASS' : 'FAIL'],
      ['Major', inspection.major_found, `≤${inspection.major_allowed}`,
        inspection.major_found <= inspection.major_allowed ? 'PASS' : 'FAIL'],
      ['Minor', inspection.minor_found, `≤${inspection.minor_allowed}`,
        inspection.minor_found <= inspection.minor_allowed ? 'PASS' : 'FAIL'],
    ],
    headStyles: { fillColor: [186, 117, 23] },
  })

  // Defect list
  if (defects.length > 0) {
    const y2 = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(12); doc.setTextColor('#111')
    doc.text('Defect Details', 14, y2)
    autoTable(doc, {
      startY: y2 + 6,
      head: [['Defect Name', 'Severity', 'Location', 'Source', 'Qty']],
      body: defects.map(d => [
        d.defect_name, d.severity, d.location || '—',
        d.source, d.quantity,
      ]),
      headStyles: { fillColor: [186, 117, 23] },
    })
  }

  // Comments
  if (inspection.inspector_comments) {
    const y3 = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(10); doc.setTextColor('#333')
    doc.text('Inspector Comments', 14, y3)
    doc.setFontSize(9); doc.setTextColor('#666')
    doc.text(inspection.inspector_comments, 14, y3 + 7, { maxWidth: 180 })
  }

  // Footer
  doc.setFontSize(7); doc.setTextColor('#bbb')
  doc.text('Generated by SankalpHub — sankalphub.in', 14, 285)

  doc.save(`${inspection.inspection_number}-report.pdf`)
}
```

---

## BUILD & DEPLOY

```bash
cd /var/www/Master_Sankalphub/V3.0_Frontend

npm install jspdf jspdf-autotable 2>/dev/null || true

npm run build 2>&1 | tail -30

if [ $? -eq 0 ]; then
  git add -A
  git commit -m "feat: inspection module — 7-step wizard, AI defect detection, AQL engine, PDF report"
  git push origin main
  echo "DEPLOYED"
else
  echo "BUILD FAILED"
  npm run build 2>&1 | grep -E "Error|error|×" | head -20
fi
```

---

## FINAL VERIFICATION CHECKLIST

**Step 1:**
- [ ] Project dropdown loads org projects
- [ ] Selecting project auto-fills factory, category, AQL
- [ ] Completion checklist turns green as fields filled
- [ ] Next locked until all 4 completion items green

**Step 2:**
- [ ] Category select works
- [ ] Sample size auto-calculates from lot size + AQL level
- [ ] AQL summary shows live: "AQL 2.5 · 125 pcs · Major ≤7 · Minor ≤14"
- [ ] Checklist sections toggleable (click to include/exclude)

**Step 3 (Photos):**
- [ ] 2×2 grid on desktop, 1 column on mobile
- [ ] Each card: capture button, guidelines, AI notice
- [ ] After capture: green border, retake/delete, AI analysis panel
- [ ] AI detects defects from defect library — Add/Skip per defect
- [ ] Next locked until all 4 captured

**Step 4 (Checklist):**
- [ ] Correct checklist loaded for selected category
- [ ] Items show in sections
- [ ] Yes/No buttons work per item
- [ ] "No" prompts defect log
- [ ] Each item can have a photo
- [ ] Section completion tracked
- [ ] Next unlocks only when all sections complete

**Step 5 (Defects):**
- [ ] AI suggestions from Step 3 photos pre-loaded
- [ ] Manual defect add from defect library
- [ ] Severity counter updates live
- [ ] AQL limit warnings show when exceeded
- [ ] Defects editable and deletable

**Step 6 (AQL):**
- [ ] AQL auto-calculated from defect counts
- [ ] Pass/Fail determined correctly
- [ ] Critical = 0 allowed always
- [ ] Inspector decision required

**Step 7 (Submit):**
- [ ] Full summary shown
- [ ] Signature canvas works (touch + mouse)
- [ ] Submit saves all data to Supabase
- [ ] Project status updated (audited/under_review)
- [ ] Notification fired (pass/fail sound triggered)
- [ ] PDF exports with all data
- [ ] Redirect to inspection detail page

**Responsive:**
- [ ] All steps work on mobile
- [ ] No horizontal scrolling
- [ ] Touch targets ≥ 44px
- [ ] Photos capture works on mobile (file input with camera)

---

*SankalpHub V3 — Inspection Module*
*7-step wizard · AI defect detection · AQL engine · PDF report*
*Responsive — desktop and mobile*
*April 3, 2026*
