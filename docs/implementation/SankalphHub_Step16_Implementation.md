# SankalphHub — Step 16: Logistics & Shipping
## Claude Code Implementation Prompt

## CONTEXT
SankalphHub (www.sankalphub.in) — Fashion Manufacturing platform. Stack: Next.js 16 (App Router), TypeScript 5, React 19, Supabase (Postgres, Auth, Storage, Realtime), Tailwind CSS 4, shadcn/ui, Radix UI, react-hook-form + Zod, Recharts, Sonner, date-fns, jsPDF, xlsx. Deployed on Vercel.

Brand tokens: GOLD=#D4A843, DARK=#1A1A2E, WHITE=#FFFFFF, RED=#CC0000, GREEN=#2E7D32, GREY=#666666, BLUE=#1565C0

Roles: Super Admin > Brand Manager > Factory Manager > Inspector > Viewer

**PREREQUISITE:** Steps 12-15 must be built first.

**PRICING:** PAID ADD-ON at $99/month. Use feature flag `LOGISTICS_ENABLED` (default true for development).

---

## WHAT TO BUILD

A Logistics & Shipping module covering: shipment booking, packing list management, shipping document generation, multi-milestone tracking (from factory to warehouse), customs & clearance tracking, and carrier management. Supports 5 shipping modes: Sea (FCL/LCL), Air, Courier, Rail, Road.

---

## 1. DATABASE SCHEMA

```sql
-- 1a. Shipments
CREATE TABLE shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  production_order_id UUID REFERENCES production_orders(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  shipment_number TEXT NOT NULL UNIQUE,
  shipping_mode TEXT NOT NULL CHECK (shipping_mode IN (
    'sea_fcl', 'sea_lcl', 'air', 'courier', 'rail', 'road'
  )),
  status TEXT DEFAULT 'booking' CHECK (status IN (
    'booking', 'booked', 'at_origin_port', 'customs_clearance_origin',
    'in_transit', 'at_destination_port', 'customs_clearance_destination',
    'last_mile', 'delivered', 'cancelled'
  )),
  carrier_name TEXT,
  carrier_booking_ref TEXT,
  vessel_name TEXT,
  voyage_number TEXT,
  container_number TEXT,
  container_size TEXT CHECK (container_size IN ('20ft', '40ft', '40ft_hc', 'LCL', 'N/A')),
  bill_of_lading TEXT,
  airway_bill TEXT,
  tracking_number TEXT,
  -- Origin
  origin_country TEXT,
  origin_port TEXT,
  origin_address TEXT,
  -- Destination
  destination_country TEXT,
  destination_port TEXT,
  destination_address TEXT,
  -- Dates
  estimated_departure DATE,
  actual_departure DATE,
  estimated_arrival DATE,
  actual_arrival DATE,
  -- Quantities
  total_cartons INTEGER DEFAULT 0,
  total_pieces INTEGER DEFAULT 0,
  gross_weight_kg NUMERIC(10,2) DEFAULT 0,
  net_weight_kg NUMERIC(10,2) DEFAULT 0,
  volume_cbm NUMERIC(10,3) DEFAULT 0,
  -- Cost
  freight_cost NUMERIC(12,2) DEFAULT 0,
  freight_currency TEXT DEFAULT 'USD',
  insurance_cost NUMERIC(12,2) DEFAULT 0,
  customs_duty NUMERIC(12,2) DEFAULT 0,
  other_charges NUMERIC(12,2) DEFAULT 0,
  total_logistics_cost NUMERIC(12,2) DEFAULT 0,
  incoterm TEXT CHECK (incoterm IN ('FOB', 'CIF', 'CFR', 'EXW', 'DDP', 'DAP', 'FCA')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1b. Shipment Milestones (tracking events)
CREATE TABLE shipment_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE NOT NULL,
  milestone_order INTEGER NOT NULL,
  milestone_name TEXT NOT NULL,
  location TEXT,
  planned_date TIMESTAMPTZ,
  actual_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'delayed', 'skipped')),
  notes TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1c. Packing Lists
CREATE TABLE packing_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE NOT NULL,
  packing_list_number TEXT NOT NULL,
  carton_number TEXT NOT NULL,
  style_number TEXT,
  color TEXT,
  size_breakdown JSONB,  -- {"S": 10, "M": 20, "L": 15, "XL": 10}
  total_pcs INTEGER DEFAULT 0,
  gross_weight_kg NUMERIC(8,2),
  net_weight_kg NUMERIC(8,2),
  carton_dimensions TEXT,  -- "60x40x30 cm"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1d. Shipping Documents
CREATE TABLE shipping_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'bill_of_lading', 'airway_bill', 'commercial_invoice', 'packing_list',
    'certificate_of_origin', 'inspection_certificate', 'insurance_certificate',
    'customs_declaration', 'phytosanitary_cert', 'fumigation_cert', 'other'
  )),
  document_number TEXT,
  file_url TEXT,
  file_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'verified', 'rejected')),
  notes TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1e. Carriers
CREATE TABLE carriers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_name TEXT NOT NULL,
  carrier_code TEXT UNIQUE,
  carrier_type TEXT CHECK (carrier_type IN ('shipping_line', 'airline', 'courier', 'freight_forwarder', 'trucking')),
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  tracking_url_template TEXT,  -- e.g., "https://www.maersk.com/tracking/{tracking_number}"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_shipments_project ON shipments(project_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_prod_order ON shipments(production_order_id);
CREATE INDEX idx_ship_milestones_shipment ON shipment_milestones(shipment_id);
CREATE INDEX idx_packing_lists_shipment ON packing_lists(shipment_id);
CREATE INDEX idx_ship_docs_shipment ON shipping_documents(shipment_id);

-- RLS
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON shipments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON shipment_milestones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON packing_lists FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON shipping_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON carriers FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

## 2. DEFAULT TRACKING MILESTONES

Auto-insert these when a shipment is created:

```typescript
const SHIPMENT_MILESTONES = {
  sea_fcl: [
    { name: 'Booking Confirmed', order: 1 },
    { name: 'Cargo Ready at Factory', order: 2 },
    { name: 'Container Loading', order: 3 },
    { name: 'Gate In at Origin Port', order: 4 },
    { name: 'Customs Clearance (Origin)', order: 5 },
    { name: 'Vessel Departed', order: 6 },
    { name: 'Transshipment', order: 7 },
    { name: 'Vessel Arrived at Destination', order: 8 },
    { name: 'Customs Clearance (Destination)', order: 9 },
    { name: 'Container Released', order: 10 },
    { name: 'Last Mile Delivery', order: 11 },
    { name: 'Delivered to Warehouse', order: 12 },
  ],
  sea_lcl: [
    { name: 'Booking Confirmed', order: 1 },
    { name: 'Cargo Drop-off at CFS', order: 2 },
    { name: 'Consolidation', order: 3 },
    { name: 'Customs Clearance (Origin)', order: 4 },
    { name: 'Vessel Departed', order: 5 },
    { name: 'Vessel Arrived', order: 6 },
    { name: 'Deconsolidation', order: 7 },
    { name: 'Customs Clearance (Destination)', order: 8 },
    { name: 'Cargo Ready for Pickup', order: 9 },
    { name: 'Delivered to Warehouse', order: 10 },
  ],
  air: [
    { name: 'Booking Confirmed', order: 1 },
    { name: 'Cargo at Airport', order: 2 },
    { name: 'Customs Clearance (Origin)', order: 3 },
    { name: 'Flight Departed', order: 4 },
    { name: 'Flight Arrived', order: 5 },
    { name: 'Customs Clearance (Destination)', order: 6 },
    { name: 'Delivered to Warehouse', order: 7 },
  ],
  courier: [
    { name: 'Picked Up', order: 1 },
    { name: 'In Transit', order: 2 },
    { name: 'Out for Delivery', order: 3 },
    { name: 'Delivered', order: 4 },
  ],
  rail: [
    { name: 'Booking Confirmed', order: 1 },
    { name: 'Container Loaded', order: 2 },
    { name: 'Customs Clearance (Origin)', order: 3 },
    { name: 'In Transit', order: 4 },
    { name: 'Border Crossing', order: 5 },
    { name: 'Customs Clearance (Destination)', order: 6 },
    { name: 'Arrived at Terminal', order: 7 },
    { name: 'Delivered to Warehouse', order: 8 },
  ],
  road: [
    { name: 'Loaded at Factory', order: 1 },
    { name: 'In Transit', order: 2 },
    { name: 'Border Crossing', order: 3 },
    { name: 'Delivered to Warehouse', order: 4 },
  ],
};
```

---

## 3. FILE STRUCTURE

```
app/
  (dashboard)/
    logistics/
      page.tsx                    -- Shipments list (main page)
      new/
        page.tsx                  -- Create shipment
      [id]/
        page.tsx                  -- Shipment detail + tracking
        packing/
          page.tsx                -- Packing list management
        documents/
          page.tsx                -- Document management
      carriers/
        page.tsx                  -- Carrier registry
components/
  logistics/
    shipment-card.tsx
    shipment-tracker.tsx          -- Visual milestone tracker (vertical timeline)
    packing-list-editor.tsx       -- Carton-by-carton entry
    document-checklist.tsx        -- Required docs with upload status
    shipping-mode-selector.tsx    -- Icon-based mode picker
    carrier-selector.tsx
    shipment-map.tsx              -- Simple origin → destination visual (no real map API needed, just styled card showing route)
lib/
  actions/
    logistics.ts
  validations/
    logistics.ts
  types/
    logistics.ts
```

---

## 4. PAGE SPECIFICATIONS

### 4a. Shipments List — `/logistics`

**Header:** "Logistics & Shipping" + "New Shipment +" button

**Filter bar:** Shipping mode, Status, Carrier, Date range, Search

**Table:** Shipment #, Mode icon, Origin → Destination, Carrier, Status, ETD, ETA, Cartons, Progress bar

**Shipping mode icons (use lucide-react):**
- sea_fcl / sea_lcl: `Ship`
- air: `Plane`
- courier: `Package`
- rail: `TrainFront`
- road: `Truck`

### 4b. Create Shipment — `/logistics/new`

**Multi-step form:**

**Step 1 — Shipment Details:**
- Link to Project / Production Order / PO (cascading)
- Shipping Mode (icon cards to select)
- Carrier (select from carriers table)
- Booking Reference
- Container Number + Size (for sea)
- Incoterm (select)

**Step 2 — Route:**
- Origin: Country, Port/Airport, Address
- Destination: Country, Port/Airport, Address
- ETD (date), ETA (date)

**Step 3 — Cargo:**
- Total Cartons, Total Pieces
- Gross Weight (kg), Net Weight (kg)
- Volume (CBM)

**Step 4 — Review & Create:**
On create: insert shipment + auto-generate milestones based on shipping mode

### 4c. Shipment Detail — `/logistics/[id]`

**Header:** Shipment #, mode icon, status badge, origin → destination

**Route visual:** Card showing: Origin flag + port → shipping mode icon → Destination flag + port, with ETD/ETA

**Tabs:**

1. **Tracking** (default)
   - Vertical timeline showing all milestones
   - Each milestone: name, planned date, actual date, status
   - Completed = green circle, Current = blue pulsing, Pending = grey
   - Click to update: set actual date, add notes
   - Progress bar at top showing % completed

2. **Packing List**
   - Table: Carton # | Style | Color | Size Breakdown | Total Pcs | Weight
   - "Add Carton" button → inline row
   - Size breakdown: editable JSON rendered as size columns (S/M/L/XL/XXL)
   - Totals row at bottom
   - "Generate Packing List PDF" button (jsPDF)

3. **Documents**
   - Checklist of required document types (based on shipping mode + destination)
   - Upload button per document type
   - Status: Pending (grey), Uploaded (blue), Verified (green), Rejected (red)
   - Store in Supabase Storage bucket `shipping-documents`

4. **Costs**
   - Freight cost, Insurance, Customs duty, Other charges
   - Total logistics cost
   - Currency selector
   - Editable inline

**Required documents by mode:**
```typescript
const REQUIRED_DOCS = {
  sea_fcl: ['bill_of_lading', 'commercial_invoice', 'packing_list', 'certificate_of_origin', 'insurance_certificate'],
  sea_lcl: ['bill_of_lading', 'commercial_invoice', 'packing_list', 'certificate_of_origin'],
  air: ['airway_bill', 'commercial_invoice', 'packing_list', 'certificate_of_origin'],
  courier: ['commercial_invoice', 'packing_list'],
  rail: ['bill_of_lading', 'commercial_invoice', 'packing_list', 'customs_declaration'],
  road: ['commercial_invoice', 'packing_list'],
};
```

---

## 5. SUPABASE STORAGE

- Bucket: `shipping-documents`
- Path: `{shipment_id}/{document_type}/{filename}`
- Allowed: application/pdf, image/jpeg, image/png
- Max size: 20MB

---

## 6. FEATURE FLAG

```typescript
LOGISTICS_ENABLED: process.env.NEXT_PUBLIC_LOGISTICS_ENABLED !== 'false'
```
Show UpgradePrompt if disabled (same component as Step 14).

---

## 7. NAVIGATION

Add "Logistics" to sidebar:
- Icon: `Ship` from lucide-react
- Position: after "Purchasing"
- Badge: count of in-transit shipments
- Sub-items: Shipments, Carriers

---

## 8. IMPLEMENTATION ORDER

1. Database — All 5 tables + storage bucket
2. Feature flag
3. Types & Zod schemas
4. Server actions
5. Carriers CRUD page
6. Shipment list + create form
7. Shipment detail with tracking timeline
8. Packing list editor
9. Document management with uploads
10. Cost tracking tab
11. PDF generation for packing list
12. Nav integration
13. Test: create carrier → create shipment → update tracking milestones → add packing list → upload documents → verify full flow

---

## 9. CONSTRAINTS

- Same patterns as Steps 12-15
- Feature flag gating
- All file uploads via Supabase Storage
- jsPDF for packing list export
- No real map API — just styled route card
- react-hook-form + Zod, Sonner, shadcn/ui
- Mobile responsive
- No fake data
