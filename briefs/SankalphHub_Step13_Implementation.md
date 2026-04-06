# SankalphHub — Step 13: Sampling Lifecycle Management
## Claude Code Implementation Prompt

## CONTEXT
SankalphHub (www.sankalphub.in) — Fashion Manufacturing platform. Stack: Next.js 16 (App Router), TypeScript 5, React 19, Supabase (Postgres, Auth, Storage, Realtime), Tailwind CSS 4, shadcn/ui, Radix UI, react-hook-form + Zod, Recharts, Sonner, date-fns, jsPDF, xlsx. Deployed on Vercel.

Brand tokens: GOLD=#D4A843, DARK=#1A1A2E, WHITE=#FFFFFF, RED=#CC0000, GREEN=#2E7D32, GREY=#666666, BLUE=#1565C0

Roles: Super Admin > Brand Manager > Factory Manager > Inspector > Viewer

**PREREQUISITE:** Step 12 (Production Tracking) must be built first — this module references production_orders.

---

## WHAT TO BUILD

A Sampling Lifecycle module that tracks garment samples through 6 stages — from proto sample to production sample. Buyers and brand teams need to submit, review, approve, or reject samples with comments and photos at each stage. This is critical in fashion manufacturing because production cannot begin until samples are approved.

---

## 1. DATABASE SCHEMA

```sql
-- 1a. Sample Requests
CREATE TABLE sample_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  production_order_id UUID REFERENCES production_orders(id),
  request_number TEXT NOT NULL UNIQUE,
  style_number TEXT,
  style_name TEXT,
  category TEXT CHECK (category IN ('woven', 'knits', 'denim', 'outerwear', 'accessories')),
  sample_type TEXT NOT NULL CHECK (sample_type IN (
    'proto', 'fit', 'size_set', 'pp', 'top_of_production', 'shipment'
  )),
  factory_id UUID REFERENCES factories(id),
  buyer_brand TEXT,
  required_date DATE,
  actual_submit_date DATE,
  status TEXT DEFAULT 'requested' CHECK (status IN (
    'requested', 'in_progress', 'submitted', 'under_review',
    'approved', 'approved_with_comments', 'rejected', 'cancelled'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  revision_number INTEGER DEFAULT 1,
  size_range TEXT,
  color TEXT,
  fabric_details TEXT,
  special_instructions TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1b. Sample Comments (review thread)
CREATE TABLE sample_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sample_request_id UUID REFERENCES sample_requests(id) ON DELETE CASCADE NOT NULL,
  comment_type TEXT DEFAULT 'general' CHECK (comment_type IN (
    'general', 'fit', 'fabric', 'color', 'construction', 'measurement', 'approval', 'rejection'
  )),
  comment TEXT NOT NULL,
  author_role TEXT,
  is_internal BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1c. Sample Images (photos of each sample submission)
CREATE TABLE sample_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sample_request_id UUID REFERENCES sample_requests(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  image_type TEXT DEFAULT 'front' CHECK (image_type IN (
    'front', 'back', 'detail', 'label', 'measurement', 'packaging', 'defect', 'other'
  )),
  caption TEXT,
  revision_number INTEGER DEFAULT 1,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1d. Sample Measurements (spec vs actual)
CREATE TABLE sample_measurements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sample_request_id UUID REFERENCES sample_requests(id) ON DELETE CASCADE NOT NULL,
  size TEXT NOT NULL,
  point_of_measure TEXT NOT NULL,
  spec_value NUMERIC(8,2),
  actual_value NUMERIC(8,2),
  tolerance_plus NUMERIC(5,2) DEFAULT 0.5,
  tolerance_minus NUMERIC(5,2) DEFAULT 0.5,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pass', 'fail', 'pending')),
  unit TEXT DEFAULT 'inches' CHECK (unit IN ('inches', 'cm')),
  revision_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_samples_project ON sample_requests(project_id);
CREATE INDEX idx_samples_status ON sample_requests(status);
CREATE INDEX idx_samples_type ON sample_requests(sample_type);
CREATE INDEX idx_samples_factory ON sample_requests(factory_id);
CREATE INDEX idx_sample_comments_request ON sample_comments(sample_request_id);
CREATE INDEX idx_sample_images_request ON sample_images(sample_request_id);
CREATE INDEX idx_sample_measurements_request ON sample_measurements(sample_request_id);

-- RLS
ALTER TABLE sample_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_samples" ON sample_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_samples" ON sample_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_samples" ON sample_requests FOR UPDATE TO authenticated USING (true);

CREATE POLICY "auth_select_comments" ON sample_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_comments" ON sample_comments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_select_images" ON sample_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_images" ON sample_images FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_select_measurements" ON sample_measurements FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_measurements" ON sample_measurements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_measurements" ON sample_measurements FOR UPDATE TO authenticated USING (true);
```

---

## 2. THE 6 SAMPLE STAGES

Each style goes through these stages in order. A sample type cannot be started until the previous type is approved (or skipped by Brand Manager):

| # | Type | Purpose | Typical Timeline |
|---|------|---------|-----------------|
| 1 | Proto | First concept sample, rough construction | 7-10 days |
| 2 | Fit | Fit check on live model, measurements verified | 5-7 days |
| 3 | Size Set | Full size range samples | 7-10 days |
| 4 | PP (Pre-Production) | Final sample before bulk production | 5-7 days |
| 5 | Top of Production | First pieces off the production line | 1-2 days |
| 6 | Shipment | Random pull from final shipment | 1 day |

---

## 3. FILE STRUCTURE

```
app/
  (dashboard)/
    sampling/
      page.tsx                    -- Sample requests list
      new/
        page.tsx                  -- Create new sample request
      [id]/
        page.tsx                  -- Sample detail + review workflow
        measurements/
          page.tsx                -- Measurement comparison sheet
components/
  sampling/
    sample-card.tsx               -- Card for list view
    sample-stage-tracker.tsx      -- Horizontal stage indicator (6 dots/steps)
    sample-review-panel.tsx       -- Comment thread + approve/reject buttons
    sample-image-gallery.tsx      -- Photo grid with upload
    measurement-sheet.tsx         -- Spec vs actual table with pass/fail
    sample-filters.tsx            -- Filter bar
lib/
  actions/
    sampling.ts                  -- Server actions
  validations/
    sampling.ts                  -- Zod schemas
  types/
    sampling.ts                  -- TypeScript types
```

---

## 4. PAGE SPECIFICATIONS

### 4a. Sample Requests List — `/sampling`

**Header:** "Sampling" title + "New Sample Request +" button (GOLD)

**Filter bar:**
- Sample type: All / Proto / Fit / Size Set / PP / TOP / Shipment
- Status: All / Requested / In Progress / Submitted / Under Review / Approved / Rejected
- Factory dropdown
- Search by request # or style

**List view:** Cards or table rows showing:
- Request #, Style, Sample Type (colored badge), Status, Revision #
- Factory, Buyer, Required Date
- Progress indicator: which stage out of 6
- Thumbnail of latest image (if any)

**Sample type badge colors:**
- proto: grey
- fit: blue
- size_set: purple
- pp: GOLD
- top_of_production: green
- shipment: dark green

### 4b. New Sample Request — `/sampling/new`

**Single-page form (not multi-step — simpler than production orders):**

Fields:
- Link to Project (required, select)
- Link to Production Order (optional, select — filtered by project)
- Style Number + Style Name
- Category (auto-fill if production order selected)
- Sample Type (required, select from 6 types)
- Factory (auto-fill if production order selected)
- Buyer/Brand
- Required Date (date picker)
- Priority (select)
- Size Range (text, e.g., "S-M-L-XL")
- Color (text)
- Fabric Details (textarea)
- Special Instructions (textarea)

On submit: create sample_request, show toast, redirect to detail page.

Auto-generate request number: `SR-{YYYYMMDD}-{XXX}`

### 4c. Sample Detail — `/sampling/[id]`

**Header:**
- Request #, Style name, Sample type badge, Status badge
- Stage tracker: horizontal dots showing all 6 stages, current one highlighted
- Key dates: Requested → Required → Submitted
- Revision counter: "Rev 3"

**Tabs:**

1. **Review** (default)
   - Comment thread (newest first or oldest first toggle)
   - Each comment shows: author name, role, timestamp, comment type badge, text
   - "Add Comment" form: comment text + type dropdown
   - **Action buttons** (visible to Brand Manager / Super Admin):
     - "Approve" (green) — changes status to approved
     - "Approve with Comments" (gold) — adds comment + approves
     - "Reject" (red) — requires rejection reason comment, increments revision_number
     - "Request Revision" — similar to reject but softer language

2. **Photos**
   - Upload zone (drag & drop or click to upload)
   - Image grid: front, back, detail, label views
   - Each image: thumbnail, type tag, caption, uploaded by, date
   - Click to view full-size in modal
   - Store in Supabase Storage bucket `sample-images`
   - Organize by revision number

3. **Measurements**
   - Table: Size | Point of Measure | Spec | Actual | Tol+ | Tol- | Status
   - Auto-calculate pass/fail: if actual is within spec +/- tolerance = pass (green), else fail (red)
   - "Add Measurement" button → inline row or modal
   - Import from previous revision (copy spec values)
   - Export to PDF option (use jsPDF)
   - Summary: X/Y measurements pass, overall pass rate %

4. **History**
   - Timeline of all status changes, comments, image uploads
   - Shows who did what and when
   - Revision history: link to previous revisions

---

## 5. BUSINESS LOGIC

### 5a. Status transitions
```typescript
const VALID_TRANSITIONS: Record<string, string[]> = {
  requested: ['in_progress', 'cancelled'],
  in_progress: ['submitted', 'cancelled'],
  submitted: ['under_review'],
  under_review: ['approved', 'approved_with_comments', 'rejected'],
  rejected: ['in_progress'],  // restart with new revision
  approved_with_comments: [],  // terminal
  approved: [],                // terminal
  cancelled: [],               // terminal
};
```

### 5b. Rejection → Auto increment revision
When a sample is rejected:
1. Set status to 'rejected'
2. Create a comment with the rejection reason
3. When factory restarts work, create a NEW sample_request with revision_number + 1
4. Copy spec measurements from previous revision

### 5c. Stage progression
Only allow creating the next sample type when the previous is approved:
```typescript
const STAGE_ORDER = ['proto', 'fit', 'size_set', 'pp', 'top_of_production', 'shipment'];

function canCreateSampleType(styleNumber: string, requestedType: string, existingSamples: SampleRequest[]): boolean {
  const typeIndex = STAGE_ORDER.indexOf(requestedType);
  if (typeIndex === 0) return true; // proto can always be created
  const previousType = STAGE_ORDER[typeIndex - 1];
  const previousApproved = existingSamples.some(
    s => s.style_number === styleNumber && s.sample_type === previousType &&
    (s.status === 'approved' || s.status === 'approved_with_comments')
  );
  return previousApproved;
}
```

### 5d. Measurement pass/fail auto-calculation
```typescript
function checkMeasurement(spec: number, actual: number, tolPlus: number, tolMinus: number): 'pass' | 'fail' {
  return (actual >= spec - tolMinus && actual <= spec + tolPlus) ? 'pass' : 'fail';
}
```

---

## 6. SUPABASE STORAGE

Create a bucket for sample images:
- Bucket name: `sample-images`
- Public: false (use signed URLs)
- File path pattern: `{sample_request_id}/rev{revision_number}/{image_type}_{timestamp}.{ext}`
- Allowed types: image/jpeg, image/png, image/webp
- Max file size: 10MB

---

## 7. NAVIGATION

Add "Sampling" to the sidebar navigation:
- Icon: `Scissors` or `SwatchBook` from lucide-react
- Position: after "Production"
- Badge: count of samples pending review (status = 'submitted' or 'under_review')

---

## 8. IMPLEMENTATION ORDER

1. Database — Run SQL for all 4 tables + create storage bucket
2. Types & Zod schemas
3. Server actions (CRUD for samples, comments, images, measurements)
4. List page with filters
5. Create form
6. Detail page with all 4 tabs
7. Photo upload component (Supabase Storage integration)
8. Measurement sheet component with auto pass/fail
9. Navigation integration
10. Test: create sample → upload photos → add measurements → submit → review → approve/reject → verify revision flow

---

## 9. CONSTRAINTS

- Follow exact code patterns from existing pages and Step 12
- Use Supabase Storage for images (NOT local file system)
- All forms: react-hook-form + Zod
- All dates: date-fns
- All toasts: Sonner
- All UI: shadcn/ui components
- Mobile responsive
- Settings view-only for non-Super Admin
- No fake data, no fabricated metrics
