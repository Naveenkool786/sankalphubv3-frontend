# SankalpHub — Factories Module Build Brief (V3 Frontend)
**For: Claude Code + Sub-Agents**
**Date:** March 28, 2026
**Scope:** Build the Factories module from empty state to fully functional
**Mode:** Build new. The page exists but is empty. Do NOT touch other modules.

> ⚠️ **WORKING DIRECTORY: V3 Frontend ONLY**
> All work is exclusively in `/var/www/Master_Sankalphub/V3.0_Frontend/`
> Do NOT touch `/var/www/Master_Sankalphub/Backend/` — V1/V2 Django backend. Out of scope entirely.

---

## PLATFORM CONTEXT

| Item | Detail |
|------|--------|
| **Frontend Framework** | Next.js 15.2.1, React 19.2.4, TypeScript, Tailwind CSS |
| **UI Library** | shadcn/ui (Radix primitives) |
| **Auth** | Supabase Auth (email/password + magic link) |
| **Database** | Supabase (hosted Postgres) — `jirhyxpcbfeelgiyxqdi.supabase.co` |
| **Existing Supabase Tables** | organizations, profiles, projects, inspections, factories, templates, tasks, documents, demo_requests |
| **Frontend Path** | `/var/www/Master_Sankalphub/V3.0_Frontend/` |
| **Repo** | GitHub: `Naveenkool786/sankalphubv3-frontend` → Vercel auto-deploy on push |
| **Live URL** | https://sankalphub.in |

---

## UI DESIGN REFERENCE (From Approved Screenshots)

These patterns are extracted from three reference screenshots provided by the product owner. Claude Code must implement these specific UI patterns in the Factories module. Adapt them to SankalpHub's existing color scheme and shadcn/ui components — do NOT copy them literally.

---

### Pattern 1 — KPI Cards with Sparklines
**Source:** WeaveIQ Overview screenshot (Image 3)
**Apply to:** Task 4 — Factory Dashboard KPI cards

Each KPI card must have:
- Colored icon on the left in a small rounded square background (teal for positive, amber for warnings, red for critical)
- Large bold metric value (e.g. "94.6%", "47/52")
- Label below the value
- A **mini sparkline** (~80px wide, 32px tall) on the right showing trend over last 7 days — use the charting library already in the project (likely Recharts). No axes, no grid, just the line.
- Delta indicator below the sparkline: "+2.1% vs last month" — green for positive, red for negative
- For fraction metrics (e.g. pass/fail counts): include a thin horizontal progress bar inside the card

```tsx
<div className="flex items-center justify-between p-4 rounded-xl border bg-white">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
      <Icon className="w-5 h-5 text-teal-600" />
    </div>
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
  <div className="flex flex-col items-end gap-1">
    {/* Mini sparkline — use Recharts LineChart, width=80, height=32, no axes */}
    <span className={`text-xs ${delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
      {delta > 0 ? '↑' : '↓'} {Math.abs(delta)}% vs last month
    </span>
  </div>
</div>
```

---

### Pattern 2 — Equipment / Defect Alert Cards
**Source:** WeaveIQ Detail screenshot (Image 2)
**Apply to:** Task 3 — Factory Profile, open defects section

Replace any plain defect list with alert-style cards. Each card shows:
- Colored severity icon on the left (red = High, amber = Medium, blue = Low)
- Bold defect title colored to match severity
- Defect ID + category in small gray text below
- Short description of the issue
- Severity badge (High / Medium / Low) top-right
- "Reported X days ago" timestamp in small text, severity-colored

Color rules:
- **High** → `border-red-200 bg-red-50`, red text, red badge
- **Medium** → `border-amber-200 bg-amber-50`, amber text, amber badge
- **Low** → `border-blue-200 bg-blue-50`, blue text, blue badge

```tsx
<div className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50">
  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
  <div className="flex-1 min-w-0">
    <div className="flex items-center justify-between gap-2">
      <p className="font-semibold text-red-700 truncate">{defectTitle}</p>
      <Badge variant="destructive" className="shrink-0">High</Badge>
    </div>
    <p className="text-xs text-gray-500 mt-0.5">{defectId} · {defectCategory}</p>
    <p className="text-sm text-gray-600 mt-1">{defectDescription}</p>
  </div>
  <p className="text-xs text-red-500 whitespace-nowrap shrink-0">{reportedAgo}</p>
</div>
```

---

### Pattern 3 — Pass Rate Progress Bars on Factory Cards
**Source:** WeaveIQ Overview screenshot (Image 3) — Production Line Status
**Apply to:** Task 2 — Factory List cards

Each factory card's pass rate must be shown as a labeled progress bar, not just a number:
- Thin bar (h-2, rounded-full) filling proportionally to pass rate
- Green if ≥80%, amber if 60–79%, red if <60%
- Percentage shown on the right

```tsx
<div className="flex items-center gap-2 mt-2">
  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
    <div
      className={`h-full rounded-full transition-all ${
        passRate >= 80 ? 'bg-green-500' :
        passRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
      }`}
      style={{ width: `${passRate ?? 0}%` }}
    />
  </div>
  <span className="text-xs font-medium w-10 text-right">
    {passRate != null ? `${passRate}%` : '—'}
  </span>
</div>
```

---

### Pattern 4 — Pill-Shaped Filter Bar
**Source:** WeaveIQ Detail screenshot (Image 2)
**Apply to:** Task 2 — Factory List filter bar, Task 4 — Factory Dashboard

Filters should be horizontal pill-shaped dropdown buttons, not a plain input row:

```tsx
<div className="flex items-center gap-2 mb-6 flex-wrap">
  <div className="flex items-center gap-1 text-sm text-gray-400">
    <SlidersHorizontal className="w-4 h-4" />
    <span>Filters</span>
  </div>
  {/* Each filter is a shadcn Select with rounded-full trigger */}
  <Select value={countryFilter} onValueChange={setCountryFilter}>
    <SelectTrigger className="h-8 px-3 rounded-full border text-sm w-auto min-w-[120px]">
      <SelectValue placeholder="All Countries" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Countries</SelectItem>
      {/* dynamic country list */}
    </SelectContent>
  </Select>
  <Select value={typeFilter} onValueChange={setTypeFilter}>
    <SelectTrigger className="h-8 px-3 rounded-full border text-sm w-auto min-w-[120px]">
      <SelectValue placeholder="All Types" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Types</SelectItem>
      <SelectItem value="garments">Garments</SelectItem>
      <SelectItem value="footwear">Footwear</SelectItem>
      <SelectItem value="gloves">Gloves</SelectItem>
      <SelectItem value="headwear">Headwear</SelectItem>
      <SelectItem value="accessories">Accessories</SelectItem>
    </SelectContent>
  </Select>
  <Select value={statusFilter} onValueChange={setStatusFilter}>
    <SelectTrigger className="h-8 px-3 rounded-full border text-sm w-auto min-w-[120px]">
      <SelectValue placeholder="All Status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Status</SelectItem>
      <SelectItem value="active">Active</SelectItem>
      <SelectItem value="inactive">Inactive</SelectItem>
      <SelectItem value="pending">Pending</SelectItem>
    </SelectContent>
  </Select>
</div>
```

---

### Pattern 5 — Day / Week / Month Toggle
**Source:** MES Platform screenshot (Image 1)
**Apply to:** Task 4 — Factory Dashboard, above defect trend chart and inspections table

```tsx
// Use shadcn ToggleGroup
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week')

<div className="flex items-center justify-between mb-4">
  <h3 className="font-semibold text-gray-800">Defect Trends</h3>
  <ToggleGroup
    type="single"
    value={period}
    onValueChange={(v) => v && setPeriod(v as 'day' | 'week' | 'month')}
    className="border rounded-lg p-0.5 bg-gray-50"
  >
    <ToggleGroupItem value="day" className="text-xs px-3 py-1 rounded data-[state=on]:bg-white data-[state=on]:shadow-sm">Day</ToggleGroupItem>
    <ToggleGroupItem value="week" className="text-xs px-3 py-1 rounded data-[state=on]:bg-white data-[state=on]:shadow-sm">Week</ToggleGroupItem>
    <ToggleGroupItem value="month" className="text-xs px-3 py-1 rounded data-[state=on]:bg-white data-[state=on]:shadow-sm">Month</ToggleGroupItem>
  </ToggleGroup>
</div>
```

The `period` state controls the Supabase query date range:
- Day → last 24 hours
- Week → last 7 days
- Month → last 30 days

---

### Pattern 6 — Gauge / Donut Chart for Overall Pass Rate
**Source:** WeaveIQ Overview screenshot (Image 3) — Production Line Overview donut
**Apply to:** Task 3 — Factory Profile, Performance Summary section

Replace plain "Pass Rate: 87%" text with a visual donut chart:
- Semi-circle or full donut, large pass rate number centered
- Label: "Avg Pass Rate"
- Color: green ≥80%, amber 60–79%, red <60%
- Use Recharts `PieChart` with `innerRadius`

```tsx
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const donutData = [
  { value: passRate },
  { value: 100 - passRate },
]
const color = passRate >= 80 ? '#16a34a' : passRate >= 60 ? '#d97706' : '#dc2626'

<div className="relative flex flex-col items-center">
  <ResponsiveContainer width={160} height={100}>
    <PieChart>
      <Pie
        data={donutData}
        cx={80} cy={90}
        startAngle={180} endAngle={0}
        innerRadius={55} outerRadius={72}
        dataKey="value"
        strokeWidth={0}
      >
        <Cell fill={color} />
        <Cell fill="#f3f4f6" />
      </Pie>
    </PieChart>
  </ResponsiveContainer>
  <div className="absolute bottom-2 flex flex-col items-center">
    <span className="text-2xl font-bold" style={{ color }}>{passRate}%</span>
    <span className="text-xs text-gray-500">Avg Pass Rate</span>
  </div>
</div>
```

---

### Pattern 7 — Live Status Indicator
**Source:** MES Platform screenshot (Image 1) — "All Systems Operational" bottom bar
**Apply to:** Task 4 — Factory Dashboard, bottom of the page

```tsx
<div className="flex items-center gap-2 text-xs text-gray-400 pt-4 mt-6 border-t">
  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
  <span>Live data</span>
  <span>·</span>
  <span>{totalInspections} inspections tracked</span>
  <span>·</span>
  <span>Updated just now</span>
</div>
```

---

## MODULE OVERVIEW

The Factories module serves **two user types:**

| User | What they need |
|------|---------------|
| **Brand / Buyer** | Add factories, browse directory, assign to projects, view performance |
| **Factory / Manufacturer** | Self-register, manage their own profile, view their inspection results |

Both entry points lead to the same data — the `factories` table in Supabase.

---

## TASK ASSIGNMENT

| Task | Description | Agent |
|------|-------------|-------|
| Task 1 | Supabase schema — verify/extend `factories` table | Sub-Agent 1 |
| Task 2 | Factory List page + Add Factory flow | Sub-Agent 2 |
| Task 3 | Factory Profile page (detail view) | Sub-Agent 2 |
| Task 4 | Factory Dashboard (factory's own view) | Sub-Agent 3 |
| Task 5 | Assign Factory to Project | Sub-Agent 3 |

**Execution order:**
- Sub-Agent 1 runs first — schema must be confirmed before any UI work begins
- Sub-Agents 2 and 3 run in parallel after Sub-Agent 1 completes

---

## TASK 1 — Verify & Extend Supabase Schema

**Agent:** Sub-Agent 1
**Priority:** 🔴 Must complete before Tasks 2–5

### Step 1 — Check existing `factories` table
In the Supabase project (`jirhyxpcbfeelgiyxqdi.supabase.co`), check the existing `factories` table schema. Use the Supabase client already configured in the project to inspect or use the Supabase dashboard.

Look for the existing columns. The table likely has basic fields from V1/V2.

### Step 2 — Ensure the following columns exist
If any column is missing, add it via a Supabase migration or directly via SQL in the Supabase SQL editor. Do NOT use Django migrations.

**Required `factories` table columns:**

```sql
-- Core identity
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
organization_id     UUID REFERENCES organizations(id)   -- which org owns this factory
created_by          UUID REFERENCES profiles(id)        -- who added it
created_at          TIMESTAMPTZ DEFAULT now()
updated_at          TIMESTAMPTZ DEFAULT now()

-- Profile
name                TEXT NOT NULL
slug                TEXT UNIQUE                          -- URL-friendly name
description         TEXT
logo_url            TEXT

-- Location
country             TEXT
city                TEXT
address             TEXT

-- Capacity & Type
factory_type        TEXT                                 -- e.g. Garments, Footwear, Gloves
production_capacity TEXT                                 -- e.g. "50,000 units/month"
employee_count      TEXT                                 -- e.g. "100-500"

-- Certifications (store as array)
certifications      TEXT[]                               -- e.g. ['ISO 9001', 'GOTS', 'OEKO-TEX']

-- Status
status              TEXT DEFAULT 'active'                -- active | inactive | pending
is_self_registered  BOOLEAN DEFAULT false               -- true if factory registered itself

-- Contact
contact_name        TEXT
contact_email       TEXT
contact_phone       TEXT
website             TEXT
```

### Step 3 — Add factory_performance view (optional but recommended)
If possible, create a Supabase view that aggregates inspection data per factory:

```sql
CREATE OR REPLACE VIEW factory_performance AS
SELECT
  f.id AS factory_id,
  f.name AS factory_name,
  COUNT(i.id) AS total_inspections,
  COUNT(CASE WHEN i.status = 'passed' THEN 1 END) AS passed,
  COUNT(CASE WHEN i.status = 'failed' THEN 1 END) AS failed,
  ROUND(
    COUNT(CASE WHEN i.status = 'passed' THEN 1 END)::numeric /
    NULLIF(COUNT(i.id), 0) * 100, 1
  ) AS pass_rate
FROM factories f
LEFT JOIN inspections i ON i.factory_id = f.id
GROUP BY f.id, f.name;
```

### Step 4 — Row Level Security (RLS)
Enable RLS on the `factories` table if not already enabled:

```sql
-- Brands can see factories linked to their organization
-- Factories can see and edit their own record
-- Super admin can see everything

ALTER TABLE factories ENABLE ROW LEVEL SECURITY;

-- Policy: org members can read factories in their org
CREATE POLICY "org_members_read_factories"
ON factories FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- Policy: factory can update their own record
CREATE POLICY "factory_can_update_own"
ON factories FOR UPDATE
USING (created_by = auth.uid());

-- Policy: authenticated users can insert
CREATE POLICY "authenticated_can_insert"
ON factories FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
```

### Acceptance Criteria — Task 1
- [ ] `factories` table has all required columns
- [ ] `factory_performance` view exists (or is noted as skipped with reason)
- [ ] RLS policies are in place
- [ ] No existing data in the table was lost or corrupted

---

## TASK 2 — Factory List Page + Add Factory Flow

**Agent:** Sub-Agent 2
**File:** `app/(dashboard)/factories/page.tsx` (or equivalent route)

### What to build

#### 2A — Factory List Page

The page should show:

**Header area:**
- Page title: "Factories"
- Subtitle: "Manage and monitor your manufacturing partners"
- Two buttons:
  - `+ Add Factory` (opens a modal/drawer — for Brands adding a factory)
  - `Register My Factory` (opens a different modal — for Factories self-registering)
  - Show/hide these buttons based on the user's role (see Role Logic below)

**Search + Filter bar:**
- Text search by factory name
- Filter by: Country, Factory Type (Garments / Footwear / Gloves / Headwear / Accessories), Status (Active / Inactive)
- ⚡ **Use Pattern 4 (Pill-Shaped Filter Bar)** from the UI Design Reference above — pill-shaped dropdown buttons, not plain inputs

**Factory cards grid (or table — match existing module style):**

Each factory card should show:
- Factory logo (or initials avatar if no logo)
- Factory name
- Location (City, Country)
- Factory type badge
- Certifications (show up to 3, then "+N more")
- Pass rate % (from `factory_performance` view — show "—" if null)
  - ⚡ **Use Pattern 3 (Pass Rate Progress Bar)** — show as a colored horizontal progress bar, not just a number
- Total inspections count
- Status badge (Active / Inactive / Pending)
- Two action buttons: `View Profile` | `Assign to Project`

**Empty state (when no factories exist):**
```
Icon: building/factory icon
Heading: "No factories yet"
Subtext: "Add your first manufacturing partner or invite a factory to register."
Button: "+ Add Factory"
```

---

#### 2B — Add Factory Modal (Brand flow)

Triggered by `+ Add Factory` button. Use a shadcn `Dialog` or `Sheet` component.

**Form fields:**

| Field | Type | Required |
|-------|------|----------|
| Factory Name | Text | Yes |
| Factory Type | Select: Garments / Footwear / Gloves / Headwear / Accessories | Yes |
| Country | Text | Yes |
| City | Text | Yes |
| Contact Name | Text | Yes |
| Contact Email | Email | Yes |
| Contact Phone | Text | No |
| Production Capacity | Text | No | e.g. "50,000 units/month" |
| Employee Count | Select: <50 / 50-200 / 200-500 / 500+ | No |
| Certifications | Multi-select or tag input: ISO 9001 / GOTS / OEKO-TEX / BSCI / SA8000 / Other | No |
| Description | Textarea | No |

**On submit:**
- Insert into `factories` table with `organization_id` from current user's profile
- Set `is_self_registered = false`
- Set `status = 'active'`
- Close modal and refresh factory list
- Show success toast: "Factory added successfully"

**On error:**
- Show inline error message
- Do not close modal

---

#### 2C — Register My Factory Modal (Factory self-registration flow)

Triggered by `Register My Factory` button. Same shadcn `Dialog` or `Sheet`.

Same fields as 2B, plus:
- Website URL (optional)
- Logo upload (optional — store URL if Supabase storage is configured, otherwise skip for now)

**On submit:**
- Insert into `factories` table
- Set `is_self_registered = true`
- Set `status = 'pending'` (requires brand/admin approval)
- Show success message: "Your factory has been registered. A team member will review and approve it shortly."

---

#### Role Logic for buttons
```typescript
// Show "+ Add Factory" only to: super_admin, brand_manager
// Show "Register My Factory" only to: factory_manager, super_admin
// Viewer role: no action buttons, read-only

const canAddFactory = ['super_admin', 'brand_manager'].includes(userRole)
const canSelfRegister = ['factory_manager', 'super_admin'].includes(userRole)
```

Get `userRole` from the existing auth/profile context already used in other modules.

### Acceptance Criteria — Task 2
- [ ] Factory list page renders with cards/rows for each factory
- [ ] Search by name works
- [ ] Filter by country, type, status works
- [ ] Empty state shows when no factories exist
- [ ] `+ Add Factory` modal opens, form validates, submits to Supabase
- [ ] `Register My Factory` modal opens, form validates, submits with `status = 'pending'`
- [ ] Role-based button visibility works correctly
- [ ] Success and error states handled properly
- [ ] Page matches the visual style of existing modules (Projects, Inspections)

---

## TASK 3 — Factory Profile Page (Detail View)

**Agent:** Sub-Agent 2 (run after Task 2)
**File:** `app/(dashboard)/factories/[id]/page.tsx`

### What to build

A dedicated page for each factory, accessible via `View Profile` from the list.

**URL pattern:** `/factories/[factory-id]`

**Page sections:**

#### Section 1 — Header
- Factory logo (or initials avatar)
- Factory name (large heading)
- Location (City, Country)
- Status badge
- Factory type badge
- Edit button (visible to: super_admin, brand_manager, factory_manager who owns the record)

#### Section 2 — About
- Description
- Production capacity
- Employee count
- Website link (if present)
- Contact: name, email, phone

#### Section 3 — Certifications
- Display each certification as a badge/chip
- If none: "No certifications listed"

#### Section 4 — Performance Summary
Pull from `factory_performance` view:
- ⚡ **Use Pattern 6 (Gauge/Donut Chart)** — display pass rate as a visual donut chart, not just a number
- Total Inspections, Passed count, Failed count shown as supporting stats below the donut
- Pass Rate color: green ≥80%, amber 60–79%, red <60%

If no inspection data: "No inspections recorded yet"

#### Section 4B — Open Defects
- ⚡ **Use Pattern 2 (Equipment/Defect Alert Cards)** — show each open defect as a colored alert card
- Group by severity: High first, then Medium, then Low
- Show maximum 5 open defects, with "View all defects →" link if more exist
- If no open defects: show a green "No open defects" indicator

#### Section 5 — Recent Inspections
- Table showing the last 10 inspections for this factory
- Columns: Date, Project Name, Inspector, Status (Pass/Fail), Score
- Link each row to the full inspection detail
- If none: "No inspections yet"

#### Section 6 — Assigned Projects
- List of projects this factory is assigned to
- Show: Project name, status, start date
- If none: "Not assigned to any projects yet"

#### Edit Factory
- Edit button opens the same form as Add Factory (pre-filled with existing data)
- On save: update the `factories` row in Supabase
- Show success toast on save

### Acceptance Criteria — Task 3
- [ ] `/factories/[id]` loads the correct factory data
- [ ] All sections render correctly including open defects
- [ ] Performance donut chart shows correct pass rate with color coding (Pattern 6)
- [ ] Open defects render as severity-colored alert cards (Pattern 2)
- [ ] Recent inspections table is linked to correct inspection records
- [ ] Edit form pre-fills with existing data and saves correctly
- [ ] 404 or error state shown if factory ID doesn't exist

---

## TASK 4 — Factory Dashboard (Factory's Own View)

**Agent:** Sub-Agent 3
**File:** Modify existing dashboard or create a role-specific view within `app/(dashboard)/dashboard/page.tsx`

### What to build

When a user with role `factory_manager` logs in, their dashboard should show factory-specific KPIs instead of the generic brand dashboard.

**Factory Dashboard sections:**

#### KPI Cards (top row)
- ⚡ **Use Pattern 1 (KPI Cards with Sparklines)** — all 4 cards must have the icon + value + sparkline + delta format
- Total Inspections (all time) — teal icon
- Pass Rate % (last 30 days) — green icon if ≥80%, amber if lower
- Open Defects — red icon if >0, green if 0
- Active Projects — blue icon

#### Recent Inspections table
- Last 10 inspections for their factory
- Columns: Date, Project, Inspector, Score, Status
- ⚡ **Use Pattern 5 (Day/Week/Month Toggle)** — add toggle above the table to control time range
- "View All" link to `/inspections`

#### Defect Trend Chart
- ⚡ **Use Pattern 5 (Day/Week/Month Toggle)** — add toggle above the chart
- Bar chart showing defect count per period (last 6 months default)
- Use the charting library already in the project (check existing Analytics page for what's installed)

#### Active Projects
- Cards for projects currently assigned to this factory
- Show: Project name, Brand name, Deadline, Status

#### Live Status Bar (bottom of page)
- ⚡ **Use Pattern 7 (Live Status Indicator)** — subtle animated green dot + "Live data · X inspections tracked"

### Role detection
```typescript
// In dashboard page — detect role and render appropriate view
if (userRole === 'factory_manager') {
  return <FactoryDashboard factoryId={userFactory.id} />
} else {
  return <BrandDashboard /> // existing dashboard
}
```

### Acceptance Criteria — Task 4
- [ ] Factory manager sees factory-specific KPIs on login
- [ ] Brand/admin users see their existing dashboard unchanged
- [ ] All 4 KPI cards have sparklines and delta indicators (Pattern 1)
- [ ] Day/Week/Month toggle controls both chart and table data (Pattern 5)
- [ ] Defect trend chart renders without errors
- [ ] Active projects section shows correct assigned projects
- [ ] Live status bar visible at bottom of page (Pattern 7)

---

## TASK 5 — Assign Factory to Project

**Agent:** Sub-Agent 3 (run in parallel with Task 4)
**Files:** Projects module — `app/(dashboard)/projects/[id]/page.tsx` or similar

### What to build

Add the ability to assign a factory to a project. This is triggered from two places:
1. The `Assign to Project` button on a factory card (factory list page)
2. Inside a project detail page — an "Assigned Factory" section

#### 5A — From Factory Card
When `Assign to Project` is clicked on a factory card:
- Open a modal with a dropdown listing all active projects
- User selects a project and clicks "Assign"
- Update the project record: set `factory_id = [selected factory id]`
- Show success toast: "Factory assigned to [Project Name]"

#### 5B — From Project Detail Page
In the project detail page, add an "Assigned Factory" section:
- If no factory assigned: show "No factory assigned" + `Assign Factory` button
- If factory assigned: show factory name, type, location + `Change Factory` and `Remove` buttons
- `Assign Factory` / `Change Factory` opens a searchable dropdown of all active factories
- `Remove` clears `factory_id` on the project (with confirmation prompt)

#### Database
The `projects` table likely already has or needs a `factory_id` column:
```sql
-- Check if factory_id exists on projects table
-- If not, add it:
ALTER TABLE projects ADD COLUMN factory_id UUID REFERENCES factories(id);
```

### Acceptance Criteria — Task 5
- [ ] `Assign to Project` from factory card opens modal with project dropdown
- [ ] Assignment saves correctly (project.factory_id updated in Supabase)
- [ ] Project detail page shows assigned factory info
- [ ] Change and Remove factory work correctly
- [ ] Confirmation prompt shown before removing a factory from a project

---

## BUILD & DEPLOY

```bash
# 1. Run build check
cd /var/www/Master_Sankalphub/V3.0_Frontend
npm run build

# 2. If build passes — commit and push
git add -A
git commit -m "feat: factories module — list, profile, dashboard, project assignment"
git push origin main

# 3. Vercel auto-deploys on push
```

**Do not push if `npm run build` fails.**

---

## GENERAL RULES FOR ALL AGENTS

1. **Read every file fully before editing.**
2. **Match the existing visual style** of other modules (Projects, Inspections). Use the same card components, table components, modal patterns, and toast notifications already in the codebase.
3. **Use the existing Supabase client** — do not create a new instance. Find it in `lib/supabase.ts` or equivalent.
4. **Use the existing auth/role context** — do not build a new auth system. Find how other pages access `userRole` and follow the same pattern.
5. **Use shadcn/ui components** already installed — Dialog, Sheet, Select, Input, Button, Badge, Table, Toast.
6. **Do not modify** the Backend at `/var/www/Master_Sankalphub/Backend/`.
7. **Do not modify** the Landing page, Pricing page, or any public pages.
8. **Build must pass** (`npm run build`) before pushing.

---

## FINAL VERIFICATION CHECKLIST

- [ ] `/factories` — list page loads, empty state visible, cards show when data exists
- [ ] Factory cards show pass rate as colored progress bar (Pattern 3)
- [ ] Filter bar uses pill-shaped dropdowns (Pattern 4)
- [ ] `+ Add Factory` — modal opens, form validates, data saves to Supabase
- [ ] `Register My Factory` — modal opens, saves with `status = 'pending'`
- [ ] `/factories/[id]` — profile page loads with all sections
- [ ] Factory profile shows pass rate as donut chart (Pattern 6)
- [ ] Factory profile shows open defects as severity-colored alert cards (Pattern 2)
- [ ] Factory edit — pre-fills and saves correctly
- [ ] Factory dashboard — factory_manager role sees factory-specific KPIs
- [ ] Factory dashboard KPI cards have sparklines + delta indicators (Pattern 1)
- [ ] Day/Week/Month toggle works on chart and table (Pattern 5)
- [ ] Live status bar visible at bottom of factory dashboard (Pattern 7)
- [ ] Brand/admin dashboard — unchanged for non-factory roles
- [ ] `Assign to Project` — works from both factory card and project detail page
- [ ] `factories` table has all required columns in Supabase
- [ ] RLS policies are active on `factories` table
- [ ] `npm run build` — zero errors

---

*SankalpHub V3 Frontend — Factories Module Build Sprint*
*March 28, 2026*
