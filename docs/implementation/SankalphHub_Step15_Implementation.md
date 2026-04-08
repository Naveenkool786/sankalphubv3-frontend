# SankalphHub — Step 15: Costing & Purchasing
## Claude Code Implementation Prompt

## CONTEXT
SankalphHub (www.sankalphub.in) — Fashion Manufacturing platform. Stack: Next.js 16 (App Router), TypeScript 5, React 19, Supabase (Postgres, Auth, Storage, Realtime), Tailwind CSS 4, shadcn/ui, Radix UI, react-hook-form + Zod, Recharts, Sonner, date-fns, jsPDF, xlsx. Deployed on Vercel.

Brand tokens: GOLD=#D4A843, DARK=#1A1A2E, WHITE=#FFFFFF, RED=#CC0000, GREEN=#2E7D32, GREY=#666666, BLUE=#1565C0

Roles: Super Admin > Brand Manager > Factory Manager > Inspector > Viewer

**PREREQUISITE:** Steps 12-14 must be built first.

---

## WHAT TO BUILD

A Costing & Purchasing module covering: garment cost sheets (BOM breakdown), quotation management, purchase order lifecycle, invoice tracking with 3-way matching, margin analysis, and multi-currency support. This is the financial backbone of the manufacturing process.

---

## 1. DATABASE SCHEMA

```sql
-- 1a. Cost Sheets (Bill of Materials)
CREATE TABLE cost_sheets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  production_order_id UUID REFERENCES production_orders(id),
  style_number TEXT,
  style_name TEXT,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'revised')),
  currency TEXT DEFAULT 'USD',
  total_cost NUMERIC(12,4) DEFAULT 0,
  target_fob NUMERIC(12,4),  -- target FOB price
  actual_fob NUMERIC(12,4),  -- calculated FOB
  margin_percentage NUMERIC(5,2),
  notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1b. Cost Sheet Line Items (BOM entries)
CREATE TABLE cost_sheet_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cost_sheet_id UUID REFERENCES cost_sheets(id) ON DELETE CASCADE NOT NULL,
  item_order INTEGER DEFAULT 0,
  cost_category TEXT NOT NULL CHECK (cost_category IN (
    'fabric', 'trims', 'accessories', 'embellishment',
    'labels', 'packaging', 'CMT', 'wash', 'testing',
    'logistics', 'overhead', 'commission', 'other'
  )),
  description TEXT NOT NULL,
  supplier TEXT,
  unit TEXT DEFAULT 'yard',  -- yard, meter, pcs, set, kg
  consumption NUMERIC(10,4) DEFAULT 0,  -- qty per garment
  unit_price NUMERIC(10,4) DEFAULT 0,
  wastage_percentage NUMERIC(5,2) DEFAULT 0,
  total_per_garment NUMERIC(10,4) GENERATED ALWAYS AS (
    consumption * unit_price * (1 + wastage_percentage / 100)
  ) STORED,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1c. Quotations
CREATE TABLE quotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  quotation_number TEXT NOT NULL UNIQUE,
  supplier_name TEXT NOT NULL,
  supplier_contact TEXT,
  supplier_email TEXT,
  factory_id UUID REFERENCES factories(id),
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'received', 'under_review',
    'negotiating', 'accepted', 'rejected', 'expired'
  )),
  valid_until DATE,
  currency TEXT DEFAULT 'USD',
  total_amount NUMERIC(12,2) DEFAULT 0,
  payment_terms TEXT,  -- e.g., "30% advance, 70% before shipment"
  delivery_terms TEXT,  -- e.g., "FOB Shanghai"
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1d. Quotation Line Items
CREATE TABLE quotation_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  style_number TEXT,
  quantity NUMERIC(10,2) DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  unit_price NUMERIC(10,4) DEFAULT 0,
  total_price NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1e. Purchase Orders
CREATE TABLE purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  production_order_id UUID REFERENCES production_orders(id),
  quotation_id UUID REFERENCES quotations(id),
  po_number TEXT NOT NULL UNIQUE,
  supplier_name TEXT NOT NULL,
  factory_id UUID REFERENCES factories(id),
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_approval', 'approved', 'sent_to_supplier',
    'acknowledged', 'in_production', 'partially_shipped',
    'shipped', 'received', 'cancelled'
  )),
  currency TEXT DEFAULT 'USD',
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  payment_terms TEXT,
  delivery_terms TEXT,
  ship_by_date DATE,
  delivery_address TEXT,
  notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1f. Purchase Order Line Items
CREATE TABLE po_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  style_number TEXT,
  color TEXT,
  size TEXT,
  quantity NUMERIC(10,2) DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  unit_price NUMERIC(10,4) DEFAULT 0,
  total_price NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  received_qty NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1g. Invoices
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID REFERENCES purchase_orders(id),
  invoice_number TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'matched', 'disputed', 'approved', 'paid', 'cancelled'
  )),
  currency TEXT DEFAULT 'USD',
  invoice_amount NUMERIC(12,2) NOT NULL,
  invoice_date DATE,
  due_date DATE,
  match_status TEXT DEFAULT 'unmatched' CHECK (match_status IN (
    'unmatched', 'matched', 'partial_match', 'mismatch'
  )),
  po_amount NUMERIC(12,2),          -- from PO
  receipt_amount NUMERIC(12,2),     -- from goods receipt
  variance_amount NUMERIC(12,2),    -- difference
  payment_reference TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cost_sheets_project ON cost_sheets(project_id);
CREATE INDEX idx_cost_items_sheet ON cost_sheet_items(cost_sheet_id);
CREATE INDEX idx_quotations_project ON quotations(project_id);
CREATE INDEX idx_quotation_items_quot ON quotation_items(quotation_id);
CREATE INDEX idx_po_project ON purchase_orders(project_id);
CREATE INDEX idx_po_items_po ON po_items(purchase_order_id);
CREATE INDEX idx_invoices_po ON invoices(purchase_order_id);

-- RLS (same pattern)
ALTER TABLE cost_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_sheet_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON cost_sheets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON cost_sheet_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON quotations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON quotation_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON po_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

## 2. MULTI-CURRENCY SUPPORT

```typescript
const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' },
  { code: 'MMK', symbol: 'K', name: 'Myanmar Kyat' },
  { code: 'KHR', symbol: '៛', name: 'Cambodian Riel' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr' },
];
```

For now, store amounts in their original currency. Currency conversion is a future enhancement — do NOT build a live FX rate integration yet.

---

## 3. FILE STRUCTURE

```
app/
  (dashboard)/
    costing/
      page.tsx                    -- Cost sheets list
      new/
        page.tsx                  -- Create cost sheet
      [id]/
        page.tsx                  -- Cost sheet detail + BOM editor
    purchasing/
      quotations/
        page.tsx                  -- Quotation list
        new/
          page.tsx                -- Create quotation
        [id]/
          page.tsx                -- Quotation detail
      orders/
        page.tsx                  -- Purchase orders list
        new/
          page.tsx                -- Create PO
        [id]/
          page.tsx                -- PO detail
      invoices/
        page.tsx                  -- Invoices list
        [id]/
          page.tsx                -- Invoice detail + 3-way match
components/
  costing/
    bom-editor.tsx                -- Add/edit/reorder cost line items
    cost-summary.tsx              -- Pie chart + totals
    margin-indicator.tsx          -- Target vs actual margin
    cost-comparison.tsx           -- Compare versions side by side
  purchasing/
    quotation-card.tsx
    po-card.tsx
    po-status-tracker.tsx         -- 10-state visual tracker
    invoice-match-panel.tsx       -- 3-way matching UI
    currency-input.tsx            -- Input with currency selector
lib/
  actions/
    costing.ts
    purchasing.ts
  validations/
    costing.ts
    purchasing.ts
  types/
    costing.ts
    purchasing.ts
```

---

## 4. PAGE SPECIFICATIONS

### 4a. Cost Sheets List — `/costing`

**Header:** "Costing" + "New Cost Sheet +" button

**Table:** Style, Version, Status, Currency, Total Cost, Target FOB, Actual FOB, Margin %, Created

### 4b. Cost Sheet Detail — `/costing/[id]`

**BOM Editor — the core of this page:**
- Grouped by cost_category (Fabric, Trims, CMT, etc.)
- Each row: Description, Supplier, Unit, Consumption, Unit Price, Wastage %, Total/garment
- Add row button per category
- Reorder rows (drag or arrows)
- Running total at bottom
- Pie chart showing cost breakdown by category (Recharts `<PieChart>`)
- Margin analysis: Target FOB vs Calculated FOB, margin %
- "Submit for Approval" button → changes status
- "Export to Excel" button (use xlsx library)

### 4c. Purchase Orders — `/purchasing/orders`

**PO Status progression (10 states):**
draft → pending_approval → approved → sent_to_supplier → acknowledged → in_production → partially_shipped → shipped → received → cancelled

**Visual status tracker:** horizontal stepper showing current position in the workflow.

### 4d. Invoice 3-Way Match — `/purchasing/invoices/[id]`

**Three-way matching panel showing side by side:**
1. PO Amount (from purchase order)
2. Receipt Amount (from goods received — entered manually for now)
3. Invoice Amount (from supplier invoice)

**Match logic:**
```typescript
function calculateMatch(po: number, receipt: number, invoice: number) {
  const variance = Math.abs(invoice - po);
  const tolerance = po * 0.02; // 2% tolerance
  if (variance <= tolerance && receipt >= po * 0.95) return 'matched';
  if (variance <= tolerance) return 'partial_match';
  return 'mismatch';
}
```

Color coding: matched = green, partial = orange, mismatch = red

---

## 5. AUTO-GENERATION

**PO Number:** `PO-{YYYYMMDD}-{XXX}`
**Quotation Number:** `QT-{YYYYMMDD}-{XXX}`

**Cost sheet from template:**
When creating for a category, pre-fill common cost categories:
```typescript
const DEFAULT_COST_CATEGORIES = {
  woven: ['fabric', 'trims', 'labels', 'packaging', 'CMT', 'wash', 'testing', 'overhead'],
  knits: ['fabric', 'trims', 'labels', 'packaging', 'CMT', 'testing', 'overhead'],
  denim: ['fabric', 'trims', 'labels', 'packaging', 'CMT', 'wash', 'testing', 'overhead'],
  outerwear: ['fabric', 'trims', 'accessories', 'labels', 'packaging', 'CMT', 'testing', 'overhead'],
  accessories: ['fabric', 'trims', 'accessories', 'packaging', 'CMT', 'overhead'],
};
```

---

## 6. NAVIGATION

Add to sidebar as a collapsible group:
- **Costing** — Icon: `Calculator` from lucide-react
  - Cost Sheets
- **Purchasing** — Icon: `ShoppingCart` from lucide-react
  - Quotations
  - Purchase Orders
  - Invoices

Badge on Purchasing: count of POs pending approval

---

## 7. IMPLEMENTATION ORDER

1. Database — All 7 tables
2. Types & Zod schemas
3. Server actions (costing + purchasing)
4. Cost sheet list + create + BOM editor
5. Quotation CRUD
6. Purchase order CRUD with status workflow
7. Invoice list + 3-way matching
8. Export (Excel for cost sheets, PDF for POs)
9. Nav integration
10. Test: create cost sheet → add BOM items → create quotation → convert to PO → create invoice → verify 3-way match

---

## 8. CONSTRAINTS

- Same patterns as Steps 12-14
- All monetary inputs must use 2 decimal places for display, 4 for storage
- Currency selector on all monetary forms
- Use GENERATED ALWAYS columns for calculated totals (Postgres handles this)
- Export: xlsx for cost sheets, jsPDF for POs
- No live FX rates — store in original currency only
- react-hook-form + Zod, Sonner, shadcn/ui
- Mobile responsive
- No fake data
