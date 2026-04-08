# SankalphHub — Merchandising Module Implementation (Step 11.5)
## Claude Code Implementation Prompt

## CONTEXT
SankalphHub (www.sankalphub.in) — Fashion Manufacturing platform. Stack: Next.js 16 (App Router), TypeScript 5, React 19, Supabase (Postgres, Auth, Storage, Realtime), Tailwind CSS 4, shadcn/ui, Radix UI, react-hook-form + Zod, Recharts, Sonner, date-fns, jsPDF, xlsx. Deployed on Vercel.

Brand tokens: GOLD=#D4A843, DARK=#1A1A2E, WHITE=#FFFFFF, RED=#CC0000, GREEN=#2E7D32, GREY=#666666, BLUE=#1565C0

Roles: Super Admin > Brand Manager > Factory Manager > Inspector > Viewer

**PLACEMENT:** This module sits BETWEEN Steps 1-11 (QA platform) and Step 12 (Production Tracking). Merchandising is where product decisions are made — it feeds directly into Production, Sampling, Costing, and all downstream steps.

**PREREQUISITE:** Steps 1-11 must be built (existing QA platform). This module should be built BEFORE Steps 12-17 so those steps can reference merchandising data (styles, tech packs, BOMs).

---

## WHAT TO BUILD

A complete Merchandising module covering the full pre-production product lifecycle:
1. **Line Planning** — Season/collection planning with target quantities and revenue
2. **Style Library** — Central repository of all styles with metadata, images, status
3. **Tech Pack Management** — Detailed technical specifications that factories need to produce garments
4. **Colorway & Size Matrix** — Color options and size distribution per style
5. **BOM (Bill of Materials)** — Fabric, trims, labels, packaging breakdown per style
6. **Seasonal Calendar** — Key milestone dates from design through delivery
7. **Order Booking** — Buyer order consolidation by style/color/size
8. **Style Lifecycle Tracking** — From concept through production handoff

---

## 1. DATABASE SCHEMA

```sql
-- =============================================
-- 1a. Seasons / Collections
-- =============================================
CREATE TABLE seasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_code TEXT NOT NULL UNIQUE,  -- e.g., "SS26", "FW26", "SS27"
  season_name TEXT NOT NULL,         -- e.g., "Spring/Summer 2026"
  year INTEGER NOT NULL,
  season_type TEXT CHECK (season_type IN ('spring_summer', 'fall_winter', 'resort', 'pre_fall', 'capsule')),
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'development', 'selling', 'production', 'delivered', 'archived')),
  start_date DATE,
  end_date DATE,
  target_styles INTEGER DEFAULT 0,
  target_units INTEGER DEFAULT 0,
  target_revenue NUMERIC(14,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 1b. Line Plan (styles planned per season)
-- =============================================
CREATE TABLE line_plan_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE NOT NULL,
  style_id UUID,  -- linked after style is created
  category TEXT CHECK (category IN ('woven', 'knits', 'denim', 'outerwear', 'accessories')),
  sub_category TEXT,  -- e.g., "jackets", "pants", "shirts", "vests", "gloves"
  style_description TEXT,
  target_wholesale_price NUMERIC(10,2),
  target_retail_price NUMERIC(10,2),
  target_cost NUMERIC(10,2),
  target_margin_pct NUMERIC(5,2),
  planned_units INTEGER DEFAULT 0,
  planned_colorways INTEGER DEFAULT 1,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('must_have', 'normal', 'nice_to_have', 'carryover')),
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_development', 'approved', 'dropped', 'carryover')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 1c. Styles (master style library)
-- =============================================
CREATE TABLE styles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  style_number TEXT NOT NULL UNIQUE,
  style_name TEXT NOT NULL,
  season_id UUID REFERENCES seasons(id),
  project_id UUID REFERENCES projects(id),
  category TEXT CHECK (category IN ('woven', 'knits', 'denim', 'outerwear', 'accessories')),
  sub_category TEXT,
  gender TEXT CHECK (gender IN ('mens', 'womens', 'unisex', 'kids', 'N/A')),
  description TEXT,
  -- Pricing
  wholesale_price NUMERIC(10,2),
  retail_price NUMERIC(10,2),
  target_fob NUMERIC(10,2),
  actual_fob NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  -- Key details
  fabric_composition TEXT,     -- e.g., "100% Nylon", "65/35 Poly/Cotton"
  weight_gsm NUMERIC(8,2),    -- fabric weight in GSM
  construction TEXT,           -- e.g., "2/1 Twill", "Jersey Knit"
  silhouette TEXT,             -- e.g., "Regular fit", "Slim", "Oversized"
  -- Status
  lifecycle_stage TEXT DEFAULT 'concept' CHECK (lifecycle_stage IN (
    'concept', 'design', 'tech_pack', 'sampling', 'costing',
    'approved', 'in_production', 'delivered', 'discontinued'
  )),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'dropped', 'archived')),
  -- Factory
  factory_id UUID REFERENCES factories(id),
  buyer_brand TEXT,
  -- Images
  thumbnail_url TEXT,
  -- Metadata
  is_carryover BOOLEAN DEFAULT false,
  carryover_from TEXT,  -- previous style number if carryover
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 1d. Style Images
-- =============================================
CREATE TABLE style_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  style_id UUID REFERENCES styles(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  image_type TEXT DEFAULT 'flat' CHECK (image_type IN (
    'flat', 'on_model', 'detail', 'colorway', 'sketch', 'cad', 'other'
  )),
  caption TEXT,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 1e. Colorways
-- =============================================
CREATE TABLE colorways (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  style_id UUID REFERENCES styles(id) ON DELETE CASCADE NOT NULL,
  color_code TEXT NOT NULL,       -- e.g., "BLK", "NVY", "OLV"
  color_name TEXT NOT NULL,       -- e.g., "Black", "Navy", "Olive"
  hex_value TEXT,                 -- e.g., "#000000"
  pantone_code TEXT,              -- e.g., "19-4010 TCX"
  fabric_ref TEXT,                -- fabric supplier reference for this color
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending_lab_dip', 'approved', 'dropped')),
  lab_dip_status TEXT CHECK (lab_dip_status IN ('not_started', 'submitted', 'approved', 'rejected', 'resubmit')),
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 1f. Size Matrix (size breakdown per style/colorway)
-- =============================================
CREATE TABLE size_matrices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  style_id UUID REFERENCES styles(id) ON DELETE CASCADE NOT NULL,
  colorway_id UUID REFERENCES colorways(id) ON DELETE CASCADE,
  size_range TEXT NOT NULL,       -- e.g., "S,M,L,XL,XXL" or "6,8,10,12,14"
  size_scale TEXT DEFAULT 'alpha' CHECK (size_scale IN ('alpha', 'numeric', 'one_size')),
  size_breakdown JSONB NOT NULL,  -- {"S": 100, "M": 200, "L": 300, "XL": 200, "XXL": 100}
  total_units INTEGER GENERATED ALWAYS AS (
    (SELECT COALESCE(SUM(value::integer), 0) FROM jsonb_each_text(size_breakdown))
  ) STORED,
  ratio TEXT,                     -- e.g., "1:2:3:2:1"
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 1g. Tech Packs
-- =============================================
CREATE TABLE tech_packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  style_id UUID REFERENCES styles(id) ON DELETE CASCADE NOT NULL,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'revised')),
  -- Construction details
  garment_description TEXT,
  fit_type TEXT,                  -- "Regular", "Slim", "Relaxed", "Oversized"
  design_details TEXT,            -- construction notes, special instructions
  stitching_details TEXT,         -- stitch types, SPI, seam allowances
  label_placement TEXT,           -- main label, care label, size label positions
  packaging_instructions TEXT,    -- folding, poly bag, hangtag, etc.
  wash_care_instructions TEXT,    -- care label content
  -- Measurements link
  grading_rule TEXT,              -- e.g., "1 inch grade between sizes"
  base_size TEXT,                 -- e.g., "M" or "L"
  -- Files
  sketch_front_url TEXT,
  sketch_back_url TEXT,
  flat_drawing_url TEXT,
  -- Approval
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 1h. Tech Pack Measurements (spec sheet)
-- =============================================
CREATE TABLE tech_pack_measurements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tech_pack_id UUID REFERENCES tech_packs(id) ON DELETE CASCADE NOT NULL,
  pom_code TEXT NOT NULL,          -- Point of Measure code: "C100", "B100", "D102", etc.
  description TEXT NOT NULL,       -- "Chest Width at Seam", "Center Back Length", etc.
  unit TEXT DEFAULT 'inches' CHECK (unit IN ('inches', 'cm')),
  tolerance_plus NUMERIC(5,2) DEFAULT 0.5,
  tolerance_minus NUMERIC(5,2) DEFAULT 0.5,
  -- Size columns stored as JSONB: {"S": "48", "M": "50", "L": "52", "XL": "54"}
  size_specs JSONB NOT NULL,
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 1i. BOM (Bill of Materials) per style
-- =============================================
CREATE TABLE style_bom (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  style_id UUID REFERENCES styles(id) ON DELETE CASCADE NOT NULL,
  tech_pack_id UUID REFERENCES tech_packs(id),
  item_order INTEGER DEFAULT 0,
  bom_category TEXT NOT NULL CHECK (bom_category IN (
    'shell_fabric', 'lining_fabric', 'interlining', 'insulation',
    'zipper', 'button', 'snap', 'velcro', 'elastic', 'drawcord',
    'thread', 'label_main', 'label_care', 'label_size', 'hangtag',
    'poly_bag', 'carton', 'tissue_paper', 'hanger',
    'embroidery', 'print', 'patch', 'reflective_tape',
    'other_trim', 'other'
  )),
  description TEXT NOT NULL,
  supplier TEXT,
  supplier_ref TEXT,              -- supplier article/reference number
  color TEXT,
  placement TEXT,                 -- where on the garment
  consumption_per_unit NUMERIC(10,4),
  unit TEXT DEFAULT 'yard',       -- yard, meter, pcs, set, roll, kg
  unit_price NUMERIC(10,4),
  wastage_pct NUMERIC(5,2) DEFAULT 0,
  total_cost_per_unit NUMERIC(10,4),  -- consumption * price * (1 + wastage%)
  currency TEXT DEFAULT 'USD',
  lead_time_days INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sourced', 'approved', 'in_stock', 'discontinued')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 1j. Seasonal Calendar / Key Dates
-- =============================================
CREATE TABLE seasonal_calendar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE NOT NULL,
  milestone_name TEXT NOT NULL,
  milestone_type TEXT CHECK (milestone_type IN (
    'design_kickoff', 'line_plan_due', 'tech_pack_due', 'proto_sample_due',
    'fit_sample_due', 'costing_due', 'sales_meeting', 'order_deadline',
    'pp_sample_due', 'bulk_fabric_due', 'production_start', 'production_end',
    'ex_factory', 'warehouse_delivery', 'retail_launch', 'custom'
  )),
  planned_date DATE NOT NULL,
  actual_date DATE,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'delayed', 'skipped')),
  assigned_to TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 1k. Order Booking (buyer orders by style/color/size)
-- =============================================
CREATE TABLE order_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID REFERENCES seasons(id),
  style_id UUID REFERENCES styles(id) NOT NULL,
  colorway_id UUID REFERENCES colorways(id),
  buyer_name TEXT NOT NULL,
  buyer_po_number TEXT,
  order_date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  size_breakdown JSONB,           -- {"S": 50, "M": 100, "L": 150, "XL": 100}
  total_units INTEGER DEFAULT 0,
  unit_price NUMERIC(10,2),
  total_value NUMERIC(12,2),
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_line_plan_season ON line_plan_items(season_id);
CREATE INDEX idx_styles_season ON styles(season_id);
CREATE INDEX idx_styles_category ON styles(category);
CREATE INDEX idx_styles_lifecycle ON styles(lifecycle_stage);
CREATE INDEX idx_styles_number ON styles(style_number);
CREATE INDEX idx_colorways_style ON colorways(style_id);
CREATE INDEX idx_size_matrix_style ON size_matrices(style_id);
CREATE INDEX idx_tech_packs_style ON tech_packs(style_id);
CREATE INDEX idx_tech_measurements_tp ON tech_pack_measurements(tech_pack_id);
CREATE INDEX idx_bom_style ON style_bom(style_id);
CREATE INDEX idx_calendar_season ON seasonal_calendar(season_id);
CREATE INDEX idx_bookings_style ON order_bookings(style_id);
CREATE INDEX idx_bookings_season ON order_bookings(season_id);
CREATE INDEX idx_style_images_style ON style_images(style_id);

-- =============================================
-- RLS
-- =============================================
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE colorways ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_matrices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_pack_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_bom ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON seasons FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON line_plan_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON styles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON style_images FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON colorways FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON size_matrices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON tech_packs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON tech_pack_measurements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON style_bom FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON seasonal_calendar FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON order_bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

## 2. POM CODES REFERENCE (from RefrigiWear Excel files)

These are real Point of Measure codes from the uploaded audit Excel files. Seed as defaults:

```typescript
const COMMON_POM_CODES = [
  { code: 'A101', description: 'Collar Length at Outer Edge' },
  { code: 'A102', description: 'Collar Height at CB' },
  { code: 'A103', description: 'Front Neck Drop' },
  { code: 'A104', description: 'Back Neck Drop' },
  { code: 'A105', description: 'Back Neck Width (Seam to seam)' },
  { code: 'A200', description: 'Across Shoulder' },
  { code: 'B100', description: 'Center Back Length' },
  { code: 'C100', description: 'Chest Width at Seam' },
  { code: 'C101', description: 'Waist Relaxed' },
  { code: 'C102', description: 'Waist Relaxed' },
  { code: 'C103', description: 'Waist Extended' },
  { code: 'C105', description: 'Sweep/Bottom Opening' },
  { code: 'C107', description: 'Waist Elastic Band Placement at CB' },
  { code: 'D102', description: 'Sleeve Length from Center Back (including cuff)' },
  { code: 'D200', description: 'Armhole (straight up from under arm seam)' },
  { code: 'D201', description: 'Armhole Circumference all around' },
  { code: 'D203', description: 'Elbow (midpoint of sleeve)' },
  { code: 'D204', description: 'Cuff Length at edge (sleeve opening)' },
  { code: 'D206', description: 'Cuff Opening' },
  { code: 'D210', description: 'Cuff Height' },
  { code: 'D211', description: 'Cuff Opening' },
  { code: 'Z100', description: 'Center Front Zipper Length' },
  { code: 'Z111', description: 'Center Front Zipper Length (excluding tape)' },
];
```

---

## 3. FILE STRUCTURE

```
app/
  (dashboard)/
    merchandising/
      page.tsx                        -- Merchandising dashboard / overview
      seasons/
        page.tsx                      -- Seasons list
        new/
          page.tsx                    -- Create season
        [id]/
          page.tsx                    -- Season detail (line plan + calendar)
      styles/
        page.tsx                      -- Style library (grid/list view)
        new/
          page.tsx                    -- Create new style
        [id]/
          page.tsx                    -- Style detail hub (tabs: overview, tech pack, BOM, colors, sizes, orders)
      tech-packs/
        [id]/
          page.tsx                    -- Tech pack editor (measurements, sketches, specs)
      orders/
        page.tsx                      -- Order booking list
        new/
          page.tsx                    -- Book new order
components/
  merchandising/
    season-card.tsx                   -- Season summary card
    season-calendar.tsx              -- Gantt-style seasonal calendar
    line-plan-table.tsx              -- Editable line plan grid
    style-card.tsx                   -- Style card with thumbnail, name, status
    style-grid.tsx                   -- Grid layout for style library
    style-lifecycle-tracker.tsx      -- Horizontal stage tracker (concept → delivered)
    colorway-strip.tsx               -- Color swatches row with hex/pantone
    colorway-manager.tsx             -- Add/edit/remove colorways
    size-matrix-editor.tsx           -- Size breakdown table with totals
    tech-pack-editor.tsx             -- Full tech pack form
    measurement-table.tsx            -- POM spec sheet (sizes as columns)
    bom-editor.tsx                   -- BOM line items editor
    bom-summary-pie.tsx              -- Cost breakdown pie chart
    order-booking-form.tsx           -- Book orders by style/color/size
    order-summary-table.tsx          -- Consolidated orders view
    style-filters.tsx                -- Filter bar for styles
lib/
  actions/
    merchandising.ts                -- Server actions (seasons, styles, tech packs, BOM, orders)
  validations/
    merchandising.ts                -- Zod schemas
  types/
    merchandising.ts                -- TypeScript types
  utils/
    style-number-generator.ts       -- Auto-generate style numbers
```

---

## 4. PAGE SPECIFICATIONS

### 4a. Merchandising Dashboard — `/merchandising`

**Overview page with key metrics:**

**Top stats cards:**
- Active Seasons: count
- Total Styles (active): count
- Styles in Development: count
- Total Orders Booked: units + value

**Season summary:** Cards showing each active season with style count, unit count, revenue target vs booked, status badge

**Style lifecycle funnel:** Horizontal bar or funnel showing how many styles are at each lifecycle stage (concept → design → tech_pack → sampling → costing → approved → in_production → delivered)

**Quick links:** "New Season", "New Style", "Style Library", "Book Order"

### 4b. Seasons — `/merchandising/seasons`

**List of seasons with:**
- Season code + name, Year, Type badge, Status, Target styles vs actual, Target units vs booked, Date range

**Season Detail — `/merchandising/seasons/[id]`:**

**Tabs:**
1. **Line Plan** (default)
   - Editable table: Category, Sub-category, Description, Target Price (wholesale/retail), Target Cost, Margin %, Planned Units, Colorways, Priority, Status
   - Add row button
   - Totals row: total units, total revenue, average margin
   - Filter by category, priority
   - "Link Style" button per row → connect to an existing style or create new

2. **Calendar**
   - Gantt-style timeline (horizontal bars) showing all seasonal milestones
   - Default milestones auto-created on season creation:
     - Design Kickoff, Line Plan Due, Tech Pack Due, Proto Sample Due, Fit Sample Due, Costing Due, Sales Meeting, Order Deadline, PP Sample Due, Bulk Fabric Due, Production Start, Production End, Ex-Factory, Warehouse Delivery, Retail Launch
   - Each milestone: planned date (light bar) + actual date (solid bar)
   - Today line (red dashed vertical)
   - Click to update dates and status

3. **Styles** — Grid view of all styles in this season

4. **Orders** — All orders booked for this season, summarized by style

### 4c. Style Library — `/merchandising/styles`

**Two view modes (toggle):**

**Grid view (default):** Cards with style thumbnail, style number, name, category badge, lifecycle stage badge, colorway swatches, price

**List view:** Table with: Style #, Name, Category, Season, Lifecycle, FOB, Colors, Total Orders, Factory, Status

**Filter bar:** Season, Category, Lifecycle Stage, Factory, Status, Search by style # or name

**Sort by:** Style number, Name, Season, Created date, Lifecycle stage

### 4d. Style Detail — `/merchandising/styles/[id]` ★ CORE PAGE ★

**Header:**
- Style number + name
- Category + sub-category badges
- Lifecycle stage tracker (horizontal dots: concept → design → tech_pack → sampling → costing → approved → in_production → delivered)
- Primary image thumbnail
- Season, Factory, Buyer/Brand
- Price: Wholesale / Retail / FOB

**Tabs:**

1. **Overview** (default)
   - Style details card: all key fields (description, fabric, construction, silhouette, etc.)
   - Image gallery: upload/manage style images (flat, on_model, detail, sketch, CAD)
   - Edit button → opens edit form
   - Lifecycle stage change dropdown

2. **Tech Pack**
   - Create/view/edit tech pack for this style
   - Version selector (if multiple versions)
   - Sections:
     - Construction details (fit, stitching, labels, packaging, wash care)
     - Sketches (front/back/flat drawing — image upload)
     - **Measurement Spec Sheet** — the key deliverable:
       - Table: POM Code | Description | Tol+ | Tol- | S | M | L | XL | XXL
       - Add POM row (select from COMMON_POM_CODES or custom)
       - Editable cells for each size
       - Base size highlighted
       - "Export to Excel" button (replicate RefrigiWear measurement sheet format)
   - Status: Draft → Review → Approved
   - "Send to Factory" button (changes lifecycle to tech_pack)

3. **BOM**
   - BOM line items editor (same concept as cost_sheet_items in Step 15, but at style level)
   - Grouped by bom_category
   - Each row: Description, Supplier, Ref #, Color, Placement, Consumption, Unit, Price, Wastage %, Cost/unit
   - Running total at bottom
   - Cost breakdown pie chart (Recharts)
   - "Export BOM" to Excel
   - Link: "Create Cost Sheet" → pre-fills Step 15 cost sheet from this BOM

4. **Colors & Sizes**
   - **Colorways section:**
     - Color swatches with code, name, hex, Pantone
     - Lab dip status per color (not_started → submitted → approved/rejected)
     - Add/remove colors
   - **Size Matrix section:**
     - Per-colorway size breakdown table
     - Columns: Color | S | M | L | XL | XXL | Total
     - Editable quantities
     - Ratio calculator: e.g., "1:2:3:2:1" auto-fills proportionally
     - Total across all colors

5. **Orders**
   - Orders booked for this style
   - Table: Buyer, PO #, Color, Size Breakdown, Units, Value, Delivery Date, Status
   - "Book Order" button → opens booking form
   - Totals: total units by color, by size, overall

6. **History**
   - Timeline of all changes: lifecycle transitions, tech pack versions, BOM changes, orders booked

### 4e. Order Booking — `/merchandising/orders`

**Orders list with filters:** Season, Style, Buyer, Status, Date range

**Create order form:**
- Select Style (required) → auto-fills season, colorways, sizes
- Select Colorway
- Buyer Name + PO Number
- Size Breakdown: dynamic columns based on style's size range
- Unit Price
- Delivery Date
- Notes

---

## 5. STYLE NUMBER AUTO-GENERATION

```typescript
function generateStyleNumber(category: string, season: string, sequence: number): string {
  const categoryPrefix: Record<string, string> = {
    woven: 'WV',
    knits: 'KN',
    denim: 'DN',
    outerwear: 'OW',
    accessories: 'AC',
  };
  const prefix = categoryPrefix[category] || 'XX';
  const seq = String(sequence).padStart(4, '0');
  return `${prefix}-${season}-${seq}`;
  // Example: "OW-FW26-0001" for first outerwear style in Fall/Winter 2026
}
```

---

## 6. LIFECYCLE STAGE TRANSITIONS

```typescript
const LIFECYCLE_TRANSITIONS: Record<string, string[]> = {
  concept: ['design', 'dropped'],
  design: ['tech_pack', 'dropped'],
  tech_pack: ['sampling', 'design'],  // can go back to design
  sampling: ['costing', 'tech_pack'], // can go back for tech pack revision
  costing: ['approved', 'sampling'],
  approved: ['in_production'],
  in_production: ['delivered'],
  delivered: ['discontinued'],
  discontinued: [],
};
```

When lifecycle changes:
- Update `styles.lifecycle_stage`
- Log the change in history
- Show toast notification
- If moving to `sampling` → prompt to create a sample_request (Step 13 link)
- If moving to `costing` → prompt to create a cost_sheet (Step 15 link)
- If moving to `in_production` → prompt to create a production_order (Step 12 link)

---

## 7. DEFAULT SEASONAL CALENDAR MILESTONES

Auto-insert when a season is created:

```typescript
const DEFAULT_SEASON_MILESTONES = [
  { name: 'Design Kickoff', type: 'design_kickoff', offsetWeeks: 0 },
  { name: 'Line Plan Due', type: 'line_plan_due', offsetWeeks: 4 },
  { name: 'Tech Pack Due', type: 'tech_pack_due', offsetWeeks: 8 },
  { name: 'Proto Sample Due', type: 'proto_sample_due', offsetWeeks: 12 },
  { name: 'Fit Sample Due', type: 'fit_sample_due', offsetWeeks: 16 },
  { name: 'Costing Due', type: 'costing_due', offsetWeeks: 18 },
  { name: 'Sales Meeting', type: 'sales_meeting', offsetWeeks: 20 },
  { name: 'Order Deadline', type: 'order_deadline', offsetWeeks: 22 },
  { name: 'PP Sample Due', type: 'pp_sample_due', offsetWeeks: 24 },
  { name: 'Bulk Fabric Due', type: 'bulk_fabric_due', offsetWeeks: 26 },
  { name: 'Production Start', type: 'production_start', offsetWeeks: 28 },
  { name: 'Production End', type: 'production_end', offsetWeeks: 36 },
  { name: 'Ex-Factory', type: 'ex_factory', offsetWeeks: 38 },
  { name: 'Warehouse Delivery', type: 'warehouse_delivery', offsetWeeks: 42 },
  { name: 'Retail Launch', type: 'retail_launch', offsetWeeks: 44 },
];
```

Calculate planned_date from season start_date + offsetWeeks.

---

## 8. CROSS-MODULE LINKS

Merchandising connects to all downstream steps:

| From Merchandising | Links To | How |
|---|---|---|
| Style → lifecycle = "sampling" | Step 13: Sample Requests | `sample_requests.style_number` matches `styles.style_number` |
| Style → lifecycle = "in_production" | Step 12: Production Orders | `production_orders.style_number` matches `styles.style_number` |
| Style BOM | Step 15: Cost Sheets | Pre-fill cost_sheet_items from style_bom |
| Tech Pack measurements | Step 13: Sample Measurements | Pre-fill sample_measurements from tech_pack_measurements |
| Order Bookings | Step 12: Production quantity | Sum of order_bookings = production_orders.total_quantity |
| Colorway lab dip | Step 14: Test Requests | Link lab dip approval to test_requests |

**IMPORTANT:** When creating production orders, sampling requests, or cost sheets from downstream steps, allow selecting a Style from the style library to auto-fill relevant data.

---

## 9. SUPABASE STORAGE

- Bucket: `style-images`
- Path: `{style_id}/{image_type}/{filename}`
- Allowed: image/jpeg, image/png, image/webp
- Max size: 10MB

- Bucket: `tech-pack-files`
- Path: `{tech_pack_id}/{filename}`
- Allowed: image/jpeg, image/png, image/webp, application/pdf
- Max size: 20MB

---

## 10. NAVIGATION

Add "Merchandising" to sidebar:
- Icon: `Palette` or `Layers` from lucide-react
- Position: BEFORE "Production" (Step 12) — this is the first module after QA steps
- Badge: count of styles in development (lifecycle = concept/design/tech_pack)
- Sub-items (collapsible): Dashboard, Seasons, Style Library, Orders

---

## 11. EXCEL EXPORTS

### Measurement Spec Sheet Export (match RefrigiWear format):
Replicate the format from the uploaded Excel files (8025, 8112 tabs):
- Row 7: Headers — POM | Description | +Tol | -Tol | [Size columns] | Sample | Diff
- Row 8+: Each measurement row
- Bottom: Comments, Sample Size, Sample Color, Status, Approved/Rejected By/On

### BOM Export:
Standard BOM table with all columns, grouped by category, totals at bottom.

### Line Plan Export:
Full line plan table with pricing, margins, units, and status.

Use `xlsx` library for all exports.

---

## 12. IMPLEMENTATION ORDER

1. Database — All 11 tables + 2 storage buckets
2. Types & Zod schemas
3. Server actions
4. Style number generator utility
5. Seasons CRUD + calendar
6. Style Library (list + create + detail page with all tabs)
7. Tech Pack editor + measurement spec sheet
8. Colorway manager + lab dip status
9. Size matrix editor
10. BOM editor + cost breakdown chart
11. Line plan table (editable)
12. Order booking CRUD
13. Dashboard page with metrics
14. Excel exports (measurement sheet, BOM, line plan)
15. Nav integration
16. Test: create season → add line plan items → create styles → build tech packs → add measurements → add BOM → set colorways → book orders → verify lifecycle transitions → export to Excel

---

## 13. CONSTRAINTS

- Same code patterns as all other steps (shadcn/ui, react-hook-form, Zod, Sonner, date-fns, Recharts)
- POM codes from RefrigiWear Excel files as defaults (can be extended)
- Measurement spec sheet export must match RefrigiWear format
- Style library must support both grid and list views
- Lifecycle transitions must be validated (only allowed transitions)
- Cross-module links: when downstream steps (12-17) create records, allow selecting from style library
- Mobile responsive
- Settings view-only for non-Super Admin
- No fake data
