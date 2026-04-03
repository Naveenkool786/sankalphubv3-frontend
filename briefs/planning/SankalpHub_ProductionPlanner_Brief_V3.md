# SankalpHub — Production Planner Brief (V3 Frontend)
**For: Claude Code + Sub-Agents**
**Date:** April 1, 2026
**Scope:** Build the full Production Planner module — 3 interfaces with live calculations
**Mode:** New module build. Do NOT touch dashboard, inspection, or any other module.

> ⚠️ **WORKING DIRECTORY: V3 Frontend ONLY**
> All work is exclusively in `/var/www/Master_Sankalphub/V3.0_Frontend/`
> Do NOT touch `/var/www/Master_Sankalphub/Backend/`

---

## PLATFORM CONTEXT

| Item | Detail |
|------|--------|
| **Framework** | Next.js 15.2.1, React 19.2.4, TypeScript, Tailwind CSS |
| **UI Library** | shadcn/ui |
| **Auth + DB** | Supabase — `jirhyxpcbfeelgiyxqdi.supabase.co` |
| **Route** | `app/(dashboard)/planning/page.tsx` |
| **Brand colors** | `#BA7517` (primary), `#C9A96E` (gold), `#1D9E75` (green), `#E24B4A` (red), `#378ADD` (blue), `#EF9F27` (amber) |

---

## DESIGN REFERENCE — APPROVED MOCKUP

Build exactly what is described below. The design has been reviewed and approved by the founder. Reference: naasmes.com Production Planning interface adapted for SankalpHub fashion/garments context.

---

## MODULE STRUCTURE

```
/planning
├── Top bar (Production Planner dropdown + WIP counter + search + user)
├── Sidebar (navigation with premium gates)
└── Main content area (3 swappable views)
    ├── View 1 — Production Planning (default)
    ├── View 2 — Production Timeline
    └── View 3 — Daily Progress Report (DPR)
```

---

## TASK ASSIGNMENT

| Task | Agent | Description |
|---|---|---|
| Task 1 | Sub-Agent 1 | Supabase schema + queries |
| Task 2 | Sub-Agent 2 | Top bar + sidebar layout |
| Task 3 | Sub-Agent 2 | View 1 — Production Planning |
| Task 4 | Sub-Agent 3 | View 2 — Production Timeline |
| Task 5 | Sub-Agent 3 | View 3 — Daily Progress Report |
| Task 6 | Sub-Agent 1 | Wire all live calculations |

**Execution order:**
- Sub-Agent 1 runs Task 1 first — schema must exist before UI
- Sub-Agents 2 and 3 build UI with static data while Sub-Agent 1 finishes
- Sub-Agent 1 runs Task 6 last — replaces static data with live queries

---

## TASK 1 — SUPABASE SCHEMA

**Agent:** Sub-Agent 1

### Check existing tables first:
```bash
# Check what tables already exist
grep -r "from('orders')\|from('production')\|from('samples')" \
  /var/www/Master_Sankalphub/V3.0_Frontend/lib \
  --include="*.ts" --include="*.tsx" | grep -v node_modules
```

### Create tables if they don't exist — run in Supabase SQL Editor:

```sql
-- Orders / Purchase Orders
CREATE TABLE IF NOT EXISTS orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID REFERENCES organizations(id) ON DELETE CASCADE,
  factory_id        UUID REFERENCES factories(id),
  order_number      TEXT NOT NULL,           -- e.g. ORD-2847
  product_category  TEXT NOT NULL,           -- garments|footwear|gloves|headwear|accessories
  product_name      TEXT,
  quantity          INT NOT NULL DEFAULT 0,
  units_produced    INT NOT NULL DEFAULT 0,  -- updated daily
  daily_target      INT NOT NULL DEFAULT 0,  -- target units per day
  status            TEXT NOT NULL DEFAULT 'confirmed',
  -- status: confirmed|in_production|in_inspection|completed|delayed|cancelled
  priority          TEXT NOT NULL DEFAULT 'medium',
  -- priority: high|medium|low
  start_date        DATE,
  expected_delivery DATE,
  actual_delivery   DATE,
  time_slot_start   TIME,
  time_slot_end     TIME,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_orders_org      ON orders (organization_id);
CREATE INDEX idx_orders_factory  ON orders (factory_id);
CREATE INDEX idx_orders_status   ON orders (status);
CREATE INDEX idx_orders_delivery ON orders (expected_delivery);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_orders" ON orders FOR ALL
USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "super_admin_orders" ON orders FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Daily Production Records (for DPR)
CREATE TABLE IF NOT EXISTS daily_production (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID REFERENCES organizations(id) ON DELETE CASCADE,
  factory_id        UUID REFERENCES factories(id),
  order_id          UUID REFERENCES orders(id),
  date              DATE NOT NULL DEFAULT CURRENT_DATE,
  units_produced    INT NOT NULL DEFAULT 0,
  daily_target      INT NOT NULL DEFAULT 0,
  cycle_time_minutes DECIMAL(6,2),
  shift             TEXT DEFAULT 'morning',  -- morning|afternoon|night
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_dp_org     ON daily_production (organization_id, date DESC);
CREATE INDEX idx_dp_factory ON daily_production (factory_id, date DESC);
CREATE INDEX idx_dp_date    ON daily_production (date DESC);

ALTER TABLE daily_production ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_daily_production" ON daily_production FOR ALL
USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "super_admin_daily_production" ON daily_production FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
```

### Acceptance Criteria — Task 1
- [ ] `orders` table created with all columns
- [ ] `daily_production` table created
- [ ] All indexes and RLS policies in place
- [ ] super_admin bypasses all RLS

---

## TASK 2 — TOP BAR + SIDEBAR

**Agent:** Sub-Agent 2

### File: `app/(dashboard)/planning/page.tsx`

Use `'use client'` — this page has interactive state (active view, dropdown).

### State management:
```typescript
const [activeView, setActiveView] = useState<'planning' | 'timeline' | 'dpr'>('planning')
const [dropdownOpen, setDropdownOpen] = useState(false)
```

---

### TOP BAR

```
[Production Planner ▾ dropdown] [WIP counter button] ........... [search] [avatar] [name + role]
```

**Production Planner dropdown button:**
- Background: `#C9A96E`, text: `#412402`
- On click: toggles dropdown menu
- Close on click outside

**Dropdown menu (3 options + divider + 1 coming soon):**

| Option | Icon | Action |
|---|---|---|
| Production Planning | Calendar icon | setActiveView('planning') |
| Production Timeline | Lines icon | setActiveView('timeline') |
| Daily Progress Report (DPR) | Document icon | setActiveView('dpr') |
| — divider — | | |
| WIP Tracker | Clock icon | disabled, "Soon" badge |

Active option gets amber highlight (`#FAEEDA` bg, `#633806` text, font-weight 500).

**WIP counter button:**
- Border: 0.5px, secondary bg
- Shows clock icon + "WIP" label + count badge (`#FAEEDA` bg, `#633806` text)
- Count = live calculation (see formula below)
- Dropdown arrow ▾

**WIP count formula:**
```typescript
const wipCount =
  orders.filter(o => o.status === 'in_production').length +
  inspections.filter(i => i.status === 'in_progress').length +
  samples.filter(s => !['approved','rejected'].includes(s.status)).length
```

---

### SIDEBAR

Width: 180px, white bg, right border 0.5px.

**Navigation items (free):**

| Item | Icon | Route |
|---|---|---|
| Dashboard | Grid icon | `/dashboard` |
| Planning | Calendar icon | `/planning` (active) |
| Orders / POs | Document icon | `/orders` |
| Inspectors | People icon | `/team` |
| Factories | Building icon | `/factories` |
| Inspections | Checklist icon | `/inspections` |

**Active state:** `#FAEEDA` bg, `#633806` text, font-weight 500.

**Section label "Premium" — 3 gated items:**

| Item | Badge |
|---|---|
| Analytics | Pro |
| Materials / BOM | Pro |
| Reports | Pro |

Premium items: opacity 0.6, cursor default, "Pro" badge in `#FAEEDA`/`#633806`.

> Exception: super_admin sees all items at full opacity and fully clickable.

**Section label "System":**
- Settings → `/settings`

**Status bar at bottom:**
```
● All systems operational
8 factories · 0 alerts
```
Green dot, green bg `#E1F5EE`, text `#085041`. Factory count = live from DB.

---

## TASK 3 — VIEW 1: PRODUCTION PLANNING

**Agent:** Sub-Agent 2

### Page header:
```
Production Planning                    [View Calendar] [+ Schedule Order]
Schedule optimisation and resource management
```

---

### KPI ROW — 4 cards

**Card 1 — Active Orders / POs**
```typescript
const activeOrders = orders.filter(o =>
  ['confirmed', 'in_production', 'in_inspection'].includes(o.status)
).length
// Sub: "This month"
```

**Card 2 — Inspections this week**
```typescript
const weekStart = startOfWeek(new Date())
const weekEnd = endOfWeek(new Date())
const thisWeek = inspections.filter(i =>
  isWithinInterval(new Date(i.scheduled_date), { start: weekStart, end: weekEnd })
).length
const lastWeek = inspections.filter(i =>
  isWithinInterval(new Date(i.scheduled_date), {
    start: subWeeks(weekStart, 1),
    end: subWeeks(weekEnd, 1)
  })
).length
const delta = thisWeek - lastWeek
// Show delta: "+3 vs last week" (green) or "-2 vs last week" (red)
```

**Card 3 — Delayed Orders**
```typescript
const delayed = orders.filter(o =>
  new Date(o.expected_delivery) < new Date() &&
  o.status !== 'completed' &&
  o.status !== 'cancelled'
).length
// Value color: #E24B4A if delayed > 0
// Sub: "Needs attention" in red if > 0, "All on track" in green if 0
```

**Card 4 — WIP Items**
```typescript
const wip = wipCount  // same formula from top bar
// Sub: `Across ${activeFactoriesCount} factories`
```

**KPI card spec:**
```
background: white
border-radius: 8px
border: 0.5px
padding: 12px
icon: 28×28px rounded square
label: 11px secondary
value: 22px font-weight 500
sub/delta: 10px
```

---

### TWO COLUMN LAYOUT: Production Schedule (left) + Resource Availability (right, 260px)

---

### LEFT — Production Schedule

**Header:** "Production schedule" + Day/Week/Month toggle (active = `#BA7517`)

**Job rows** — fetched from `orders` table, filtered by selected toggle (day/week/month):

Each row:
```
[Time slot label]   [Order number]   [Priority badge] [Status badge]   [Modify button]
[08:00 – 10:00]     [ORD-2847]       [High]           [In progress]
                    [Factory · Category]
```

**Priority badge colors:**
- High: `#FCEBEB` bg, `#791F1F` text
- Medium: `#FAEEDA` bg, `#633806` text
- Low: `#E1F5EE` bg, `#085041` text

**Status badge colors:**
- In progress: `#E6F1FB` bg, `#0C447C` text
- Scheduled: `#EEEDFE` bg, `#3C3489` text
- Completed: `#E1F5EE` bg, `#085041` text
- Delayed: `#FCEBEB` bg, `#791F1F` text

**Modify button:** Opens an edit sheet/modal for the order.

**Toggle filter logic:**
```typescript
// Day: orders where time_slot_start is today
// Week: orders where start_date BETWEEN weekStart AND weekEnd
// Month: orders where start_date in current month
```

---

### RIGHT — Resource Availability (260px)

**Title:** "Resource availability" + "Current capacity status"

**Per-factory utilisation rows:**
```typescript
// For each active factory:
const utilisation = Math.round(
  (activeOrdersAtFactory / factory.max_capacity) * 100
)

// Bar color:
// < 80%  → #C9A96E (gold)
// 80–99% → #EF9F27 (amber)
// 100%   → #E24B4A (red)

// Label: "X% utilisation" or "100% — at capacity" in red
```

**Inspectors row:**
```typescript
const assignedInspectors = inspectors.filter(i => i.status === 'assigned').length
const totalInspectors = inspectors.length
const inspectorUtilisation = Math.round((assignedInspectors / totalInspectors) * 100)
```

**Optimise Schedule button:**
- Full width, `#BA7517`, white text
- On click: sorts orders by priority (High → Medium → Low) and re-renders schedule

---

## TASK 4 — VIEW 2: PRODUCTION TIMELINE

**Agent:** Sub-Agent 3

### Page header:
```
Production Timeline                    [← Prev month] [Today] [Next month →]
Order timeline connected to all active POs and deliveries
```

**Month navigation state:**
```typescript
const [viewMonth, setViewMonth] = useState(new Date())
// Prev: subMonths(viewMonth, 1)
// Next: addMonths(viewMonth, 1)
// Today: new Date()
```

---

### KPI ROW — 4 cards

```typescript
const activeOrders = orders.filter(o => o.status !== 'cancelled').length

const onTrack = orders.filter(o =>
  new Date(o.expected_delivery) >= new Date() || o.status === 'completed'
).length

const delayed = orders.filter(o =>
  new Date(o.expected_delivery) < new Date() && o.status !== 'completed'
).length

const dueThisMonth = orders.filter(o => {
  const d = new Date(o.expected_delivery)
  return d.getMonth() === viewMonth.getMonth() &&
         d.getFullYear() === viewMonth.getFullYear()
}).length
```

---

### GANTT BAR CHART

**Header row:** Date markers across the month (Apr 1, Apr 5, Apr 8... Apr 30)

**Per-order row:**
```
[Order number    ] [━━━━━━━━━━━━━━━━━ bar ━━━━━━━━━━━━]
[Factory name    ]
```

**Bar position calculation:**
```typescript
const daysInMonth = getDaysInMonth(viewMonth)
const monthStart = startOfMonth(viewMonth)

const leftPct = Math.max(0, Math.min(100,
  (differenceInDays(new Date(order.start_date), monthStart) / daysInMonth) * 100
))

const widthPct = Math.max(2, Math.min(100 - leftPct,
  (differenceInDays(new Date(order.expected_delivery), new Date(order.start_date)) / daysInMonth) * 100
))
```

**Bar color logic:**
```typescript
const getBarColor = (order: Order): string => {
  if (order.status === 'completed') return '#1D9E75'
  if (new Date(order.expected_delivery) < new Date()) return '#E24B4A'  // delayed
  if (order.status === 'in_production') return '#378ADD'
  if (order.status === 'in_inspection') return '#534AB7'
  return '#C9A96E'  // scheduled
}

const getBarTextColor = (order: Order): string => {
  if (getBarColor(order) === '#C9A96E') return '#412402'
  return '#ffffff'
}
```

**Bar label inside:**
```typescript
`${order.product_category} · ${order.quantity.toLocaleString()} pcs`
// Truncate with ellipsis if bar too narrow
```

**Category filter dropdown:**
```typescript
// All | Garments | Footwear | Gloves | Headwear | Accessories
const filteredOrders = selectedCategory === 'all'
  ? orders
  : orders.filter(o => o.product_category === selectedCategory)
```

**Legend:**
- Green = On track
- Red = Delayed
- Blue = In production
- Purple = In inspection
- Gold = Scheduled

---

## TASK 5 — VIEW 3: DAILY PROGRESS REPORT (DPR)

**Agent:** Sub-Agent 3

### Page header:
```
Daily Progress Report                  [Date picker] [Export PDF] [Share Report]
Production output + quality summary — [selected date]
```

**Date picker:** defaults to today. On change, refetch all DPR data for selected date.

---

### KPI ROW — 4 cards (all calculated for selected date)

**Card 1 — Total units produced**
```typescript
const totalProduced = dailyProduction
  .filter(dp => dp.date === selectedDate)
  .reduce((sum, dp) => sum + dp.units_produced, 0)

const totalTarget = dailyProduction
  .filter(dp => dp.date === selectedDate)
  .reduce((sum, dp) => sum + dp.daily_target, 0)

const achievementPct = totalTarget > 0
  ? Math.round((totalProduced / totalTarget) * 100)
  : 0

// Delta: `${achievementPct}% of target`
// Color: green if >= 90%, amber if >= 70%, red if < 70%
```

**Card 2 — Inspections done**
```typescript
const inspectionsDone = inspections.filter(i =>
  i.inspection_date === selectedDate
).length

const passed = inspections.filter(i =>
  i.inspection_date === selectedDate && i.result === 'pass'
).length

const passRate = inspectionsDone > 0
  ? Math.round((passed / inspectionsDone) * 100)
  : 0

// Sub: `${passRate}% pass rate`
```

**Card 3 — Total defects**
```typescript
const allDefects = defects.filter(d => d.date === selectedDate)

const criticalCount = allDefects.filter(d => d.severity === 'critical').length
const majorCount    = allDefects.filter(d => d.severity === 'major').length
const minorCount    = allDefects.filter(d => d.severity === 'minor').length
const totalDefects  = allDefects.length

// Value color: #E24B4A if totalDefects > 0
// Sub: `${criticalCount} critical · ${majorCount} major`
```

**Card 4 — Average cycle time**
```typescript
const cycleTimeRecords = dailyProduction
  .filter(dp => dp.date === selectedDate && dp.cycle_time_minutes != null)

const avgCycleTime = cycleTimeRecords.length > 0
  ? (cycleTimeRecords.reduce((sum, dp) => sum + dp.cycle_time_minutes, 0) / cycleTimeRecords.length).toFixed(1)
  : '—'

// Show as: "22.5 min"
// Sub: `Target: ${categoryTarget} min`
```

---

### PER-FACTORY CARDS GRID (2 columns)

One card per active factory. For each factory:

**Header:**
```
[Factory name]                    [Status badge]
```

**3-metric row:**
```typescript
const factoryDP = dailyProduction.find(dp =>
  dp.factory_id === factory.id && dp.date === selectedDate
)

const unitsProduced = factoryDP?.units_produced ?? 0
const dailyTarget   = factoryDP?.daily_target ?? 0
const achievement   = dailyTarget > 0
  ? Math.round((unitsProduced / dailyTarget) * 100)
  : 0
```

| Metric | Calculation |
|---|---|
| Units today | `factoryDP.units_produced` |
| Target | `factoryDP.daily_target` |
| Achieved % | `Math.round(unitsProduced / dailyTarget * 100)` |

**Progress bar:**
```typescript
const progressWidth = `${Math.min(100, achievement)}%`

const progressColor =
  achievement >= 90 ? '#1D9E75' :
  achievement >= 70 ? '#BA7517' :
  '#E24B4A'
```

**Progress label row:**
```
Production progress          1,820 / 2,000
```

**Quality summary row (4 cells):**
```typescript
const factoryInspections = inspections.filter(i =>
  i.factory_id === factory.id && i.inspection_date === selectedDate
)
const factoryDefects = defects.filter(d =>
  d.factory_id === factory.id && d.date === selectedDate
)

const passRate = factoryInspections.length > 0
  ? Math.round(
      factoryInspections.filter(i => i.result === 'pass').length /
      factoryInspections.length * 100
    )
  : 0

const critical = factoryDefects.filter(d => d.severity === 'critical').length
const major    = factoryDefects.filter(d => d.severity === 'major').length
const minor    = factoryDefects.filter(d => d.severity === 'minor').length
```

| Cell | Color | Value |
|---|---|---|
| Pass rate | `#E1F5EE` / `#085041` | `${passRate}%` |
| Critical | `#FCEBEB` / `#791F1F` | count (red if > 0) |
| Major | `#FAEEDA` / `#633806` | count |
| Minor | `#E1F5EE` / `#085041` | count |

---

### EXPORT PDF — `Export PDF` button

On click:
```typescript
// Use browser print API for now
// Later: generate PDF using a library like jsPDF or react-pdf
window.print()
// Or open a print-formatted version of the DPR
```

---

## TASK 6 — LIVE DATA WIRING

**Agent:** Sub-Agent 1

### Create `hooks/usePlanningData.ts`:

```typescript
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  subWeeks, isWithinInterval, differenceInDays,
  getDaysInMonth
} from 'date-fns'

export function usePlanningData(selectedDate: string, viewMonth: Date) {
  const [data, setData] = useState<PlanningData>(defaultData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      try {
        const supabase = createClient()

        // Get org ID from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .single()

        const orgId = profile?.organization_id
        if (!orgId) return

        // Fetch all required data in parallel
        const [ordersRes, factoriesRes, inspectionsRes, defectsRes, dpRes] =
          await Promise.all([
            supabase.from('orders').select('*, factories(name, max_capacity)').eq('organization_id', orgId),
            supabase.from('factories').select('*').eq('organization_id', orgId).eq('is_active', true),
            supabase.from('inspections').select('*').eq('organization_id', orgId),
            supabase.from('defects').select('*').eq('organization_id', orgId),
            supabase.from('daily_production').select('*').eq('organization_id', orgId),
          ])

        // Calculate all derived values here
        // Pass raw data + calculated KPIs to components
        setData(calculateAll({
          orders: ordersRes.data ?? [],
          factories: factoriesRes.data ?? [],
          inspections: inspectionsRes.data ?? [],
          defects: defectsRes.data ?? [],
          dailyProduction: dpRes.data ?? [],
          selectedDate,
          viewMonth,
        }))
      } catch (err) {
        console.error('[PlanningData]', err)
        // Never crash — return safe defaults
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [selectedDate, viewMonth])

  return { ...data, loading }
}
```

### `calculateAll` function — all formulas in one place:

```typescript
function calculateAll(input: PlanningInput): PlanningData {
  const { orders, factories, inspections, defects, dailyProduction, selectedDate, viewMonth } = input
  const today = new Date()

  // ── PLANNING KPIs ────────────────────────────────────────
  const activeOrders = orders.filter(o =>
    ['confirmed', 'in_production', 'in_inspection'].includes(o.status)
  ).length

  const weekStart = startOfWeek(today)
  const weekEnd   = endOfWeek(today)
  const thisWeekInspections = inspections.filter(i =>
    isWithinInterval(new Date(i.scheduled_date ?? i.created_at), { start: weekStart, end: weekEnd })
  ).length
  const lastWeekInspections = inspections.filter(i =>
    isWithinInterval(new Date(i.scheduled_date ?? i.created_at), {
      start: subWeeks(weekStart, 1), end: subWeeks(weekEnd, 1)
    })
  ).length
  const inspectionsDelta = thisWeekInspections - lastWeekInspections

  const delayedOrders = orders.filter(o =>
    o.expected_delivery &&
    new Date(o.expected_delivery) < today &&
    !['completed', 'cancelled'].includes(o.status)
  ).length

  const wipCount =
    orders.filter(o => o.status === 'in_production').length +
    inspections.filter(i => i.status === 'in_progress').length

  // ── RESOURCE UTILISATION ──────────────────────────────────
  const factoryUtilisation = factories.map(f => {
    const activeAtFactory = orders.filter(o =>
      o.factory_id === f.id &&
      ['in_production', 'confirmed'].includes(o.status)
    ).length
    const maxCap = f.max_capacity ?? 4
    const pct = Math.min(100, Math.round((activeAtFactory / maxCap) * 100))
    return { factory: f, activeOrders: activeAtFactory, maxCapacity: maxCap, utilisationPct: pct }
  })

  // ── TIMELINE ──────────────────────────────────────────────
  const monthStart = startOfMonth(viewMonth)
  const daysInMonth = getDaysInMonth(viewMonth)

  const timelineOrders = orders
    .filter(o => !['cancelled'].includes(o.status))
    .map(o => {
      const start = o.start_date ? new Date(o.start_date) : monthStart
      const end   = o.expected_delivery ? new Date(o.expected_delivery) : start

      const leftPct  = Math.max(0, Math.min(100,
        (differenceInDays(start, monthStart) / daysInMonth) * 100
      ))
      const widthPct = Math.max(2, Math.min(100 - leftPct,
        (differenceInDays(end, start) / daysInMonth) * 100
      ))

      const isDelayed = end < today && o.status !== 'completed'
      const color =
        o.status === 'completed'    ? '#1D9E75' :
        isDelayed                   ? '#E24B4A' :
        o.status === 'in_production'? '#378ADD' :
        o.status === 'in_inspection'? '#534AB7' :
        '#C9A96E'

      return { ...o, leftPct, widthPct, color, isDelayed }
    })

  const onTrack  = orders.filter(o => !o.expected_delivery || new Date(o.expected_delivery) >= today || o.status === 'completed').length
  const dueThisMonth = orders.filter(o => {
    if (!o.expected_delivery) return false
    const d = new Date(o.expected_delivery)
    return d.getMonth() === viewMonth.getMonth() && d.getFullYear() === viewMonth.getFullYear()
  }).length

  // ── DPR ───────────────────────────────────────────────────
  const todayDP = dailyProduction.filter(dp => dp.date === selectedDate)

  const totalProduced = todayDP.reduce((s, dp) => s + (dp.units_produced ?? 0), 0)
  const totalTarget   = todayDP.reduce((s, dp) => s + (dp.daily_target ?? 0), 0)
  const overallAchievement = totalTarget > 0 ? Math.round((totalProduced / totalTarget) * 100) : 0

  const todayInspections = inspections.filter(i => (i.inspection_date ?? i.created_at?.split('T')[0]) === selectedDate)
  const passedToday = todayInspections.filter(i => i.result === 'pass').length
  const overallPassRate = todayInspections.length > 0 ? Math.round((passedToday / todayInspections.length) * 100) : 0

  const todayDefects  = defects.filter(d => (d.created_at?.split('T')[0]) === selectedDate)
  const criticalToday = todayDefects.filter(d => d.severity === 'critical').length
  const majorToday    = todayDefects.filter(d => d.severity === 'major').length
  const minorToday    = todayDefects.filter(d => d.severity === 'minor').length

  const cycleRecords = todayDP.filter(dp => dp.cycle_time_minutes != null)
  const avgCycleTime = cycleRecords.length > 0
    ? parseFloat((cycleRecords.reduce((s, dp) => s + dp.cycle_time_minutes, 0) / cycleRecords.length).toFixed(1))
    : null

  // Per-factory DPR
  const factoryDPR = factories.map(f => {
    const fp = todayDP.find(dp => dp.factory_id === f.id)
    const produced = fp?.units_produced ?? 0
    const target   = fp?.daily_target ?? 0
    const achievement = target > 0 ? Math.round((produced / target) * 100) : 0

    const fInspections = todayInspections.filter(i => i.factory_id === f.id)
    const fPassed = fInspections.filter(i => i.result === 'pass').length
    const fPassRate = fInspections.length > 0 ? Math.round((fPassed / fInspections.length) * 100) : 0

    const fDefects  = todayDefects.filter(d => d.factory_id === f.id)
    const fCritical = fDefects.filter(d => d.severity === 'critical').length
    const fMajor    = fDefects.filter(d => d.severity === 'major').length
    const fMinor    = fDefects.filter(d => d.severity === 'minor').length

    const progressColor =
      achievement >= 90 ? '#1D9E75' :
      achievement >= 70 ? '#BA7517' :
      '#E24B4A'

    const status = orders.find(o => o.factory_id === f.id && o.status === 'in_production')
      ? 'in_production'
      : orders.find(o => o.factory_id === f.id && o.status === 'delayed')
      ? 'delayed'
      : 'scheduled'

    return {
      factory: f, produced, target, achievement, progressColor,
      passRate: fPassRate, critical: fCritical, major: fMajor, minor: fMinor, status
    }
  })

  return {
    // Planning KPIs
    activeOrders, thisWeekInspections, inspectionsDelta,
    delayedOrders, wipCount,
    // Schedule
    scheduleOrders: orders,
    factoryUtilisation,
    // Timeline
    timelineOrders, onTrack, delayedCount: delayedOrders, dueThisMonth,
    // DPR KPIs
    totalProduced, totalTarget, overallAchievement, overallPassRate,
    todayInspectionsCount: todayInspections.length,
    criticalToday, majorToday, minorToday,
    totalDefectsToday: todayDefects.length,
    avgCycleTime,
    // Per-factory DPR
    factoryDPR,
  }
}
```

---

## COLOR HELPER — use everywhere

```typescript
export const getPriorityColor = (priority: string) => ({
  high:   { bg: '#FCEBEB', text: '#791F1F' },
  medium: { bg: '#FAEEDA', text: '#633806' },
  low:    { bg: '#E1F5EE', text: '#085041' },
}[priority] ?? { bg: '#F1EFE8', text: '#444441' })

export const getStatusColor = (status: string) => ({
  in_production: { bg: '#E6F1FB', text: '#0C447C' },
  in_inspection: { bg: '#EEEDFE', text: '#3C3489' },
  scheduled:     { bg: '#EEEDFE', text: '#3C3489' },
  confirmed:     { bg: '#EEEDFE', text: '#3C3489' },
  completed:     { bg: '#E1F5EE', text: '#085041' },
  delayed:       { bg: '#FCEBEB', text: '#791F1F' },
  cancelled:     { bg: '#F1EFE8', text: '#444441' },
}[status] ?? { bg: '#F1EFE8', text: '#444441' })
```

---

## NAVIGATION — add to sidebar

Add `/planning` route to the main dashboard sidebar:
```bash
grep -r "Factories\|factories\|sidebar" \
  /var/www/Master_Sankalphub/V3.0_Frontend/app/(dashboard) \
  --include="*.tsx" -l | grep -v node_modules
```
Find the sidebar component and add Planning nav item between Dashboard and Inspections.

---

## BUILD & DEPLOY

```bash
cd /var/www/Master_Sankalphub/V3.0_Frontend

# Install date-fns if not already installed
npm install date-fns

# Build check
npm run build

git add -A
git commit -m "feat: production planner — planning, timeline, DPR with live calculations"
git push origin main
```

---

## FINAL VERIFICATION CHECKLIST

**Top bar:**
- [ ] Production Planner dropdown toggles menu
- [ ] All 3 views switch correctly
- [ ] WIP count calculates live from DB
- [ ] Close dropdown on outside click

**Sidebar:**
- [ ] All 6 free nav items present and link correctly
- [ ] Analytics, Materials/BOM, Reports show Pro badge
- [ ] super_admin sees premium items at full opacity
- [ ] Status bar shows live factory count

**View 1 — Production Planning:**
- [ ] Active orders count correct
- [ ] Inspections this week count + delta correct
- [ ] Delayed orders count correct, red when > 0
- [ ] WIP count correct
- [ ] Day/Week/Month toggle filters job rows
- [ ] Priority badges correct colors
- [ ] Status badges correct colors
- [ ] Factory utilisation % calculated correctly
- [ ] Bar color: gold < 80%, amber 80–99%, red = 100%
- [ ] Optimise Schedule button sorts by priority

**View 2 — Production Timeline:**
- [ ] Month navigation works (prev/next/today)
- [ ] Bar left position calculated from start_date
- [ ] Bar width calculated from duration
- [ ] Bar colors: green/red/blue/purple/gold correct
- [ ] Category filter updates bars
- [ ] Delayed orders show red bars
- [ ] KPI counts correct

**View 3 — DPR:**
- [ ] Date picker refetches data
- [ ] Total units produced = SUM across all factories
- [ ] Achievement % = produced / target * 100
- [ ] Progress bar color: green ≥ 90%, amber ≥ 70%, red < 70%
- [ ] Pass rate = passed / total inspections * 100
- [ ] Defect counts: critical, major, minor correct
- [ ] Avg cycle time calculated correctly
- [ ] Per-factory cards show correct individual values
- [ ] Export PDF triggers print

**General:**
- [ ] All calculations done in `calculateAll` — single source of truth
- [ ] No raw math outside `usePlanningData` hook
- [ ] All errors caught silently — page never crashes
- [ ] super_admin bypasses all data restrictions
- [ ] `npm run build` — zero errors

---

*SankalpHub V3 Frontend — Production Planner Module*
*Design approved via interactive mockup — April 1, 2026*
*All formulas verified and documented above — build exactly as specified*
