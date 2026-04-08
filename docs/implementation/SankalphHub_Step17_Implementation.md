# SankalphHub — Step 17: Compliance, Certifications & Marketing Milestones
## Claude Code Implementation Prompt

## CONTEXT
SankalphHub (www.sankalphub.in) — Fashion Manufacturing platform. Stack: Next.js 16 (App Router), TypeScript 5, React 19, Supabase (Postgres, Auth, Storage, Realtime), Tailwind CSS 4, shadcn/ui, Radix UI, react-hook-form + Zod, Recharts, Sonner, date-fns, jsPDF, xlsx. Deployed on Vercel.

Brand tokens: GOLD=#D4A843, DARK=#1A1A2E, WHITE=#FFFFFF, RED=#CC0000, GREEN=#2E7D32, GREY=#666666, BLUE=#1565C0

Roles: Super Admin > Brand Manager > Factory Manager > Inspector > Viewer

**PREREQUISITE:** Steps 12-16 must be built first.

**PRICING:** PAID ADD-ON at $59/month. Use feature flag `COMPLIANCE_ENABLED` (default true for development).

---

## WHAT TO BUILD

A Compliance & Certifications module covering: regulatory compliance tracking (US + EU), factory audit management, product certification tracker, sustainability/ESG scoring, and marketing milestone tracker (from concept to retail). This is the final module that closes the loop on the entire product lifecycle.

---

## 1. DATABASE SCHEMA

```sql
-- 1a. Compliance Requirements
CREATE TABLE compliance_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  regulation_name TEXT NOT NULL,
  regulation_code TEXT,
  region TEXT CHECK (region IN ('US', 'EU', 'UK', 'global', 'other')),
  category TEXT CHECK (category IN ('safety', 'chemical', 'labeling', 'environmental', 'social', 'trade')),
  applicable_to TEXT[],  -- ['woven', 'knits', 'denim', 'outerwear', 'accessories']
  description TEXT,
  requirement_details TEXT,
  testing_required BOOLEAN DEFAULT false,
  certification_required BOOLEAN DEFAULT false,
  penalty_info TEXT,
  reference_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1b. Factory Audits
CREATE TABLE factory_audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  factory_id UUID REFERENCES factories(id) NOT NULL,
  audit_type TEXT NOT NULL CHECK (audit_type IN (
    'social', 'environmental', 'quality_system', 'security', 'structural', 'fire_safety'
  )),
  audit_standard TEXT,  -- e.g., "BSCI", "WRAP", "SA8000", "OEKO-TEX STeP", "ISO 9001"
  auditor_name TEXT,
  auditor_organization TEXT,
  audit_date DATE,
  next_audit_date DATE,
  overall_rating TEXT CHECK (overall_rating IN ('A', 'B', 'C', 'D', 'F', 'pass', 'fail', 'conditional')),
  score NUMERIC(5,2),
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'in_progress', 'completed', 'corrective_action_required',
    'corrective_action_submitted', 'closed', 'expired'
  )),
  findings_count INTEGER DEFAULT 0,
  critical_findings INTEGER DEFAULT 0,
  major_findings INTEGER DEFAULT 0,
  minor_findings INTEGER DEFAULT 0,
  corrective_action_deadline DATE,
  report_url TEXT,
  certificate_url TEXT,
  certificate_expiry DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1c. Product Certifications
CREATE TABLE product_certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  production_order_id UUID REFERENCES production_orders(id),
  certification_name TEXT NOT NULL,  -- e.g., "OEKO-TEX Standard 100", "GOTS", "GRS", "BCI"
  certification_body TEXT,
  certificate_number TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'application_submitted', 'testing_in_progress',
    'approved', 'rejected', 'expired', 'renewal_due'
  )),
  applied_date DATE,
  approved_date DATE,
  expiry_date DATE,
  scope TEXT,  -- what products/materials it covers
  certificate_url TEXT,
  cost NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1d. Sustainability Metrics
CREATE TABLE sustainability_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  factory_id UUID REFERENCES factories(id),
  project_id UUID REFERENCES projects(id),
  metric_period TEXT,  -- "2026-Q1", "2026-03"
  -- Environmental
  water_usage_liters NUMERIC(12,2),
  energy_usage_kwh NUMERIC(12,2),
  renewable_energy_pct NUMERIC(5,2),
  waste_generated_kg NUMERIC(10,2),
  waste_recycled_pct NUMERIC(5,2),
  carbon_emissions_kg NUMERIC(12,2),
  -- Social
  total_workers INTEGER,
  female_workers_pct NUMERIC(5,2),
  living_wage_compliance BOOLEAN,
  average_overtime_hours NUMERIC(5,1),
  workplace_incidents INTEGER DEFAULT 0,
  -- Materials
  sustainable_material_pct NUMERIC(5,2),
  recycled_content_pct NUMERIC(5,2),
  organic_content_pct NUMERIC(5,2),
  -- Score
  esg_score NUMERIC(5,2),  -- calculated overall score 0-100
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1e. Marketing Milestones (product go-to-market stages)
CREATE TABLE marketing_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) NOT NULL,
  production_order_id UUID REFERENCES production_orders(id),
  milestone_stage TEXT NOT NULL CHECK (milestone_stage IN (
    'concept', 'design_finalized', 'sampling_approved',
    'production_confirmed', 'photoshoot_ready', 'listing_live', 'retail_launch'
  )),
  milestone_order INTEGER NOT NULL,
  planned_date DATE,
  actual_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed', 'skipped')),
  assigned_to TEXT,
  deliverables TEXT,  -- what needs to happen at this stage
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_compliance_region ON compliance_requirements(region);
CREATE INDEX idx_audits_factory ON factory_audits(factory_id);
CREATE INDEX idx_audits_status ON factory_audits(status);
CREATE INDEX idx_certifications_project ON product_certifications(project_id);
CREATE INDEX idx_sustainability_factory ON sustainability_metrics(factory_id);
CREATE INDEX idx_marketing_project ON marketing_milestones(project_id);

-- RLS
ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sustainability_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON compliance_requirements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON factory_audits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON product_certifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON sustainability_metrics FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON marketing_milestones FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

## 2. SEED DATA — COMMON REGULATIONS

Seed `compliance_requirements` with these on first load:

```typescript
const US_REGULATIONS = [
  { name: 'CPSIA', code: 'CPSIA', region: 'US', category: 'safety', description: 'Consumer Product Safety Improvement Act — lead, phthalates limits for children\'s products' },
  { name: 'CPSC 16 CFR 1610', code: 'CFR1610', region: 'US', category: 'safety', description: 'Flammability of clothing textiles' },
  { name: 'FTC Textile Rules', code: 'FTC-TEXTILE', region: 'US', category: 'labeling', description: 'Fiber content, country of origin, care labeling (16 CFR 303)' },
  { name: 'California Prop 65', code: 'PROP65', region: 'US', category: 'chemical', description: 'Warning requirements for chemicals known to cause cancer or reproductive harm' },
  { name: 'Lacey Act', code: 'LACEY', region: 'US', category: 'trade', description: 'Prohibition of illegally sourced plant-based fibers' },
  { name: 'TSCA', code: 'TSCA', region: 'US', category: 'chemical', description: 'Toxic Substances Control Act — PFAS restrictions' },
];

const EU_REGULATIONS = [
  { name: 'REACH', code: 'REACH', region: 'EU', category: 'chemical', description: 'Registration, Evaluation, Authorisation and Restriction of Chemicals' },
  { name: 'EU Textile Regulation 1007/2011', code: 'EU-1007', region: 'EU', category: 'labeling', description: 'Textile fibre names and related labelling' },
  { name: 'EU ESPR', code: 'ESPR', region: 'EU', category: 'environmental', description: 'Ecodesign for Sustainable Products Regulation — digital product passport' },
  { name: 'EU CSDDD', code: 'CSDDD', region: 'EU', category: 'social', description: 'Corporate Sustainability Due Diligence Directive' },
  { name: 'EU Green Claims Directive', code: 'GREEN-CLAIMS', region: 'EU', category: 'labeling', description: 'Substantiation requirements for environmental claims' },
  { name: 'OEKO-TEX Standard 100', code: 'OEKO-100', region: 'global', category: 'chemical', description: 'Testing for harmful substances in textiles' },
];
```

---

## 3. DEFAULT MARKETING MILESTONES

Auto-insert when linked to a project:

```typescript
const MARKETING_STAGES = [
  { stage: 'concept', order: 1, deliverables: 'Mood board, initial sketches, target customer profile' },
  { stage: 'design_finalized', order: 2, deliverables: 'Tech pack complete, BOM finalized, colorways confirmed' },
  { stage: 'sampling_approved', order: 3, deliverables: 'PP sample approved, size grading done, fit comments closed' },
  { stage: 'production_confirmed', order: 4, deliverables: 'PO issued, production schedule locked, bulk fabric in-house' },
  { stage: 'photoshoot_ready', order: 5, deliverables: 'Shipment samples ready, lookbook shot list, model booked' },
  { stage: 'listing_live', order: 6, deliverables: 'Product page live, SEO optimized, inventory synced' },
  { stage: 'retail_launch', order: 7, deliverables: 'Available for purchase, marketing campaign active, PR sent' },
];
```

---

## 4. FILE STRUCTURE

```
app/
  (dashboard)/
    compliance/
      page.tsx                    -- Compliance dashboard
      regulations/
        page.tsx                  -- Regulations registry
      audits/
        page.tsx                  -- Factory audits list
        new/
          page.tsx                -- Schedule audit
        [id]/
          page.tsx                -- Audit detail
      certifications/
        page.tsx                  -- Certifications list
        new/
          page.tsx                -- Add certification
        [id]/
          page.tsx                -- Certification detail
      sustainability/
        page.tsx                  -- ESG dashboard
      marketing/
        page.tsx                  -- Marketing milestones tracker
components/
  compliance/
    compliance-dashboard.tsx      -- Overview cards: audits due, certs expiring, etc.
    regulation-card.tsx
    audit-card.tsx
    audit-status-tracker.tsx
    certification-card.tsx
    certification-expiry-badge.tsx
    esg-scorecard.tsx             -- Radar chart for ESG metrics
    esg-entry-form.tsx
    marketing-timeline.tsx        -- 7-stage horizontal tracker
    marketing-stage-card.tsx
lib/
  actions/
    compliance.ts
  validations/
    compliance.ts
  types/
    compliance.ts
```

---

## 5. PAGE SPECIFICATIONS

### 5a. Compliance Dashboard — `/compliance`

**Summary cards (top row):**
- Upcoming Audits: count due in next 30 days
- Expiring Certifications: count expiring in next 60 days
- Open Corrective Actions: count of audits needing follow-up
- ESG Score: average across factories (0-100)

**Quick-access sections below:**
- Recent audits table (last 5)
- Certification status grid
- Regulations applicable to current projects

### 5b. Regulations — `/compliance/regulations`

**Table:** Regulation Name, Code, Region (flag icon), Category, Applicable To, Testing Required, Certification Required

Filter by region and category.

Seed with US + EU regulations on first load (use server action that checks if table is empty).

### 5c. Factory Audits — `/compliance/audits`

**List:** Factory, Audit Type, Standard, Date, Rating, Score, Status, Next Audit

**Create form (`/compliance/audits/new`):**
- Select Factory
- Audit Type (6 types)
- Standard (text — common: BSCI, WRAP, SA8000, SEDEX, ISO 9001, OEKO-TEX STeP)
- Auditor Name + Organization
- Audit Date + Next Audit Date
- Status

**Detail page (`/compliance/audits/[id]`):**
- Audit info card
- Findings summary: Critical / Major / Minor counts
- Rating + Score
- Corrective action status + deadline
- Upload audit report + certificate (Supabase Storage bucket `compliance-docs`)
- Certificate expiry alert (yellow if <60 days, red if expired)

### 5d. Certifications — `/compliance/certifications`

**Grid/table view:** Certification name, Body, Status, Applied → Approved, Expiry, Project

**Status badges:**
- pending: grey
- application_submitted: blue
- testing_in_progress: GOLD
- approved: green
- rejected: red
- expired: dark red
- renewal_due: orange

**Expiry alerts:**
- >60 days: green "Valid"
- 30-60 days: orange "Renewal Due"
- <30 days: red "Expiring Soon"
- Past: dark red "Expired"

### 5e. Sustainability/ESG — `/compliance/sustainability`

**ESG Scorecard page:**
- Factory selector (dropdown)
- Period selector (quarter/month)
- Entry form for all metrics (environmental, social, materials)
- Radar chart (Recharts `<RadarChart>`) showing 6 dimensions:
  - Water efficiency, Energy efficiency, Waste management, Carbon footprint, Social compliance, Material sustainability
- Trend charts over time (line charts)
- ESG score calculation:
```typescript
function calculateESGScore(metrics: SustainabilityMetrics): number {
  let score = 0;
  // Environmental (40%)
  if (metrics.renewable_energy_pct >= 50) score += 15; else score += (metrics.renewable_energy_pct / 50) * 15;
  if (metrics.waste_recycled_pct >= 80) score += 15; else score += (metrics.waste_recycled_pct / 80) * 15;
  score += Math.min(10, (100 - (metrics.carbon_emissions_kg / 1000)) * 0.1);
  // Social (30%)
  if (metrics.living_wage_compliance) score += 15;
  if (metrics.average_overtime_hours <= 10) score += 10; else score += Math.max(0, 10 - (metrics.average_overtime_hours - 10));
  if (metrics.workplace_incidents === 0) score += 5;
  // Materials (30%)
  score += (metrics.sustainable_material_pct / 100) * 15;
  score += (metrics.recycled_content_pct / 100) * 10;
  score += (metrics.organic_content_pct / 100) * 5;
  return Math.min(100, Math.round(score));
}
```

### 5f. Marketing Milestones — `/compliance/marketing`

**7-stage horizontal tracker (similar to sampling stage tracker):**
- Each stage is a card/dot on a horizontal line
- Completed = green, In Progress = gold pulsing, Pending = grey, Delayed = red
- Click stage to expand: planned date, actual date, deliverables, assigned to, notes
- Update status and dates inline
- Filter by project

---

## 6. SUPABASE STORAGE

- Bucket: `compliance-docs`
- Path: `audits/{audit_id}/{filename}` and `certifications/{certification_id}/{filename}`
- Allowed: application/pdf, image/jpeg, image/png
- Max size: 20MB

---

## 7. FEATURE FLAG

```typescript
COMPLIANCE_ENABLED: process.env.NEXT_PUBLIC_COMPLIANCE_ENABLED !== 'false'
```

---

## 8. NAVIGATION

Add "Compliance" to sidebar:
- Icon: `ShieldCheck` from lucide-react
- Position: after "Logistics" (last module)
- Badge: count of expiring certs + overdue audits
- Sub-items (collapsible): Dashboard, Regulations, Audits, Certifications, ESG, Marketing

---

## 9. IMPLEMENTATION ORDER

1. Database — All 5 tables + storage bucket
2. Feature flag
3. Types & Zod schemas
4. Server actions
5. Seed regulations data
6. Compliance dashboard page
7. Regulations list
8. Factory audits CRUD
9. Certifications CRUD
10. ESG dashboard + entry form + charts
11. Marketing milestones tracker
12. Nav integration
13. Test: seed regulations → schedule audit → enter findings → add certification → enter ESG metrics → set marketing milestones → verify dashboard aggregations

---

## 10. CONSTRAINTS

- Same patterns as Steps 12-16
- Feature flag gating ($59/month add-on)
- ESG score calculation runs client-side (no server function needed)
- Radar chart uses Recharts `<RadarChart>` — follow existing chart patterns
- Certificate expiry alerts: check on page load, no cron needed yet
- All file uploads via Supabase Storage
- react-hook-form + Zod, Sonner, shadcn/ui
- Mobile responsive
- No fake data, no fabricated ESG scores
- IMPORTANT: This is the LAST step. After this, the full product lifecycle is complete from production through compliance.
