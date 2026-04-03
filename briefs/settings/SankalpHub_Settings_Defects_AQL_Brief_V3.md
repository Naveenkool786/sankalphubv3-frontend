# SankalpHub — Settings: Defects Library + AQL Table Brief (V3 Frontend)
**For: Claude Code + Sub-Agents**
**Date:** March 28, 2026
**Scope:** Add two new tabs inside Settings — Defects Library + AQL Table
**Mode:** New feature build. Read-only UI. Do NOT touch Inspections, Projects, or any other module.

> ⚠️ **WORKING DIRECTORY: V3 Frontend ONLY**
> All work is exclusively in `/var/www/Master_Sankalphub/V3.0_Frontend/`
> Do NOT touch `/var/www/Master_Sankalphub/Backend/` — V1/V2 Django backend. Out of scope.

---

## PLATFORM CONTEXT

| Item | Detail |
|------|--------|
| **Frontend Framework** | Next.js 15.2.1, React 19.2.4, TypeScript, Tailwind CSS |
| **UI Library** | shadcn/ui (Radix primitives) |
| **Frontend Path** | `/var/www/Master_Sankalphub/V3.0_Frontend/` |
| **Repo** | GitHub: `Naveenkool786/sankalphubv3-frontend` → Vercel auto-deploy on push |
| **Settings structure** | Already restructured — sub-nav at `/settings/*` with layout.tsx |

---

## CURRENT SETTINGS STRUCTURE (Already Built)

From the previous brief, Settings now has:
```
/settings/general        ✅ exists
/settings/templates      ✅ exists
/settings/users          ✅ exists
/settings/permissions    ✅ exists
/settings/billing        ✅ exists
```

This brief adds two more tabs:
```
/settings/defects        🆕 Defects Library
/settings/aql            🆕 AQL Reference Table
```

---

## SOURCE DATA FILES

All data comes from the uploaded QC Intelligence Module files. These files must be copied into the V3 frontend codebase as static data — no external API calls needed.

### Files to copy into the project

Create this folder structure in the V3 frontend:

```
/var/www/Master_Sankalphub/V3.0_Frontend/
└── lib/
    └── qc-data/
        ├── master-defects.json       ← defect library (uploaded)
        ├── all-stages.json           ← 10 process stages (uploaded)
        ├── mens-outerwear.json       ← product data (uploaded)
        ├── womens-outerwear.json     ← product data (uploaded)
        ├── footwear.json             ← product data (uploaded)
        ├── gloves.json               ← product data (uploaded)
        ├── headwear.json             ← product data (uploaded)
        └── accessories.json          ← product data (uploaded)
```

The files are already uploaded and available at:
`/mnt/user-data/uploads/master-defects.json`
`/mnt/user-data/uploads/all-stages.json`
`/mnt/user-data/uploads/mens-outerwear.json`
`/mnt/user-data/uploads/womens-outerwear.json`
`/mnt/user-data/uploads/footwear.json`
`/mnt/user-data/uploads/gloves.json`
`/mnt/user-data/uploads/headwear.json`
`/mnt/user-data/uploads/accessories.json`

Copy them:
```bash
mkdir -p /var/www/Master_Sankalphub/V3.0_Frontend/lib/qc-data
cp /mnt/user-data/uploads/master-defects.json /var/www/Master_Sankalphub/V3.0_Frontend/lib/qc-data/
cp /mnt/user-data/uploads/all-stages.json /var/www/Master_Sankalphub/V3.0_Frontend/lib/qc-data/
cp /mnt/user-data/uploads/mens-outerwear.json /var/www/Master_Sankalphub/V3.0_Frontend/lib/qc-data/
cp /mnt/user-data/uploads/womens-outerwear.json /var/www/Master_Sankalphub/V3.0_Frontend/lib/qc-data/
cp /mnt/user-data/uploads/footwear.json /var/www/Master_Sankalphub/V3.0_Frontend/lib/qc-data/
cp /mnt/user-data/uploads/gloves.json /var/www/Master_Sankalphub/V3.0_Frontend/lib/qc-data/
cp /mnt/user-data/uploads/headwear.json /var/www/Master_Sankalphub/V3.0_Frontend/lib/qc-data/
cp /mnt/user-data/uploads/accessories.json /var/www/Master_Sankalphub/V3.0_Frontend/lib/qc-data/
```

---

## TASK ASSIGNMENT

| Task | Description | Agent | Order |
|------|-------------|-------|-------|
| Task 1 | Create QC data utility functions | Sub-Agent 1 | First |
| Task 2 | Add Defects Library to Settings sub-nav + build page | Sub-Agent 2 | After Task 1 |
| Task 3 | Add AQL Table to Settings sub-nav + build page | Sub-Agent 3 | After Task 1, parallel with Task 2 |

---

## TASK 1 — Create QC Data Utility (TypeScript)

**Agent:** Sub-Agent 1
**File:** `lib/qc-data/index.ts` (new file)

This replaces the Node.js `index.js` from the uploaded module with a TypeScript version safe for Next.js (no `require()` — use `import` instead).

### Create `lib/qc-data/index.ts`:

```typescript
// ─── TYPE DEFINITIONS ─────────────────────────────────────────

export type Severity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'COSMETIC'

export type CategoryId =
  | 'mens_outerwear'
  | 'womens_outerwear'
  | 'footwear'
  | 'gloves'
  | 'headwear'
  | 'accessories'

export interface StageCheck {
  active: boolean
  check: string
  action: string
  tools_required?: string[]
  pass_criteria?: string
}

export interface Defect {
  id: string
  code: string
  name: string
  type: string
  severity: Severity
  applies_to: CategoryId[]
  products_affected?: string[]
  description?: string
  corrective_action?: string
  stage_checks: Record<string, StageCheck>
}

export interface DefectsData {
  defects: Defect[]
}

export interface Product {
  id: string
  style: string
  name: string
  subcategory: string
  collection?: string
  colors: string[]
  description: string
  sizes: string[]
  temp_rating_f?: number | null
  temp_rating_c?: number | null
  specs: Record<string, string>
  key_materials: string[]
  category_id?: CategoryId
}

// ─── DATA IMPORTS ─────────────────────────────────────────────
import defectsData from './master-defects.json'
import stagesData from './all-stages.json'
import mensOuterwear from './mens-outerwear.json'
import womensOuterwear from './womens-outerwear.json'
import footwear from './footwear.json'
import gloves from './gloves.json'
import headwear from './headwear.json'
import accessories from './accessories.json'

const productFiles: Record<CategoryId, { products: Product[] }> = {
  mens_outerwear: mensOuterwear as { products: Product[] },
  womens_outerwear: womensOuterwear as { products: Product[] },
  footwear: footwear as { products: Product[] },
  gloves: gloves as { products: Product[] },
  headwear: headwear as { products: Product[] },
  accessories: accessories as { products: Product[] },
}

const defects = (defectsData as DefectsData).defects

// ─── CATEGORY LABELS ──────────────────────────────────────────
export const CATEGORY_LABELS: Record<CategoryId, string> = {
  mens_outerwear: "Men's Outerwear",
  womens_outerwear: "Women's Outerwear",
  footwear: 'Footwear',
  gloves: 'Gloves',
  headwear: 'Headwear',
  accessories: 'Accessories',
}

export const CATEGORY_IDS = Object.keys(CATEGORY_LABELS) as CategoryId[]

// ─── SEVERITY CONFIG ──────────────────────────────────────────
export const SEVERITY_CONFIG: Record<Severity, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  aql: string
  action: string
}> = {
  CRITICAL: {
    label: 'Critical',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    aql: '0.0 (Zero Tolerance)',
    action: 'HALT — Do not ship',
  },
  MAJOR: {
    label: 'Major',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    aql: 'AQL 2.5',
    action: 'Rework or reject lot',
  },
  MINOR: {
    label: 'Minor',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    aql: 'AQL 4.0',
    action: 'Conditional accept',
  },
  COSMETIC: {
    label: 'Cosmetic',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    aql: 'AQL 4.0',
    action: 'Note on report',
  },
}

// ─── DEFECT FUNCTIONS ─────────────────────────────────────────

export function getAllDefects(): Defect[] {
  return defects
}

export function getDefectsByCategory(categoryId: CategoryId): Defect[] {
  return defects.filter(d => d.applies_to?.includes(categoryId))
}

export function getDefectsBySeverity(severity: Severity): Defect[] {
  return defects.filter(d => d.severity === severity)
}

export function getCriticalDefects(): Defect[] {
  return defects.filter(d => d.severity === 'CRITICAL')
}

export function getDefectById(code: string): Defect | null {
  return defects.find(d => d.code === code) || null
}

export function getDefectChecksByStage(stageKey: string): Array<{
  defect_id: string
  code: string
  name: string
  type: string
  severity: Severity
  category: CategoryId[]
  stage_check: StageCheck
}> {
  return defects
    .filter(d => d.stage_checks?.[stageKey]?.active)
    .map(d => ({
      defect_id: d.id,
      code: d.code,
      name: d.name,
      type: d.type,
      severity: d.severity,
      category: d.applies_to,
      stage_check: d.stage_checks[stageKey],
    }))
}

// ─── PRODUCT FUNCTIONS ────────────────────────────────────────

export function getAllProducts(): (Product & { category_id: CategoryId })[] {
  const all: (Product & { category_id: CategoryId })[] = []
  for (const [categoryId, file] of Object.entries(productFiles)) {
    file.products.forEach(p =>
      all.push({ ...p, category_id: categoryId as CategoryId })
    )
  }
  return all
}

export function getProductsByCategory(categoryId: CategoryId): Product[] {
  return productFiles[categoryId]?.products ?? []
}
```

**Add to `tsconfig.json`** — ensure JSON imports work:
```json
{
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
```

### Acceptance Criteria — Task 1
- [ ] `lib/qc-data/index.ts` exists with all functions exported
- [ ] All 8 JSON files copied to `lib/qc-data/`
- [ ] `resolveJsonModule: true` in tsconfig
- [ ] No TypeScript errors on the utility file
- [ ] `getAllDefects()` returns all defects without error

---

## TASK 2 — Defects Library Page

**Agent:** Sub-Agent 2
**Files:**
- Update `app/(dashboard)/settings/layout.tsx` — add Defects Library to sub-nav
- Create `app/(dashboard)/settings/defects/page.tsx`

---

### Step 1 — Add to Settings sub-nav

Open `app/(dashboard)/settings/layout.tsx`.

Add this item to the `settingsNav` array, after Permissions and before Billing:

```typescript
{
  label: 'Defects Library',
  href: '/settings/defects',
  icon: AlertTriangle,         // import from lucide-react
  description: 'Master defect database by category and severity'
},
```

Also add AQL Table (for Task 3):
```typescript
{
  label: 'AQL Table',
  href: '/settings/aql',
  icon: Table2,                // import from lucide-react
  description: 'ANSI/ASQ Z1.4 sampling reference table'
},
```

Updated Settings sub-nav order:
```
General
Templates
Users & Roles
Permissions
Defects Library    ← NEW
AQL Table          ← NEW
Billing
```

---

### Step 2 — Build the Defects Library page

Create `app/(dashboard)/settings/defects/page.tsx`:

#### Page overview
The Defects Library is a **searchable, filterable reference database** of all defects from `master-defects.json`. It is read-only — no create/edit/delete.

#### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Defects Library                          [Export CSV button] │
│ Master defect database — 6 categories · 4 severity levels   │
├───────────────────────┬──────────────┬──────────────────────┤
│ [Search defects...]   │ [Category ▾] │ [Severity ▾]         │
├───────────────────────┴──────────────┴──────────────────────┤
│ Summary stats: Total | Critical | Major | Minor              │
├─────────────────────────────────────────────────────────────┤
│ [Critical section]                                           │
│  ┌─ DEF card ──────────────────────────────────────────┐   │
│  │ 🔴 CRITICAL  CON-001                   Stitching    │   │
│  │ Seam Breakage / Open Seam                           │   │
│  │ Applies to: Mens Outerwear · Womens Outerwear       │   │
│  │ Action: HALT PRODUCTION                             │   │
│  └─────────────────────────────────────────────────────┘   │
│ [Major section]                                              │
│ [Minor section]                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Full page implementation:

```tsx
'use client'

import { useState, useMemo } from 'react'
import {
  getAllDefects,
  getDefectsByCategory,
  CATEGORY_LABELS,
  CATEGORY_IDS,
  SEVERITY_CONFIG,
  type Defect,
  type CategoryId,
  type Severity,
} from '@/lib/qc-data'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

const SEVERITIES: Severity[] = ['CRITICAL', 'MAJOR', 'MINOR', 'COSMETIC']

const severityIcon = {
  CRITICAL: <AlertTriangle className="w-4 h-4 text-red-600" />,
  MAJOR: <AlertCircle className="w-4 h-4 text-orange-500" />,
  MINOR: <AlertCircle className="w-4 h-4 text-amber-500" />,
  COSMETIC: <Info className="w-4 h-4 text-gray-400" />,
}

function DefectCard({ defect }: { defect: Defect }) {
  const [expanded, setExpanded] = useState(false)
  const config = SEVERITY_CONFIG[defect.severity]

  return (
    <div className={`rounded-lg border p-4 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-0.5 shrink-0">{severityIcon[defect.severity]}</div>
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge
                className={`text-xs border ${config.bgColor} ${config.color} ${config.borderColor}`}
              >
                {config.label}
              </Badge>
              <span className="text-xs font-mono text-gray-500">{defect.code}</span>
              {defect.type && (
                <span className="text-xs text-gray-400">· {defect.type}</span>
              )}
            </div>

            {/* Defect name */}
            <p className={`font-semibold text-sm ${config.color}`}>{defect.name}</p>

            {/* Applies to */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {defect.applies_to?.map(cat => (
                <span
                  key={cat}
                  className="text-xs bg-white/60 border border-gray-200 rounded px-1.5 py-0.5 text-gray-600"
                >
                  {CATEGORY_LABELS[cat]}
                </span>
              ))}
            </div>

            {/* Action */}
            <p className="text-xs text-gray-600 mt-1.5">
              <span className="font-medium">Action:</span> {defect.corrective_action || config.action}
            </p>

            {/* Expanded detail */}
            {expanded && (
              <div className="mt-3 pt-3 border-t border-white/50 space-y-2">
                {defect.description && (
                  <p className="text-xs text-gray-600">{defect.description}</p>
                )}
                {/* Stage checks */}
                {defect.stage_checks && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Active at stages:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(defect.stage_checks)
                        .filter(([, check]) => check.active)
                        .map(([stage]) => (
                          <span
                            key={stage}
                            className="text-xs bg-white/70 border border-gray-200 rounded px-1.5 py-0.5 text-gray-700 font-mono"
                          >
                            {stage.replace(/_/g, ' ')}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-gray-600 shrink-0 mt-1"
        >
          {expanded
            ? <ChevronUp className="w-4 h-4" />
            : <ChevronDown className="w-4 h-4" />
          }
        </button>
      </div>
    </div>
  )
}

export default function DefectsLibraryPage() {
  const allDefects = useMemo(() => getAllDefects(), [])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')

  // Filter logic
  const filtered = useMemo(() => {
    return allDefects.filter(d => {
      const matchesSearch =
        !search ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.code.toLowerCase().includes(search.toLowerCase()) ||
        d.type?.toLowerCase().includes(search.toLowerCase())

      const matchesCategory =
        categoryFilter === 'all' ||
        d.applies_to?.includes(categoryFilter as CategoryId)

      const matchesSeverity =
        severityFilter === 'all' || d.severity === severityFilter

      return matchesSearch && matchesCategory && matchesSeverity
    })
  }, [allDefects, search, categoryFilter, severityFilter])

  // Stats
  const stats = useMemo(() => ({
    total: filtered.length,
    critical: filtered.filter(d => d.severity === 'CRITICAL').length,
    major: filtered.filter(d => d.severity === 'MAJOR').length,
    minor: filtered.filter(d => d.severity === 'MINOR').length,
  }), [filtered])

  // Group by severity
  const grouped = useMemo(() => {
    const result: Record<Severity, Defect[]> = {
      CRITICAL: [], MAJOR: [], MINOR: [], COSMETIC: []
    }
    filtered.forEach(d => result[d.severity]?.push(d))
    return result
  }, [filtered])

  // CSV export
  const handleExport = () => {
    const rows = [
      ['Code', 'Name', 'Severity', 'Type', 'Applies To', 'Action'],
      ...filtered.map(d => [
        d.code,
        d.name,
        d.severity,
        d.type || '',
        d.applies_to?.map(c => CATEGORY_LABELS[c]).join(' | ') || '',
        d.corrective_action || SEVERITY_CONFIG[d.severity].action,
      ])
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sankalphub-defects-library.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Defects Library</h2>
          <p className="text-sm text-gray-500 mt-1">
            Master defect database — {allDefects.length} defects across 6 categories and 4 severity levels
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 shrink-0">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, code, or type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORY_IDS.map(id => (
              <SelectItem key={id} value={id}>{CATEGORY_LABELS[id]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="All Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            {SEVERITIES.map(s => (
              <SelectItem key={s} value={s}>{SEVERITY_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-700', bg: 'bg-gray-50' },
          { label: 'Critical', value: stats.critical, color: 'text-red-700', bg: 'bg-red-50' },
          { label: 'Major', value: stats.major, color: 'text-orange-700', bg: 'bg-orange-50' },
          { label: 'Minor', value: stats.minor, color: 'text-amber-700', bg: 'bg-amber-50' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-lg p-3 ${stat.bg} border`}>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Defect groups */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No defects match your search</p>
        </div>
      ) : (
        <div className="space-y-6">
          {SEVERITIES.map(severity => {
            const group = grouped[severity]
            if (!group?.length) return null
            const config = SEVERITY_CONFIG[severity]
            return (
              <div key={severity}>
                <div className="flex items-center gap-2 mb-3">
                  {severityIcon[severity]}
                  <h3 className={`text-sm font-semibold ${config.color}`}>
                    {config.label} ({group.length})
                  </h3>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="space-y-2">
                  {group.map(defect => (
                    <DefectCard key={defect.id} defect={defect} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

### Acceptance Criteria — Task 2
- [ ] "Defects Library" appears in Settings sub-nav
- [ ] `/settings/defects` loads without error
- [ ] All defects from `master-defects.json` render correctly
- [ ] Search by name, code, and type works
- [ ] Filter by category works
- [ ] Filter by severity works
- [ ] Stats bar shows correct counts (updates with filters)
- [ ] Defects grouped by severity: Critical → Major → Minor
- [ ] Each card shows: severity badge, code, name, applies_to categories, action
- [ ] Expand/collapse shows stage checks
- [ ] Export CSV downloads a valid CSV file
- [ ] Empty state shows when no results match

---

## TASK 3 — AQL Reference Table Page

**Agent:** Sub-Agent 3
**File:** `app/(dashboard)/settings/aql/page.tsx` (new file)

This is a **read-only interactive reference table** based on ANSI/ASQ Z1.4. No database needed — all data is hardcoded from `aql-engine-advanced.md`.

---

### AQL data constants (define at top of file)

```typescript
// Lot Size → Code Letter table (Level I / II / III)
const LOT_SIZE_TABLE = [
  { range: '2 – 8',              l1: 'A', l2: 'A', l3: 'B' },
  { range: '9 – 15',             l1: 'A', l2: 'B', l3: 'C' },
  { range: '16 – 25',            l1: 'B', l2: 'C', l3: 'D' },
  { range: '26 – 50',            l1: 'C', l2: 'D', l3: 'E' },
  { range: '51 – 90',            l1: 'C', l2: 'E', l3: 'F' },
  { range: '91 – 150',           l1: 'D', l2: 'F', l3: 'G' },
  { range: '151 – 280',          l1: 'E', l2: 'G', l3: 'H' },
  { range: '281 – 500',          l1: 'F', l2: 'H', l3: 'J' },
  { range: '501 – 1,200',        l1: 'G', l2: 'J', l3: 'K' },
  { range: '1,201 – 3,200',      l1: 'H', l2: 'K', l3: 'L' },
  { range: '3,201 – 10,000',     l1: 'J', l2: 'L', l3: 'M' },
  { range: '10,001 – 35,000',    l1: 'K', l2: 'M', l3: 'N' },
  { range: '35,001 – 150,000',   l1: 'L', l2: 'N', l3: 'P' },
  { range: '150,001 – 500,000',  l1: 'M', l2: 'P', l3: 'Q' },
  { range: '500,001+',           l1: 'N', l2: 'Q', l3: 'R' },
]

// Code Letter → Sample Size
const CODE_SAMPLE_TABLE = [
  { code: 'A', sample: 2 },   { code: 'J', sample: 80 },
  { code: 'B', sample: 3 },   { code: 'K', sample: 125 },
  { code: 'C', sample: 5 },   { code: 'L', sample: 200 },
  { code: 'D', sample: 8 },   { code: 'M', sample: 315 },
  { code: 'E', sample: 13 },  { code: 'N', sample: 500 },
  { code: 'F', sample: 20 },  { code: 'P', sample: 800 },
  { code: 'G', sample: 32 },  { code: 'Q', sample: 1250 },
  { code: 'H', sample: 50 },  { code: 'R', sample: 2000 },
]

// Acceptance Limits (ANSI/ASQ Z1.4) — Ac/Re per AQL level per sample size
// null = use arrow rule (↑)
const ACCEPTANCE_TABLE = [
  { sample: 2,    aql10: null,    aql25: null,    aql40: null    },
  { sample: 3,    aql10: null,    aql25: null,    aql40: [0,1]   },
  { sample: 5,    aql10: [0,1],   aql25: null,    aql40: [0,1]   },
  { sample: 8,    aql10: [0,1],   aql25: [0,1],   aql40: [1,2]   },
  { sample: 13,   aql10: [0,1],   aql25: [1,2],   aql40: [1,2]   },
  { sample: 20,   aql10: [0,1],   aql25: [1,2],   aql40: [2,3]   },
  { sample: 32,   aql10: [1,2],   aql25: [2,3],   aql40: [3,4]   },
  { sample: 50,   aql10: [1,2],   aql25: [3,4],   aql40: [5,6]   },
  { sample: 80,   aql10: [2,3],   aql25: [5,6],   aql40: [7,8]   },
  { sample: 125,  aql10: [3,4],   aql25: [7,8],   aql40: [10,11] },
  { sample: 200,  aql10: [5,6],   aql25: [10,11], aql40: [14,15] },
  { sample: 315,  aql10: [7,8],   aql25: [14,15], aql40: [21,22] },
  { sample: 500,  aql10: [10,11], aql25: [21,22], aql40: null    },
  { sample: 800,  aql10: [14,15], aql25: [21,22], aql40: null    },
  { sample: 1250, aql10: [21,22], aql25: [21,22], aql40: null    },
  { sample: 2000, aql10: [21,22], aql25: null,    aql40: null    },
]

// Common apparel scenarios
const COMMON_SCENARIOS = [
  { lot: '350',    level: 'II', code: 'H',  sample: 50,  major: '3/4',  minor: '5/6'  },
  { lot: '800',    level: 'II', code: 'J',  sample: 80,  major: '5/6',  minor: '7/8'  },
  { lot: '1,500',  level: 'II', code: 'K',  sample: 125, major: '7/8',  minor: '10/11'},
  { lot: '5,000',  level: 'II', code: 'L',  sample: 200, major: '10/11',minor: '14/15'},
  { lot: '15,000', level: 'II', code: 'M',  sample: 315, major: '14/15',minor: '21/22'},
  { lot: '800',    level: 'III',code: 'K',  sample: 125, major: '7/8',  minor: '10/11'},
]
```

---

### Build the AQL page

```tsx
'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertTriangle, Calculator, BookOpen } from 'lucide-react'

// ... (paste data constants from above here)

export default function AQLTablePage() {
  // AQL Calculator state
  const [lotSize, setLotSize] = useState('')
  const [inspLevel, setInspLevel] = useState<'1' | '2' | '3'>('2')
  const [calcResult, setCalcResult] = useState<{
    code: string
    sample: number
    major: { ac: number; re: number }
    minor: { ac: number; re: number }
  } | null>(null)

  const calculate = () => {
    const lot = parseInt(lotSize.replace(/,/g, ''), 10)
    if (!lot || lot < 2) return

    // Find lot size row
    const ranges = [
      [2,8],[9,15],[16,25],[26,50],[51,90],[91,150],
      [151,280],[281,500],[501,1200],[1201,3200],
      [3201,10000],[10001,35000],[35001,150000],
      [150001,500000],[500001,999999999]
    ]
    const lotIdx = ranges.findIndex(([min, max]) => lot >= min && lot <= max)
    if (lotIdx < 0) return

    const row = LOT_SIZE_TABLE[lotIdx]
    const code = inspLevel === '1' ? row.l1 : inspLevel === '3' ? row.l3 : row.l2
    const sampleRow = CODE_SAMPLE_TABLE.find(r => r.code === code)
    if (!sampleRow) return

    const limitsRow = ACCEPTANCE_TABLE.find(r => r.sample === sampleRow.sample)
    if (!limitsRow) return

    setCalcResult({
      code,
      sample: sampleRow.sample,
      major: limitsRow.aql25
        ? { ac: limitsRow.aql25[0], re: limitsRow.aql25[1] }
        : { ac: -1, re: -1 }, // arrow rule
      minor: limitsRow.aql40
        ? { ac: limitsRow.aql40[0], re: limitsRow.aql40[1] }
        : { ac: -1, re: -1 },
    })
  }

  const formatCell = (val: [number, number] | null) => {
    if (!val) return <span className="text-gray-300 text-xs">↑</span>
    return <span>{val[0]} / {val[1]}</span>
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">AQL Reference Table</h2>
        <p className="text-sm text-gray-500 mt-1">
          ANSI / ASQ Z1.4 — Sampling Procedures and Tables for Inspection by Attributes
        </p>
      </div>

      {/* Severity legend */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Critical', aql: 'Zero Tolerance (0.0)', action: 'HALT — Do not ship', color: 'bg-red-50 border-red-200 text-red-700' },
          { label: 'Major', aql: 'AQL 2.5', action: 'Rework or reject lot', color: 'bg-orange-50 border-orange-200 text-orange-700' },
          { label: 'Minor', aql: 'AQL 4.0', action: 'Conditional accept', color: 'bg-amber-50 border-amber-200 text-amber-700' },
        ].map(item => (
          <div key={item.label} className={`rounded-lg border p-3 ${item.color}`}>
            <p className="font-semibold text-sm">{item.label}</p>
            <p className="text-xs mt-0.5 font-mono">{item.aql}</p>
            <p className="text-xs mt-1 opacity-80">{item.action}</p>
          </div>
        ))}
      </div>

      {/* ── AQL Calculator ── */}
      <div className="rounded-xl border bg-white p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-sm text-gray-800">AQL Calculator</h3>
          <span className="text-xs text-gray-400">Enter lot size to get sample size and accept/reject limits</span>
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">Lot Size</Label>
            <Input
              placeholder="e.g. 1500"
              value={lotSize}
              onChange={e => setLotSize(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && calculate()}
              className="w-36 h-9"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">Inspection Level</Label>
            <Select value={inspLevel} onValueChange={v => setInspLevel(v as '1'|'2'|'3')}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Level I — Reduced</SelectItem>
                <SelectItem value="2">Level II — Normal ★</SelectItem>
                <SelectItem value="3">Level III — Tightened</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button
            onClick={calculate}
            className="h-9 px-4 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            Calculate
          </button>
        </div>

        {/* Result */}
        {calcResult && (
          <div className="mt-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Code Letter</p>
                <p className="text-2xl font-bold text-gray-900">{calcResult.code}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Sample Size</p>
                <p className="text-2xl font-bold text-gray-900">{calcResult.sample}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Major (AQL 2.5)</p>
                <p className="text-xl font-bold text-orange-700">
                  {calcResult.major.ac >= 0
                    ? `${calcResult.major.ac} / ${calcResult.major.re}`
                    : '↑ see table'
                  }
                </p>
                <p className="text-xs text-gray-400">Accept / Reject</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Minor (AQL 4.0)</p>
                <p className="text-xl font-bold text-amber-700">
                  {calcResult.minor.ac >= 0
                    ? `${calcResult.minor.ac} / ${calcResult.minor.re}`
                    : '↑ see table'
                  }
                </p>
                <p className="text-xs text-gray-400">Accept / Reject</p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2 text-xs text-red-700 bg-red-50 rounded p-2 border border-red-100">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>Critical defects = Zero Tolerance. Any critical defect found = automatic FAIL. HALT inspection immediately.</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Common Scenarios ── */}
      <div className="rounded-xl border bg-white overflow-hidden mb-6">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Common Apparel Inspection Scenarios</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Lot Size</th>
                <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Level</th>
                <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Code</th>
                <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Sample</th>
                <th className="text-left px-4 py-2.5 text-xs text-orange-600 font-medium">Major (2.5) Ac/Re</th>
                <th className="text-left px-4 py-2.5 text-xs text-amber-600 font-medium">Minor (4.0) Ac/Re</th>
                <th className="text-left px-4 py-2.5 text-xs text-red-600 font-medium">Critical</th>
              </tr>
            </thead>
            <tbody>
              {COMMON_SCENARIOS.map((row, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium">{row.lot}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className="text-xs">
                      Level {row.level}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-gray-700">{row.code}</td>
                  <td className="px-4 py-2.5 font-semibold">{row.sample}</td>
                  <td className="px-4 py-2.5 text-orange-700 font-medium">{row.major}</td>
                  <td className="px-4 py-2.5 text-amber-700 font-medium">{row.minor}</td>
                  <td className="px-4 py-2.5 text-red-700 font-medium">0 / 1</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Full Acceptance Limits Table ── */}
      <div className="rounded-xl border bg-white overflow-hidden mb-6">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-800">Full Acceptance Limits Table</h3>
          <p className="text-xs text-gray-500 mt-0.5">Ac = Accept if defects ≤ · Re = Reject if defects ≥ · ↑ = Use arrow rule</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Sample Size</th>
                <th className="text-center px-4 py-2.5 text-xs text-gray-600 font-medium">AQL 1.0 (Ac/Re)</th>
                <th className="text-center px-4 py-2.5 text-xs text-orange-600 font-medium">AQL 2.5 — Major (Ac/Re)</th>
                <th className="text-center px-4 py-2.5 text-xs text-amber-600 font-medium">AQL 4.0 — Minor (Ac/Re)</th>
              </tr>
            </thead>
            <tbody>
              {ACCEPTANCE_TABLE.map((row, i) => {
                // Highlight common apparel range (sample 50–315)
                const isCommon = row.sample >= 50 && row.sample <= 315
                return (
                  <tr
                    key={i}
                    className={`border-b last:border-0 ${isCommon ? 'bg-amber-50/30' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-4 py-2.5 font-semibold">
                      {row.sample}
                      {isCommon && (
                        <span className="ml-2 text-xs text-amber-600 font-normal">common</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono text-sm">
                      {formatCell(row.aql10 as [number,number] | null)}
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono text-sm text-orange-700">
                      {formatCell(row.aql25 as [number,number] | null)}
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono text-sm text-amber-700">
                      {formatCell(row.aql40 as [number,number] | null)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Lot Size → Code Letter Table ── */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-800">Lot Size → Code Letter</h3>
          <p className="text-xs text-gray-500 mt-0.5">Level II is the default for all standard inspections</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Lot Size Range</th>
                <th className="text-center px-4 py-2.5 text-xs text-gray-500 font-medium">Level I</th>
                <th className="text-center px-4 py-2.5 text-xs text-amber-700 font-medium">Level II ★</th>
                <th className="text-center px-4 py-2.5 text-xs text-gray-500 font-medium">Level III</th>
              </tr>
            </thead>
            <tbody>
              {LOT_SIZE_TABLE.map((row, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800">{row.range}</td>
                  <td className="px-4 py-2.5 text-center font-mono text-gray-500">{row.l1}</td>
                  <td className="px-4 py-2.5 text-center font-mono font-bold text-amber-700">{row.l2}</td>
                  <td className="px-4 py-2.5 text-center font-mono text-gray-500">{row.l3}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Standard note */}
      <p className="text-xs text-gray-400 mt-4">
        Standard: ANSI / ASQ Z1.4 — Sampling Procedures and Tables for Inspection by Attributes.
        Default: Level II Normal inspection. Switch to Level III after 2 consecutive FAIL results.
      </p>
    </div>
  )
}
```

### Acceptance Criteria — Task 3
- [ ] "AQL Table" appears in Settings sub-nav
- [ ] `/settings/aql` loads without error
- [ ] Severity legend shows Critical / Major / Minor with correct colors and AQL levels
- [ ] AQL Calculator: enter lot size + level → shows code, sample size, Major Ac/Re, Minor Ac/Re
- [ ] Calculator works for Enter key press
- [ ] Critical zero-tolerance warning always visible in calculator result
- [ ] Common Scenarios table renders all 6 rows correctly
- [ ] Full Acceptance Limits table renders all 16 rows
- [ ] Common apparel range (sample 50–315) highlighted in amber
- [ ] Lot Size → Code Letter table renders all 15 rows
- [ ] Level II column bold/highlighted as default
- [ ] Arrow rule (↑) shown as gray arrow, not as numbers
- [ ] Tables are horizontally scrollable on mobile

---

## BUILD & DEPLOY

```bash
# 1. Run build check
cd /var/www/Master_Sankalphub/V3.0_Frontend
npm run build

# 2. If build passes — commit and push
git add -A
git commit -m "feat: settings — defects library + AQL reference table"
git push origin main

# 3. Vercel auto-deploys on push
```

**Do not push if `npm run build` fails.**

---

## GENERAL RULES FOR ALL AGENTS

1. **Read every file fully before editing.**
2. **Do not touch** Inspections, Projects, Factories, Analytics, or any other module.
3. **Do not touch** `/var/www/Master_Sankalphub/Backend/`.
4. **Use shadcn/ui components** already installed — no new libraries.
5. **Match the existing Settings page style** — same padding, same card borders, same font sizes.
6. **Build must pass** before pushing.

---

## FINAL VERIFICATION CHECKLIST

**Settings sub-nav:**
- [ ] "Defects Library" link visible in Settings sub-nav
- [ ] "AQL Table" link visible in Settings sub-nav
- [ ] Both highlight correctly when active

**Defects Library (`/settings/defects`):**
- [ ] All defects load and render
- [ ] Search works across name, code, type
- [ ] Category filter works
- [ ] Severity filter works
- [ ] Stats bar updates with filters
- [ ] Cards expandable to show stage checks
- [ ] Export CSV works and downloads valid file

**AQL Table (`/settings/aql`):**
- [ ] Calculator produces correct results for known inputs:
  - Lot 800, Level II → Code J, Sample 80, Major 5/6, Minor 7/8
  - Lot 1500, Level II → Code K, Sample 125, Major 7/8, Minor 10/11
  - Lot 5000, Level II → Code L, Sample 200, Major 10/11, Minor 14/15
- [ ] All 3 reference tables render correctly
- [ ] Common range highlighted in acceptance limits table
- [ ] Arrow rule (↑) renders correctly
- [ ] No errors in console

**Build:**
- [ ] `npm run build` — zero errors
- [ ] `resolveJsonModule: true` in tsconfig

---

*SankalpHub V3 Frontend — Settings: Defects Library + AQL Table*
*Source: QC Intelligence Module v1.0 / AQL Engine v2.0 (ANSI/ASQ Z1.4)*
*March 28, 2026*
