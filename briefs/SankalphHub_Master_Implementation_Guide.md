# SankalphHub V3 — Master Implementation Guide

> **Purpose**: Single-file implementation reference for Claude Code. Execute steps sequentially.
> **Platform**: Fashion Manufacturing QA — Garments, Footwear, Gloves, Headwear, Accessories
> **Owner**: Naveen | **Domain**: sankalphub.in

---

## TECH STACK REFERENCE

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.1 — App Router (`app/` directory) |
| Language | TypeScript 5, strict mode, `@/*` path alias |
| React | React 19.2.4 |
| Database | Supabase (hosted Postgres), `@supabase/supabase-js` 2.100.1 |
| Auth | Supabase Auth — email/password + magic link, `@supabase/ssr` 0.9.0 |
| Query | Direct Supabase client — `supabase.from('table').select()` — NO ORM |
| Storage | Supabase Storage — buckets: `factory-photos`, `inspection-photos` |
| CSS | Tailwind CSS 4 + CSS custom properties in `globals.css` |
| Components | shadcn/ui (source-copied) + Radix UI primitives |
| Icons | lucide-react 1.7.0 |
| Theme | next-themes 0.4.6 (dark/light) |
| Forms | react-hook-form 7.72.0 + Zod 4.3.6 |
| Charts | Recharts 3.8.1 |
| Toasts | Sonner 2.0.7 |
| Dates | date-fns 4.1.0 |
| AI | @anthropic-ai/sdk 0.82.0 (Claude API) |
| PDF Export | jsPDF 4.2.1 + jspdf-autotable |
| Excel Export | xlsx 0.18.5 |
| Audio | Web Audio API (procedural — no files) |
| Real-time | Supabase Realtime (WebSocket, postgres_changes) |
| Deploy | Vercel — auto-deploy from `main` |
| NOT present | Stripe, email service, testing framework, ORM, external state manager |

### Brand Design Tokens

```
GOLD    = #D4A843   (Primary accent, PremiumHub)
DARK    = #1A1A2E   (Primary text, headers, sidebar)
WHITE   = #FFFFFF   (Backgrounds)
RED     = #CC0000   (Errors, critical defects, fail states)
GREEN   = #2E7D32   (Success, pass states)
GREY    = #666666   (Secondary text)
BLUE    = #1565C0   (Links, info states)
```

### Fashion Manufacturing Categories (used throughout)

| Category | Production Stages | Key Defect Types |
|----------|------------------|-----------------|
| Garments | Cut → Sew → Finish → Pack | Stitching, fabric, measurement, finishing |
| Footwear | Upper → Sole → Lasting → Finish | Bonding, sole defects, symmetry, material |
| Gloves | Cut → Sew → Turn → Inspect | Seam alignment, finger symmetry, grip coating |
| Headwear | Cut → Form → Assemble → Finish | Shape retention, brim alignment, lining |
| Accessories | Component → Assemble → Finish → QC | Hardware, material, assembly, cosmetic |

### Role Hierarchy

```
Super Admin → Brand Manager → Factory Manager → Inspector → Viewer
```

**Access Rule**: ALL Settings sections are VIEW-ONLY for non-admin users. Only Admin can make changes when notified via change request workflow.

---

## PROCESS FLOW OVERVIEW

```
PHASE 1: Foundation & Bug Fixes
├── Step 1:  Landing Page Enhancements
├── Step 2:  Login Page Enhancements
├── Step 3:  Dashboard Enhancements
└── Step 4:  Inspections Setup (+ BUG FIX: dropdown persistence)

PHASE 2: Core Modules
├── Step 5:  Factories & Audits (+ Factory Audit WRAP Spec)
├── Step 6:  Projects (+ BUG FIX: listing persistence)
└── Step 7:  Planning Module (NEW BUILD — Production, Timeline, DPR, WIP)

PHASE 3: Intelligence & Controls
├── Step 8:  Analytics Engine (Cody's 4 KPIs + 26 metrics)
├── Step 9:  Settings (7 sub-sections + session management + RBAC)
└── Step 10: PremiumHub (Stripe, billing, trial automation, feature gates)

PHASE 4: Engagement
└── Step 11: Notification Bell (wire 8 events, preferences page, sound system)
```

**Rule**: Complete each step fully before moving to the next. Each step lists its prerequisites.

---

# ═══════════════════════════════════════════
# PHASE 1: FOUNDATION & BUG FIXES
# ═══════════════════════════════════════════

---

## STEP 1 — Landing Page Enhancements

**Reference**: `SankalphHub_Step1_Landing_Page_Review.docx`
**Prerequisites**: None
**Estimated effort**: 1–2 days

### 1.1 Tasks

1. **Remove placeholder trust signals**: Delete any fake client logos, testimonial placeholders, or "Trusted by X companies" text. The platform is in development — do not fabricate social proof. Replace with a simple "Built for Fashion Manufacturing QA" tagline.

2. **Hero section improvements**:
   - Headline: Clear value prop for fashion manufacturing QA (garments, footwear, gloves, headwear, accessories)
   - Sub-headline: Mention key capabilities — AQL inspections, factory audits, production planning
   - Primary CTA: "Start Free Trial" → links to `/signup`
   - Secondary CTA: "Request Demo" → links to demo form
   - Background: Subtle factory/textile imagery or abstract pattern (not stock photos of generic offices)

3. **Feature sections**: Organize by platform capability:
   - Inspections & AQL Sampling (ANSI Z1.4 standard)
   - Factory Audits & WRAP Compliance
   - Production Planning & DPR Tracking
   - Analytics & Quality Metrics
   - Each section: icon (lucide-react), 2-line description, "Learn more" link

4. **Category showcase**: Visual representation of the 5 fashion manufacturing categories with icons/illustrations. Show that the platform is purpose-built, not generic.

5. **Footer**: Clean footer with links to Privacy Policy, Terms, Contact, and social links. No fake addresses.

6. **Responsive**: Ensure landing page is fully responsive — test at 320px, 768px, 1024px, 1440px breakpoints.

7. **Performance**: Lazy-load below-fold images. Ensure LCP < 2.5s. Use Next.js `<Image>` component with proper `sizes` and `priority` on hero image.

### 1.2 Files to Touch

```
app/(marketing)/page.tsx          — Main landing page
app/(marketing)/layout.tsx        — Marketing layout (no sidebar)
components/landing/HeroSection.tsx — Hero component
components/landing/Features.tsx    — Feature grid
components/landing/Categories.tsx  — Category showcase
components/landing/Footer.tsx      — Footer
```

### 1.3 Acceptance Criteria

- [ ] No fake trust signals or placeholder logos
- [ ] Hero clearly communicates fashion manufacturing QA focus
- [ ] All 5 categories visually represented
- [ ] CTAs link to correct routes
- [ ] Mobile responsive (320px–1440px)
- [ ] LCP < 2.5s on Vercel deployment

---

## STEP 2 — Login Page Enhancements

**Reference**: `SankalphHub_Step2_Login_Page_Review.docx`
**Prerequisites**: Step 1 complete
**Estimated effort**: 1 day

### 2.1 Tasks

1. **Visual polish**:
   - Left panel: Brand imagery or subtle pattern with SankalphHub logo and tagline
   - Right panel: Login form — clean, centered, minimal
   - Brand colors: GOLD accent on CTA button, DARK text
   - Ensure the login page matches the visual language of the new landing page

2. **Form improvements**:
   - Email + Password fields with proper labels and placeholders
   - "Remember me" checkbox
   - "Forgot password?" link → triggers Supabase magic link / password recovery flow
   - Form validation: Zod schema, react-hook-form, inline error messages
   - Loading state on submit button (spinner + disabled)

3. **Error handling**:
   - Invalid credentials: Clear error toast (Sonner) — "Invalid email or password"
   - Rate limiting: If Supabase returns 429, show "Too many attempts. Try again in X minutes."
   - Network error: "Unable to connect. Check your internet connection."

4. **Signup link**: "Don't have an account? Start your free trial" → links to `/signup`

5. **Accessibility**: Focus management, keyboard navigation, aria-labels, visible focus rings

### 2.2 Files to Touch

```
app/(auth)/login/page.tsx         — Login page
app/(auth)/signup/page.tsx        — Signup page (verify trial setup works)
app/(auth)/layout.tsx             — Auth layout
components/auth/LoginForm.tsx     — Login form component
lib/validations/auth.ts           — Zod schemas for auth forms
```

### 2.3 Acceptance Criteria

- [ ] Login form validates with Zod + react-hook-form
- [ ] Error messages display via Sonner toast
- [ ] Loading state on submit
- [ ] Forgot password flow works via Supabase
- [ ] Keyboard accessible (Tab, Enter, Escape)
- [ ] Responsive at all breakpoints

---

## STEP 3 — Dashboard Enhancements

**Reference**: `SankalphHub_Step3_Dashboard_Review.docx`
**Prerequisites**: Step 2 complete (auth flow working)
**Estimated effort**: 2–3 days

### 3.1 Tasks

1. **KPI Summary Cards** (top row, 4 cards):
   - Total Inspections (this month) — with trend arrow vs last month
   - Pass Rate % — color-coded (green ≥90%, amber 70–89%, red <70%)
   - Active Projects — count of in-progress projects
   - Factory Compliance — average audit score across factories
   - Each card: icon (lucide-react), value, trend indicator, "View details" link

2. **Recent Activity Feed**:
   - Pull from notifications table (last 5 items)
   - Show: icon, title, detail, relative timestamp (date-fns `formatDistanceToNow`)
   - Click navigates to the linked page (notification.link field)

3. **Quick Actions Bar**:
   - "New Inspection" → `/inspections/new`
   - "New Project" → `/projects/new`
   - "Schedule Audit" → `/factories/audits/new`
   - Use shadcn/ui Button with lucide-react icons

4. **Charts** (Recharts):
   - Inspection trend line chart (last 30 days, pass vs fail)
   - Defect distribution bar chart (by category: Garments, Footwear, etc.)
   - Factory audit scores comparison (horizontal bar chart, top 10 factories)

5. **Role-based dashboard content**:
   - Super Admin / Brand Manager: All KPIs, all charts, admin quick actions
   - Factory Manager: Factory-specific KPIs, their factory's inspections/audits only
   - Inspector: Today's assigned inspections, recent results
   - Viewer: Read-only summary, no action buttons

### 3.2 Files to Touch

```
app/(dashboard)/dashboard/page.tsx           — Main dashboard
components/dashboard/KPICards.tsx             — Summary cards row
components/dashboard/ActivityFeed.tsx         — Recent notifications feed
components/dashboard/QuickActions.tsx         — Action buttons bar
components/dashboard/InspectionTrendChart.tsx — Line chart
components/dashboard/DefectDistribution.tsx   — Bar chart
components/dashboard/AuditScoresChart.tsx     — Horizontal bar chart
lib/queries/dashboard.ts                     — Supabase queries for dashboard data
```

### 3.3 Data Queries

```typescript
// KPI: Total inspections this month
supabase.from('inspections').select('id', { count: 'exact' })
  .gte('created_at', startOfMonth)
  .eq('org_id', orgId)

// KPI: Pass rate
supabase.from('inspections').select('result')
  .eq('org_id', orgId)
  .gte('created_at', startOfMonth)
// Calculate: passCount / totalCount * 100

// Chart: Inspection trend (last 30 days)
supabase.from('inspections').select('created_at, result')
  .eq('org_id', orgId)
  .gte('created_at', subDays(new Date(), 30))
// Group by date using date-fns format
```

### 3.4 Acceptance Criteria

- [ ] 4 KPI cards with real data and trend arrows
- [ ] Activity feed shows last 5 notifications
- [ ] Quick action buttons navigate correctly
- [ ] Charts render with real data (handle empty state)
- [ ] Role-based content filtering works
- [ ] Dashboard loads in < 1s (server component + parallel queries)

---

## STEP 4 — Inspections Setup + Bug Fix

**Reference**: `SankalphHub_Step4_Inspections_Setup_Review.docx`
**Prerequisites**: Step 3 complete
**Estimated effort**: 3–4 days

### 4.1 CRITICAL BUG FIX: Dropdown/Form Persistence

**Bug**: Inspections complete the creation flow (multi-step form) but data doesn't persist — items don't appear on the listing page. This is the same root cause as the Projects bug in Step 6.

**Investigation steps**:
1. Open browser DevTools → Network tab
2. Complete an inspection creation flow
3. Check: Does the POST/INSERT request to Supabase return a success response?
4. Check: Does the response include the created record with an `id`?
5. Check: Does the listing page query include the correct filters (org_id, status)?
6. Check Supabase dashboard: Is the record actually in the `inspections` table?

**Probable causes** (check in order):
1. **Missing org_id on insert**: The server action doesn't attach org_id to the new record
2. **RLS policy blocks read**: The SELECT policy on inspections table doesn't match the user's role/org
3. **Missing revalidation**: After insert, the listing page cache isn't invalidated — use `revalidatePath('/inspections')`
4. **Status filter mismatch**: Listing page filters by a status value that doesn't match what was inserted

**Fix pattern**:
```typescript
// In the server action (e.g., inspections/actions.ts)
'use server'
import { revalidatePath } from 'next/cache'

export async function createInspection(data: InspectionFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Get user's org_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  // 2. Insert WITH org_id
  const { data: inspection, error } = await supabase
    .from('inspections')
    .insert({
      ...data,
      org_id: profile.org_id,   // ← Ensure this is set
      created_by: user.id,
      status: 'scheduled'       // ← Ensure this matches listing filter
    })
    .select()
    .single()

  if (error) throw error

  // 3. Revalidate the listing page cache
  revalidatePath('/inspections')

  return inspection
}
```

### 4.2 Inspections Module Enhancements

1. **AQL Sampling Engine**:
   - Implement ANSI Z1.4 / ASQ Z1.4 Level II sampling by default
   - Input: lot size → Output: sample size + accept/reject numbers
   - The AQL table is already in the platform (competitive advantage) — ensure it renders correctly
   - Allow inspectors to select: Level I (reduced), Level II (normal), Level III (tightened)

2. **Category-specific inspection templates**:
   - Each of the 5 categories gets default inspection checkpoints
   - Garments: 15+ checkpoints (measurements, stitching, fabric, labeling, packing)
   - Footwear: 12+ checkpoints (upper, sole, lasting, bonding, symmetry)
   - Gloves: 10+ checkpoints (finger alignment, seam, grip, elasticity)
   - Headwear: 10+ checkpoints (shape, brim, lining, embellishment, fit)
   - Accessories: 12+ checkpoints (hardware, material, assembly, finish, packaging)

3. **Defect recording with severity**:
   - Critical (safety/legal risk) → auto-triggers `critical_defect` notification
   - Major (functional/appearance affecting saleability)
   - Minor (cosmetic, won't affect function)
   - Use the existing Defect Library (94 defects) — map defects to categories

4. **Inspection result calculation**:
   - Based on AQL accept/reject numbers
   - PASS: defect count ≤ accept number
   - FAIL: defect count ≥ reject number
   - Auto-set result and trigger `inspection_passed` or `inspection_failed` notification

5. **Photo capture**:
   - Upload defect photos to Supabase Storage bucket `inspection-photos`
   - Associate photos with specific defects (defect_id reference)
   - Support camera capture on mobile (accept="image/*" capture="environment")

### 4.3 Files to Touch

```
app/(dashboard)/inspections/page.tsx              — Listing page (fix query)
app/(dashboard)/inspections/new/page.tsx           — Creation form
app/(dashboard)/inspections/[id]/page.tsx          — Detail view
app/(dashboard)/inspections/actions.ts             — Server actions (FIX: org_id + revalidate)
components/inspections/InspectionForm.tsx           — Multi-step form
components/inspections/AQLCalculator.tsx            — AQL sampling engine
components/inspections/DefectRecorder.tsx           — Defect entry with severity
components/inspections/CategoryCheckpoints.tsx      — Category-specific checklists
lib/aql-table.ts                                   — AQL lookup table (ANSI Z1.4)
lib/validations/inspection.ts                      — Zod schemas
```

### 4.4 Acceptance Criteria

- [ ] **BUG FIXED**: Created inspections appear on listing page immediately
- [ ] AQL calculator returns correct sample size for any lot size
- [ ] Category-specific checkpoints load when category is selected
- [ ] Defects can be recorded with severity (Critical/Major/Minor)
- [ ] Inspection result auto-calculates based on AQL accept/reject
- [ ] Photos upload to Supabase Storage successfully
- [ ] `inspection_passed` / `inspection_failed` notifications fire

---

## STEP 5 — Factories & Audits + WRAP Implementation

**References**: `SankalphHub_Step5_Factories_Audits_Review.docx` + `SankalphHub_Factory_Audit_Implementation_Spec.docx`
**Prerequisites**: Step 4 complete
**Estimated effort**: 5–7 days

### 5.1 Factory Management

1. **Factory profile page**:
   - Factory name, location (city, country), contact info
   - Category specialization (which of the 5 categories this factory handles)
   - Capacity: max concurrent orders, production lines count
   - Compliance status badge: GREEN (≥85%), YELLOW (70–84%), RED (<70%), N/A (no audits)
   - Photo gallery (Supabase Storage `factory-photos` bucket)

2. **Factory listing**:
   - Card or table view with search + filters (country, category, compliance status)
   - Sort by: name, compliance score, last audit date
   - Quick stats: total factories, by compliance status, by country

### 5.2 Factory Audit System (WRAP-Aligned)

**This is a major feature build.** The audit system uses a G/Y/R/N/A rating system across 21+ checkpoints, expanding to ~35 WRAP-aligned checkpoints.

#### Audit Rating System

| Rating | Meaning | Score Weight |
|--------|---------|-------------|
| G (Green) | Fully compliant | Counts toward score |
| Y (Yellow) | Minor non-compliance, corrective action planned | Counts toward score |
| R (Red) | Major non-compliance, immediate action required | Does NOT count toward score |
| N/A | Not applicable to this factory | Excluded from denominator |

#### Score Formula

```
Score % = (G count + Y count) / (Total checkpoints - N/A count) × 100
```

Example: 15 Green + 3 Yellow + 2 Red + 1 N/A = (15+3)/(21-1) = 90%

#### WRAP 12 Principles → Audit Sections

**Section 1: Employment Practices (Checkpoints 1–8)**
1. Prohibition of Forced Labor
2. Prohibition of Child Labor
3. Prohibition of Harassment/Abuse
4. Compensation & Benefits (meets minimum wage)
5. Hours of Work (within legal limits)
6. Prohibition of Discrimination
7. Freedom of Association
8. Employment contracts and documentation

**Section 2: Health, Safety & Environment (Checkpoints 9–16)**
9. Health & Safety Management System
10. Fire Safety (extinguishers, exits, drills)
11. First Aid & Medical Facilities
12. Machine Safety & Guarding
13. Chemical/Hazardous Material Handling
14. PPE (Personal Protective Equipment) Provision
15. Environmental Compliance
16. Waste Management & Disposal

**Section 3: Management & Security (Checkpoints 17–21+)**
17. Legal Compliance (business licenses, permits)
18. Sub-contracting Controls
19. Security Procedures (customs-trade compliance)
20. Management Systems (corrective action tracking)
21. Record Keeping & Documentation

**Additional WRAP-aligned checkpoints (22–35)** — expand each section:
22. Dormitory conditions (if applicable)
23. Emergency evacuation procedures
24. Electrical safety
25. Structural integrity of buildings
26. Ventilation and lighting
27. Canteen/dining hygiene
28. Worker grievance mechanism
29. Anti-corruption policy
30. Supply chain transparency
31. Water management
32. Energy efficiency practices
33. Restricted substances compliance (REACH, CPSIA)
34. Product safety testing records
35. Worker training records

#### Audit Form Implementation

```typescript
// Type definition for audit checkpoint
interface AuditCheckpoint {
  id: number
  section: 'employment' | 'health_safety' | 'management'
  wrap_principle: string
  description: string
  rating: 'G' | 'Y' | 'R' | 'NA' | null  // null = not yet rated
  notes: string
  photo_urls: string[]                      // evidence photos
  corrective_action: string | null          // required if Y or R
  corrective_deadline: string | null        // ISO date
}

// Score calculation
function calculateAuditScore(checkpoints: AuditCheckpoint[]): number {
  const rated = checkpoints.filter(c => c.rating !== 'NA' && c.rating !== null)
  const passing = rated.filter(c => c.rating === 'G' || c.rating === 'Y')
  return rated.length > 0 ? (passing.length / rated.length) * 100 : 0
}
```

#### Database Schema

```sql
-- Factory audits table
factory_audits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id),
  factory_id    UUID REFERENCES factories(id),
  auditor_id    UUID REFERENCES auth.users(id),
  audit_date    DATE NOT NULL,
  status        TEXT DEFAULT 'draft',  -- draft, in_progress, completed, approved
  total_score   DECIMAL(5,2),
  g_count       INTEGER DEFAULT 0,
  y_count       INTEGER DEFAULT 0,
  r_count       INTEGER DEFAULT 0,
  na_count      INTEGER DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
)

-- Audit checkpoint responses
audit_responses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id            UUID REFERENCES factory_audits(id) ON DELETE CASCADE,
  checkpoint_number   INTEGER NOT NULL,
  section             TEXT NOT NULL,
  wrap_principle      TEXT NOT NULL,
  description         TEXT NOT NULL,
  rating              TEXT,  -- G, Y, R, NA
  notes               TEXT,
  corrective_action   TEXT,
  corrective_deadline DATE,
  photo_urls          TEXT[],
  created_at          TIMESTAMPTZ DEFAULT now()
)

-- RLS: Users see only their org's audits
CREATE POLICY "Users see own org audits" ON factory_audits
  FOR SELECT USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));
```

### 5.3 Files to Touch

```
app/(dashboard)/factories/page.tsx                    — Factory listing
app/(dashboard)/factories/[id]/page.tsx               — Factory profile
app/(dashboard)/factories/[id]/audits/page.tsx        — Audit history for factory
app/(dashboard)/factories/[id]/audits/new/page.tsx    — New audit form
app/(dashboard)/factories/[id]/audits/[auditId]/page.tsx — Audit detail/report
app/(dashboard)/factories/actions.ts                  — Server actions
components/factories/FactoryCard.tsx                   — Factory list card
components/factories/ComplianceBadge.tsx               — G/Y/R status badge
components/audits/AuditForm.tsx                        — WRAP audit form (35 checkpoints)
components/audits/AuditScoreCard.tsx                   — Score summary display
components/audits/CheckpointRow.tsx                    — Individual checkpoint rating row
lib/audit-checkpoints.ts                              — Checkpoint definitions (35 items)
lib/validations/audit.ts                              — Zod schemas
```

### 5.4 Acceptance Criteria

- [ ] Factory profiles display with category, capacity, and compliance badge
- [ ] Audit form renders all 35 WRAP-aligned checkpoints in 3 sections
- [ ] G/Y/R/N/A rating works on each checkpoint
- [ ] Score auto-calculates using formula: (G+Y)/(Total-NA) × 100
- [ ] Corrective action field required for Y and R ratings
- [ ] Evidence photos upload to Supabase Storage
- [ ] Completed audit triggers `audit_completed` notification
- [ ] Failed audit (<70%) triggers `audit_failed` notification
- [ ] Audit report exportable as PDF (jsPDF)

---

## STEP 6 — Projects + Bug Fix

**Reference**: `SankalphHub_Step6_Projects_Review.docx`
**Prerequisites**: Step 5 complete
**Estimated effort**: 2–3 days

### 6.1 CRITICAL BUG FIX: Projects Listing Persistence

**Bug**: Projects complete the full 4-step wizard but don't appear on the listing page. Same root cause as Step 4 inspection bug.

**Apply the same investigation and fix pattern from Step 4.1.** Specifically:
1. Ensure `org_id` is attached on insert
2. Ensure `revalidatePath('/projects')` is called after insert
3. Verify RLS SELECT policy matches
4. Verify listing query filters match inserted status value

### 6.2 Project 4-Step Wizard Enhancements

The project creation wizard has 4 steps:

**Step 1: Basic Info** — Project name, factory selection, category (Garments/Footwear/Gloves/Headwear/Accessories), PO number, delivery date

**Step 2: Size Breakdown** — Size matrix with quantities per size.
- **Fix**: Validate that size quantities sum to the total order quantity
- Currently there's a mismatch (e.g., 1,070 entered vs 2,000 total) — add real-time sum validation

**Step 3: Inspection Plan** — Link inspections to this project, set AQL levels, define inspection stages per category:
- Garments: Inline → Pre-final → Final
- Footwear: Materials → In-process → Pre-final → Final
- Gloves: Materials → Mid-production → Final
- Headwear: Materials → In-process → Final
- Accessories: Components → Assembly → Final

**Step 4: Review & Submit** — Summary of all data, confirm and create

### 6.3 Projects Listing Enhancements

- Status columns: Draft, Active, Completed, Cancelled
- Filter by: factory, category, status, date range
- Sort by: delivery date (urgent first), creation date, factory name
- Show: progress indicator (inspections completed / total planned)
- Overdue badge: if delivery_date < today and status ≠ Completed

### 6.4 Files to Touch

```
app/(dashboard)/projects/page.tsx              — Listing (FIX: query + revalidation)
app/(dashboard)/projects/new/page.tsx          — 4-step wizard
app/(dashboard)/projects/[id]/page.tsx         — Project detail
app/(dashboard)/projects/actions.ts            — Server actions (FIX: org_id + revalidate)
components/projects/ProjectWizard.tsx          — 4-step form
components/projects/SizeBreakdown.tsx          — Size matrix with sum validation
components/projects/InspectionPlan.tsx         — Category-specific inspection stages
lib/validations/project.ts                     — Zod schemas
```

### 6.5 Acceptance Criteria

- [ ] **BUG FIXED**: Created projects appear on listing page immediately
- [ ] Size breakdown validates quantities sum to total
- [ ] Category-specific inspection stages display correctly
- [ ] Listing page filters and sorts work
- [ ] Overdue projects show warning badge
- [ ] Project detail page shows linked inspections with status

---

# ═══════════════════════════════════════════
# PHASE 2: CORE MODULES — NEW BUILDS
# ═══════════════════════════════════════════

---

## STEP 7 — Planning Module (NEW BUILD)

**Reference**: `SankalphHub_Step7_Planning_Module_Spec.docx`
**Prerequisites**: Step 6 complete (Projects working correctly)
**Estimated effort**: 7–10 days

> **Note**: This section is completely new — no existing UI or data. Build from scratch following this specification.

### 7.1 Module Overview

The Planning module has 4 sub-modules:

```
Planning
├── Production Planning    — Order allocation to factories with capacity checks
├── Timeline View         — Gantt-style view of production stages
├── Daily Production Report (DPR) — Daily output tracking against targets
└── WIP Tracker           — Work-in-progress across production stages
```

### 7.2 Database Schema

```sql
-- Production plans
production_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organizations(id),
  project_id      UUID REFERENCES projects(id),
  factory_id      UUID REFERENCES factories(id),
  category        TEXT NOT NULL,  -- garments, footwear, gloves, headwear, accessories
  planned_start   DATE NOT NULL,
  planned_end     DATE NOT NULL,
  total_quantity  INTEGER NOT NULL,
  daily_target    INTEGER NOT NULL,  -- total_quantity / working days
  status          TEXT DEFAULT 'planned',  -- planned, active, completed, delayed
  created_at      TIMESTAMPTZ DEFAULT now()
)

-- Daily production reports
daily_production_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID REFERENCES production_plans(id),
  report_date     DATE NOT NULL,
  stage           TEXT NOT NULL,  -- category-specific stage (e.g., 'cutting', 'sewing')
  target_qty      INTEGER NOT NULL,
  actual_qty      INTEGER NOT NULL,
  defect_qty      INTEGER DEFAULT 0,
  efficiency_pct  DECIMAL(5,2),  -- (actual_qty / target_qty) * 100
  notes           TEXT,
  reported_by     UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan_id, report_date, stage)
)

-- WIP tracking
wip_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID REFERENCES production_plans(id),
  stage           TEXT NOT NULL,
  quantity        INTEGER NOT NULL,
  status          TEXT DEFAULT 'in_progress',  -- in_progress, completed, held
  updated_at      TIMESTAMPTZ DEFAULT now()
)
```

### 7.3 Production Planning

**Purpose**: Allocate orders to factories, check capacity, set daily targets.

**UI**: Form with:
- Select project (from Projects list)
- Select factory (show capacity indicator: X/Y orders)
- Category auto-fills from project
- Date range picker (start → end)
- Total quantity (auto-fills from project)
- Daily target auto-calculates: `total_quantity / working_days` (exclude weekends)
- Capacity warning if factory already at max concurrent orders

**Category-specific production stages** (used throughout Planning):

| Category | Stages |
|----------|--------|
| Garments | Cutting → Sewing → Finishing → Packing → QC |
| Footwear | Upper Preparation → Sole Making → Lasting → Finishing → QC |
| Gloves | Cutting → Sewing → Turning → Inspection → Packing |
| Headwear | Cutting → Forming → Assembly → Finishing → QC |
| Accessories | Component Prep → Assembly → Finishing → QC → Packing |

### 7.4 Timeline View

**Purpose**: Gantt-style visualization of all active production plans.

**UI**: Horizontal timeline with:
- Y-axis: Factory names
- X-axis: Calendar dates (scrollable)
- Bars: Color-coded by category
- Each bar shows stages as segments within the bar
- Today marker: vertical red line
- Overdue highlighting: red background on bars past planned_end that aren't completed
- Click bar → opens production plan detail

**Implementation**: Use a custom component with CSS Grid or a lightweight Gantt library. Recharts isn't ideal for Gantt — consider building with CSS Grid + date-fns for date calculations.

### 7.5 Daily Production Report (DPR)

**Purpose**: Factory managers log daily output per production stage.

**UI**: Table-based input form:
- Date selector (defaults to today)
- Production plan selector
- Rows: one per active stage for the selected plan
- Columns: Stage | Target Qty | Actual Qty | Defects | Efficiency %
- Efficiency auto-calculates: `(actual / target) * 100`
- Color coding: ≥100% green, 80–99% amber, <80% red
- Submit button saves all rows at once

**Triggers**:
- When efficiency < 80% for any stage → `production_behind` notification
- When actual_qty meets cumulative target → `production_target_met` notification

### 7.6 WIP Tracker

**Purpose**: Real-time view of work-in-progress quantities at each production stage.

**UI**: Kanban-style board:
- Columns = production stages (category-specific)
- Cards = quantity batches with status
- Visual flow: items move left→right through stages
- Stage totals shown at column header
- "Bottleneck" indicator: if one stage has significantly more WIP than downstream stages

### 7.7 Files to Create

```
app/(dashboard)/planning/page.tsx                    — Planning overview/tab container
app/(dashboard)/planning/production/page.tsx          — Production plans list + create
app/(dashboard)/planning/timeline/page.tsx            — Gantt timeline view
app/(dashboard)/planning/dpr/page.tsx                 — DPR entry + history
app/(dashboard)/planning/wip/page.tsx                 — WIP kanban board
app/(dashboard)/planning/actions.ts                   — Server actions for all planning
components/planning/ProductionPlanForm.tsx             — Plan creation form
components/planning/TimelineGantt.tsx                  — Gantt chart component
components/planning/DPREntryTable.tsx                  — Daily report input table
components/planning/WIPBoard.tsx                       — Kanban WIP tracker
components/planning/StageColumns.tsx                   — Category-specific stage config
lib/planning/stages.ts                                — Stage definitions per category
lib/planning/calculations.ts                          — Daily target, efficiency calcs
lib/validations/planning.ts                           — Zod schemas
```

### 7.8 Acceptance Criteria

- [ ] Production plan creates with capacity check
- [ ] Daily target auto-calculates correctly (excluding weekends)
- [ ] Timeline renders Gantt bars for all active plans
- [ ] DPR form saves daily output per stage
- [ ] Efficiency auto-calculates and color-codes
- [ ] WIP board shows quantities per stage
- [ ] `production_behind` notification fires when efficiency < 80%
- [ ] All 5 category stage configurations work correctly

---

# ═══════════════════════════════════════════
# PHASE 3: INTELLIGENCE & CONTROLS
# ═══════════════════════════════════════════

---

## STEP 8 — Analytics Engine

**Reference**: `SankalphHub_Step8_Analytics_Spec.docx`
**Prerequisites**: Steps 4–7 complete (data flowing from inspections, audits, projects, planning)
**Estimated effort**: 5–7 days

### 8.1 Cody Hughes' 4 Core KPIs

These 4 metrics were specifically requested and are the foundation of the analytics engine:

| # | KPI | Formula | Visualization |
|---|-----|---------|--------------|
| 1 | **Pass/Fail Rate** | (Passed inspections / Total inspections) × 100 | Donut chart + trend line |
| 2 | **Defect Counts** | Count by severity: Critical, Major, Minor | Stacked bar chart by period |
| 3 | **OQR% (Outgoing Quality Rate)** | (Units shipped without defects / Total units shipped) × 100 | Gauge chart + trend |
| 4 | **FP AQL%** | (Inspections passing AQL on first attempt / Total inspections) × 100 | KPI card + trend |

### 8.2 Full Metrics Suite (26 Total)

**Quality Metrics (8)**:
1. Pass/Fail Rate (Cody KPI)
2. Defect Counts by Severity (Cody KPI)
3. OQR% (Cody KPI)
4. FP AQL% (Cody KPI)
5. Defect Density — defects per 100 units inspected
6. Defect Pareto — top 5 defect types by frequency (80/20 analysis)
7. Repeat Defect Rate — same defect at same factory within 30 days
8. Category Defect Comparison — defect rates across Garments/Footwear/Gloves/Headwear/Accessories

**Factory Metrics (6)**:
9. Factory Compliance Score — average audit score per factory
10. Audit Trend — score changes over time per factory
11. Corrective Action Completion Rate — closed/total corrective actions
12. Factory Risk Matrix — compliance score × defect rate scatter plot
13. WRAP Section Scores — breakdown by Employment/H&S/Management
14. Factory Comparison Ranking — all factories sorted by composite score

**Production Metrics (6)**:
15. On-Time Delivery Rate — projects completed by planned_end
16. Production Efficiency — actual vs target output (from DPR)
17. Stage Bottleneck Analysis — which stages consistently underperform
18. Capacity Utilization — active orders / max capacity per factory
19. Lead Time Analysis — average days from order creation to completion
20. WIP Aging — items in a stage > expected duration

**Operational Metrics (6)**:
21. Inspections per Month — volume trending
22. Average Inspection Duration — time from scheduled to completed
23. Inspector Productivity — inspections per inspector per week
24. Template Usage — which templates are used most
25. Response Time — time from critical notification to acknowledgment
26. Platform Usage — active users, login frequency, feature adoption

### 8.3 Dashboard Layout

```
Analytics Page Layout:
┌──────────────────────────────────────────────┐
│  Date Range Picker  │  Category Filter  │  Factory Filter  │  Export  │
├──────────┬──────────┬──────────┬──────────────┤
│ Pass/Fail│ Defect   │ OQR%     │ FP AQL%      │   ← Cody's 4 KPIs
│ Rate     │ Counts   │          │              │      (always visible)
├──────────┴──────────┴──────────┴──────────────┤
│  Tabs: Quality │ Factory │ Production │ Ops   │
├───────────────────────────────────────────────┤
│                                               │
│  Tab content: charts + tables for that group  │
│                                               │
└───────────────────────────────────────────────┘
```

### 8.4 Report Generation

**Automated reports** (future — requires email service):
- Weekly Quality Summary: Pass rate, top defects, trend
- Monthly Factory Scorecard: Audit scores, corrective actions, compliance status
- Quarterly Executive Report: All 26 metrics with narrative

**Manual export** (implement now):
- "Export to PDF" button (jsPDF) — current dashboard view
- "Export to Excel" button (xlsx) — raw data with all metrics
- "Share Report" — generates a shareable link (read-only view)

### 8.5 Files to Create

```
app/(dashboard)/analytics/page.tsx                   — Analytics dashboard container
app/(dashboard)/analytics/layout.tsx                 — Tab layout (Quality/Factory/Production/Ops)
components/analytics/KPIRow.tsx                      — Cody's 4 KPI cards (always visible)
components/analytics/QualityTab.tsx                  — Quality metrics charts
components/analytics/FactoryTab.tsx                  — Factory metrics charts
components/analytics/ProductionTab.tsx               — Production metrics charts
components/analytics/OpsTab.tsx                      — Operational metrics charts
components/analytics/DateRangeFilter.tsx             — Date range + category + factory filters
components/analytics/ExportButtons.tsx               — PDF + Excel export
lib/analytics/queries.ts                            — All Supabase queries for metrics
lib/analytics/calculations.ts                       — Metric calculation functions
lib/analytics/export-pdf.ts                         — jsPDF report generation
lib/analytics/export-excel.ts                       — xlsx export generation
```

### 8.6 Acceptance Criteria

- [ ] Cody's 4 KPIs display prominently at top (Pass/Fail, Defects, OQR%, FP AQL%)
- [ ] All 26 metrics calculate correctly from real data
- [ ] Date range and category filters work across all charts
- [ ] Charts render properly (Recharts) with empty-state handling
- [ ] PDF export generates a readable report
- [ ] Excel export includes raw data for all visible metrics
- [ ] Role-based: Viewers see dashboard, only Professional+ can export

---

## STEP 9 — Settings (7 Sub-sections + Session Management)

**Reference**: `SankalphHub_Step9_Settings_Review.docx`
**Prerequisites**: Step 8 complete
**Estimated effort**: 4–5 days

### 9.1 Access Control Architecture

**CRITICAL RULE**: All Settings sections are VIEW-ONLY for non-admin users. Only Admin can make changes.

```typescript
// Settings access check — use on every settings page
const isAdmin = profile.role === 'super_admin' || profile.role === 'brand_manager'

// For non-admin users:
// - All form fields: disabled
// - All buttons: hidden or disabled
// - Show banner: "Settings are view-only. Contact your admin to request changes."
// - "Request Change" button: sends notification to admin
```

### 9.2 Settings Sub-sections

**Tab 1: General** — Organization name, logo upload, timezone, currency, default category

**Tab 2: Users & Roles** — User list, invite users (seat check against plan), assign roles (Super Admin, Brand Manager, Factory Manager, Inspector, Viewer), deactivate users. Domain lock enforcement.

**Tab 3: Templates** — Inspection template management. List, create, edit, duplicate, delete templates.
- **BUG FIX**: Template creation fails for "Report" and "Workflow" types with error toast "Failed to create template". Investigate: the API probably only handles the "Inspection" type. Check the server action and ensure it handles all template types.

**Tab 4: Defect Library** — View and manage the 94 defect types. Add custom defects (Professional+ plan). Map defects to categories. Set severity defaults.

**Tab 5: AQL Configuration** — Default AQL level (I, II, III), default inspection level, custom AQL thresholds per category.

**Tab 6: Notifications** — See Step 11 for full spec (notification preferences page).

**Tab 7: Billing** — See Step 10 for full spec (PremiumHub billing page).

### 9.3 Session Management

Add to Settings (General or as a separate section):

**Session timeout with role-based tiers**:

| Role | Timeout | Rationale |
|------|---------|-----------|
| Inspector | 30 min | Factory floor — shared devices, security risk |
| Factory Manager | 30 min | Factory floor — shared devices |
| Brand Manager | 60 min | Office environment |
| Super Admin | 60 min | Office environment |
| Viewer | 45 min | Moderate — may be on shared devices |

**Timeout flow** (4 steps):
1. At `timeout - 5 min`: Show warning banner — "Your session will expire in 5 minutes. Click here to extend."
2. At `timeout - 1 min`: Show modal dialog — "Session expiring in 60 seconds" with countdown and "Extend Session" button
3. At `timeout`: Auto-logout. Redirect to login page with message "Session expired for security. Please log in again."
4. Save unsaved work: Before timeout, attempt to auto-save any form data to localStorage (restore on next login)

**Implementation**:
```typescript
// lib/session-timeout.ts
import { useEffect, useRef } from 'react'

const ROLE_TIMEOUTS: Record<string, number> = {
  inspector: 30 * 60 * 1000,      // 30 min
  factory_manager: 30 * 60 * 1000,
  brand_manager: 60 * 60 * 1000,  // 60 min
  super_admin: 60 * 60 * 1000,
  viewer: 45 * 60 * 1000          // 45 min
}

// Reset timer on: mouse move, keypress, click, scroll, touch
// Show warning at timeout - 5min
// Show modal at timeout - 1min
// Logout at timeout
```

**No sidebar Logout button** — the platform auto-logs out on inactivity. Remove the manual logout button from the sidebar.

### 9.4 Permissions Matrix

```
Feature              | Super Admin | Brand Manager | Factory Manager | Inspector | Viewer
---------------------|-------------|---------------|-----------------|-----------|-------
Settings (edit)      | ✓           | ✓             | ✗ (view-only)   | ✗         | ✗
Users & Roles        | ✓           | ✓ (no SA)     | ✗               | ✗         | ✗
Templates (CRUD)     | ✓           | ✓             | ✓ (own only)    | ✗         | ✗
Inspections (create) | ✓           | ✓             | ✓               | ✓         | ✗
Inspections (view)   | ✓           | ✓             | ✓ (own factory) | ✓ (own)   | ✓
Audits (create)      | ✓           | ✓             | ✗               | ✗         | ✗
Audits (view)        | ✓           | ✓             | ✓ (own factory) | ✗         | ✓
Projects (create)    | ✓           | ✓             | ✗               | ✗         | ✗
Planning (edit)      | ✓           | ✓             | ✓               | ✗         | ✗
Analytics (view)     | ✓           | ✓             | ✓               | ✓         | ✓
Analytics (export)   | ✓           | ✓             | ✗               | ✗         | ✗
Factory Audit        | ✓           | ✓             | ✗               | ✗         | ✗
```

### 9.5 Files to Touch

```
app/(dashboard)/settings/page.tsx                    — Settings container with tabs
app/(dashboard)/settings/general/page.tsx            — General settings
app/(dashboard)/settings/users/page.tsx              — Users & Roles
app/(dashboard)/settings/templates/page.tsx          — Templates (FIX: Report/Workflow creation bug)
app/(dashboard)/settings/defects/page.tsx            — Defect Library
app/(dashboard)/settings/aql/page.tsx                — AQL Configuration
app/(dashboard)/settings/notifications/page.tsx      — Notification preferences (Step 11)
app/(dashboard)/settings/billing/page.tsx            — Billing (Step 10)
app/(dashboard)/settings/actions.ts                  — Server actions
components/settings/SettingsGuard.tsx                — View-only wrapper for non-admin
components/settings/SessionTimeoutProvider.tsx       — Session timeout logic
lib/session-timeout.ts                              — Timeout configuration + hooks
lib/permissions.ts                                  — Role-based permission checks
```

### 9.6 Acceptance Criteria

- [ ] All 7 settings tabs render correctly
- [ ] Non-admin users see view-only mode with disabled fields
- [ ] "Request Change" button sends notification to admin
- [ ] **Template BUG FIXED**: Report and Workflow types create successfully
- [ ] Session timeout fires at correct interval per role
- [ ] Warning shown at T-5min, modal at T-1min, logout at T-0
- [ ] Permissions matrix enforced across all modules

---

## STEP 10 — PremiumHub (Billing & Monetization)

**Reference**: `SankalphHub_Step10_PremiumHub_Review.docx`
**Prerequisites**: Step 9 complete (Settings framework in place)
**Estimated effort**: 8–10 days (4 phases)

### 10.1 New Dependency: Install Stripe

```bash
npm install stripe @stripe/stripe-js
```

Add environment variables:
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 10.2 Database Additions

```sql
-- Add to organizations table
ALTER TABLE organizations ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE organizations ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE organizations ADD COLUMN billing_email TEXT;
ALTER TABLE organizations ADD COLUMN plan_changed_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN billing_cycle TEXT DEFAULT 'monthly';  -- monthly, annual
ALTER TABLE organizations ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT false;

-- New table: usage counters
CREATE TABLE usage_counters (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID REFERENCES organizations(id),
  period                DATE NOT NULL,  -- first day of billing month
  inspections_count     INTEGER DEFAULT 0,
  projects_count        INTEGER DEFAULT 0,
  templates_count       INTEGER DEFAULT 0,
  ai_generations_count  INTEGER DEFAULT 0,
  factory_audits_count  INTEGER DEFAULT 0,
  UNIQUE(org_id, period)
);

-- New table: feature flags
CREATE TABLE plan_features (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  trial       JSONB NOT NULL,       -- { enabled: false } or { enabled: true, limit: 10 }
  starter     JSONB NOT NULL,
  professional JSONB NOT NULL,
  enterprise  JSONB NOT NULL
);
```

### 10.3 Plan Tiers

| Feature | Trial (21d) | Starter ($49/mo) | Professional ($149/mo) | Enterprise (Custom) |
|---------|-------------|-------------------|----------------------|-------------------|
| Users | 3 | 10 | 50 | Unlimited |
| Factories | 2 | 10 | 50 | Unlimited |
| Inspections/mo | 20 | 100 | 500 | Unlimited |
| Projects/mo | 5 | 25 | 100 | Unlimited |
| Categories | Garments only | All 5 | All 5 | All + Custom |
| WRAP Audit | No | Standard 21-pt | Full WRAP + Custom | Full + Multi-framework |
| Planning Module | No | Production Planning | Full (DPR, WIP, Timeline) | Full + Integrations |
| Analytics | Summary only | Full KPI suite | Full + Export | Full + API + Custom |
| AI Generations/mo | 10 | 50 | 200 | Unlimited |

### 10.4 Implementation Phases

**Phase 1 (Week 1-2): Payment Infrastructure**
1. Install Stripe SDK
2. Create Stripe products + prices (Starter monthly, annual; Professional monthly, annual)
3. Build `POST /api/billing/create-checkout` — creates Stripe Checkout Session
4. Build `POST /api/billing/create-portal` — creates Stripe Customer Portal session
5. Build `POST /api/webhooks/stripe` — handles webhook events with signature verification
6. Handle `checkout.session.completed`: update org plan, save stripe IDs, clear trial lock
7. Handle `customer.subscription.updated`: sync plan changes
8. Handle `invoice.payment_failed`: send failure notification
9. Update PremiumHub badge in header to show dynamic plan status

**Phase 2 (Week 3-4): Enforcement + Trial Automation**
1. Create `usage_counters` table + increment function
2. Add quota check middleware: before every inspection/project/template/audit creation, check count vs plan limit
3. Build daily trial expiry cron (Vercel Cron or Supabase Edge Function):
   - 7 days left → warning notification
   - 3 days left → warning notification + email (when email service added)
   - 1 day left → urgent notification
   - 0 days → set `is_trial_locked = true` → read-only mode
4. Implement read-only mode: users can view but not create
5. Build usage dashboard on billing settings page

**Phase 3 (Week 5-6): Feature Gates + UX**
1. Build PremiumGate v2 component (replaces hardcoded PremiumGate):
   - Boolean gates: locked overlay with plan name + upgrade CTA
   - Quota gates: usage bar with 80%/100% thresholds
2. Build upgrade modal with plan comparison
3. Category gating: Trial users restricted to Garments only
4. Build `/pricing` public page

**Phase 4 (Week 7-8): Enterprise + Growth**
1. Enterprise "Contact Sales" flow
2. Annual billing discount (20% off)
3. Plan downgrade flow
4. Admin analytics: MRR dashboard

### 10.5 Key Files

```
app/api/billing/create-checkout/route.ts    — Stripe Checkout session
app/api/billing/create-portal/route.ts      — Stripe Customer Portal
app/api/webhooks/stripe/route.ts            — Stripe webhook handler
app/api/cron/trial-expiry/route.ts          — Daily trial check cron
app/(marketing)/pricing/page.tsx            — Public pricing page
app/(dashboard)/settings/billing/page.tsx   — Enhanced billing settings
components/premium/PremiumGate.tsx          — v2 feature gate component
components/premium/UpgradeModal.tsx         — Plan comparison + upgrade
components/premium/PlanBadge.tsx            — Header badge (dynamic)
components/premium/UsageBar.tsx             — Quota usage visualization
lib/stripe.ts                              — Stripe client initialization
lib/billing/check-quota.ts                 — Quota enforcement middleware
lib/billing/plans.ts                       — Plan definitions + limits
```

### 10.6 Acceptance Criteria

- [ ] Stripe Checkout creates sessions correctly
- [ ] Webhooks process payment events and update org plan
- [ ] Trial expires after 21 days (read-only mode, not data deletion)
- [ ] Quota enforcement blocks creation past plan limits
- [ ] PremiumGate v2 shows locked overlays for gated features
- [ ] Upgrade modal displays plan comparison correctly
- [ ] Trial users limited to Garments category only
- [ ] PremiumHub badge in header reflects current plan dynamically

---

## STEP 11 — Notification Bell & Sound System

**Reference**: `SankalphHub_Step11_Notification_Bell_Review.docx`
**Prerequisites**: Step 10 complete (PremiumHub events feed into notifications)
**Estimated effort**: 3–5 days

### 11.1 Wire the 8 Unwired Events

These events exist in the schema but no `createNotification()` call fires them. Add the call in the specified location:

| Event | Where to Add `createNotification()` | Trigger Condition | is_critical | sound_category |
|-------|-------------------------------------|-------------------|-------------|---------------|
| `critical_defect` | `inspections/actions.ts` (defect save) | severity === 'critical' | true | inspection_fail |
| `inspection_failed` | `inspections/actions.ts` (result submit) | AQL result = FAIL | true | inspection_fail |
| `inspection_passed` | `inspections/actions.ts` (result submit) | AQL result = PASS | false | inspection_pass |
| `order_delayed` | `projects/actions.ts` (status update) | actual_date > planned_date | true | factory |
| `factory_at_capacity` | `projects/actions.ts` (order create) | factory.order_count >= capacity | true | factory |
| `report_submitted` | `reports/actions.ts` (submit) | status → submitted | false | brand |
| `report_approved` | `reports/actions.ts` (approve) | status → approved | false | brand |
| `plan_upgraded` | `webhooks/stripe` or admin `changePlan()` | plan tier increases | false | brand |

**Pattern for each**:
```typescript
import { createNotification } from '@/lib/notifications'

// Inside the server action, after the main operation succeeds:
await createNotification({
  org_id: profile.org_id,
  user_id: targetUserId,      // or null for org-wide
  event_type: 'critical_defect',
  sound_category: 'inspection_fail',
  title: 'Critical Defect Found',
  detail: `${defectName} found during inspection #${inspectionId}`,
  link: `/inspections/${inspectionId}`,
  is_critical: true
})
```

### 11.2 New Fashion Manufacturing Events

Add these new event types (requires adding `createNotification()` calls in the corresponding features built in Steps 5-7):

| Event | Source Module | Trigger |
|-------|-------------|---------|
| `audit_scheduled` | Step 5 (Audits) | Factory audit created |
| `audit_completed` | Step 5 (Audits) | Audit score submitted |
| `audit_failed` | Step 5 (Audits) | Audit score < 70% |
| `production_target_met` | Step 7 (DPR) | Daily target reached |
| `production_behind` | Step 7 (DPR) | Efficiency < 80% |
| `shipment_deadline` | Step 6 (Projects) | 3 days before ship date (cron) |
| `defect_trend_alert` | Step 4 (Inspections) | Same defect 3+ times in 24h |
| `trial_expiring` | Step 10 (PremiumHub) | Trial days ≤ 7 |

### 11.3 Notification Preferences Settings Page

Build at `app/(dashboard)/settings/notifications/page.tsx`:

**Section A: Global Sound Settings**
- Master sound toggle (sync with in-panel toggle)
- Volume slider (0–100%, controls Web Audio API gain)
- Quiet hours (start/end time pickers)
- Sound preview buttons per category

**Section B: Per-Event Configuration Table**
- Columns: Event Name | In-App | Sound | Email
- Some events have "locked on" in-app (cannot disable critical events)
- Save to `profiles.notification_preferences` JSON field

**Section C: Role-Based Defaults**
- Super Admin: All ON
- Brand Manager: Critical + email ON, non-critical in-app only
- Factory Manager: Production + factory events ON with sound
- Inspector: Inspection events only, minimal noise
- Viewer: Reports only, in-app, no sounds

### 11.4 Bell UI Enhancements

1. **Mark All as Read**: Button at top of dropdown
2. **Group by Time**: "Today", "Yesterday", "This Week", "Earlier"
3. **Inline Action Buttons**: "View Inspection", "Review Report", "Open Audit"
4. **Sound Category Dot**: Colored dot per notification (gold/brown/green/red/grey)
5. **Badge Cap**: Max display "99+" for unread count
6. **Empty State**: Bell + checkmark icon with "All caught up!"

### 11.5 New Sound Categories

Add to the existing Web Audio API procedural sound system:

| Category | Sound | Technical Spec |
|----------|-------|---------------|
| `audit_complete` | Firm double-tap | Two square waves (D4, D5), fast decay |
| `deadline_warning` | Ticking acceleration | Pulse at 200ms→100ms→50ms |
| `production_milestone` | Ascending fanfare | C4→E4→G4→C5, triangle wave, 1.0s |
| `urgent_action` | Sharp double-beep | Two 880Hz square waves, 100ms gap |

### 11.6 Files to Touch/Create

```
components/notifications/NotificationBell.tsx      — Enhance: mark-all, grouping, badge cap
components/notifications/NotificationItem.tsx      — Enhance: action buttons, sound dot
app/(dashboard)/settings/notifications/page.tsx    — NEW: Preferences page
lib/notifications.ts                              — Add new event helper functions
lib/sounds/sounds.ts                              — Add 4 new sound categories
lib/sounds/founderSound.ts                        — Keep as-is (founder exclusive)
```

### 11.7 Acceptance Criteria

- [ ] All 8 previously unwired events now fire notifications
- [ ] New fashion manufacturing events fire from Steps 5, 6, 7
- [ ] Notification preferences page saves to profiles.notification_preferences
- [ ] Per-event in-app/sound/email toggles work
- [ ] Mark All as Read clears all unread
- [ ] Notifications grouped by time period
- [ ] Badge caps at 99+
- [ ] 4 new sound categories play correctly
- [ ] Quiet hours mute sounds during configured window

---

# ═══════════════════════════════════════════
# CROSS-CUTTING CONCERNS
# ═══════════════════════════════════════════

## Email Service (Required for Steps 10 & 11)

**Current state**: No email service installed.
**Recommendation**: Install Resend (best Next.js integration) or SendGrid.

```bash
npm install resend
```

```env
RESEND_API_KEY=re_...
```

**Needed for**:
- Trial expiry warnings (Step 10)
- Payment failure notifications (Step 10)
- Email notification channel (Step 11)
- Daily/weekly digest reports (Step 11)

---

## Testing Strategy

**Current state**: No testing framework installed.
**Recommendation**: Add Vitest + React Testing Library for unit/integration tests.

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Priority test coverage**:
1. AQL calculation logic (Step 4)
2. Audit score calculation (Step 5)
3. Quota enforcement (Step 10)
4. Session timeout logic (Step 9)
5. Notification event firing (Step 11)

---

## Deployment Checklist

Before each step's deployment to production:

- [ ] All Supabase migrations applied
- [ ] RLS policies created for new tables
- [ ] Environment variables set in Vercel
- [ ] Build passes (`npm run build`)
- [ ] No TypeScript errors
- [ ] Responsive test at 320px, 768px, 1024px, 1440px
- [ ] Test with each role (Super Admin, Brand Manager, Factory Manager, Inspector, Viewer)

---

## DOCUMENT INDEX

| # | Document | Purpose |
|---|----------|---------|
| Step 1 | `SankalphHub_Step1_Landing_Page_Review.docx` | Landing page design review |
| Step 2 | `SankalphHub_Step2_Login_Page_Review.docx` | Login page design review |
| Step 3 | `SankalphHub_Step3_Dashboard_Review.docx` | Dashboard design review |
| Step 4 | `SankalphHub_Step4_Inspections_Setup_Review.docx` | Inspections review + bug report |
| Step 5 | `SankalphHub_Step5_Factories_Audits_Review.docx` | Factories & Audits review |
| 5b | `SankalphHub_Factory_Audit_Implementation_Spec.docx` | WRAP-aligned audit specification |
| Step 6 | `SankalphHub_Step6_Projects_Review.docx` | Projects wizard review + bug report |
| Step 7 | `SankalphHub_Step7_Planning_Module_Spec.docx` | Planning module build spec |
| Step 8 | `SankalphHub_Step8_Analytics_Spec.docx` | Analytics engine specification |
| Step 9 | `SankalphHub_Step9_Settings_Review.docx` | Settings + session management |
| Step 10 | `SankalphHub_Step10_PremiumHub_Review.docx` | PremiumHub monetization spec |
| Step 11 | `SankalphHub_Step11_Notification_Bell_Review.docx` | Notification system spec |

---

> **End of Master Implementation Guide**
> Execute Step 1 → Step 11 sequentially. Each step's review .docx has additional detail.
> Founder Console will be addressed separately after all 11 steps are complete.
