# SankalpHub — Dashboard Brief (V3 Frontend)
**For: Claude Code + Sub-Agents**
**Date:** April 1, 2026
**Scope:** Build the main dashboard page — with data view + guided empty state for new users
**Mode:** New build. Replace existing placeholder dashboard. Do NOT touch any other module.

> ⚠️ **WORKING DIRECTORY: V3 Frontend ONLY**
> All work is exclusively in `/var/www/Master_Sankalphub/V3.0_Frontend/`
> Do NOT touch `/var/www/Master_Sankalphub/Backend/`

---

## PLATFORM CONTEXT

| Item | Detail |
|------|--------|
| **Frontend Framework** | Next.js 15.2.1, React 19.2.4, TypeScript, Tailwind CSS |
| **UI Library** | shadcn/ui (Radix primitives) |
| **Auth** | Supabase Auth |
| **Database** | Supabase — `jirhyxpcbfeelgiyxqdi.supabase.co` |
| **Charts** | Use Chart.js (`chart.js`) — already available or install |
| **File** | `app/(dashboard)/dashboard/page.tsx` |

---

## DESIGN REFERENCE — APPROVED MOCKUP

This brief is based on a visual mockup reviewed and approved by the founder. Build exactly what is described. No creative interpretation needed.

**Brand colors:**
- Primary button / active tab: `#BA7517`
- Gold accent / links: `#C9A96E`
- Success green: `#1D9E75`
- Danger red: `#E24B4A`
- Amber: `#EF9F27`
- Blue: `#378ADD`

---

## TASK ASSIGNMENT

| Task | Description | Agent |
|------|-------------|-------|
| Task 1 | Build dashboard page — with data view | Sub-Agent 1 |
| Task 2 | Build guided empty state | Sub-Agent 1 |
| Task 3 | Wire Supabase data queries | Sub-Agent 2 |

Sub-Agent 1 builds the full UI with mock/static data first.
Sub-Agent 2 replaces static data with live Supabase queries after UI is complete.

---

## PAGE STRUCTURE

```
Dashboard page
├── Page header (title + subtitle + action buttons)
├── Inline metrics bar (5 quick stats)
├── Row 1 — KPI cards (3 columns)
├── Row 2 — KPI cards (3 columns)
├── Bottom section (2 columns)
│   ├── Left — Quality analysis by category
│   └── Right — Quality trend chart (4 lines)
└── Recent inspections table
```

**Conditional rendering:**
- If user has NO data (0 projects, 0 inspections, 0 factories) → show **Guided Empty State**
- If user has ANY data → show **Dashboard with data**

---

## SECTION 1 — PAGE HEADER

```tsx
<div className="flex items-start justify-between mb-4">
  <div>
    <h1 className="text-lg font-medium text-foreground">Dashboard</h1>
    <p className="text-xs text-muted-foreground mt-0.5">
      Welcome back, {firstName} · Last updated just now
    </p>
  </div>
  <div className="flex gap-2">
    <Button variant="outline" size="sm">Live</Button>
    <Button variant="outline" size="sm">Export</Button>
    <Button size="sm" style={{ background: '#BA7517', color: '#fff', border: 'none' }}>
      + New Project
    </Button>
  </div>
</div>
```

---

## SECTION 2 — INLINE METRICS BAR

A single horizontal bar with 5 quick metrics separated by dividers.

```
[12 / 15 Inspections today] | [94% Defect-free rate] | [3 Pending approvals] | [8 Active factories] | [2 Critical alerts (red)]
```

- Background: white card, 0.5px border, 8px radius, 10px 16px padding
- Values: 18px, font-weight 500
- Labels: 11px, tertiary color
- Separator: 1px vertical line, 20px tall
- Critical alerts value: `#E24B4A` color when > 0

**Data sources:**
- Inspections today: COUNT from `inspections` where `created_at` = today
- Defect-free rate: (inspections with result='pass' / total inspections) * 100
- Pending approvals: COUNT from `inspections` where `status` = 'pending_approval'
- Active factories: COUNT from `factories` where `is_active` = true
- Critical alerts: COUNT from `inspections` where open critical defects > 0

---

## SECTION 3 — KPI CARDS (ROW 1 — 3 cards)

Each card follows this exact structure:

```
[Icon] [Title]
       [Industry avg: X%]
[Large value %]
[Delta badge: ▲ +X% vs last month]
[Progress label row: "Achieved target" ····· "87.3%"]
[Progress bar]
[Progress label row: "Target progress" ····· "97%"]
[─────────────────────────────────────]
[Sub metric 1] [Sub metric 2] [Sub metric 3]
```

### Card 1 — Overall Pass Rate
- Icon bg: `#E1F5EE`, stroke: `#1D9E75` (checkmark)
- Industry avg: 82.0%
- Value: calculated from all inspections (pass count / total * 100)
- Delta: vs previous month
- Progress bar color: `#1D9E75`
- Sub metrics: Garments %, Footwear %, Gloves %

### Card 2 — AQL First Pass Yield
- Icon bg: `#E6F1FB`, stroke: `#185FA5` (circle check)
- Industry avg: 89.0%
- Value: first-attempt pass rate (inspections passed on first run)
- Progress bar color: `#185FA5`
- Sub metrics: Defect rate %, Rework %, Rejected %

### Card 3 — On-Time Shipment Rate
- Icon bg: `#FAEEDA`, stroke: `#854F0B` (house/factory icon)
- Industry avg: 84.0%
- Value: shipments on time / total shipments * 100
- Progress bar color: `#BA7517`
- Sub metrics: NPS score, Returns %, Claims %

**KPI Card component spec:**
```
background: white
border-radius: 10px
border: 0.5px solid var(--border)
padding: 14px
value font-size: 26px, font-weight 500
delta badge: 10px, font-weight 500
  - up: bg #E1F5EE, text #085041
  - down: bg #FCEBEB, text #791F1F
progress track: 4px height, bg secondary, radius 2px
progress label: 10px, flex justify-between
sub-grid: 3 columns, border-top 0.5px, padding-top 8px
sub value: 12px, font-weight 500
sub label: 10px, tertiary
colored dot before sub value: 6px circle
```

---

## SECTION 4 — KPI CARDS (ROW 2 — 3 cards)

### Card 4 — Active Projects
- Icon bg: `#EEEDFE`, stroke: `#534AB7` (briefcase)
- Value: COUNT from `projects` where `status` != 'completed'
- Progress bar color: `#534AB7`
- Sub metrics: In inspection, In production, Completed

### Card 5 — Open Defects
- Icon bg: `#FCEBEB`, stroke: `#A32D2D` (warning triangle)
- Value: COUNT open defects — shown in `#E24B4A` if > 0
- Delta badge: down/red if increased since yesterday
- Progress bar color: `#E24B4A`
- Sub metrics: Critical (red), Major (amber), Minor (gray)

### Card 6 — Active Factories
- Icon bg: `#E1F5EE`, stroke: `#1D9E75` (group/people icon)
- Value: COUNT from `factories` where `is_active` = true
- Progress bar color: `#1D9E75`
- Sub metrics: Garments count, Footwear count, Accessories count

---

## SECTION 5 — BOTTOM SECTION (2 columns, equal width)

### Left column — Quality Analysis by Category

**Category tabs (single select, active = amber `#BA7517`):**
```
[All] [Garments] [Footwear] [Gloves] [Headwear] [Accessories]
```

On tab change, update the defect row counts and percentages below.

**6 defect rows — each row:**
```
[Colored bg row] [Label] ········· [Count] [%]
```

| Row | Background | Text color |
|---|---|---|
| Pass — Excellent | `#E6F1FB` | `#0C447C` |
| Pass — Good | `#EEEDFE` | `#3C3489` |
| Minor defects | `#FAEEDA` | `#633806` |
| Major defects | `#EAF3DE` | `#27500A` |
| Critical defects | `#FCEBEB` | `#791F1F` |
| Rework required | `#E6F1FB` | `#0C447C` |

Row spec: `padding: 7px 10px`, `border-radius: 6px`, label `font-size: 11px font-weight 500`, count `font-size: 13px font-weight 500`, pct `font-size: 10px tertiary`

**Data query per category:**
```typescript
// All categories
const defectData = await supabase
  .from('inspections')
  .select('result, category, defects')
  .eq('organization_id', orgId)

// Filter by category tab selection
// Aggregate into: passExcellent, passGood, minorDefects, majorDefects, criticalDefects, reworkRequired
```

---

### Right column — Quality Trend Chart

**Title:** "Quality trend"
**Subtitle:** "30-day operational metrics"
**Toggle:** "Last 7 days / Last 30 days / Last 90 days" select dropdown (top right)

**Chart type:** Line chart using Chart.js

**4 data lines:**
| Line | Color | Style | Data |
|---|---|---|---|
| Pass rate % | `#1D9E75` | Solid, filled area below | Daily pass rate |
| Defect rate % | `#E24B4A` | Solid | Daily defect rate |
| AQL score % | `#378ADD` | Dashed (4,3) | Daily AQL score |
| Rework % | `#EF9F27` | Dashed (2,4) | Daily rework rate |

**Chart.js config:**
```typescript
{
  type: 'line',
  data: { labels, datasets },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'white',
        titleColor: '#111',
        bodyColor: '#666',
        borderColor: '#e5e5e5',
        borderWidth: 0.5,
        padding: 10,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 } }, min: 0, max: 100 }
    }
  }
}
```

**Legend** (manually rendered below chart, not Chart.js built-in):
```
● Pass rate  ● Defect rate  -- AQL score  -- Rework %
```

**Chart height:** 150px

**Data query:**
```typescript
// Get daily aggregated stats for the selected time range
const { data } = await supabase
  .from('inspections')
  .select('created_at, result, aql_score')
  .eq('organization_id', orgId)
  .gte('created_at', startDate)
  .order('created_at', { ascending: true })

// Aggregate by day into pass rate, defect rate, aql score, rework rate
```

---

## SECTION 6 — RECENT INSPECTIONS TABLE

Full-width card below the bottom section.

**Header:** "Recent inspections" (left) + "View all →" link in `#C9A96E` (right, goes to `/inspections`)

**Table columns with fixed widths:**
| Column | Width | Content |
|---|---|---|
| Inspection | 14% | INS-047 |
| Factory | 18% | Factory name |
| Category | 14% | Garments / Footwear / Gloves / Headwear / Accessories |
| AQL | 8% | 1.0 / 2.5 / 4.0 |
| Score | 10% | 98.5% |
| Result | 10% | Pass / Fail / Review badge |
| Date | 12% | Today / Yesterday / X days ago |

**Result badge colors:**
- Pass: bg `#E1F5EE`, text `#085041`
- Fail: bg `#FCEBEB`, text `#791F1F`
- Review: bg `#FAEEDA`, text `#633806`

**Table spec:**
- `table-layout: fixed` — prevents overflow
- Header: 10px uppercase, letter-spacing 0.04em, tertiary
- Rows: 11px, truncate with ellipsis
- Row border-bottom: 0.5px
- Last row: no border
- Show 5 most recent inspections

**Data query:**
```typescript
const { data } = await supabase
  .from('inspections')
  .select(`
    id,
    result,
    aql_level,
    score,
    category,
    created_at,
    factories ( name )
  `)
  .eq('organization_id', orgId)
  .order('created_at', { ascending: false })
  .limit(5)
```

---

## SECTION 7 — GUIDED EMPTY STATE

Show this instead of the full dashboard when:
```typescript
const isEmpty = projects.count === 0 && inspections.count === 0 && factories.count === 0
```

**Layout:**
```
[Sacred Orbit logo — 48px]
[Title: "Welcome to SankalpHub"]
[Subtitle: "Your quality dashboard is ready. Complete these steps..."]
[2-col stats: 0 Active projects | 0 Inspections run]
[Get started checklist — 6 steps]
```

**Sacred Orbit logo SVG** (use exactly this, scaled to 48px):
```tsx
<svg viewBox="0 0 140 140" width="48" height="48" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="eG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#EDD898"/>
      <stop offset="100%" stopColor="#A87C30"/>
    </linearGradient>
    <linearGradient id="eN" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#C9A96E"/>
      <stop offset="100%" stopColor="#8B6520"/>
    </linearGradient>
  </defs>
  <ellipse cx="70" cy="70" rx="62" ry="22" fill="none" stroke="#C9A96E" strokeWidth="1" opacity="0.3" transform="rotate(-40 70 70)"/>
  <ellipse cx="70" cy="70" rx="62" ry="22" fill="none" stroke="#C9A96E" strokeWidth="1" opacity="0.5" transform="rotate(20 70 70)"/>
  <polygon points="70,14 116,70 70,122 24,70" fill="none" stroke="url(#eG)" strokeWidth="1.5" opacity="0.7"/>
  <polygon points="70,44 96,70 70,94 44,70" fill="none" stroke="url(#eG)" strokeWidth="2"/>
  <circle cx="70" cy="8" r="4" fill="url(#eN)"/>
  <circle cx="70" cy="70" r="6" fill="url(#eG)"/>
  <circle cx="70" cy="70" r="2.5" fill="#EDD898"/>
</svg>
```

**Checklist — 6 steps:**

| Step | Title | Subtitle | Action |
|---|---|---|---|
| 1 ✅ | Create your account | Organisation set up · Role selected | Done (always complete) |
| 2 | Add your first factory | Connect your manufacturing partner | → `/factories/new` |
| 3 | Create your first project | Set up season, styles, and deadlines | → `/projects/new` |
| 4 | Build an inspection template | Garments · Footwear · Gloves · Headwear | → `/settings?tab=templates` |
| 5 | Run your first inspection | Live AQL scoring · Defect logging · PDF report | → `/inspections/new` |
| 6 | Invite your team | Brand Manager · Inspector · Factory Manager | → `/settings?tab=users` |

**Step states:**
- Completed: green circle checkmark, title struck through, opacity 0.5, "Done" label in green
- Current (next incomplete): amber number circle, full opacity, action link in `#C9A96E`
- Locked (not yet): gray number circle, opacity 0.5, action link in tertiary

**Which steps are complete:** Check Supabase:
- Step 1: always done
- Step 2: `factories.count > 0`
- Step 3: `projects.count > 0`
- Step 4: `templates.count > 0`
- Step 5: `inspections.count > 0`
- Step 6: `profiles.count > 1` (more than just the owner)

**Check item spec:**
```
background: white
border-radius: 8px
border: 0.5px solid var(--border)
padding: 12px 14px
hover: border-color #C9A96E
number circle: 24px, border-radius 50%
title: 13px, font-weight 500
subtitle: 11px, tertiary
action: 11px, #C9A96E
```

---

## TASK 3 — SUPABASE DATA WIRING

**Agent:** Sub-Agent 2

All queries use the user's `organization_id` from their profile. Never fetch data outside the user's org (RLS enforces this).

### Dashboard data hook — create `hooks/useDashboardData.ts`:

```typescript
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface DashboardData {
  // Inline bar
  inspectionsToday: number
  inspectionsTodayTarget: number
  defectFreeRate: number
  pendingApprovals: number
  activeFactories: number
  criticalAlerts: number

  // KPI Row 1
  overallPassRate: number
  overallPassRateDelta: number
  aqlFirstPassYield: number
  aqlDelta: number
  onTimeShipmentRate: number
  shipmentDelta: number

  // KPI Row 2
  activeProjects: number
  projectsDelta: number
  projectsInInspection: number
  projectsInProduction: number
  projectsCompleted: number
  openDefects: number
  criticalDefects: number
  majorDefects: number
  minorDefects: number

  // Category analysis
  categoryData: Record<string, {
    passExcellent: number
    passGood: number
    minorDefects: number
    majorDefects: number
    criticalDefects: number
    reworkRequired: number
  }>

  // Trend chart
  trendData: {
    labels: string[]
    passRate: number[]
    defectRate: number[]
    aqlScore: number[]
    reworkRate: number[]
  }

  // Recent inspections
  recentInspections: Array<{
    id: string
    factoryName: string
    category: string
    aqlLevel: string
    score: number
    result: 'pass' | 'fail' | 'review'
    createdAt: string
  }>

  // Empty state check
  isEmpty: boolean
  completedSteps: boolean[]

  loading: boolean
  error: string | null
}

export function useDashboardData(): DashboardData {
  // Implementation: fetch all required data from Supabase
  // Group into a single effect to minimize round trips
  // Return loading state while fetching
  // Never throw — always return safe defaults on error
}
```

### Error handling rule:
- All queries wrapped in try/catch
- On error: return zeros/empty arrays — dashboard must never crash
- Show a small "Data unavailable" placeholder inside the affected card only

---

## BUILD & DEPLOY

```bash
# Install Chart.js if not already installed
cd /var/www/Master_Sankalphub/V3.0_Frontend
npm install chart.js

# Build check
npm run build

# Commit and push
git add -A
git commit -m "feat: main dashboard — KPI cards, trend chart, category analysis, guided empty state"
git push origin main
```

---

## FINAL VERIFICATION CHECKLIST

**With data view:**
- [ ] Page header with title, subtitle, Live + Export + New Project buttons
- [ ] Inline metrics bar — 5 stats with separators
- [ ] Row 1 — 3 KPI cards (Pass Rate, AQL Yield, Shipment Rate)
- [ ] Row 2 — 3 KPI cards (Projects, Defects, Factories)
- [ ] Each KPI card has: icon, title, avg, large value, delta badge, 2 progress rows, 3 sub-metrics
- [ ] Quality analysis — 6 category tabs working, defect rows update on tab click
- [ ] Trend chart — 4 lines, Chart.js, hover tooltip, time range toggle
- [ ] Recent inspections table — 5 rows, result badges, fixed column widths
- [ ] All data fetched from Supabase for logged-in user's org

**Guided empty state:**
- [ ] Shows when 0 projects + 0 inspections + 0 factories
- [ ] Sacred Orbit logo centered at top
- [ ] 6-step checklist with correct completion states
- [ ] Step 1 always done
- [ ] Active step is the first incomplete one
- [ ] Each action link navigates to correct route
- [ ] Hover state on check items (border turns gold)

**General:**
- [ ] Dashboard never crashes on empty data
- [ ] super_admin sees full dashboard regardless of org data
- [ ] Mobile responsive
- [ ] `npm run build` — zero errors

---

*SankalpHub V3 Frontend — Main Dashboard*
*Design approved via interactive mockup — April 1, 2026*
