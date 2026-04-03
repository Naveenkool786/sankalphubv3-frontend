# SankalpHub — Factories Board + Factory Audit Module Brief (V3 Frontend)
**For: Claude Code + Sub-Agents**
**Date:** April 2, 2026
**Scope:** Two modules — Factories board redesign + new Factory Audit module
**Mode:** Extend existing factories page + add new audit module. Do NOT touch projects module.

> ⚠️ **WORKING DIRECTORY: V3 Frontend ONLY**
> All work is in `/var/www/Master_Sankalphub/V3.0_Frontend/`
> Always use `org_id` (NOT organization_id) in all Supabase queries
> Email is in `auth.users` — NOT in profiles table

---

## OVERVIEW

| Module | Route | What changes |
|---|---|---|
| Factories board | `/factories` | Redesign cards — photo, audit score, utilisation, certifications, status filters |
| Factory audit | `/audits/factory/new` | Brand new module — audit template, live scoring, score published to factory + brand |

---

## TASK ASSIGNMENT

| Task | Agent | Description |
|---|---|---|
| Task 1 | Sub-Agent 1 | Supabase schema updates + storage buckets |
| Task 2 | Sub-Agent 2 | Factories board redesign |
| Task 3 | Sub-Agent 2 | Factory audit template page |
| Task 4 | Sub-Agent 1 | Wire audit score back to factory card + sidebar nav |

---

## TASK 1 — SUPABASE SCHEMA + STORAGE

**Agent:** Sub-Agent 1

Run in Supabase SQL Editor:

```sql
-- ─── FACTORIES TABLE — add new columns ─────────────────────────
ALTER TABLE factories
  ADD COLUMN IF NOT EXISTS photo_url              TEXT,
  ADD COLUMN IF NOT EXISTS latest_audit_score     INTEGER,
  ADD COLUMN IF NOT EXISTS latest_audit_date      DATE,
  ADD COLUMN IF NOT EXISTS latest_audit_result    TEXT,
  ADD COLUMN IF NOT EXISTS status                 TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS utilisation_pct        INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_lines            INTEGER DEFAULT 4,
  ADD COLUMN IF NOT EXISTS active_lines           INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pass_rate              INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS certifications         TEXT[] DEFAULT '{}';

-- status values: active | at_capacity | under_review | inactive

-- ─── FACTORY AUDITS TABLE — new table ──────────────────────────
CREATE TABLE IF NOT EXISTS factory_audits (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID REFERENCES organizations(id) ON DELETE CASCADE,
  factory_id          UUID REFERENCES factories(id) ON DELETE CASCADE,
  audited_by          UUID REFERENCES auth.users(id),
  auditor_name        TEXT NOT NULL,
  auditor_type        TEXT NOT NULL DEFAULT 'brand_inspector',
  -- auditor_type: brand_inspector | third_party | internal_qc
  audit_type          TEXT NOT NULL DEFAULT 'initial',
  -- audit_type: initial | follow_up | annual
  audit_date          DATE NOT NULL,

  -- Section scores
  score_legal         INTEGER DEFAULT 0 CHECK (score_legal BETWEEN 0 AND 20),
  score_safety        INTEGER DEFAULT 0 CHECK (score_safety BETWEEN 0 AND 20),
  score_conditions    INTEGER DEFAULT 0 CHECK (score_conditions BETWEEN 0 AND 20),
  score_capacity      INTEGER DEFAULT 0 CHECK (score_capacity BETWEEN 0 AND 15),
  score_quality       INTEGER DEFAULT 0 CHECK (score_quality BETWEEN 0 AND 15),
  score_environment   INTEGER DEFAULT 0 CHECK (score_environment BETWEEN 0 AND 10),

  -- Auto-calculated total (max 100)
  total_score         INTEGER GENERATED ALWAYS AS (
    score_legal + score_safety + score_conditions +
    score_capacity + score_quality + score_environment
  ) STORED,

  -- Auto-calculated result
  result              TEXT GENERATED ALWAYS AS (
    CASE
      WHEN (score_legal + score_safety + score_conditions +
            score_capacity + score_quality + score_environment) >= 75
      THEN 'approved'
      WHEN (score_legal + score_safety + score_conditions +
            score_capacity + score_quality + score_environment) >= 50
      THEN 'conditional'
      ELSE 'failed'
    END
  ) STORED,

  report_url          TEXT,
  key_findings        TEXT,
  corrective_actions  TEXT,
  next_audit_due      DATE,
  status              TEXT DEFAULT 'draft',
  -- status: draft | submitted
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE factory_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_factory_audits" ON factory_audits FOR ALL
USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "super_admin_factory_audits" ON factory_audits FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
));

-- ─── STORAGE BUCKETS ──────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('factory-photos', 'factory-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('audit-reports', 'audit-reports', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY IF NOT EXISTS "factory_photos_upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'factory-photos');

CREATE POLICY IF NOT EXISTS "factory_photos_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'factory-photos');
```

### Acceptance Criteria — Task 1
- [ ] `factories` table has all new columns
- [ ] `factory_audits` table created with generated columns `total_score` and `result`
- [ ] Storage buckets `factory-photos` and `audit-reports` exist
- [ ] RLS policies created

---

## TASK 2 — FACTORIES BOARD REDESIGN

**Agent:** Sub-Agent 2
**File:** `app/(dashboard)/factories/page.tsx`

---

### Page header
```
[Factories]                                        [+ Add factory]
[X factories · Y active · Z at capacity · W under review]
```

### Filter tabs
```
[All] [Active] [At capacity] [Under review] [Audited] [Inactive]
```

Search input: `placeholder="Search factories..."` — font-size 9px

---

### Card grid — 3 columns, gap 12px

---

### Factory card structure (top → bottom)

**1. Image area — 120px height:**
```tsx
{factory.photo_url ? (
  // Shows actual photo
  <div style={{ position: 'relative', height: '120px', overflow: 'hidden' }}>
    <img src={factory.photo_url}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    // Hover overlay
    <div className="photo-overlay">
      <button>Change photo</button>
    </div>
  </div>
) : (
  // Upload placeholder
  <div onClick={() => handlePhotoUpload(factory.id)}
    style={{ height: '120px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '6px',
      background: 'var(--muted)', cursor: 'pointer' }}>
    <svg ...factory building icon... />
    <span style={{ fontSize: '10px' }}>Click to upload photo</span>
  </div>
)}
```

**Status pill — positioned top-left of image:**
```typescript
const statusConfig = {
  active:       { bg: '#E1F5EE', color: '#085041', label: 'Active' },
  at_capacity:  { bg: '#FCEBEB', color: '#791F1F', label: 'At capacity' },
  under_review: { bg: '#EEEDFE', color: '#3C3489', label: 'Under review' },
  inactive:     { bg: 'var(--muted)', color: 'var(--muted-foreground)', label: 'Inactive' },
}
```

**"..." menu — top-right of image:**
```
View factory
Edit factory
Change photo / Upload photo
New audit           ← goes to /audits/factory/new?factoryId=XXX
View audit history  ← goes to /audits/factory?factoryId=XXX
────────────
Assign to project
────────────
Deactivate (red text)

// For under_review factories — replace New audit with:
Schedule re-audit
Mark as active (purple text)
```

**Left border color by status:**
```typescript
const borderColor = {
  active:       '#1D9E75',
  at_capacity:  '#E24B4A',
  under_review: '#534AB7',
  inactive:     '#888780',
}
// Applied as: borderLeft: `3px solid ${borderColor[factory.status]}`
// borderRadius: '0 10px 10px 0'
```

---

**2. Card body (padding 10px 12px 12px):**

**Factory name:** 13px, font-weight 500, truncated

**Category badges:** small gray badges

**Audit score row:**
```tsx
<div style={{
  display: 'flex', alignItems: 'center',
  justifyContent: 'space-between',
  padding: '5px 8px', borderRadius: '6px',
  marginBottom: '6px',
  background: factory.latest_audit_result === 'failed'
    ? '#FCEBEB' : 'var(--muted)',
}}>
  <div>
    <div style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>
      Factory audit score
    </div>
    <div style={{ fontSize: '9px', color: 'var(--muted-foreground)' }}>
      {factory.latest_audit_date} · {auditorType}
    </div>
  </div>
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <span style={{
      fontSize: '14px', fontWeight: 500,
      color: factory.latest_audit_score >= 75 ? '#085041'
           : factory.latest_audit_score >= 50 ? '#BA7517' : '#E24B4A',
    }}>
      {factory.latest_audit_score}%
    </span>
    <span style={{
      fontSize: '9px', padding: '2px 6px', borderRadius: '5px',
      fontWeight: 500,
      background: factory.latest_audit_score >= 75 ? '#E1F5EE'
               : factory.latest_audit_score >= 50 ? '#FAEEDA' : '#FCEBEB',
      color: factory.latest_audit_score >= 75 ? '#085041'
           : factory.latest_audit_score >= 50 ? '#633806' : '#791F1F',
    }}>
      {factory.latest_audit_result === 'approved' ? 'Approved'
     : factory.latest_audit_result === 'conditional' ? 'Conditional'
     : 'Failed'}
    </span>
  </div>
</div>

// No audit yet:
{!factory.latest_audit_score && (
  <div style={{ padding: '5px 8px', background: 'var(--muted)',
    borderRadius: '6px', fontSize: '10px',
    color: 'var(--muted-foreground)', marginBottom: '6px' }}>
    No audit yet — <span style={{ color: '#BA7517', cursor: 'pointer' }}>
      Schedule audit →
    </span>
  </div>
)}

// Failed audit — extra banner:
{factory.latest_audit_result === 'failed' && (
  <div style={{ padding: '5px 8px', background: '#FCEBEB',
    borderRadius: '6px', fontSize: '10px', color: '#791F1F',
    marginBottom: '6px' }}>
    Re-audit required — no new orders until passed
  </div>
)}
```

**Utilisation bar:**
```tsx
const utilColor = (pct: number) =>
  pct >= 100 ? '#E24B4A' : pct >= 80 ? '#BA7517' : '#1D9E75'

<div style={{ display: 'flex', justifyContent: 'space-between',
  fontSize: '10px', color: 'var(--muted-foreground)', marginBottom: '3px' }}>
  <span>Utilisation</span>
  <span style={{ color: pct >= 100 ? '#E24B4A' : 'inherit' }}>
    {factory.active_lines}/{factory.total_lines} lines
    {pct >= 100 ? ' — Full' : ''}
  </span>
</div>
<div style={{ height: '3px', background: 'var(--muted)',
  borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
  <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%',
    background: utilColor(pct), borderRadius: '2px' }} />
</div>
```

**KPI row — 3 equal boxes:**
```tsx
<div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
  {[
    { val: factory.active_orders || 0, label: 'Active orders' },
    { val: `${factory.pass_rate || 0}%`, label: 'Pass rate',
      color: (factory.pass_rate || 0) >= 90 ? '#1D9E75' : '#BA7517' },
    { val: factory.total_lines || 0, label: 'Lines' },
  ].map((kpi, i) => (
    <div key={i} style={{ flex: 1, textAlign: 'center', padding: '5px',
      background: 'var(--muted)', borderRadius: '6px' }}>
      <div style={{ fontSize: '14px', fontWeight: 500,
        color: kpi.color || 'var(--foreground)' }}>
        {kpi.val}
      </div>
      <div style={{ fontSize: '9px', color: 'var(--muted-foreground)' }}>
        {kpi.label}
      </div>
    </div>
  ))}
</div>
```

**Certifications:**
```tsx
<div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap',
  marginBottom: '8px' }}>
  {(factory.certifications || []).map(cert => (
    <span key={cert} style={{ fontSize: '9px', padding: '2px 6px',
      borderRadius: '5px', background: 'var(--muted)',
      color: 'var(--muted-foreground)' }}>
      {cert}
    </span>
  ))}
</div>
```

**Card footer (border-top):**
```
📍 City, Country          X,XXX pcs active
```

---

### Photo upload handler
```typescript
const handlePhotoUpload = async (factoryId: string, file?: File) => {
  const input = file ? null : document.createElement('input')
  if (input) {
    input.type = 'file'
    input.accept = 'image/*'
    input.click()
    input.onchange = async (e) => {
      const f = (e.target as HTMLInputElement).files?.[0]
      if (f) await uploadPhoto(factoryId, f)
    }
    return
  }
  if (file) await uploadPhoto(factoryId, file)
}

const uploadPhoto = async (factoryId: string, file: File) => {
  const { data } = await supabase.storage
    .from('factory-photos')
    .upload(`${orgId}/${factoryId}/photo.jpg`, file, { upsert: true })
  const url = supabase.storage.from('factory-photos')
    .getPublicUrl(data!.path).data.publicUrl
  await supabase.from('factories')
    .update({ photo_url: url }).eq('id', factoryId)
  refetchFactories()
}
```

### Acceptance Criteria — Task 2
- [ ] 3-column card grid loads with all org factories
- [ ] Photo area 120px: shows photo or upload placeholder
- [ ] Click placeholder → file picker → photo appears immediately
- [ ] Hover on photo → "Change photo" overlay visible
- [ ] Status pill correct color per status
- [ ] Left border color matches status
- [ ] Audit score row: score %, result badge, date, inspector type
- [ ] No audit yet → "No audit yet · Schedule audit →" link
- [ ] Failed audit → red re-audit banner
- [ ] Utilisation bar: green <80%, amber 80-99%, red 100%
- [ ] "Full" label shown when 100% utilised
- [ ] KPI boxes: active orders, pass rate (colored), lines
- [ ] Certifications shown as small badges
- [ ] Filter tabs: All / Active / At capacity / Under review / Audited / Inactive
- [ ] "..." menu works — all options navigate/function correctly

---

## TASK 3 — FACTORY AUDIT TEMPLATE

**Agent:** Sub-Agent 2
**File:** `app/(dashboard)/audits/factory/new/page.tsx`

---

### Page header
```
[← Factories]
Factory audit
Step-by-step audit of a manufacturing facility
```

### Layout — 3 stacked cards

---

### Card 1 — Audit details

```
Factory *           select (from org's factories)
                    pre-populate if ?factoryId= in URL

Audit date *        date input

Inspector name *    text input, placeholder "Full name"

Inspector type      select
                    [Brand inspector] [Third-party agency] [Internal QC]

Audit type          3-button toggle
                    [Initial audit] [Follow-up] [Annual re-audit]
                    Selected state: bg #FAEEDA, color #633806, border #C9A96E
                    Default selected: Initial audit
```

---

### Card 2 — Section scores

Title: "Section scores"
Subtitle: "Score each section — total is calculated automatically"

**6 section rows:**

| Section | Max points | Subtitle |
|---|---|---|
| Legal & compliance | 20 | Licenses, permits, certifications |
| Health & safety | 20 | Fire exits, PPE, emergency procedures |
| Working conditions | 20 | Hours, wages, worker welfare |
| Production capacity | 15 | Lines, equipment, output capability |
| Quality systems | 15 | QC processes, defect tracking |
| Environmental | 10 | Waste management, water, emissions |

**Each row layout:**
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '12px',
  padding: '8px 10px', background: 'var(--muted)',
  borderRadius: '7px', marginBottom: '6px' }}>
  
  {/* Left: name + progress bar */}
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: '12px', fontWeight: 500,
      color: 'var(--foreground)', marginBottom: '2px' }}>
      Legal & compliance
    </div>
    <div style={{ fontSize: '9px', color: 'var(--muted-foreground)',
      marginBottom: '4px' }}>
      Licenses, permits, certifications
    </div>
    <div style={{ height: '4px', background: 'var(--border)',
      borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{
        width: `${(scores.legal / 20) * 100}%`,
        height: '100%', borderRadius: '2px',
        background: (scores.legal / 20) >= 0.75 ? '#1D9E75'
                  : (scores.legal / 20) >= 0.50 ? '#BA7517' : '#E24B4A',
        transition: 'width .3s, background .3s',
      }} />
    </div>
  </div>

  {/* Right: number input + max */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '4px',
    flexShrink: 0 }}>
    <input
      type="number" min={0} max={20}
      value={scores.legal}
      onChange={e => setScores(prev => ({
        ...prev, legal: Math.min(20, Math.max(0, parseInt(e.target.value) || 0))
      }))}
      style={{ width: '52px', height: '32px', textAlign: 'center',
        borderRadius: '6px', border: '0.5px solid var(--border)',
        fontSize: '13px', fontWeight: 500, background: 'var(--background)' }}
    />
    <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>
      /20
    </span>
  </div>
</div>
```

**Total score box (below all 6 sections):**
```typescript
// Reactive — updates as user types
const totalScore = scores.legal + scores.safety + scores.conditions +
                   scores.capacity + scores.quality + scores.environment

const result = totalScore >= 75 ? 'approved'
             : totalScore >= 50 ? 'conditional'
             : 'failed'

const resultConfig = {
  approved: {
    bg: '#E1F5EE', border: '#1D9E75', color: '#085041',
    label: 'Approved — factory meets requirements',
  },
  conditional: {
    bg: '#FAEEDA', border: '#C9A96E', color: '#633806',
    label: 'Conditional — improvements required before next order',
  },
  failed: {
    bg: '#FCEBEB', border: '#E24B4A', color: '#791F1F',
    label: 'Failed — re-audit required before any orders',
  },
}
```

Display:
```tsx
<div style={{
  display: 'flex', alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 14px', borderRadius: '8px',
  border: `1.5px solid ${resultConfig[result].border}`,
  background: resultConfig[result].bg,
  marginTop: '10px',
}}>
  <div>
    <div style={{ fontSize: '11px', fontWeight: 500,
      color: resultConfig[result].color }}>
      Total audit score
    </div>
    <div style={{ fontSize: '10px', color: resultConfig[result].color,
      opacity: 0.8 }}>
      {resultConfig[result].label}
    </div>
  </div>
  <div style={{ fontSize: '28px', fontWeight: 500,
    color: resultConfig[result].color }}>
    {totalScore}%
  </div>
</div>
```

---

### Card 3 — Report upload + findings

```
Upload audit report PDF
  → drag & drop zone
  → Accepts PDF only, max 20MB
  → Stored: audit-reports/{auditId}/report.pdf
  → Shows filename after upload

Key findings          textarea, placeholder "Summary of key observations..."
Corrective actions    textarea, placeholder "List improvements required..."
Next audit due        date input

[Save draft]    [Submit audit → publish score →]
```

**Submit logic:**
```typescript
const handleSubmit = async () => {
  setSubmitting(true)

  // 1. Save audit record
  const { data: audit, error } = await supabase
    .from('factory_audits')
    .insert({
      org_id: orgId,
      factory_id: formData.factoryId,
      audited_by: user.id,
      auditor_name: formData.auditorName,
      auditor_type: formData.auditorType,
      audit_type: formData.auditType,
      audit_date: formData.auditDate,
      score_legal: scores.legal,
      score_safety: scores.safety,
      score_conditions: scores.conditions,
      score_capacity: scores.capacity,
      score_quality: scores.quality,
      score_environment: scores.environment,
      key_findings: formData.keyFindings,
      corrective_actions: formData.correctiveActions,
      next_audit_due: formData.nextAuditDue,
      status: 'submitted',
    })
    .select().single()

  if (error) { setError(error.message); setSubmitting(false); return }

  // 2. Upload PDF report if provided
  if (pdfFile) {
    const { data: fileData } = await supabase.storage
      .from('audit-reports')
      .upload(`${audit.id}/report.pdf`, pdfFile, { upsert: true })
    if (fileData) {
      await supabase.from('factory_audits')
        .update({ report_url: fileData.path })
        .eq('id', audit.id)
    }
  }

  // 3. Update factory's latest audit score — THIS IS CRITICAL
  // Factory card must show new score immediately
  await supabase.from('factories')
    .update({
      latest_audit_score: audit.total_score,
      latest_audit_date:  audit.audit_date,
      latest_audit_result: audit.result,
      // Auto set to under_review if failed
      ...(audit.result === 'failed' ? { status: 'under_review' } : {}),
    })
    .eq('id', formData.factoryId)

  // 4. Navigate back to factories board
  router.push('/factories')
}
```

---

### Acceptance Criteria — Task 3
- [ ] Page loads at `/audits/factory/new`
- [ ] URL param `?factoryId=` pre-selects factory in dropdown
- [ ] Section score inputs clamp between 0 and max
- [ ] Progress bars update live as scores are typed
- [ ] Bar colors: ≥75% section → green, 50-74% → amber, <50% → red
- [ ] Total score calculates reactively
- [ ] Result badge changes live: Approved / Conditional / Failed
- [ ] Total score box bg/border/text color all change with result
- [ ] PDF uploads to `audit-reports` bucket
- [ ] Submit saves to `factory_audits` table
- [ ] Submit updates `factories.latest_audit_score`
- [ ] Failed audit sets `factories.status = 'under_review'`
- [ ] After submit → redirects to `/factories`
- [ ] Factory card on board shows updated score immediately

---

## TASK 4 — NAVIGATION + WIRE AUDIT SCORE TO FACTORY CARD

**Agent:** Sub-Agent 1

### Step 1 — Add to sidebar navigation

Find the sidebar component:
```bash
find . -name "*.tsx" | xargs grep -l "sidebar\|Sidebar\|nav.*item\|NavItem" \
  | grep -v node_modules | grep -v .next | head -5
```

Add Factory Audits link under Factories:
```tsx
// Option A — as a sub-item under Factories
{ label: 'Factories', href: '/factories', icon: BuildingIcon },
{ label: 'Factory Audits', href: '/audits/factory', icon: ClipboardCheckIcon,
  indent: true },  // indented sub-item

// Option B — as a tab on the factories page header
// Add [Factories] [Audit history] tab switcher at top of /factories page
```

Use whichever approach matches the existing sidebar structure.

Add "+ New audit" button on the factories page header area:
```tsx
<button onClick={() => router.push('/audits/factory/new')}>
  + New audit
</button>
```

### Step 2 — Audit history page

**File:** `app/(dashboard)/audits/factory/page.tsx`

Simple list of all factory audits for the org:

```
[Filter by factory: All factories ▾]   [+ New audit]

List rows:
Factory name · Audit type · Date · Inspector · Score% · Result badge · [View report PDF]
```

Sort by date descending. Each row links to the audit detail.

### Step 3 — "New audit" quick link from factory card

The "..." menu on each factory card has "New audit" option:
```typescript
// Navigate with factory pre-selected
router.push(`/audits/factory/new?factoryId=${factory.id}`)
```

### Step 4 — Brand dashboard audit widget

On the main `/dashboard` page, add a small "Factory audit scores" widget showing all factories with their latest audit score:

```tsx
// Small widget — shows top 4 factories by audit score
// Factory name | Score% | Result badge
// Link: "View all factory audits →"
```

### Acceptance Criteria — Task 4
- [ ] Sidebar has Factory Audits navigation link
- [ ] "New audit" button on /factories page navigates correctly
- [ ] Factory card "..." menu "New audit" passes factoryId in URL
- [ ] Audit template pre-selects factory when factoryId in URL
- [ ] Audit history page at `/audits/factory` shows all past audits
- [ ] Dashboard shows factory audit scores widget

---

## BUILD & DEPLOY

```bash
cd /var/www/Master_Sankalphub/V3.0_Frontend

npm run build 2>&1 | tail -30

if [ $? -eq 0 ]; then
  git add -A
  git commit -m "feat: factories board redesign + factory audit module — photo cards, audit scores, live scoring template, score published to factory and brand"
  git push origin main
  echo "DEPLOYED SUCCESSFULLY"
else
  echo "BUILD FAILED — do not push"
  npm run build 2>&1 | grep -E "Error|error|×" | head -20
fi
```

---

## FINAL VERIFICATION CHECKLIST

**Factories board `/factories`:**
- [ ] 3-column card grid loads
- [ ] Factory photo 120px — shows photo or upload placeholder
- [ ] Click placeholder → file picker → photo appears immediately
- [ ] Hover → "Change photo" overlay
- [ ] Status pill: Active (green) / At capacity (red) / Under review (purple) / Inactive (gray)
- [ ] Left border matches status color
- [ ] Audit score row with score%, result badge, date, type
- [ ] No audit yet → "No audit yet — Schedule audit →"
- [ ] Failed → red re-audit banner
- [ ] Utilisation bar green/amber/red
- [ ] KPI row: orders, pass rate, lines
- [ ] Certifications badges
- [ ] Filter tabs work correctly

**Factory audit template `/audits/factory/new`:**
- [ ] All 6 section inputs work
- [ ] Progress bars animate as values typed
- [ ] Bar colors change green/amber/red per section score
- [ ] Total score updates live
- [ ] Result badge (Approved/Conditional/Failed) updates live
- [ ] Box background changes with result
- [ ] PDF uploads to storage
- [ ] Submit → saves audit → updates factory score → redirects to /factories
- [ ] Factory card shows updated score immediately

**Navigation:**
- [ ] Sidebar has Factory Audits link
- [ ] "+ New audit" button visible on factories page
- [ ] "New audit" from card "..." menu pre-selects factory

---

*SankalpHub V3 — Factories Board + Factory Audit Module*
*4 tasks · 2 sub-agents*
*April 2, 2026*
