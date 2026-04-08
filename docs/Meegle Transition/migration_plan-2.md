# SankalphHub Migration Plan v2 — Deep Fashion Logic Audit
## Generated: 2026-04-07 | Forensic Code-Level Analysis

---

## AUDIT SUMMARY

| Domain | Status | Verdict |
|--------|--------|---------|
| AQL / ISO 2859-1 | Lookup tables implemented | Math correct, enforcement missing |
| Costing (CMT/FOB) | Basic formula works | No landed cost, no DB-level formulas |
| T&A Critical Path | Static offsets only | No delay propagation, no dependencies |
| Inspection Gates | No enforcement | Can skip inline, approve after critical defect |
| Lifecycle Thread | Text-based links | No FK, no gate validation |
| Multi-tenant RLS | Wide open | 8+ pages missing org_id filtering |
| Role Route Guards | None | Any role can hit any URL directly |

---

## 1. THE THREAD — Lifecycle Traceability

### Current Data Flow Map
```
Style (styles.id)
  ├── Tech Pack (tech_packs.style_id) ✓ FK
  ├── BOM (style_bom.style_id) ✓ FK
  ├── Colorways (colorways.style_id) ✓ FK
  ├── Order Bookings (order_bookings.style_id) ✓ FK
  │
  ├── Sample Request (sample_requests.style_number) ✗ TEXT MATCH
  ├── Production Order (production_orders.style_number) ✗ TEXT MATCH
  │     ├── Production Milestones ✓ FK
  │     ├── Daily Logs ✓ FK
  │     └── Shipment (shipments.production_order_id) ✓ FK
  │           ├── Packing Lists ✓ FK
  │           ├── Shipping Documents ✓ FK
  │           └── Milestones ✓ FK
  │
  ├── Cost Sheet (cost_sheets.project_id) ✓ FK (via project, not style)
  ├── Purchase Order (purchase_orders.project_id) ✓ FK (via project)
  └── Invoice (invoices.purchase_order_id) ✓ FK
```

### Broken Links Identified

| Link | Current | Problem | Fix |
|------|---------|---------|-----|
| Style → Production Order | `style_number` TEXT match | Rename breaks chain | Add `style_id UUID FK` |
| Style → Sample Request | `style_number` TEXT match | Same | Add `style_id UUID FK` |
| Style → Cost Sheet | Via project_id only | No direct style link | Add `style_id UUID FK` to cost_sheets |
| Style → Inspection | No link exists | Can't trace which inspections belong to which style | Add `style_id` to inspections |
| Cost Sheet → Style BOM | No link | BOM and cost sheet are independent | Add `style_bom_id` or cross-reference |
| Carrier → Shipment | `carrier_name` TEXT | Should FK to carriers table | Add `carrier_id UUID FK` |
| Certification → Production | No link | Expired certs don't block production | Add gate check |

### Missing org_id Filtering (CRITICAL)

**8 page-level queries using createAdminClient() WITHOUT org_id filter:**

| Page | Table | Risk |
|------|-------|------|
| `/costing` | cost_sheets | Any user sees ALL orgs' cost data |
| `/costing/[id]` | cost_sheets + items | Direct ID access cross-org |
| `/merchandising/styles` | styles | Pricing visible cross-org |
| `/production` | production_orders | Production data exposed |
| `/purchasing/orders` | purchase_orders | PO data exposed |
| `/purchasing/quotations` | quotations | Supplier quotes exposed |
| `/purchasing/invoices` | invoices | Financial data exposed |
| `/logistics` | shipments | Shipping data exposed |
| `/compliance` | multiple tables | Compliance records exposed |

**Pages WITH proper org_id filtering (good examples):**
- `/dashboard` — `.eq('org_id', ctx.orgId)` ✓
- `/analytics` — `.eq('org_id', ctx.orgId)` ✓

### No Route Guards

The dashboard layout (`app/(dashboard)/layout.tsx`) checks authentication but does NOT validate role permissions per route. An inspector can type `/costing` in the URL bar and access the page — the sidebar just hides the nav link.

---

## 2. TECHNICAL FASHION FORMULAS

### AQL (Acceptable Quality Level) — ISO 2859-1

**Status: Lookup tables IMPLEMENTED, enforcement MISSING**

**What exists (`lib/inspection/aql-engine.ts` + `settings/aql/page.tsx`):**
```
LOT_SIZE_TABLE: 15 ranges (2-8 through 500,001+) → Code letters A-R  ✓
CODE_SAMPLE_TABLE: 16 codes → Sample sizes (A=2 through R=2000)      ✓
ACCEPTANCE_TABLE: AQL 1.0/2.5/4.0 with accept/reject pairs           ✓
Critical defect = zero tolerance (any = FAIL)                         ✓
```

**What's missing:**
| Gap | Impact | Fix |
|-----|--------|-----|
| AQL result not persisted to DB | No audit trail of pass/fail | Save calculation result to `inspections` table |
| Sample size can be manually overridden | Invalidates ISO compliance | Lock sample size after AQL calculation |
| Failed inspection doesn't block shipment | Can ship failed goods | Add gate in `createShipment()` |
| Multiple inspections of same type allowed | Duplicate results | Add uniqueness constraint per project + type |
| No re-inspection workflow | After failure, no structured re-check | Add `parent_inspection_id` for re-inspections |

### COSTING — CMT, Fabric Consumption, FOB

**Cost Item Formula (correct):**
```
total_per_garment = consumption × unit_price × (1 + wastage_pct / 100)
```

**CMT Handling:**
- Listed as a BOM category alongside fabric, trims, etc.
- Defaults to `unit: 'pcs'` (correct for CMT — per piece)
- No separate labor rate / efficiency calculation
- No overtime / shift differential

**Margin Calculation (correct but unprotected):**
```
margin_pct = ((actual_fob - total_cost) / actual_fob) × 100
```

**What's missing:**
| Gap | Impact | Fix |
|-----|--------|-----|
| No landed cost (LDP) | Can't calculate true cost to warehouse | Add: LDP = FOB + Freight + Insurance + Duty + Customs + Local Transport |
| No GENERATED ALWAYS column | `total_per_garment` relies on app recalc | Use Postgres GENERATED ALWAYS (already in SQL spec but not enforced) |
| Negative margin allowed | No warning on unprofitable styles | Add threshold warning at <10%, block at <0% |
| Division by zero possible | `actual_fob = 0` crashes margin calc | Add guard: `if (actual_fob <= 0) return null` |
| No currency conversion | Multi-currency stored but not converted | Future enhancement — store in original currency for now |
| Freight/insurance/duty fields missing on cost_sheets | Only on shipments table | Add landed cost fields to cost_sheets |

**Landed Cost Formula (should implement):**
```
Landed Cost = FOB Price
            + Ocean Freight (per unit)
            + Insurance (typically 0.5-1% of FOB)
            + Import Duty (% based on HS code + country)
            + Customs Clearance Fee
            + Local Freight to Warehouse
            + Agent Commission (if applicable)
```

### T&A — Time & Action Critical Path

**Current implementation:**
- Season calendar: 15 milestones with static `offsetWeeks` from start date
- Production milestones: Sequential, each starts day after previous ends
- `updateMilestoneStatus()` calculates delay_days for ONE milestone only

**What's completely missing:**
| Gap | Impact | Fix |
|-----|--------|-----|
| No delay propagation | Upstream delay doesn't shift downstream dates | Implement cascade: when milestone N slips X days, shift milestones N+1...end by X days |
| No critical path analysis | Can't identify bottleneck stages | Calculate longest path through dependency graph |
| No float/slack time | All milestones appear equally urgent | Add `float_days` = latest_start - earliest_start |
| No precedence dependencies | Milestones are independent | Add `depends_on` FK (milestone → milestone) |
| No warning system | Delays are silent | Add: if delay > 0 on any milestone, flag all downstream + final date |
| Cross-module timeline missing | Season calendar, production milestones, shipment ETD are separate | Unified T&A view aggregating all modules |

**Delay Propagation Algorithm (should implement):**
```typescript
async function propagateDelay(milestoneId: string, delayDays: number) {
  // Get all downstream milestones (higher order)
  const { data: downstream } = await supabase
    .from('production_milestones')
    .select('id, planned_start, planned_end, milestone_order')
    .eq('production_order_id', orderId)
    .gt('milestone_order', currentMilestone.milestone_order)
    .order('milestone_order')

  // Shift each downstream milestone by delayDays
  for (const ms of downstream) {
    await supabase.from('production_milestones').update({
      planned_start: addDays(ms.planned_start, delayDays),
      planned_end: addDays(ms.planned_end, delayDays),
      status: 'delayed'
    }).eq('id', ms.id)
  }

  // Flag the production order ex-factory date
  await checkExFactoryImpact(orderId)
}
```

---

## 3. ACCESS & LOGIC GATES

### Illegal Actions (Currently Possible)

| Illegal Action | Current State | Business Risk |
|----------------|--------------|---------------|
| Create Final Inspection without Inline passing | **Allowed** | Goods ship without proper QC progression |
| Create Production Order for `concept` stage style | **Allowed** | Production starts without design/sampling |
| Create Sample Request without approved Tech Pack | **Allowed** | Factory produces from draft specs |
| Ship goods after Failed inspection | **Allowed** | Defective goods reach buyer |
| Approve inspection with Critical defects | **Allowed** | Zero-tolerance violation |
| Move lifecycle backward (in_production → design) | **Allowed** | Status confusion, data integrity |
| Submit audit with Red items missing notes | **Blocked** ✓ | Correctly enforced |
| Create cost sheet without project | **Allowed** | Orphaned cost data |

### Lifecycle Validation (COMPLETELY UNVALIDATED)

```typescript
// Current code — accepts ANY string:
export async function updateStyleLifecycle(styleId: string, stage: string) {
  const { error } = await supabase.from('styles')
    .update({ lifecycle_stage: stage }).eq('id', styleId)
}
```

**Should be:**
```typescript
const VALID_TRANSITIONS: Record<LifecycleStage, LifecycleStage[]> = {
  concept: ['design'],
  design: ['tech_pack'],
  tech_pack: ['sampling'],
  sampling: ['costing'],
  costing: ['approved'],
  approved: ['in_production'],
  in_production: ['delivered'],
  delivered: ['discontinued'],
}

export async function updateStyleLifecycle(styleId: string, newStage: LifecycleStage) {
  const { data: style } = await supabase.from('styles')
    .select('lifecycle_stage').eq('id', styleId).single()

  const allowed = VALID_TRANSITIONS[style.lifecycle_stage]
  if (!allowed?.includes(newStage)) {
    return { success: false, error: `Cannot transition from ${style.lifecycle_stage} to ${newStage}` }
  }
  // ... proceed
}
```

### Sensitive Data Visibility

| Data Type | Who Sees It Now | Who Should See It |
|-----------|----------------|-------------------|
| Wholesale price | Anyone on `/merchandising/styles/[id]` | Brand Manager, Super Admin only |
| Retail price | Same | Brand Manager, Super Admin only |
| Cost sheet margins | Anyone on `/costing` | Brand Manager, Super Admin only |
| Factory labor rates (CMT) | Anyone on `/costing/[id]` | Brand Manager, Super Admin only |
| Supplier pricing | Anyone on `/purchasing` | Brand Manager, Super Admin only |
| Invoice amounts | Anyone on `/purchasing/invoices` | Brand Manager, Super Admin only |
| Audit scores | Anyone on `/audits` | All roles (appropriate) |
| ESG metrics | Anyone on `/compliance/sustainability` | All roles (appropriate) |

---

## 4. UI/UX — THE MEEGLE TRANSFORMATION

### Table Views → Card Components

| Current Table View | Recommended Card Design |
|-------------------|------------------------|
| `/compliance/regulations` (12 rows) | Regulation cards with region flag, category icon, testing/cert badges |
| `/merchandising/orders` | Order cards with style thumbnail, buyer, color swatch, size bar chart |
| `/purchasing/invoices` | Invoice cards with 3-way match traffic light (green/amber/red circles) |
| `/purchasing/quotations` | Supplier cards with validity countdown, total amount, status |
| `/logistics` (shipment list) | Shipment cards with route visualization (origin → icon → destination) ← already partially done |
| `/audits` (audit list) | Audit cards with circular score gauge, G/Y/R/NA bar, verdict badge ← data exists, needs visual upgrade |
| `/settings/users` | User cards with role badge, last active, avatar |

### Missing Real-Time Updates (Supabase Subscriptions)

| Component | Current | Impact of Adding Realtime |
|-----------|---------|--------------------------|
| Inspection status | Server revalidation | Inspector in field sees live status from office |
| Production daily log totals | Manual refresh | Factory floor dashboard shows live output |
| Shipment milestone tracker | Manual refresh | All stakeholders see tracking update instantly |
| Audit G/Y/R/NA completion | React state (client only) | Multiple auditors on same audit see each other's ratings |
| Order booking totals | Manual refresh | Sales meeting shows live order book |
| Notification bell | **Already realtime** ✓ | Keep as-is |

### Missing UI Patterns

| Pattern | Current State | Fix |
|---------|--------------|-----|
| Loading skeletons | Text "Loading..." or blank | Add `loading.tsx` with shimmer skeletons per module |
| Error boundaries | None — crashes show white screen | Add `error.tsx` with retry button per module |
| Empty state illustrations | Plain text "No items found" | SVG illustrations + contextual CTA |
| Breadcrumb navigation | Only "Back" links | Add breadcrumb trail (Dashboard > Merchandising > Styles > OW-FW26-0001) |
| Keyboard shortcuts | None | Add Cmd+K search, Cmd+N new item |
| Drag-and-drop reorder | Not implemented | BOM items, milestone reorder, colorway sort |

---

## 5. THE ROADMAP — Prioritized Migration Tasks

### TIER 1: CRITICAL (Security / Broken Math)

| # | Task | Files to Change | Effort |
|---|------|----------------|--------|
| C1 | Add org_id filtering to ALL page queries (8+ pages) | costing/page, merchandising/styles/page, production/page, purchasing/\*\*/page, logistics/page, compliance/page | 1 day |
| C2 | Add route-level role guards in dashboard layout | app/(dashboard)/layout.tsx — check role vs pathname | 0.5 day |
| C3 | Enforce lifecycle transition validation | lib/actions/merchandising.ts — add VALID_TRANSITIONS check | 0.5 day |
| C4 | Block shipment creation if final inspection failed | lib/actions/logistics.ts — add inspection status check | 0.5 day |
| C5 | Persist AQL calculation result to DB | lib/actions/inspections — save sample_size, accept, reject, verdict | 0.5 day |
| C6 | Guard against division by zero in margin calc | lib/actions/costing.ts + client components | 0.5 day |
| C7 | Enforce inline→final inspection sequence | app/(dashboard)/inspections/actions.ts — check prior inspection | 0.5 day |

**Subtotal: ~4 days**

### TIER 2: STRUCTURAL (Database / Logic Gates)

| # | Task | Files to Change | Effort |
|---|------|----------------|--------|
| S1 | Add style_id FK to production_orders, sample_requests | DB migration + lib/actions/production.ts, sampling.ts | 1 day |
| S2 | Implement delay propagation for production milestones | lib/actions/production.ts — cascade algorithm | 1.5 days |
| S3 | Add landed cost calculation to cost sheets | New fields on cost_sheets + lib/actions/costing.ts + UI | 1.5 days |
| S4 | Add prerequisite checks (tech pack approved before sampling, etc.) | lib/actions/sampling.ts, production.ts | 1 day |
| S5 | Implement proper RLS policies per table | Supabase SQL — replace `USING (true)` with org-scoped | 2 days |
| S6 | Add error.tsx and loading.tsx boundaries | app/(dashboard)/error.tsx, loading.tsx + per-module | 1 day |
| S7 | Unified T&A dashboard (cross-module timeline) | New page: app/(dashboard)/planning/t-and-a/page.tsx | 2 days |
| S8 | Schema version control (migration files) | Setup supabase CLI migrations or SQL files | 1 day |
| S9 | Restrict sensitive data (margins, pricing) by role | Add role checks to page queries + filter fields | 1 day |
| S10 | Add carrier_id FK to shipments | DB migration + lib/actions/logistics.ts | 0.5 day |

**Subtotal: ~12.5 days**

### TIER 3: VISUAL (Meegle UI Refactor)

| # | Task | Effort |
|---|------|--------|
| V1 | Card-based refactor for 7 table views | 3 days |
| V2 | Skeleton loading screens (all modules) | 1.5 days |
| V3 | Empty state illustrations + CTAs | 1 day |
| V4 | Supabase realtime subscriptions (5 components) | 2.5 days |
| V5 | Breadcrumb navigation system | 1 day |
| V6 | Dashboard KPI animations (count-up, progress rings) | 1 day |
| V7 | Mobile-optimized audit form (bottom sheet, swipe) | 1.5 days |
| V8 | Drag-and-drop for BOM items, milestones | 1.5 days |

**Subtotal: ~13 days**

### TIER 4: PREMIUM (Hub Features)

| # | Task | Effort |
|---|------|--------|
| P1 | Stripe tier enforcement (Free/Pro/Enterprise) | 2 days |
| P2 | PDF exports (audit reports, POs, packing lists, cost sheets) | 3 days |
| P3 | Excel exports (tech pack measurements, BOM, line plan — RefrigiWear format) | 2 days |
| P4 | File upload UI for all storage buckets (5 buckets) | 2.5 days |
| P5 | Email notifications (Resend — 5 trigger types) | 2 days |
| P6 | REST API endpoints for external integration (4 endpoints) | 3 days |
| P7 | AQL auto-calculation with ISO 2859-1 standard tables in inspection form | 1.5 days |
| P8 | Keyboard shortcuts (Cmd+K search, Cmd+N new) | 1 day |

**Subtotal: ~17 days**

---

## TOTAL EFFORT ESTIMATE

| Tier | Days | Priority |
|------|------|----------|
| CRITICAL | 4 | Week 1 |
| STRUCTURAL | 12.5 | Weeks 2-3 |
| VISUAL | 13 | Weeks 4-5 |
| PREMIUM | 17 | Weeks 6-8 |
| **TOTAL** | **~46.5 days** | **~8-10 weeks** |

---

## WHAT'S ALREADY SOLID (Don't Touch)

- AQL ISO 2859-1 lookup tables (correct math)
- Cost item formula: `consumption × price × (1 + wastage/100)` (correct)
- Audit scoring: `(G+Y)/(Total-NA)×100` (matches RefrigiWear exactly)
- 3-way invoice matching with 2% tolerance (industry standard)
- Server action pattern: `{success, error}` return (production-safe)
- Auto-retry with column stripping (resilient to schema drift)
- 14-currency support across all financial modules
- Feature flag system for paid add-ons
- Notification bell with Supabase realtime (only realtime component)
- Session timeout with role-based tiers
