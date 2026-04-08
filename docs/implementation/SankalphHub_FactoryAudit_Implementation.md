# SankalphHub — Factory Audit System Implementation
## Claude Code Implementation Prompt

## CONTEXT
SankalphHub (www.sankalphub.in) — Fashion Manufacturing platform. Stack: Next.js 16 (App Router), TypeScript 5, React 19, Supabase (Postgres, Auth, Storage, Realtime), Tailwind CSS 4, shadcn/ui, Radix UI, react-hook-form + Zod, Recharts, Sonner, date-fns, jsPDF, xlsx. Deployed on Vercel.

Brand tokens: GOLD=#D4A843, DARK=#1A1A2E, WHITE=#FFFFFF, RED=#CC0000, GREEN=#2E7D32, GREY=#666666, BLUE=#1565C0

Roles: Super Admin > Brand Manager > Factory Manager > Inspector > Viewer

**THIS IS A STANDALONE MODULE** that can be built independently. It replaces/enhances the basic factory_audits table in Step 17 with a full-featured audit system based on the real RefrigiWear Factory Audit Form v1.0.

---

## WHAT TO BUILD

A complete Factory Audit System using the G / Y / R / N/A rating methodology from the RefrigiWear audit Excel files. The system has 21 checkpoints across 3 sections, with real-time score calculation, photo documentation, corrective action tracking, configurable templates (WRAP-aligned), and PDF report generation.

---

## 1. THE RATING SYSTEM (CRITICAL — MUST MATCH EXACTLY)

This is the core of the system. Taken directly from the RefrigiWear Excel audits:

| Rating | Color | Code | Definition |
|--------|-------|------|-----------|
| **G** | Green (#2E7D32) | `green` | No nonconformances identified. Fully compliant. |
| **Y** | Yellow (#F59E0B) | `yellow` | Overall being followed — isolated instance/minor oversight observed and corrected immediately. |
| **R** | Red (#CC0000) | `red` | Nonconformance identified. Corrective action required. **Notes MANDATORY.** |
| **N/A** | Grey (#666666) | `na` | Not applicable to process being audited. **Excluded from score calculation.** |

### Scoring Formula (from Excel cell L8/L39):
```
Score = (G count + Y count) / (Total items − N/A count) × 100%

Where:
  Items OK = G count + Y count
  Applicable Items = G + Y + R (excludes N/A)
  Actions Required = R count
```

### Score Thresholds & Verdicts:
| Score | Verdict | Color | Business Decision |
|-------|---------|-------|------------------|
| 90-100% | **PASSED** | Green | Factory approved for orders and sampling |
| 75-89% | **CONDITIONAL** | Yellow | Approved with corrective actions within 30 days |
| 50-74% | **WARNING** | Orange | Hold orders until re-audit confirms improvement |
| 0-49% | **FAILED** | Red | Re-audit required before any orders or sampling |

### Real-world reference scores (from the uploaded Excel files):
- ACI Oils (India-Kanpur): 95.2% — 16G / 4Y / 1R / 0 N/A
- ACE TRIMS (China-Dongguan): 95.2% — 15G / 5Y / 1R / 0 N/A
- Far Eastern Fabric Mill (Vietnam): 100% — 18G / 0Y / 0R / 3 N/A
- Vitosafe Footwear (China-QingDao): 68.4% — 6G / 7Y / 6R / 2 N/A

---

## 2. THE 21 CHECKPOINTS (3 Sections)

These are the exact checkpoints from the RefrigiWear Audit Form v1.0:

### Section 1: Social Responsibility (10 pts) / Legal & Compliance (15 pts) — Items 1-7
```typescript
const SECTION_1 = {
  name: 'Social Responsibility / Legal & Compliance',
  shortName: 'Legal & Social',
  maxPoints: 25,
  checkpoints: [
    { item: 1, text: 'Ethical Sourcing: Verify compliance with ethical sourcing standards and policies.' },
    { item: 2, text: 'Supplier Code of Conduct: Assess adherence to the supplier code of conduct.' },
    { item: 3, text: 'Community Relations: Evaluate the factory\'s relationship with the local community.' },
    { item: 4, text: 'Business Licenses and Permits: Verify all necessary licenses, permits, and registrations are current.' },
    { item: 5, text: 'Labor Laws Adherence: Check compliance with labor laws, including minimum wage, overtime, working hours, and benefits.' },
    { item: 6, text: 'Health and Safety Regulations: Assess adherence to occupational health and safety regulations.' },
    { item: 7, text: 'Environmental Compliance: Verify compliance with environmental regulations, waste disposal, and pollution control.' },
  ]
};
```

### Section 2: Production Processes & Quality (20 pts) — Items 8-12
```typescript
const SECTION_2 = {
  name: 'Production Processes & Quality',
  shortName: 'Production & Quality',
  maxPoints: 20,
  conditionalNote: 'Is SPC (Statistical Process Control) required at this stage? If "no", mark items 8-10 as "N/A".',
  checkpoints: [
    { item: 8, text: 'Production Planning and Control: Assess production planning, scheduling, and control systems.' },
    { item: 9, text: 'Quality Management System: Evaluate the implementation and effectiveness of the quality management system.' },
    { item: 10, text: 'Material Handling and Storage: Check material handling practices, storage conditions, and inventory control.' },
    { item: 11, text: 'Sewing Equipment and Maintenance: Assess the condition and maintenance of sewing equipment.' },
    { item: 12, text: 'Product Quality: Evaluate product quality through inspection and sampling.' },
  ]
};
```

### Section 3: Workplace Environment & Safety (20 pts) / Labor Practices (25 pts) — Items 13-21
```typescript
const SECTION_3 = {
  name: 'Workplace Environment & Safety / Labor Practices',
  shortName: 'Workplace & Labor',
  maxPoints: 45,
  checkpoints: [
    { item: 13, text: 'First Aid Facilities: Verify availability and adequacy of first aid equipment and trained personnel.' },
    { item: 14, text: 'Hygiene and Sanitation: Check for clean restrooms, drinking water, and overall hygiene practices.' },
    { item: 15, text: 'Building Structure: Evaluate building condition, fire safety equipment, emergency exits, and lighting.' },
    { item: 16, text: 'Workstation Ergonomics: Assess workstation setup, ventilation, and noise levels.' },
    { item: 17, text: 'Forced Labor and Child Labor: Verify absence of forced labor, child labor, and bonded labor.' },
    { item: 18, text: 'Wages and Benefits: Assess wage payment, overtime pay, and benefits provided to workers.' },
    { item: 19, text: 'Working Hours: Check compliance with working hour regulations and overtime limits.' },
    { item: 20, text: 'Disciplinary Practices: Evaluate fairness and transparency of disciplinary procedures.' },
    { item: 21, text: 'Freedom of Association: Verify workers\' rights to form unions and collective bargaining.' },
  ]
};
```

---

## 3. DATABASE SCHEMA

```sql
-- 3a. Audit Templates (configurable audit standards)
CREATE TABLE audit_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  standard TEXT DEFAULT 'RW-v1.0',  -- 'RW-v1.0', 'WRAP', 'BSCI', 'SEDEX', 'custom'
  version INTEGER DEFAULT 1,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3b. Audit Template Sections
CREATE TABLE audit_template_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES audit_templates(id) ON DELETE CASCADE NOT NULL,
  section_order INTEGER NOT NULL,
  section_name TEXT NOT NULL,
  short_name TEXT,
  max_points INTEGER DEFAULT 0,
  conditional_note TEXT,  -- e.g., "Is SPC required? If no, mark 8-10 as N/A"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3c. Audit Template Checkpoints
CREATE TABLE audit_template_checkpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID REFERENCES audit_template_sections(id) ON DELETE CASCADE NOT NULL,
  item_number INTEGER NOT NULL,
  checkpoint_text TEXT NOT NULL,
  is_conditional BOOLEAN DEFAULT false,
  condition_group TEXT,  -- e.g., 'spc' — all items in this group affected by same condition
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3d. Factory Audits (main audit record)
CREATE TABLE factory_audits_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  factory_id UUID REFERENCES factories(id) NOT NULL,
  template_id UUID REFERENCES audit_templates(id) NOT NULL,
  audit_number TEXT NOT NULL UNIQUE,
  audit_date DATE NOT NULL,
  audit_type TEXT DEFAULT 'initial' CHECK (audit_type IN ('initial', 'follow_up', 'annual', 'special')),
  auditor_name TEXT NOT NULL,
  auditor_organization TEXT,
  department TEXT,
  plant_audited TEXT,
  shift_audited TEXT,
  attendees TEXT,
  -- Calculated scores (updated on each rating change)
  green_count INTEGER DEFAULT 0,
  yellow_count INTEGER DEFAULT 0,
  red_count INTEGER DEFAULT 0,
  na_count INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 21,
  applicable_items INTEGER DEFAULT 0,  -- total - na_count
  items_ok INTEGER DEFAULT 0,          -- green + yellow
  actions_required INTEGER DEFAULT 0,   -- red count
  overall_score NUMERIC(5,2) DEFAULT 0, -- (items_ok / applicable_items) * 100
  verdict TEXT CHECK (verdict IN ('passed', 'conditional', 'warning', 'failed')),
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'submitted', 'reviewed', 'closed')),
  -- Follow-up
  corrective_action_deadline DATE,
  follow_up_audit_id UUID,  -- self-reference for re-audits
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3e. Audit Ratings (one row per checkpoint per audit)
CREATE TABLE audit_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID REFERENCES factory_audits_v2(id) ON DELETE CASCADE NOT NULL,
  checkpoint_id UUID REFERENCES audit_template_checkpoints(id) NOT NULL,
  section_id UUID REFERENCES audit_template_sections(id),
  item_number INTEGER NOT NULL,
  rating TEXT CHECK (rating IN ('G', 'Y', 'R', 'NA')),
  notes TEXT,  -- MANDATORY when rating = 'R'
  corrective_action TEXT,
  corrective_action_status TEXT DEFAULT 'open' CHECK (corrective_action_status IN ('open', 'in_progress', 'resolved', 'verified')),
  corrective_action_deadline DATE,
  resolved_at TIMESTAMPTZ,
  rated_by UUID REFERENCES auth.users(id),
  rated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(audit_id, checkpoint_id)
);

-- 3f. Audit Photos
CREATE TABLE audit_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID REFERENCES factory_audits_v2(id) ON DELETE CASCADE NOT NULL,
  section_id UUID REFERENCES audit_template_sections(id),
  checkpoint_id UUID REFERENCES audit_template_checkpoints(id),
  photo_category TEXT DEFAULT 'general' CHECK (photo_category IN (
    'general', 'exterior', 'production_floor', 'storage', 'worker_areas',
    'safety_equipment', 'product_samples', 'nonconformance', 'other'
  )),
  image_url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_v2_factory ON factory_audits_v2(factory_id);
CREATE INDEX idx_audit_v2_status ON factory_audits_v2(status);
CREATE INDEX idx_audit_v2_date ON factory_audits_v2(audit_date);
CREATE INDEX idx_audit_ratings_audit ON audit_ratings(audit_id);
CREATE INDEX idx_audit_ratings_rating ON audit_ratings(rating);
CREATE INDEX idx_audit_photos_audit ON audit_photos(audit_id);

-- RLS
ALTER TABLE audit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_template_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_template_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_audits_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON audit_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON audit_template_sections FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON audit_template_checkpoints FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON factory_audits_v2 FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON audit_ratings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON audit_photos FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

## 4. SEED TEMPLATES (TWO BUILT-IN TEMPLATES)

On first load, seed **both** templates. Template 1 (RW v1.0) is the default. Template 2 (WRAP-aligned) is the comprehensive version mapped to WRAP's 12 Principles.

### Template 1: RefrigiWear v1.0 (Default — 3 sections, 21 checkpoints)
This is the exact format from the Excel files (already defined in Section 2 above).

### Template 2: WRAP-Aligned Comprehensive (8 categories, ~35 checkpoints)
Based on WRAP (Worldwide Responsible Accredited Production) 12 Principles, expanded into 8 audit categories:

```typescript
const WRAP_TEMPLATE = {
  name: 'WRAP-Aligned Factory Audit',
  standard: 'WRAP',
  sections: [
    {
      order: 1,
      name: 'Legal & Compliance',
      shortName: 'Legal',
      wrapPrinciple: 'Principle 1: Compliance with Laws',
      checkpoints: [
        { item: 1, text: 'Business Licenses and Permits: Verify all necessary licenses, permits, and registrations are current.' },
        { item: 2, text: 'Labor Law Compliance: Check compliance with local and national labor laws.' },
        { item: 3, text: 'Environmental Regulations: Verify compliance with environmental regulations and permits.' },
        { item: 4, text: 'Import/Export Permits: Verify all trade and customs documentation is current.' },
        { item: 5, text: 'Tax Compliance: Verify tax registration and payment documentation.' },
      ]
    },
    {
      order: 2,
      name: 'Labor Standards',
      shortName: 'Labor',
      wrapPrinciple: 'Principles 2-4: Prohibition of Forced Labor, Child Labor, Harassment/Abuse',
      checkpoints: [
        { item: 6, text: 'No Forced Labor: Verify absence of forced labor, bonded labor, or involuntary prison labor.' },
        { item: 7, text: 'No Child Labor: Verify age verification systems and absence of child labor (under local legal minimum age).' },
        { item: 8, text: 'No Harassment or Abuse: Verify absence of physical, sexual, psychological, or verbal harassment.' },
        { item: 9, text: 'Freedom of Association: Verify workers\' rights to form unions and collective bargaining.' },
        { item: 10, text: 'Non-Discrimination: Verify hiring and employment practices are free from discrimination.' },
        { item: 11, text: 'Disciplinary Practices: Evaluate fairness, transparency, and documentation of disciplinary procedures.' },
      ]
    },
    {
      order: 3,
      name: 'Compensation & Working Hours',
      shortName: 'Compensation',
      wrapPrinciple: 'Principles 5-6: Compensation, Hours of Work',
      checkpoints: [
        { item: 12, text: 'Minimum Wage Compliance: Verify all workers receive at least the legal minimum wage.' },
        { item: 13, text: 'Overtime Pay: Verify overtime is paid at legally mandated premium rates.' },
        { item: 14, text: 'Benefits: Assess legally required benefits (social insurance, leave, holidays) are provided.' },
        { item: 15, text: 'Working Hours Limits: Check compliance with maximum regular working hours per local law.' },
        { item: 16, text: 'Overtime Limits: Verify overtime does not exceed legal limits and is voluntary.' },
        { item: 17, text: 'Payroll Records: Verify accurate, transparent payroll records and pay slips for all workers.' },
      ]
    },
    {
      order: 4,
      name: 'Health & Safety',
      shortName: 'H&S',
      wrapPrinciple: 'Principle 8: Health and Safety',
      checkpoints: [
        { item: 18, text: 'Building Structure: Evaluate building condition, structural integrity, and maintenance.' },
        { item: 19, text: 'Fire Safety: Verify fire extinguishers, alarms, sprinklers, and evacuation plans are current and tested.' },
        { item: 20, text: 'Emergency Exits: Check that emergency exits are clearly marked, unobstructed, and sufficient.' },
        { item: 21, text: 'First Aid Facilities: Verify availability and adequacy of first aid equipment and trained personnel.' },
        { item: 22, text: 'PPE Availability: Assess that appropriate personal protective equipment is provided and used.' },
        { item: 23, text: 'Ventilation and Lighting: Evaluate ventilation systems, air quality, and adequate lighting.' },
        { item: 24, text: 'Workstation Ergonomics: Assess workstation setup, noise levels, and ergonomic conditions.' },
      ]
    },
    {
      order: 5,
      name: 'Environment & Hygiene',
      shortName: 'Environment',
      wrapPrinciple: 'Principle 10: Environment',
      checkpoints: [
        { item: 25, text: 'Waste Management: Evaluate waste disposal, segregation, and recycling practices.' },
        { item: 26, text: 'Pollution Control: Assess measures for air, water, and noise pollution control.' },
        { item: 27, text: 'Chemical Storage & Handling: Verify proper storage, labeling, and MSDS documentation for chemicals.' },
        { item: 28, text: 'Hygiene and Sanitation: Check for clean restrooms, drinking water, and overall hygiene practices.' },
        { item: 29, text: 'Canteen and Rest Areas: Evaluate condition and hygiene of canteen, break rooms, and rest areas.' },
      ]
    },
    {
      order: 6,
      name: 'Production & Quality',
      shortName: 'Production',
      wrapPrinciple: 'N/A (Custom — RefrigiWear standard)',
      conditionalNote: 'Is SPC (Statistical Process Control) required? If "no", mark items 30-31 as "N/A".',
      checkpoints: [
        { item: 30, text: 'Production Planning and Control: Assess production planning, scheduling, and control systems.' },
        { item: 31, text: 'Quality Management System: Evaluate the implementation and effectiveness of QMS (ISO 9001 or equivalent).' },
        { item: 32, text: 'Material Handling and Storage: Check material handling practices, storage conditions, and inventory control.' },
        { item: 33, text: 'Equipment Condition and Maintenance: Assess the condition and preventive maintenance of machinery.' },
        { item: 34, text: 'Product Quality: Evaluate product quality through inspection, sampling, and defect tracking.' },
      ]
    },
    {
      order: 7,
      name: 'Social Responsibility',
      shortName: 'Social',
      wrapPrinciple: 'Principles 7, 9: Prohibition of Discrimination, Customs Compliance',
      checkpoints: [
        { item: 35, text: 'Ethical Sourcing: Verify compliance with ethical sourcing standards and policies.' },
        { item: 36, text: 'Supplier Code of Conduct: Assess adherence to the supplier code of conduct.' },
        { item: 37, text: 'Community Relations: Evaluate the factory\'s relationship with the local community.' },
        { item: 38, text: 'Customs Compliance: Verify compliance with customs laws and regulations (WRAP Principle 9).' },
      ]
    },
    {
      order: 8,
      name: 'Security',
      shortName: 'Security',
      wrapPrinciple: 'Principle 12: Security',
      checkpoints: [
        { item: 39, text: 'Facility Security: Evaluate perimeter security, CCTV, and access control systems.' },
        { item: 40, text: 'Shipping and Receiving Security: Verify security procedures for incoming/outgoing shipments.' },
        { item: 41, text: 'C-TPAT Compliance: Assess compliance with Customs-Trade Partnership Against Terrorism (if applicable).' },
      ]
    },
  ]
};
```

### Seed Function:

```typescript
async function seedAuditTemplates() {
  // Check if templates exist
  const { count } = await supabase
    .from('audit_templates')
    .select('id', { count: 'exact', head: true });

  if (count && count > 0) return; // already seeded

  // --- TEMPLATE 1: RefrigiWear v1.0 (default) ---
  const { data: rwTemplate } = await supabase
    .from('audit_templates')
    .insert({
      template_name: 'RefrigiWear Factory Audit Form v1.0',
      standard: 'RW-v1.0',
      version: 1,
      description: '21-point factory audit with G/Y/R/NA scoring across Social Responsibility, Production Quality, and Workplace Safety.',
      is_default: true,
    })
    .select()
    .single();

  // Insert 3 sections with their checkpoints for RW v1.0
  // Loop through SECTION_1, SECTION_2, SECTION_3 (defined in Section 2 above)
  // For each section: insert into audit_template_sections, then insert checkpoints

  // --- TEMPLATE 2: WRAP-Aligned (comprehensive) ---
  const { data: wrapTemplate } = await supabase
    .from('audit_templates')
    .insert({
      template_name: 'WRAP-Aligned Factory Audit',
      standard: 'WRAP',
      version: 1,
      description: '41-point comprehensive audit aligned to WRAP 12 Principles covering Legal, Labor, Compensation, H&S, Environment, Production, Social Responsibility, and Security.',
      is_default: false,
    })
    .select()
    .single();

  // Insert 8 sections with their checkpoints for WRAP
  // Loop through WRAP_TEMPLATE.sections (defined above)
  // For each section: insert into audit_template_sections, then insert checkpoints
}
```

**IMPORTANT:** When a user selects the WRAP template for a new audit, the system creates 41 rating rows (one per checkpoint) instead of 21. The scoring formula remains the same: `(G+Y)/(Total-NA)*100`. The UI dynamically renders sections and checkpoints from the template — no hardcoding of checkpoint counts.

---

## 5. FILE STRUCTURE

```
app/
  (dashboard)/
    audits/
      page.tsx                      -- Audit list (all audits across factories)
      new/
        page.tsx                    -- Start new audit (select factory, template, fill details)
      [id]/
        page.tsx                    -- Audit form: the main G/Y/R/NA rating interface
        report/
          page.tsx                  -- Generated audit report view
      templates/
        page.tsx                    -- Audit templates management
components/
  audits/
    audit-form-header.tsx           -- Factory name, date, auditor, score gauge
    checkpoint-rating-row.tsx       -- Single checkpoint with G/Y/R/NA buttons
    section-accordion.tsx           -- Collapsible section with checkpoints
    score-dashboard.tsx             -- Live circular gauge + category bars + stats
    score-gauge.tsx                 -- Circular radial chart (0-100%)
    verdict-badge.tsx               -- PASSED/CONDITIONAL/WARNING/FAILED badge
    rating-button.tsx               -- G/Y/R/NA pill-style toggle button
    audit-photo-gallery.tsx         -- Photo grid with upload per section
    corrective-action-panel.tsx     -- Red items with notes + action tracking
    audit-card.tsx                  -- Card for list view
    audit-filters.tsx
    factory-score-trend.tsx         -- Line chart of score over time per factory
    factory-comparison-chart.tsx    -- Bar chart comparing factories
lib/
  actions/
    audits.ts                      -- Server actions for all audit CRUD
  validations/
    audits.ts                      -- Zod schemas
  types/
    audits.ts                      -- TypeScript types
  utils/
    audit-scoring.ts               -- Score calculation functions
```

---

## 6. PAGE SPECIFICATIONS

### 6a. Audits List — `/audits`

**Header:** "Factory Audits" + "Start New Audit +" button (GOLD)

**Filter bar:** Factory, Verdict, Audit Type, Date Range, Search by audit number

**Table columns:**
- Audit # | Factory | Location | Date | Auditor | Score (with circular mini gauge) | Verdict badge | G/Y/R/NA counts | Status

**Sort by:** Date (newest first default), Score, Factory name

**Quick stats row at top:**
- Total audits conducted
- Average score across all factories
- Factories passed (green count)
- Factories needing action (red count)

### 6b. Start New Audit — `/audits/new`

**Form layout:**
- Select Factory (required — from factories table)
- Audit Template (select, default: "RefrigiWear Factory Audit Form v1.0")
- Audit Date (date picker, default today)
- Audit Type: Initial / Follow-up / Annual / Special
- Auditor Name (text, pre-fill with current user name)
- Auditor Organization (text)
- Department (text)
- Plant Audited (text)
- Shift Audited (text)
- Attendees (text)

On submit: Create audit + create 21 audit_rating rows (one per checkpoint, all unrated), redirect to audit form page.

Auto-generate audit number: `FA-{YYYYMMDD}-{XXX}`

### 6c. Audit Form — `/audits/[id]` ★ THIS IS THE CORE PAGE ★

**Layout: 3-column on desktop, stacked on mobile**

**Left column (narrow) — Audit Info:**
- Factory name, location
- Audit date, auditor
- Audit type badge
- Template name

**Center column (wide) — Checkpoint Sections:**
Three collapsible accordion sections matching the Excel structure.

Each section header shows: section name, section score mini-bar, G/Y/R/NA counts for that section.

**Each checkpoint row inside a section:**
```
[Item #] [Checkpoint description text]
[G] [Y] [R] [N/A]  ← pill buttons, one selected at a time
[📝 Notes] [📷 Photo]  ← expand icons
```

**G/Y/R/NA pill buttons behavior:**
- Only one can be selected per row (radio-style)
- G button: green fill when selected, outline when not
- Y button: yellow/amber fill when selected
- R button: red fill when selected → IMMEDIATELY expand the notes field below, make it required
- N/A button: grey fill when selected, grey out the row slightly

**When R is selected:**
A notes area expands below the checkpoint with:
- Required notes textarea: "Describe the nonconformance..." (must have content before saving)
- Corrective action textarea: "Required corrective action..."
- Deadline date picker for corrective action
- Photo upload button for evidence

**Section 2 special: SPC conditional logic**
At the top of Section 2, show a toggle:
"Is SPC (Statistical Process Control) required at this stage? [Yes] [No]"
If "No" is selected, auto-set items 8, 9, 10 to N/A and disable their rating buttons.

**Right column (narrow) — Live Score Dashboard:**
This updates in REAL-TIME as the auditor clicks G/Y/R/NA buttons:

1. **Large circular gauge (top):**
   - Score percentage in center: e.g., "95.2%"
   - Circular fill colored by threshold (green/yellow/orange/red)
   - Use Recharts `<RadialBarChart>` or a custom SVG circle

2. **Verdict badge below gauge:**
   - "PASSED" (green), "CONDITIONAL" (yellow), "WARNING" (orange), "FAILED" (red)
   - Updates dynamically as score crosses thresholds

3. **Section breakdown:**
   Three horizontal bars showing each section's score:
   - Legal & Social: 85.7% ████████░░
   - Production & Quality: 60.0% ██████░░░░
   - Workplace & Labor: 100% ██████████

4. **Summary stats:**
   - Items Rated: 19 / 21
   - Green: 13 | Yellow: 4 | Red: 2 | N/A: 2
   - Items OK: 17
   - Actions Required: 2

5. **Progress bar:**
   "19 of 21 checkpoints rated" with progress bar

**Bottom action bar:**
- "Save Draft" button (saves current state, can return later)
- "Submit Audit" button (GOLD — validates all items rated, notes on all Red items, then locks the audit)
- "Generate Report" button (appears after submission)

### 6d. Audit Report — `/audits/[id]/report`

**A printable/downloadable report page:**

1. **Cover section:**
   - SankalphHub logo + "Factory Audit Report"
   - Factory: name, location
   - Audit date, auditor, audit type
   - Large score gauge + verdict badge

2. **Summary section:**
   - Score: X% | Verdict: PASSED/CONDITIONAL/WARNING/FAILED
   - G: X | Y: X | R: X | N/A: X
   - Items OK: X / Applicable: X

3. **Section-by-section breakdown:**
   For each of the 3 sections:
   - Section name + section score
   - Table: Item # | Checkpoint | Rating (color-coded badge) | Notes

4. **Non-conformance report:**
   - Dedicated table of ALL Red-rated items
   - Columns: Item # | Checkpoint | Notes | Required Action | Deadline | Status

5. **Photo gallery:**
   - All uploaded photos organized by section

6. **Historical comparison** (if previous audits exist for this factory):
   - Line chart showing score trend over multiple audits
   - Table of previous audit dates + scores

7. **Export buttons:**
   - "Download PDF" (use jsPDF)
   - "Export to Excel" (use xlsx — replicate the RefrigiWear Excel format)

### 6e. Templates — `/audits/templates`

**For Super Admin only:**

**Two built-in templates ship by default:**
1. **RefrigiWear Factory Audit Form v1.0** (default) — 3 sections, 21 checkpoints. Matches the Excel format exactly.
2. **WRAP-Aligned Factory Audit** — 8 categories, 41 checkpoints. Based on WRAP's 12 Principles with expanded coverage for Legal, Labor Standards, Compensation, H&S, Environment, Production, Social Responsibility, and Security.

**Template list page shows:**
- Template name, Standard (RW-v1.0 / WRAP / BSCI / Custom), Version, Sections count, Checkpoints count, Default badge, Active toggle

**Template detail (view/edit):**
- Template name + standard + version
- Sections listed with expand/collapse
- Each section: name, WRAP principle mapping, checkpoints list
- Add/remove/reorder checkpoints
- Add/remove sections

**Additional features:**
- Create custom template (clone from existing or start blank)
- Set default template (used when starting a new audit)
- Version tracking (creating a new version preserves the old one for historical audits)
- Cannot delete a template if audits reference it

---

## 7. SCORE CALCULATION (lib/utils/audit-scoring.ts)

```typescript
interface AuditScoreResult {
  greenCount: number;
  yellowCount: number;
  redCount: number;
  naCount: number;
  totalItems: number;
  applicableItems: number;  // total - na
  itemsOK: number;          // green + yellow
  actionsRequired: number;  // red
  overallScore: number;     // (itemsOK / applicableItems) * 100
  verdict: 'passed' | 'conditional' | 'warning' | 'failed';
  sectionScores: {
    sectionName: string;
    score: number;
    greenCount: number;
    yellowCount: number;
    redCount: number;
    naCount: number;
  }[];
}

function calculateAuditScore(ratings: AuditRating[]): AuditScoreResult {
  const greenCount = ratings.filter(r => r.rating === 'G').length;
  const yellowCount = ratings.filter(r => r.rating === 'Y').length;
  const redCount = ratings.filter(r => r.rating === 'R').length;
  const naCount = ratings.filter(r => r.rating === 'NA').length;
  const totalItems = ratings.length;
  const applicableItems = totalItems - naCount;
  const itemsOK = greenCount + yellowCount;
  const actionsRequired = redCount;
  const overallScore = applicableItems > 0 ? (itemsOK / applicableItems) * 100 : 0;

  let verdict: 'passed' | 'conditional' | 'warning' | 'failed';
  if (overallScore >= 90) verdict = 'passed';
  else if (overallScore >= 75) verdict = 'conditional';
  else if (overallScore >= 50) verdict = 'warning';
  else verdict = 'failed';

  return {
    greenCount, yellowCount, redCount, naCount,
    totalItems, applicableItems, itemsOK, actionsRequired,
    overallScore: Math.round(overallScore * 100) / 100,
    verdict,
    sectionScores: [], // calculate per-section similarly
  };
}
```

---

## 8. SUPABASE STORAGE

- Bucket: `audit-photos`
- Path: `{audit_id}/{section_name}/{filename}`
- Allowed: image/jpeg, image/png, image/webp
- Max size: 10MB
- Also allow PDF uploads for supporting docs in `audit-photos/{audit_id}/documents/`

---

## 9. NAVIGATION

Add "Audits" to sidebar:
- Icon: `ClipboardCheck` from lucide-react
- Position: as a top-level nav item (this is a core feature, not buried under Compliance)
- Badge: count of audits in draft status (reminding auditor to complete)
- Sub-items: All Audits, Templates

---

## 10. REAL-TIME SCORE UPDATE

The score dashboard MUST update instantly when a rating button is clicked — no page reload:

```typescript
// In the audit form component, use React state:
const [ratings, setRatings] = useState<Record<string, 'G' | 'Y' | 'R' | 'NA' | null>>({});

// On rating change:
function handleRatingChange(checkpointId: string, rating: 'G' | 'Y' | 'R' | 'NA') {
  setRatings(prev => ({ ...prev, [checkpointId]: rating }));
  // Debounced save to Supabase (don't save on every click, batch with 500ms debounce)
}

// Score recalculates from state on every render:
const score = useMemo(() => calculateAuditScore(Object.values(ratings)), [ratings]);
```

---

## 11. CORRECTIVE ACTION WORKFLOW

For Red-rated items, track corrective actions:

1. **During audit:** Auditor notes the nonconformance + required action + deadline
2. **After submission:** Red items appear in a "Corrective Actions" dashboard
3. **Factory responds:** Factory Manager can update status (open → in_progress → resolved) and add resolution notes
4. **Follow-up audit:** When scheduling a follow-up, the system pre-loads previous Red items to re-check
5. **Verification:** Brand Manager/Super Admin can mark actions as "verified" after follow-up

---

## 12. EXCEL EXPORT (Match RefrigiWear Format)

The Excel export should replicate the exact format of the uploaded RefrigiWear Excel files:
- Row 1: "RefrigiWear Audit Form v1.0" (or "SankalphHub Audit Form v1.0")
- Row 3: Audit Date, Performed by, Plant audited
- Row 4: Factory Name, Department
- Row 5: Location, Attendees, Shift
- Row 8: Rating legend (G/Y/R/NA descriptions)
- Row 11: Column headers: Rating, G, Y, R, N/A
- Row 12+: Section headers and checkpoint rows with G/Y/R/NA marks in columns L/M/N/O
- Row 38: Score computation: G count, Y count, R count, NA count
- Row 39: Overall score percentage
- Row 40: Items OK count
- Row 41: Applicable items count
- Row 42: Actions required count

Use the `xlsx` library to generate this format.

---

## 13. IMPLEMENTATION ORDER

1. **Database** — Run SQL for all 6 tables + storage bucket
2. **Seed default template** — Insert RW v1.0 template with 3 sections, 21 checkpoints
3. **Types & Zod schemas**
4. **Score calculation utility** (`audit-scoring.ts`)
5. **Server actions** — CRUD for audits, ratings, photos
6. **Audit list page** with filters and stats
7. **New audit form** (select factory + template + details)
8. **★ Audit form page ★** — The core G/Y/R/NA rating interface with live score dashboard
9. **Rating button component** — G/Y/R/NA pill toggles with color states
10. **Score dashboard component** — Circular gauge + section bars + stats
11. **Photo upload** per section/checkpoint
12. **Corrective action panel** for Red items
13. **Report page** — printable view
14. **PDF export** (jsPDF)
15. **Excel export** (xlsx — match RefrigiWear format)
16. **Templates management** page (Super Admin)
17. **Nav integration**
18. **Test end-to-end:** Create audit → rate all 21 checkpoints → verify score matches formula → add photos → submit → generate report → export to Excel → verify format matches RefrigiWear

---

## 14. CONSTRAINTS

- The G/Y/R/NA scoring formula MUST match the Excel exactly: `(G+Y)/(Total-NA)*100`
- Notes are MANDATORY when Red is selected — form validation must enforce this
- Score dashboard updates in real-time (React state, no page reload)
- The audit form must work on tablet/mobile (auditors use this in the field)
- SPC conditional logic must auto-set items to N/A when toggled
- Excel export must replicate the RefrigiWear format with ratings in columns L/M/N/O
- Follow existing code patterns (shadcn/ui, react-hook-form, Zod, Sonner, date-fns)
- No fake data, no fabricated scores
- Settings view-only for non-Super Admin
