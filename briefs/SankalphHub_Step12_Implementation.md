# SankalphHub — Step 12: Production Tracking & Timeline Management
## Claude Code Implementation Prompt

## CONTEXT
SankalphHub (www.sankalphub.in) is a Fashion Manufacturing QA platform built with:
- **Stack:** Next.js 16 (App Router), TypeScript 5, React 19, Supabase (Postgres, Auth, Storage, Realtime), Tailwind CSS 4, shadcn/ui, Radix UI, react-hook-form + Zod, Recharts, Sonner, date-fns, jsPDF, xlsx
- **Deployment:** Vercel
- **Brand tokens:** GOLD=#D4A843, DARK=#1A1A2E, WHITE=#FFFFFF, RED=#CC0000, GREEN=#2E7D32, GREY=#666666, BLUE=#1565C0
- **Roles:** Super Admin > Brand Manager > Factory Manager > Inspector > Viewer
- **Fashion categories:** Woven, Knits, Denim, Outerwear, Accessories

Steps 1-11 (QA platform) are already built and live. Step 12 is the FIRST new module in the product lifecycle expansion. All subsequent steps (13-17) will build on this foundation.

---

## WHAT TO BUILD

### Overview
A Production Tracking & Timeline Management module that lets users track every order through the full manufacturing pipeline — from fabric sourcing through final packing — with real-time status, Gantt-style timeline views, milestone tracking, delay alerts, and factory performance analytics.

---

## 1. DATABASE SCHEMA

Run these in Supabase SQL Editor:

```sql
-- 1a. Production Orders table
CREATE TABLE production_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  order_number TEXT NOT NULL UNIQUE,
  style_number TEXT,
  style_name TEXT,
  category TEXT CHECK (category IN ('woven', 'knits', 'denim', 'outerwear', 'accessories')),
  factory_id UUID REFERENCES factories(id),
  buyer_brand TEXT,
  season TEXT,
  total_quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  status TEXT DEFAULT 'planning' CHECK (status IN (
    'planning', 'fabric_sourcing', 'fabric_in_house', 'cutting',
    'sewing', 'washing', 'finishing', 'packing', 'ready_to_ship', 'shipped', 'cancelled'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  planned_start_date DATE,
  planned_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  ex_factory_date DATE,
  revised_ex_factory_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1b. Production Milestones table (tracks each stage)
CREATE TABLE production_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  production_order_id UUID REFERENCES production_orders(id) ON DELETE CASCADE NOT NULL,
  milestone_name TEXT NOT NULL,
  milestone_order INTEGER NOT NULL,
  planned_start DATE,
  planned_end DATE,
  actual_start DATE,
  actual_end DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed', 'skipped')),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  delay_days INTEGER DEFAULT 0,
  delay_reason TEXT,
  notes TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1c. Daily Production Logs
CREATE TABLE production_daily_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  production_order_id UUID REFERENCES production_orders(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  milestone_name TEXT,
  planned_qty INTEGER DEFAULT 0,
  actual_qty INTEGER DEFAULT 0,
  cumulative_qty INTEGER DEFAULT 0,
  efficiency_percentage NUMERIC(5,2),
  defect_qty INTEGER DEFAULT 0,
  rework_qty INTEGER DEFAULT 0,
  operator_count INTEGER,
  machine_count INTEGER,
  remarks TEXT,
  logged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1d. Production Delays / Issues log
CREATE TABLE production_delays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  production_order_id UUID REFERENCES production_orders(id) ON DELETE CASCADE NOT NULL,
  milestone_name TEXT,
  delay_type TEXT CHECK (delay_type IN (
    'fabric_delay', 'trim_delay', 'machine_breakdown', 'labor_shortage',
    'quality_issue', 'approval_pending', 'power_outage', 'other'
  )),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  delay_days INTEGER DEFAULT 0,
  description TEXT,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  reported_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_prod_orders_project ON production_orders(project_id);
CREATE INDEX idx_prod_orders_status ON production_orders(status);
CREATE INDEX idx_prod_orders_factory ON production_orders(factory_id);
CREATE INDEX idx_prod_milestones_order ON production_milestones(production_order_id);
CREATE INDEX idx_prod_daily_order ON production_daily_logs(production_order_id);
CREATE INDEX idx_prod_delays_order ON production_delays(production_order_id);

-- RLS Policies
ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_delays ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all, insert/update own org's data
CREATE POLICY "Users can view production orders" ON production_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert production orders" ON production_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update production orders" ON production_orders FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can view milestones" ON production_milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert milestones" ON production_milestones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update milestones" ON production_milestones FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can view daily logs" ON production_daily_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert daily logs" ON production_daily_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view delays" ON production_delays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert delays" ON production_delays FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update delays" ON production_delays FOR UPDATE TO authenticated USING (true);
```

---

## 2. DEFAULT MILESTONES TEMPLATE

When a production order is created, auto-insert these milestones based on the category:

```typescript
const DEFAULT_MILESTONES = {
  woven: [
    { name: 'Fabric Sourcing', order: 1, defaultDays: 14 },
    { name: 'Fabric In-House & Inspection', order: 2, defaultDays: 3 },
    { name: 'Cutting', order: 3, defaultDays: 5 },
    { name: 'Sewing', order: 4, defaultDays: 15 },
    { name: 'Finishing & Pressing', order: 5, defaultDays: 3 },
    { name: 'Final Inspection', order: 6, defaultDays: 2 },
    { name: 'Packing', order: 7, defaultDays: 3 },
  ],
  knits: [
    { name: 'Yarn Sourcing', order: 1, defaultDays: 10 },
    { name: 'Knitting', order: 2, defaultDays: 10 },
    { name: 'Dyeing & Processing', order: 3, defaultDays: 7 },
    { name: 'Cutting', order: 4, defaultDays: 4 },
    { name: 'Sewing', order: 5, defaultDays: 12 },
    { name: 'Finishing', order: 6, defaultDays: 3 },
    { name: 'Final Inspection', order: 7, defaultDays: 2 },
    { name: 'Packing', order: 8, defaultDays: 3 },
  ],
  denim: [
    { name: 'Fabric Sourcing', order: 1, defaultDays: 14 },
    { name: 'Fabric In-House & Inspection', order: 2, defaultDays: 3 },
    { name: 'Cutting', order: 3, defaultDays: 5 },
    { name: 'Sewing', order: 4, defaultDays: 15 },
    { name: 'Washing & Finishing', order: 5, defaultDays: 7 },
    { name: 'Final Inspection', order: 6, defaultDays: 2 },
    { name: 'Packing', order: 7, defaultDays: 3 },
  ],
  outerwear: [
    { name: 'Shell & Lining Sourcing', order: 1, defaultDays: 18 },
    { name: 'Fabric In-House & Inspection', order: 2, defaultDays: 3 },
    { name: 'Cutting', order: 3, defaultDays: 5 },
    { name: 'Sewing & Assembly', order: 4, defaultDays: 20 },
    { name: 'Finishing & QC', order: 5, defaultDays: 4 },
    { name: 'Final Inspection', order: 6, defaultDays: 2 },
    { name: 'Packing', order: 7, defaultDays: 3 },
  ],
  accessories: [
    { name: 'Material Sourcing', order: 1, defaultDays: 10 },
    { name: 'Component Assembly', order: 2, defaultDays: 8 },
    { name: 'Finishing', order: 3, defaultDays: 4 },
    { name: 'Quality Check', order: 4, defaultDays: 2 },
    { name: 'Packing', order: 5, defaultDays: 3 },
  ],
};
```

---

## 3. FILE STRUCTURE

Create these files following the existing project conventions:

```
app/
  (dashboard)/
    production/
      page.tsx                    -- Production orders list (main page)
      new/
        page.tsx                  -- Create new production order
      [id]/
        page.tsx                  -- Production order detail + timeline view
        milestones/
          page.tsx                -- Milestone management
        daily-log/
          page.tsx                -- Daily production log entry
        delays/
          page.tsx                -- Delay tracker
components/
  production/
    production-order-card.tsx     -- Card component for list view
    production-timeline.tsx       -- Gantt-style horizontal timeline
    milestone-tracker.tsx         -- Vertical milestone stepper
    daily-log-form.tsx           -- Form to log daily production
    delay-form.tsx               -- Form to report delays
    production-stats.tsx         -- Summary stats bar (total qty, efficiency, etc.)
    production-filters.tsx       -- Filter bar (status, factory, priority, date range)
lib/
  actions/
    production.ts                -- Server actions (CRUD for production orders, milestones, logs, delays)
  validations/
    production.ts                -- Zod schemas for all forms
  types/
    production.ts                -- TypeScript types
```

---

## 4. PAGE SPECIFICATIONS

### 4a. Production Orders List — `/production`

**Layout:** Same pattern as existing `/projects` list page

**Features:**
- Page title: "Production Tracking" with a "New Order +" button (GOLD background)
- Filter bar: Status dropdown, Factory dropdown, Priority dropdown, Date range picker, Search by order/style number
- Table/card view toggle
- Table columns: Order #, Style, Category, Factory, Quantity, Status (colored badge), Ex-Factory Date, Delay (red if >0), Progress bar
- Status badges with colors:
  - planning: grey
  - fabric_sourcing / fabric_in_house: blue
  - cutting / sewing: GOLD
  - washing / finishing: purple
  - packing: green
  - ready_to_ship / shipped: dark green
  - cancelled: red
- Sort by: Ex-factory date, Status, Priority, Created date
- Click row → navigate to `/production/[id]`

### 4b. New Production Order — `/production/new`

**Layout:** Multi-step form similar to existing project creation

**Step 1 — Order Details:**
- Order Number (auto-generated: PO-YYYYMMDD-XXX, or manual entry)
- Style Number (text)
- Style Name (text)
- Category (select: woven/knits/denim/outerwear/accessories)
- Link to Project (select from existing projects)
- Factory (select from existing factories)
- Buyer/Brand (text)
- Season (text, e.g., "SS26", "FW26")

**Step 2 — Quantities & Dates:**
- Total Quantity (number)
- Unit (pcs/dozens/meters)
- Planned Start Date (date picker)
- Planned End Date (date picker)
- Ex-Factory Date (date picker)
- Priority (select: low/normal/high/urgent)

**Step 3 — Review & Create:**
- Summary of all fields
- "Create Order" button
- On create: insert production_order + auto-generate milestones from DEFAULT_MILESTONES based on selected category
- Auto-calculate milestone planned dates sequentially from planned_start_date
- Show success toast and redirect to `/production/[id]`

### 4c. Production Order Detail — `/production/[id]`

**Layout:** Detail page with tabs

**Header section:**
- Order number, style name, status badge, priority badge
- Factory name, buyer/brand, season
- Key dates: Planned start → Ex-factory, Actual start → Actual end
- Delay indicator: "X days behind" in red if delayed, "On track" in green
- Edit button, Status change dropdown

**Tabs:**
1. **Timeline** (default) — Gantt-style horizontal bar chart showing all milestones
   - Each milestone = horizontal bar (planned in light color, actual in dark color)
   - Today line (vertical dashed red line)
   - Drag to update dates (optional — can be edit-in-place instead)
   - Click milestone → expand to show details

2. **Milestones** — Vertical stepper/tracker
   - Each milestone shows: name, planned dates, actual dates, status, completion %, delay
   - Inline edit: click to update status, dates, completion %
   - Add custom milestone button
   - Reorder milestones (drag or arrows)

3. **Daily Log** — Production data entry table
   - Date-wise rows showing planned vs actual qty
   - Running cumulative total
   - Efficiency % calculation: (actual_qty / planned_qty) * 100
   - "Add Today's Log" button → opens form
   - Mini line chart: planned vs actual cumulative (Recharts)

4. **Delays** — Issue tracker
   - List of reported delays with type, severity, days, description
   - "Report Delay" button → opens form
   - Resolution status (open/resolved)
   - Impact on timeline shown

5. **Summary** — Overview card
   - Total quantity vs produced quantity
   - Overall efficiency %
   - Total delay days
   - Milestone completion progress bar
   - Quality metrics (link to inspection data from Steps 1-11 if available)

### 4d. Navigation Integration

Add "Production" to the main sidebar navigation:
- Icon: use `Factory` or `Activity` from lucide-react
- Position: after existing nav items, before Settings
- Badge: show count of delayed orders (red badge)

---

## 5. KEY BUSINESS LOGIC

### 5a. Auto-status update
When all milestones up to a stage are completed, auto-update the production_order status:
```typescript
// Example mapping
const MILESTONE_TO_STATUS: Record<string, string> = {
  'Fabric Sourcing': 'fabric_sourcing',
  'Fabric In-House & Inspection': 'fabric_in_house',
  'Cutting': 'cutting',
  'Sewing': 'sewing',
  'Washing & Finishing': 'washing',
  'Finishing': 'finishing',
  'Packing': 'packing',
};
```

### 5b. Delay calculation
```typescript
function calculateDelay(planned_end: Date, actual_end: Date | null): number {
  const endDate = actual_end || new Date(); // if not completed, compare to today
  const diff = differenceInDays(endDate, planned_end);
  return diff > 0 ? diff : 0;
}
```

### 5c. Auto order number
```typescript
function generateOrderNumber(): string {
  const date = format(new Date(), 'yyyyMMdd');
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `PO-${date}-${random}`;
}
```

### 5d. Milestone date auto-fill
When creating milestones from template, cascade dates:
```typescript
let currentDate = planned_start_date;
milestones.forEach(m => {
  m.planned_start = currentDate;
  m.planned_end = addDays(currentDate, m.defaultDays);
  currentDate = addDays(m.planned_end, 1); // next day
});
```

---

## 6. UI COMPONENTS SPEC

### 6a. Production Timeline (Gantt)
- Use a horizontal bar chart built with div elements (not a library)
- X-axis: dates (weekly markers)
- Y-axis: milestone names
- Planned bar: light gold (#D4A843 at 30% opacity)
- Actual bar: solid gold (#D4A843)
- Delayed portion: solid red (#CC0000)
- Today marker: dashed vertical line in red
- Responsive: horizontal scroll on mobile

### 6b. Milestone Stepper
- Vertical layout with connecting line
- Circle icons: grey (pending), blue (in_progress), green (completed), red (delayed)
- Show planned vs actual dates
- Completion % as a small progress bar inside each step

### 6c. Daily Log Chart
- Use Recharts `<LineChart>` or `<AreaChart>`
- Two lines: Planned cumulative (dashed grey) vs Actual cumulative (solid gold)
- Area between them shaded (green if ahead, red if behind)

---

## 7. NOTIFICATIONS (Sonner Toasts)

- Order created: success toast "Production order PO-XXXX created"
- Milestone completed: success toast "Milestone 'Cutting' completed"
- Delay reported: warning toast "Delay reported on PO-XXXX"
- Order delayed: error toast "PO-XXXX is now X days behind schedule"
- Status changed: info toast "Status updated to [new status]"

---

## 8. IMPLEMENTATION ORDER

1. **Database first** — Run SQL to create all 4 tables
2. **Types & validations** — Create TypeScript types and Zod schemas
3. **Server actions** — CRUD operations for all tables
4. **List page** — `/production` with filters and table
5. **Create page** — `/production/new` multi-step form
6. **Detail page** — `/production/[id]` with all tabs
7. **Components** — Timeline, milestone tracker, daily log, delay form
8. **Nav integration** — Add to sidebar
9. **Test end-to-end** — Create order → update milestones → log daily → report delay → verify timeline

---

## 9. IMPORTANT CONSTRAINTS

- Follow the EXACT same code patterns as existing pages (check `/projects` and `/inspections` for reference)
- Use the existing Supabase client setup (check `lib/supabase/` for client/server helpers)
- Use existing auth helpers to get current user
- All forms must use react-hook-form + Zod validation
- All dates must use date-fns for formatting/calculation
- All toasts must use Sonner
- All UI components must use shadcn/ui (Button, Input, Select, Table, Card, Badge, Tabs, Dialog, etc.)
- Keep the same visual style — GOLD accents, DARK text, clean card-based layouts
- Mobile responsive — all pages must work on phone screens
- Settings for Production module should be VIEW-ONLY for non-Super Admin roles
- Do NOT add fake testimonials, fake metrics, or any fabricated trust signals anywhere
