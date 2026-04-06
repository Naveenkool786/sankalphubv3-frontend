# SankalphHub — Step 14: Testing & Lab Management
## Claude Code Implementation Prompt

## CONTEXT
SankalphHub (www.sankalphub.in) — Fashion Manufacturing platform. Stack: Next.js 16 (App Router), TypeScript 5, React 19, Supabase (Postgres, Auth, Storage, Realtime), Tailwind CSS 4, shadcn/ui, Radix UI, react-hook-form + Zod, Recharts, Sonner, date-fns, jsPDF, xlsx. Deployed on Vercel.

Brand tokens: GOLD=#D4A843, DARK=#1A1A2E, WHITE=#FFFFFF, RED=#CC0000, GREEN=#2E7D32, GREY=#666666, BLUE=#1565C0

Roles: Super Admin > Brand Manager > Factory Manager > Inspector > Viewer

**PREREQUISITE:** Steps 12-13 must be built first.

**PRICING:** This is a PAID ADD-ON module at $79/month. Access should be gated behind a subscription check (for now, use a feature flag `TESTING_LAB_ENABLED` that defaults to `true` for development — the billing integration comes later).

---

## WHAT TO BUILD

A Testing & Lab Management module for tracking fabric and garment testing — physical tests (tensile strength, pilling, shrinkage), chemical tests (pH, formaldehyde, AZO dyes), colorfastness tests (wash, light, rubbing), and performance tests (water resistance, breathability). Factories send samples to certified labs, and results are tracked, compared against buyer standards, and linked to production orders.

---

## 1. DATABASE SCHEMA

```sql
-- 1a. Lab Partners (registered testing labs)
CREATE TABLE lab_partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_name TEXT NOT NULL,
  lab_code TEXT UNIQUE,
  accreditation TEXT,  -- e.g., "ISO 17025", "OEKO-TEX", "AATCC"
  country TEXT,
  city TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  specializations TEXT[],  -- array: ['physical', 'chemical', 'colorfastness', 'performance']
  turnaround_days INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1b. Test Requests
CREATE TABLE test_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  production_order_id UUID REFERENCES production_orders(id),
  sample_request_id UUID REFERENCES sample_requests(id),
  request_number TEXT NOT NULL UNIQUE,
  lab_id UUID REFERENCES lab_partners(id),
  test_category TEXT NOT NULL CHECK (test_category IN ('physical', 'chemical', 'colorfastness', 'performance')),
  fabric_type TEXT,
  fabric_composition TEXT,  -- e.g., "100% Cotton", "65% Poly 35% Cotton"
  color TEXT,
  sample_size TEXT,
  buyer_standard TEXT,  -- e.g., "M&S P100", "Nike RSL", "H&M CL"
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted_to_lab', 'in_testing', 'results_received',
    'pass', 'fail', 'conditional_pass', 'retest_required', 'cancelled'
  )),
  submitted_date DATE,
  expected_result_date DATE,
  actual_result_date DATE,
  overall_result TEXT CHECK (overall_result IN ('pass', 'fail', 'conditional_pass')),
  report_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1c. Individual Test Results (each test within a request)
CREATE TABLE test_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_request_id UUID REFERENCES test_requests(id) ON DELETE CASCADE NOT NULL,
  test_name TEXT NOT NULL,
  test_method TEXT,  -- e.g., "AATCC 61-2A", "ISO 105-C06"
  test_parameter TEXT,  -- what's being measured
  required_value TEXT,  -- buyer's minimum standard
  actual_value TEXT,  -- lab result
  unit TEXT,
  result TEXT DEFAULT 'pending' CHECK (result IN ('pass', 'fail', 'pending', 'not_applicable')),
  grade TEXT,  -- e.g., "4-5" for colorfastness grey scale
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1d. Test Templates (pre-defined test packages)
CREATE TABLE test_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  test_category TEXT NOT NULL,
  buyer_standard TEXT,
  tests JSONB NOT NULL,  -- array of {test_name, test_method, test_parameter, required_value, unit}
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1e. Lab Reports (uploaded files)
CREATE TABLE lab_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_request_id UUID REFERENCES test_requests(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  report_type TEXT DEFAULT 'lab_report' CHECK (report_type IN ('lab_report', 'certificate', 'supporting_doc')),
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_test_req_project ON test_requests(project_id);
CREATE INDEX idx_test_req_prod_order ON test_requests(production_order_id);
CREATE INDEX idx_test_req_status ON test_requests(status);
CREATE INDEX idx_test_req_lab ON test_requests(lab_id);
CREATE INDEX idx_test_results_request ON test_results(test_request_id);

-- RLS
ALTER TABLE lab_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_lab_partners" ON lab_partners FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_test_requests" ON test_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_test_results" ON test_results FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_test_templates" ON test_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_lab_reports" ON lab_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

## 2. COMMON TESTS BY CATEGORY

### Physical Tests
| Test | Method | Typical Requirement |
|------|--------|-------------------|
| Tensile Strength | ASTM D5034 | Min 25 lbs |
| Tear Strength | ASTM D1424 | Min 2 lbs |
| Pilling Resistance | ASTM D4970 | Grade 3-4 min |
| Shrinkage (Wash) | AATCC 135 | Max ±3% |
| Seam Slippage | ASTM D434 | Min 6mm |
| Abrasion Resistance | ASTM D4966 | Min 20,000 cycles |

### Chemical Tests
| Test | Method | Typical Requirement |
|------|--------|-------------------|
| pH Value | ISO 3071 | 4.0 - 7.5 |
| Formaldehyde | ISO 14184-1 | Max 75 ppm |
| AZO Dyes (Banned Amines) | EN 14362 | Not detected |
| Heavy Metals (Lead) | CPSC-CH-E1001 | Max 90 ppm |
| Nickel Release | EN 1811 | Max 0.5 µg/cm²/week |
| PFAS | EPA Method 533 | Not detected |

### Colorfastness Tests
| Test | Method | Typical Requirement |
|------|--------|-------------------|
| Colorfastness to Washing | AATCC 61 | Grade 4 min |
| Colorfastness to Light | AATCC 16 | Grade 4 min |
| Colorfastness to Rubbing (Dry) | AATCC 8 | Grade 4 min |
| Colorfastness to Rubbing (Wet) | AATCC 8 | Grade 3 min |
| Colorfastness to Water | AATCC 107 | Grade 4 min |
| Colorfastness to Perspiration | AATCC 15 | Grade 3-4 min |

### Performance Tests (Outerwear / Technical)
| Test | Method | Typical Requirement |
|------|--------|-------------------|
| Water Resistance | AATCC 127 | Min 60 cm |
| Breathability (MVTR) | ASTM E96 | Min 5000 g/m²/24h |
| Down Fill Power | IDFB | Min 550 |
| Insulation (CLO) | ASTM F1868 | Varies by product |

Use these to seed the `test_templates` table with default templates.

---

## 3. FILE STRUCTURE

```
app/
  (dashboard)/
    testing/
      page.tsx                    -- Test requests list
      new/
        page.tsx                  -- Create new test request
      [id]/
        page.tsx                  -- Test request detail + results
      labs/
        page.tsx                  -- Lab partner registry
      templates/
        page.tsx                  -- Test templates management
components/
  testing/
    test-request-card.tsx         -- Card for list
    test-results-table.tsx        -- Results with pass/fail indicators
    lab-selector.tsx              -- Lab partner picker
    test-template-picker.tsx      -- Select template to auto-fill tests
    result-entry-form.tsx         -- Enter individual test results
    test-summary-badge.tsx        -- Overall pass/fail badge
    test-report-upload.tsx        -- File upload for lab reports
lib/
  actions/
    testing.ts                   -- Server actions
  validations/
    testing.ts                   -- Zod schemas
  types/
    testing.ts                   -- TypeScript types
```

---

## 4. PAGE SPECIFICATIONS

### 4a. Test Requests List — `/testing`

**Header:** "Testing & Lab" title + "New Test Request +" button (GOLD)

**Filter bar:** Test category, Status, Lab, Date range, Search

**Table columns:** Request #, Category badge, Fabric, Lab, Status, Result (pass/fail/pending), Submitted, Expected Results

**Result indicators:**
- Pass: green checkmark
- Fail: red X
- Conditional Pass: orange warning
- Pending: grey clock

### 4b. Create Test Request — `/testing/new`

**Form fields:**
- Link to Project / Production Order / Sample Request (cascading selects)
- Test Category (select — determines which tests appear)
- Fabric Type + Composition
- Color
- Select Lab Partner (from lab_partners table)
- Buyer Standard (text)
- Select Test Template (optional — auto-fills individual tests)
- Add individual tests manually if needed
- Notes

**On submit:** Create test_request + insert test_results rows (one per test from template), set status to 'draft'.

### 4c. Test Request Detail — `/testing/[id]`

**Header:** Request #, Category, Status, Overall Result badge

**Tabs:**

1. **Results** (default)
   - Table: Test Name | Method | Required | Actual | Unit | Grade | Result
   - Each row: editable "Actual" and "Grade" fields
   - Auto-calculate result: compare actual vs required
   - Color-coded: green rows = pass, red rows = fail
   - "Save Results" button at bottom
   - Overall result auto-calculated: all pass = PASS, any fail = FAIL

2. **Reports**
   - Upload lab report PDF/images
   - Store in Supabase Storage bucket `lab-reports`
   - List of uploaded reports with download links

3. **History**
   - Timeline of status changes, result entries, report uploads

**Status workflow buttons:**
- Draft → "Submit to Lab" → submitted_to_lab
- Submitted → "Mark In Testing" → in_testing
- In Testing → "Enter Results" → (fill results) → results_received
- Results Received → auto-calculate → pass/fail/conditional_pass
- Fail → "Request Retest" → retest_required → (create new request)

### 4d. Lab Partners — `/testing/labs`

**CRUD page for lab partner management:**
- Table: Lab Name, Code, Accreditation, Location, Specializations, Turnaround, Active
- Add/Edit lab in dialog/modal
- Only Super Admin and Brand Manager can add/edit labs

### 4e. Test Templates — `/testing/templates`

**Template management:**
- List of templates by category and buyer standard
- Create/edit template: name, category, buyer standard, list of tests (test_name, method, parameter, required_value, unit)
- Seed default templates on first load using the common tests listed above

---

## 5. FEATURE FLAG

```typescript
// lib/feature-flags.ts
export const FEATURE_FLAGS = {
  TESTING_LAB_ENABLED: process.env.NEXT_PUBLIC_TESTING_LAB_ENABLED !== 'false', // default true
};

// Usage in page:
if (!FEATURE_FLAGS.TESTING_LAB_ENABLED) {
  return <UpgradePrompt module="Testing & Lab" price="$79/month" />;
}
```

Create an `UpgradePrompt` component showing: module name, price, features list, "Contact us" button. Use GOLD accent.

---

## 6. SUPABASE STORAGE

- Bucket: `lab-reports`
- Path: `{test_request_id}/{filename}`
- Allowed: application/pdf, image/jpeg, image/png
- Max size: 20MB

---

## 7. NAVIGATION

Add "Testing" to sidebar:
- Icon: `FlaskConical` or `TestTube` from lucide-react
- Position: after "Sampling"
- Badge: count of pending results (status = 'submitted_to_lab' or 'in_testing')
- Sub-items (collapsible): Requests, Labs, Templates

---

## 8. IMPLEMENTATION ORDER

1. Database — Run SQL for all 5 tables + storage bucket
2. Feature flag setup
3. Types & Zod schemas
4. Server actions
5. Lab partners CRUD page
6. Test templates page + seed defaults
7. Test request list page
8. Create test request form
9. Test detail page with results entry
10. Report upload
11. Nav integration
12. Test: create lab → create template → create test request → enter results → verify pass/fail → upload report

---

## 9. CONSTRAINTS

- Same patterns as Steps 12-13
- Feature flag gating (show upgrade prompt if disabled)
- react-hook-form + Zod, date-fns, Sonner, shadcn/ui
- Mobile responsive
- No fake data
