# SankalphHub Migration Plan — Meegle-Style Transformation
## Generated: 2026-04-07

---

## A. CRITICAL (Security Risks & Broken Connections)

### A1. RLS Policy Enforcement (HIGH PRIORITY)
**Problem:** All 47 tables use `USING (true)` — any authenticated user can access any org's data.
**Fix:** Replace permissive policies with org-scoped RLS:
```sql
CREATE POLICY "org_isolation" ON [table] FOR ALL TO authenticated
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));
```
**Tables needing org_id column added:** styles, seasons, shipments, carriers, compliance_requirements
**Effort:** 2-3 days
**Risk if skipped:** Data leak between organizations

### A2. Style-to-Production FK Link (MEDIUM PRIORITY)
**Problem:** `production_orders.style_number` is TEXT — no FK to `styles.id`. Renaming a style breaks the chain.
**Fix:** Add `style_id UUID REFERENCES styles(id)` to `production_orders`, `sample_requests`, and update actions to populate it.
**Effort:** 1 day

### A3. Error Boundaries (MEDIUM PRIORITY)
**Problem:** No `error.tsx` files — unhandled errors crash pages with no recovery.
**Fix:** Create `app/(dashboard)/error.tsx` global boundary + per-module boundaries for critical pages.
**Effort:** 0.5 day

### A4. Loading States (LOW-MEDIUM PRIORITY)
**Problem:** No `loading.tsx` Suspense boundaries — blank screens during server fetch.
**Fix:** Create `app/(dashboard)/loading.tsx` with skeleton UI + per-module loading states.
**Effort:** 0.5 day

---

## B. STRUCTURAL (Database & Logic Gates)

### B1. Lifecycle Gate Enforcement
**Problem:** No validation prevents creating production orders before sample approval.
**Fix:** Add server-side checks in `createProductionOrder()`:
- Verify `styles.lifecycle_stage` >= `approved` before allowing production
- Verify `tech_packs.status` = `approved` before allowing sampling
- Verify active `product_certifications` before production (for regulated markets)
**Effort:** 1 day

### B2. AQL Sample Size Calculator
**Problem:** AQL level is stored but ISO 2859-1 sample size tables not implemented.
**Fix:** Implement standard AQL lookup tables that auto-calculate:
- Sample size from lot size + inspection level
- Accept/reject numbers from AQL level
- Pass/fail verdict from defect count vs accept number
**Effort:** 1-2 days

### B3. Cross-Module T&A Dashboard
**Problem:** Each module tracks its own timeline independently — no unified view.
**Fix:** Create `/planning/t-and-a` page that aggregates:
- Seasonal calendar milestones
- Production milestones
- Sampling stage dates
- Shipment ETD/ETA
- Certification expiry dates
All in one Gantt-style view filterable by season/project/factory.
**Effort:** 2-3 days

### B4. Certification → Production Gate
**Problem:** Expired certifications don't block production orders.
**Fix:** In `createProductionOrder()`, check if factory has valid (non-expired) required certifications. Show warning for expiring (<60 days) and block for expired.
**Effort:** 0.5 day

### B5. Tech Pack Version Locking
**Problem:** Production can reference draft/outdated tech packs.
**Fix:** When creating production order or sample request:
- Only allow linking to `approved` tech pack versions
- Show warning if newer version exists
- Store `tech_pack_version` on production_orders for audit trail
**Effort:** 0.5 day

### B6. Carrier FK Link
**Problem:** `shipments.carrier_name` is TEXT — should FK to `carriers.id`.
**Fix:** Add `carrier_id UUID REFERENCES carriers(id)` to shipments table.
**Effort:** 0.5 day

### B7. Schema Version Control
**Problem:** No migration files — tables created via Supabase dashboard. No rollback capability.
**Fix:** Adopt Supabase CLI migrations (`supabase migration new`) or document all DDL in version-controlled SQL files.
**Effort:** 1 day setup + ongoing

---

## C. VISUAL (Meegle-Style UI Refactor)

### C1. Skeleton Loading Screens
**Replace:** Text "Loading..." and blank states
**With:** Shimmer skeleton components matching each page layout
**Pages:** All 17 dashboard modules
**Effort:** 1-2 days

### C2. Card-Based List Views
**Refactor these table-heavy pages to card grids:**
- `/compliance/regulations` — Regulation cards with category icons, region flags
- `/merchandising/orders` — Order cards with style thumbnails
- `/purchasing/invoices` — Invoice cards with 3-way match visual indicator
- `/purchasing/quotations` — Quotation cards with supplier info + status
**Effort:** 2-3 days

### C3. Empty State Illustrations
**Replace:** Plain "No items found" text
**With:** SVG illustrations + contextual CTA buttons per module
**Effort:** 1 day

### C4. Supabase Realtime Subscriptions
**Add live updates to:**
- Inspection status changes (inspectors in field)
- Production daily log counters
- Shipment milestone progression
- Audit rating completion percentage
**Tech:** `supabase.channel().on('postgres_changes', ...)` per component
**Effort:** 2-3 days

### C5. Dashboard KPI Animations
**Add:** Number count-up animations on dashboard stat cards
**Add:** Micro-interactions on lifecycle stage transitions
**Add:** Progress ring animations on audit scores
**Effort:** 1 day

### C6. Mobile-First Audit Form
**Current:** 3-column desktop layout, stacked on mobile
**Improve:** Bottom sheet for score dashboard on mobile, swipeable sections, haptic feedback on G/Y/R/NA buttons
**Effort:** 1-2 days

---

## D. PREMIUM (PremiumHub Integrations)

### D1. Stripe Subscription Tiers
**Current:** Stripe integration scaffolded but env vars not configured
**Fix:** Configure STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET in Vercel
**Tiers:** Free (5 inspections/mo) → Pro ($49/mo) → Enterprise (custom)
**Add-ons:** Testing Lab ($79/mo), Logistics ($99/mo), Compliance ($59/mo)
**Effort:** 1 day (config) + 2 days (tier enforcement)

### D2. PDF/Excel Exports
**Current:** jsPDF and xlsx imported but limited usage
**Add:**
- Audit report PDF (cover + sections + findings + photos)
- Cost sheet Excel (match RefrigiWear format)
- Tech pack measurement sheet Excel
- Packing list PDF
- PO PDF for supplier distribution
**Effort:** 3-4 days

### D3. Supabase Storage Integration
**Buckets needed:**
- `style-images` — Style photos (flat, on-model, detail, sketch)
- `tech-pack-files` — Sketches, flat drawings, PDFs
- `audit-photos` — Checkpoint evidence photos
- `shipping-documents` — BOL, AWB, certificates
- `compliance-docs` — Audit reports, certificates
**Current:** Buckets referenced in code but file upload UI not fully wired
**Effort:** 2-3 days

### D4. Email Notifications
**Add:** Transactional emails via Resend/SendGrid for:
- Inspection assigned → Inspector email
- Audit submitted → Brand Manager email
- Certification expiring → Admin email
- Production order created → Factory Manager email
- Shipment milestone reached → All stakeholders
**Effort:** 2-3 days

### D5. API Endpoints for External Integration
**Build:** REST API routes for:
- `/api/v1/styles` — Style catalog for e-commerce sync
- `/api/v1/orders` — Order feed for ERP integration
- `/api/v1/inspections` — Inspection results for BI tools
- `/api/v1/shipments` — Tracking feed for logistics partners
**Effort:** 3-4 days

---

## TIMELINE ESTIMATE

| Sprint | Focus | Duration |
|--------|-------|----------|
| Sprint 1 | A1-A4 (Critical fixes) | 1 week |
| Sprint 2 | B1-B7 (Structural gates) | 1.5 weeks |
| Sprint 3 | C1-C6 (Visual refactor) | 2 weeks |
| Sprint 4 | D1-D5 (Premium features) | 2-3 weeks |

**Total estimated effort:** 6-8 weeks for full Meegle-style transformation.

---

## ARCHITECTURE STRENGTHS (Keep As-Is)
- Server Components + revalidatePath pattern (efficient, no over-fetching)
- createAdminClient() for service role operations (consistent pattern)
- Server actions returning `{success, error}` (production-safe)
- Auto-retry with column stripping (resilient to schema drift)
- Feature flag system for paid add-ons
- G/Y/R/NA audit scoring (matches industry standard exactly)
- Multi-currency support across all financial modules
- 9-stage style lifecycle tracker
- 15-milestone seasonal calendar with auto-generation
