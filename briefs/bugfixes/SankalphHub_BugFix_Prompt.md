# SankalphHub — Bug Fix & Landing Page Overhaul Prompt

## CONTEXT
SankalphHub (www.sankalphub.in) is a Fashion Manufacturing platform built with Next.js 16 (App Router), TypeScript, React 19, Supabase (Postgres, Auth, Storage), Tailwind CSS 4, shadcn/ui, Radix UI. Deployed on Vercel.

The platform started as a QA-only tool (Steps 1-11) but is expanding to a full **End-to-End Product Lifecycle** platform (Steps 12-17: Product Development, Sampling, Testing, Costing, Logistics, Compliance). The landing page and some app functionality need updates to reflect this.

Brand tokens: GOLD=#D4A843, DARK=#1A1A2E, WHITE=#FFFFFF, RED=#CC0000, GREEN=#2E7D32, GREY=#666666, BLUE=#1565C0

---

## BUG #1 — CRITICAL: Project Creation Fails — Missing `buyer_brand` Column

**Where:** `/projects/new` — Step 4 "Review & Save"

**What happens:**
1. User fills all 4 steps (Basics, Factory, Timeline & QC, Review & Save)
2. Clicks "Create project →" button
3. Button changes to "Creating..." (loading state works)
4. Then throws error: **"Project creation failed — Could not find the 'buyer_brand' column of 'projects' in the schema cache"**
5. Project is NOT created

**Root cause (CONFIRMED):**
The project creation form/server action is trying to INSERT a value into a `buyer_brand` column on the `projects` table, but that column does NOT exist in the Supabase database schema.

**How to fix (pick one):**

**Option A (Recommended — Add the column):**
Run this SQL in Supabase SQL Editor:
```sql
ALTER TABLE projects ADD COLUMN buyer_brand TEXT;
```
Then verify the project creation works end-to-end.

**Option B (Fix the code):**
1. Find the project creation server action (likely in `app/projects/new/actions.ts` or `app/actions/projects.ts` or similar)
2. Look for where `buyer_brand` is being included in the INSERT payload
3. Either:
   a. Remove `buyer_brand` from the insert object if it's not needed
   b. Rename it to match the actual column name in the `projects` table (e.g., `brand`, `buyer`, `buyer_name`, `client_name`)
4. Check the `projects` table schema in Supabase to see what columns actually exist

**Option C (Both — Belt and suspenders):**
1. Add the column to the database (Option A)
2. Also add proper error handling in the server action so future schema mismatches show a meaningful toast instead of a generic Server Components error

**Fix requirements:**
- The project creation must work end-to-end
- Show meaningful error toast to user if creation fails (not generic Server Components error)
- Ensure the "Creating..." loading state resets on error
- Verify the project appears in `/projects` list after successful creation
- Wrap the Supabase insert in a try/catch and return the error message to the client

---

## ISSUE #2 — HIGH: Landing Page Hero Copy Outdated

**Where:** Landing page hero section at `sankalphub.in` (likely `app/page.tsx` or `app/(landing)/page.tsx`)

**Current state:**
- Badge: "FASHION MANUFACTURING QA PLATFORM" ← This is OK, keep it
- Headline: "Quality Control for Fashion Manufacturing" ← NEEDS CHANGE
- Subtitle: "AQL inspections, factory audits, and production planning for Garments, Footwear, Gloves, Headwear & Accessories — all in one platform." ← NEEDS CHANGE
- Stats bar: "50 Founding Slots | 100% Digital, No Paper | < 24 hr Onboarding | 5 Roles Supported" ← CAN ADD MORE

**Required changes:**

The platform is no longer just QA — it's an end-to-end product lifecycle platform. Update the copy:

**New headline suggestion:**
```
End-to-End Product Lifecycle for
Fashion Manufacturing
```
(Keep "Fashion Manufacturing" in the gold/accent color)

**New subtitle suggestion:**
```
From product development and sampling to testing, costing, logistics, and compliance —
manage your entire manufacturing pipeline for Garments, Footwear, Gloves, Headwear & Accessories.
```

**Updated stats bar — add more items to reflect the expanded platform:**
```
50 Founding Slots | 100% Digital | < 24 hr Onboarding | 5 Categories | 17 Workflow Steps | 5 Roles
```

**Also update the bottom CTA section** which currently says:
"Ready to streamline your quality inspections?"
Change to: "Ready to streamline your manufacturing lifecycle?"

---

## ISSUE #3 — HIGH: "Learn More" Links Are Dead (Blank Click)

**Where:** Features section on landing page (URL shows `sankalphub.in/#planning`)

**What happens:** All 4 feature cards have "Learn more >" links that do nothing when clicked — no navigation, no expand, no content shown.

The 4 cards are:
1. Inspections & AQL Sampling
2. Factory Audits & WRAP Compliance
3. Production Planning & DPR Tracking
4. Analytics & Quality Metrics

**Fix options (pick one):**

**Option A (Recommended):** Make "Learn more" scroll to or open an expanded detail section below each card with 3-4 bullet points of detail. Use a collapsible/accordion pattern.

**Option B:** Create dedicated feature pages (`/features/inspections`, `/features/audits`, etc.) and link there.

**Option C:** Remove "Learn more" links entirely if there's no content to show — better to have no link than a dead link.

Whatever option you choose, also **add new feature cards** for the expanded platform modules:
5. Product Development & Tech Packs
6. Sampling Lifecycle
7. Testing & Lab Management
8. Costing & Purchasing
9. Logistics & Shipping
10. Compliance & Certifications

These can be shown in a "Coming Soon" style or as a separate "Expanding Soon" section below the existing 4 cards.

---

## ISSUE #4 — MEDIUM: Category Cards Need Professional SVG Design

**Where:** "5 Categories. One Platform." section on landing page

**Current state:** Each of the 5 category cards shows:
- An emoji-style icon
- Category name (Garments, Footwear, etc.)
- Process text like "Cut → Sew → Finish → Pack"
- Bullet text like "Stitching, fabric, measurement, finishing"

**Problem:** The process flow text ("Cut → Sew → Finish → Pack") doesn't look professional. It looks like placeholder text.

**Required changes:**
1. **Remove the process flow text** (e.g., "Cut → Sew → Finish → Pack")
2. **Replace with a professional one-liner** describing the category focus:
   - Garments: "Complete garment QA from cutting room to final pack"
   - Footwear: "Sole bonding, lasting, and finish inspection"
   - Gloves: "Finger alignment, grip coating, and symmetry checks"
   - Headwear: "Shape retention, brim alignment, and logo placement"
   - Accessories: "Hardware, material integrity, and assembly QC"
3. **Keep the icon** but consider using more polished SVG icons if available in lucide-react or another icon set
4. **Use a card slicer/hover effect** — on hover, card lifts slightly with shadow, showing it's interactive
5. Remove the secondary bullet text at bottom (the "Stitching, fabric, measurement..." text)

---

## ISSUE #5 — MEDIUM: Invisible Ghost Button in Footer CTA

**Where:** Bottom CTA section of landing page, next to "Start Free Trial →"

**What happens:** There's a second button (likely "Take a Tour" or "Talk to Sales") that appears invisible — white text on near-white background, or opacity issue.

**Fix:**
1. Find the CTA section at the bottom of the landing page
2. Locate the second button next to "Start Free Trial"
3. It's likely using a `variant="outline"` or `variant="ghost"` on a dark/gradient background but the text color is white/transparent
4. Fix: Give it a visible style — either:
   - White outline button with white text on the dark CTA background: `border-white text-white hover:bg-white/10`
   - Or a solid secondary style: `bg-white text-[#1A1A2E]` for contrast
5. Verify both buttons are visible and clickable on both light and dark mode

---

## ISSUE #6 — LOW: FAQ Section Placement

**Where:** FAQ section near bottom of landing page, above the footer CTA

**Question:** Should the FAQ section stay on the landing page?

**Recommendation:** Keep it — FAQs on landing pages improve SEO and reduce support queries. BUT:
1. Move it ABOVE the final CTA section (not between CTA and footer)
2. Ensure the FAQ content is up-to-date with the expanded platform messaging
3. Update any FAQ answers that only reference "QA" or "inspections" to include the full lifecycle
4. Consider adding new FAQs:
   - "What modules are included?"
   - "Can I start with just QA and add modules later?"
   - "How does PremiumHub pricing work?"

---

## EXECUTION ORDER

Fix in this priority order:
1. **Bug #1** — Project creation (Critical, blocks users)
2. **Issue #2** — Hero copy update (High, first thing visitors see)
3. **Issue #3** — Dead "Learn more" links (High, looks broken)
4. **Issue #5** — Ghost button (Medium, quick CSS fix)
5. **Issue #4** — Category cards redesign (Medium, design improvement)
6. **Issue #6** — FAQ updates (Low, content update)

For each fix, commit separately with a clear commit message describing what was changed.
