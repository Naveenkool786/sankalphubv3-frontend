# SankalpHub — Sidebar Restructure + Permissions System Brief (V3 Frontend)
**For: Claude Code + Sub-Agents**
**Date:** March 28, 2026
**Scope:** Step 1 — Move Templates + Users & Roles into Settings. Step 2 — Add Permissions page with role matrix.
**Mode:** Restructure + New Feature. Do NOT touch any other module logic, data, or styling.

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
| **Frontend Path** | `/var/www/Master_Sankalphub/V3.0_Frontend/` |
| **Repo** | GitHub: `Naveenkool786/sankalphubv3-frontend` → Vercel auto-deploy on push |

---

## CURRENT STATE (Confirmed via screenshots — March 28, 2026)

### Current Sidebar
```
Dashboard
Projects
Inspections
Factories
Analytics
Templates        ← needs to move into Settings
Users & Roles    ← needs to move into Settings
Settings
```

### Target Sidebar (After This Brief)
```
Dashboard
Projects
Inspections
Factories
Analytics
Settings         ← now expands into sub-sections
```

### Target Settings Page Structure
```
Settings
├── General          (already exists or needs to exist)
├── Templates        (moved from sidebar)
├── Users & Roles    (moved from sidebar)
├── Permissions      (new — role permission matrix)
└── Billing          (existing PremiumHub section)
```

---

## TASK ASSIGNMENT

| Task | Description | Agent | Order |
|------|-------------|-------|-------|
| Task 1 | Remove Templates + Users & Roles from sidebar | Sub-Agent 1 | First |
| Task 2 | Add Settings sub-navigation with all sections | Sub-Agent 1 | After Task 1 |
| Task 3 | Build Permissions page with role matrix | Sub-Agent 2 | Parallel with Task 1+2 |

---

## TASK 1 — Remove Templates + Users & Roles from Main Sidebar

**Agent:** Sub-Agent 1
**Files:** Sidebar/navigation component

### Step 1 — Locate the sidebar component

```bash
find /var/www/Master_Sankalphub/V3.0_Frontend -type f -name "*.tsx" | xargs grep -l "Templates\|Users & Roles\|sidebar\|Sidebar\|nav\|Nav" | grep -v node_modules | grep -v .next
```

The sidebar is likely in one of:
- `components/Sidebar.tsx`
- `components/layout/Sidebar.tsx`
- `app/(dashboard)/layout.tsx`
- `components/nav/AppNav.tsx`

Read the full file before editing.

### Step 2 — Identify the nav items array

The sidebar nav items will look something like this:

```typescript
const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Inspections', href: '/inspections', icon: ClipboardCheck },
  { label: 'Factories', href: '/factories', icon: Building2 },
  { label: 'Analytics', href: '/analytics', icon: BarChart2 },
  { label: 'Templates', href: '/templates', icon: FileText },       // ← REMOVE
  { label: 'Users & Roles', href: '/users', icon: Users },          // ← REMOVE
  { label: 'Settings', href: '/settings', icon: Settings },
]
```

### Step 3 — Remove Templates and Users & Roles from the array

Remove only these two items:
- `{ label: 'Templates', href: '/templates', ... }`
- `{ label: 'Users & Roles', href: '/users', ... }`

Do NOT remove Dashboard, Projects, Inspections, Factories, Analytics, or Settings.

### Step 4 — Do NOT delete the pages

The actual page files (`app/templates/page.tsx`, `app/users/page.tsx`) must NOT be deleted. They will be linked from within Settings instead. Only the sidebar nav link is removed.

### Acceptance Criteria — Task 1
- [ ] Sidebar shows exactly 6 items: Dashboard, Projects, Inspections, Factories, Analytics, Settings
- [ ] Templates and Users & Roles links are gone from the sidebar
- [ ] The actual `/templates` and `/users` page files still exist and are not deleted
- [ ] All remaining sidebar links still navigate correctly
- [ ] No visual styling was changed

---

## TASK 2 — Build Settings Sub-Navigation with All Sections

**Agent:** Sub-Agent 1 (run after Task 1)
**Files:** Settings page — `app/(dashboard)/settings/page.tsx` or equivalent

### What to Build

Settings becomes a multi-section page with a left sub-nav and a right content area. This is a standard pattern — similar to how Notion, Linear, and Vercel structure their settings.

### Step 1 — Locate the current Settings page

```bash
find /var/www/Master_Sankalphub/V3.0_Frontend -type f -name "*.tsx" | grep -i setting | grep -v node_modules | grep -v .next
```

Read the full file. Understand what already exists in Settings before adding anything.

### Step 2 — Build the Settings layout

The Settings page should have a two-column layout:

```
┌─────────────────────────────────────────────────────┐
│  Settings                                            │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│  General     │   [Content of selected section]      │
│  Templates   │                                      │
│  Users &     │                                      │
│  Roles       │                                      │
│  Permissions │                                      │
│  Billing     │                                      │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

Implement using URL-based tab routing — each section gets its own URL:
- `/settings` or `/settings/general` → General
- `/settings/templates` → Templates
- `/settings/users` → Users & Roles
- `/settings/permissions` → Permissions
- `/settings/billing` → Billing

Use Next.js nested routing: create `app/(dashboard)/settings/` as a layout with sub-pages.

### Step 3 — Settings layout file

Create `app/(dashboard)/settings/layout.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Settings, FileText, Users, ShieldCheck, CreditCard, Building2
} from 'lucide-react'
import { cn } from '@/lib/utils'

const settingsNav = [
  {
    label: 'General',
    href: '/settings/general',
    icon: Settings,
    description: 'Organisation profile and preferences'
  },
  {
    label: 'Templates',
    href: '/settings/templates',
    icon: FileText,
    description: 'Inspection, report and workflow templates'
  },
  {
    label: 'Users & Roles',
    href: '/settings/users',
    icon: Users,
    description: 'Team members and invitations'
  },
  {
    label: 'Permissions',
    href: '/settings/permissions',
    icon: ShieldCheck,
    description: 'Role-based access control'
  },
  {
    label: 'Billing',
    href: '/settings/billing',
    icon: CreditCard,
    description: 'Plan, seats and usage'
  },
]

export default function SettingsLayout({
  children
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your organisation, team, and platform configuration
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-8">

        {/* Left sub-nav */}
        <nav className="w-56 shrink-0">
          <ul className="space-y-1">
            {settingsNav.map((item) => {
              const isActive = pathname === item.href ||
                (item.href === '/settings/general' && pathname === '/settings')
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                      isActive
                        ? 'bg-amber-50 text-amber-800 font-medium'  // use existing brand color
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <item.icon className={cn(
                      'w-4 h-4 shrink-0',
                      isActive ? 'text-amber-700' : 'text-gray-400'
                    )} />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Right content area */}
        <div className="flex-1 min-w-0">
          {children}
        </div>

      </div>
    </div>
  )
}
```

> ⚠️ **Color note:** The active state uses `amber-50 / amber-800 / amber-700` to match SankalpHub's existing brand color (the golden/amber used on buttons throughout the platform). If the codebase uses a different color variable, match that instead.

### Step 4 — Redirect /settings to /settings/general

Create or update `app/(dashboard)/settings/page.tsx`:

```tsx
import { redirect } from 'next/navigation'

export default function SettingsPage() {
  redirect('/settings/general')
}
```

### Step 5 — Move existing Settings content to /settings/general

Whatever currently exists on the Settings page — move it to:
`app/(dashboard)/settings/general/page.tsx`

If Settings is currently empty or minimal, create a simple placeholder:

```tsx
export default function GeneralSettingsPage() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">General</h2>
      <p className="text-sm text-gray-500 mb-6">
        Organisation profile and preferences
      </p>
      {/* Existing settings content goes here */}
    </div>
  )
}
```

### Step 6 — Create /settings/templates route

Create `app/(dashboard)/settings/templates/page.tsx`:

```tsx
// Import and re-export the existing Templates page content
// Do NOT duplicate the logic — import the component from its existing location

export { default } from '@/app/(dashboard)/templates/page'
// OR if the above doesn't work due to route conflicts, copy the page content here
// and update all internal links/refs accordingly
```

> **Important:** Check if the existing templates page uses `usePathname()` or any route-specific logic. If it does, update those references to use `/settings/templates` instead of `/templates`.

### Step 7 — Create /settings/users route

Create `app/(dashboard)/settings/users/page.tsx`:

```tsx
// Same pattern as templates — re-use existing Users page
export { default } from '@/app/(dashboard)/users/page'
```

### Step 8 — Create /settings/billing route

Create `app/(dashboard)/settings/billing/page.tsx`:

```tsx
export default function BillingSettingsPage() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Billing</h2>
      <p className="text-sm text-gray-500 mb-6">
        Manage your plan, seats, and usage
      </p>
      {/* Link to existing PremiumHub or billing page if it exists */}
      <p className="text-sm text-gray-500">
        You are currently on the <strong>Founding Member</strong> plan.
      </p>
    </div>
  )
}
```

### Step 9 — Update all internal links

Search for any internal links to `/templates` and `/users` throughout the codebase and update them:

```bash
# Find all references to /templates and /users
grep -r '"/templates"' /var/www/Master_Sankalphub/V3.0_Frontend/app --include="*.tsx" | grep -v node_modules | grep -v .next
grep -r '"/users"' /var/www/Master_Sankalphub/V3.0_Frontend/app --include="*.tsx" | grep -v node_modules | grep -v .next
```

Update each found reference:
- `"/templates"` → `"/settings/templates"`
- `"/users"` → `"/settings/users"`

This includes any links in the Dashboard, breadcrumbs, or anywhere else.

### Acceptance Criteria — Task 2
- [ ] `/settings` redirects to `/settings/general`
- [ ] Settings page shows two-column layout: left sub-nav + right content
- [ ] Sub-nav has 5 items: General, Templates, Users & Roles, Permissions, Billing
- [ ] Active sub-nav item is highlighted with brand color
- [ ] `/settings/templates` renders the Templates page content correctly
- [ ] `/settings/users` renders the Users & Roles page content correctly
- [ ] `/settings/billing` renders billing placeholder
- [ ] All internal links to `/templates` and `/users` updated to new paths
- [ ] Old `/templates` and `/users` routes still work (redirect to new paths) — optional but good practice

---

## TASK 3 — Build Permissions Page (Role Permission Matrix)

**Agent:** Sub-Agent 2
**File:** `app/(dashboard)/settings/permissions/page.tsx` (new file)

### What to Build

A visual permission matrix showing exactly what each role can and cannot do. This existed in V1/V2 and is being restored in V3.

The page has two parts:
1. **Permission Matrix Table** — a read-only visual grid showing all permissions per role
2. **Role Descriptions** — a card for each role explaining what it is

---

### Step 1 — Define the permissions data

Create this as a constant in the file (or in a separate `lib/permissions.ts`):

```typescript
export type Role = 'super_admin' | 'brand_manager' | 'factory_manager' | 'inspector' | 'viewer'

export interface Permission {
  category: string
  action: string
  description: string
  roles: Record<Role, boolean>
}

export const PERMISSIONS: Permission[] = [
  // Projects
  {
    category: 'Projects',
    action: 'Create Projects',
    description: 'Create new production projects',
    roles: {
      super_admin: true,
      brand_manager: true,
      factory_manager: false,
      inspector: false,
      viewer: false,
    },
  },
  {
    category: 'Projects',
    action: 'Edit Projects',
    description: 'Modify existing project details',
    roles: {
      super_admin: true,
      brand_manager: true,
      factory_manager: false,
      inspector: false,
      viewer: false,
    },
  },
  {
    category: 'Projects',
    action: 'View Projects',
    description: 'View project details and status',
    roles: {
      super_admin: true,
      brand_manager: true,
      factory_manager: true,
      inspector: true,
      viewer: true,
    },
  },
  // Inspections
  {
    category: 'Inspections',
    action: 'Start Inspection',
    description: 'Create and start a new inspection',
    roles: {
      super_admin: true,
      brand_manager: true,
      factory_manager: true,
      inspector: true,
      viewer: false,
    },
  },
  {
    category: 'Inspections',
    action: 'Submit Report',
    description: 'Submit completed inspection report',
    roles: {
      super_admin: true,
      brand_manager: true,
      factory_manager: false,
      inspector: true,
      viewer: false,
    },
  },
  {
    category: 'Inspections',
    action: 'Approve Report',
    description: 'Approve or reject submitted reports',
    roles: {
      super_admin: true,
      brand_manager: true,
      factory_manager: false,
      inspector: false,
      viewer: false,
    },
  },
  {
    category: 'Inspections',
    action: 'View Inspections',
    description: 'View inspection records and results',
    roles: {
      super_admin: true,
      brand_manager: true,
      factory_manager: true,
      inspector: true,
      viewer: true,
    },
  },
  // Factories
  {
    category: 'Factories',
    action: 'Add Factory',
    description: 'Add a new manufacturing partner',
    roles: {
      super_admin: true,
      brand_manager: true,
      factory_manager: false,
      inspector: false,
      viewer: false,
    },
  },
  {
    category: 'Factories',
    action: 'Edit Factory',
    description: 'Edit factory profile and details',
    roles: {
      super_admin: true,
      brand_manager: true,
      factory_manager: true,
      inspector: false,
      viewer: false,
    },
  },
  {
    category: 'Factories',
    action: 'View Factories',
    description: 'View factory list and profiles',
    roles: {
      super_admin: true,
      brand_manager: true,
      factory_manager: true,
      inspector: true,
      viewer: true,
    },
  },
  // Analytics
  {
    category: 'Analytics',
    action: 'View Analytics',
    description: 'Access quality analytics and reports',
    roles: {
      super_admin: true,
      brand_manager: true,
      factory_manager: true,
      inspector: false,
      viewer: false,
    },
  },
  {
    category: 'Analytics',
    action: 'Export Data',
    description: 'Export reports to PDF or Excel',
    roles: {
      super_admin: true,
      brand_manager: true,
      factory_manager: false,
      inspector: false,
      viewer: false,
    },
  },
  // Templates
  {
    category: 'Templates',
    action: 'Create Templates',
    description: 'Build inspection and workflow templates',
    roles: {
      super_admin: true,
      brand_manager: true,
      factory_manager: false,
      inspector: false,
      viewer: false,
    },
  },
  {
    category: 'Templates',
    action: 'Use Templates',
    description: 'Apply templates to inspections',
    roles: {
      super_admin: true,
      brand_manager: true,
      factory_manager: true,
      inspector: true,
      viewer: false,
    },
  },
  // Team & Settings
  {
    category: 'Team & Settings',
    action: 'Invite Members',
    description: 'Invite new team members',
    roles: {
      super_admin: true,
      brand_manager: true,
      factory_manager: false,
      inspector: false,
      viewer: false,
    },
  },
  {
    category: 'Team & Settings',
    action: 'Manage Roles',
    description: 'Change roles for team members',
    roles: {
      super_admin: true,
      brand_manager: false,
      factory_manager: false,
      inspector: false,
      viewer: false,
    },
  },
  {
    category: 'Team & Settings',
    action: 'Manage Billing',
    description: 'Manage plan, seats and payments',
    roles: {
      super_admin: true,
      brand_manager: false,
      factory_manager: false,
      inspector: false,
      viewer: false,
    },
  },
  {
    category: 'Team & Settings',
    action: 'Edit Org Settings',
    description: 'Update organisation profile and settings',
    roles: {
      super_admin: true,
      brand_manager: false,
      factory_manager: false,
      inspector: false,
      viewer: false,
    },
  },
]
```

---

### Step 2 — Build the Permissions page UI

Create `app/(dashboard)/settings/permissions/page.tsx`:

```tsx
'use client'

import { PERMISSIONS, type Role } from '@/lib/permissions' // or define inline
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const ROLES: { key: Role; label: string; color: string; description: string }[] = [
  {
    key: 'super_admin',
    label: 'Super Admin',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    description: 'Full access to all platform features, settings, billing, and team management.',
  },
  {
    key: 'brand_manager',
    label: 'Brand Manager',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    description: 'Creates projects, manages factories, approves inspection reports, and views analytics.',
  },
  {
    key: 'factory_manager',
    label: 'Factory Manager',
    color: 'bg-teal-100 text-teal-700 border-teal-200',
    description: 'Manages factory profile, tracks inspections, and views assigned projects.',
  },
  {
    key: 'inspector',
    label: 'Inspector',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    description: 'Conducts inspections, logs defects, and submits reports.',
  },
  {
    key: 'viewer',
    label: 'Viewer',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    description: 'Read-only access to projects, inspections, and factory data.',
  },
]

// Group permissions by category
const grouped = PERMISSIONS.reduce<Record<string, typeof PERMISSIONS>>((acc, p) => {
  if (!acc[p.category]) acc[p.category] = []
  acc[p.category].push(p)
  return acc
}, {})

export default function PermissionsPage() {
  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Permissions</h2>
        <p className="text-sm text-gray-500 mt-1">
          Role-based access control for your organisation.
          Permissions are fixed and apply to all members with that role.
        </p>
      </div>

      {/* Role description cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {ROLES.map((role) => (
          <div
            key={role.key}
            className="p-4 rounded-xl border bg-white"
          >
            <Badge className={`${role.color} border mb-2`}>
              {role.label}
            </Badge>
            <p className="text-sm text-gray-600">{role.description}</p>
          </div>
        ))}
      </div>

      {/* Permission matrix table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-700 w-64">
                  Permission
                </th>
                {ROLES.map((role) => (
                  <th key={role.key} className="text-center px-3 py-3 font-medium">
                    <Badge className={`${role.color} border text-xs`}>
                      {role.label}
                    </Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([category, permissions]) => (
                <>
                  {/* Category header row */}
                  <tr key={category} className="bg-gray-50 border-b border-t">
                    <td
                      colSpan={6}
                      className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {category}
                    </td>
                  </tr>

                  {/* Permission rows */}
                  {permissions.map((permission) => (
                    <tr
                      key={permission.action}
                      className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{permission.action}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{permission.description}</p>
                      </td>
                      {ROLES.map((role) => (
                        <td key={role.key} className="text-center px-3 py-3">
                          {permission.roles[role.key] ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-200 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-400 mt-4 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5" />
        Permissions are managed at the organisation level and cannot be customised per user on the current plan.
      </p>
    </div>
  )
}
```

---

### Step 3 — Enforce permissions in the codebase

After the permissions UI is built, enforce them in the actual platform. Find all role-gated UI elements and make sure they match the permission matrix above.

The pattern to use throughout the codebase:

```typescript
// Find the existing useRole or useAuth hook — use it, don't create a new one
const { role } = useAuth() // or useRole() — check what exists

// Enforce permissions
const canCreateProjects = ['super_admin', 'brand_manager'].includes(role)
const canStartInspection = ['super_admin', 'brand_manager', 'factory_manager', 'inspector'].includes(role)
const canApproveReport = ['super_admin', 'brand_manager'].includes(role)
const canInviteMembers = ['super_admin', 'brand_manager'].includes(role)
const canManageBilling = role === 'super_admin'
const canViewAnalytics = ['super_admin', 'brand_manager', 'factory_manager'].includes(role)
const canManageTemplates = ['super_admin', 'brand_manager'].includes(role)
```

Apply these to:
- `+ New Project` button on Projects page — hide for factory_manager, inspector, viewer
- `+ Start Inspection` — hide for viewer
- `+ Add Factory` — hide for inspector, viewer
- `Approve` button on inspection reports — hide for factory_manager, inspector, viewer
- `Invite Member` button — hide for factory_manager, inspector, viewer
- `Analytics` sidebar link — hide for inspector, viewer
- `+ New Template` button — hide for factory_manager, inspector, viewer

---

### Acceptance Criteria — Task 3
- [ ] `/settings/permissions` page loads correctly
- [ ] Role description cards show all 5 roles with correct colors and descriptions
- [ ] Permission matrix table renders with all categories and permissions
- [ ] ✅ green checkmark shown for allowed permissions
- [ ] ⬜ gray X shown for denied permissions
- [ ] Table is horizontally scrollable on mobile
- [ ] Footer note about plan-level permissions is visible
- [ ] Role-gated buttons throughout the platform match the permission matrix

---

## BUILD & DEPLOY (After All Tasks)

```bash
# 1. Run build check
cd /var/www/Master_Sankalphub/V3.0_Frontend
npm run build

# 2. If build passes — commit and push
git add -A
git commit -m "feat: move templates+users into settings, add permissions matrix"
git push origin main

# 3. Vercel auto-deploys on push
```

**Do not push if `npm run build` fails.**

---

## GENERAL RULES FOR ALL AGENTS

1. **Read every file fully before editing.**
2. **Do not change any UI styling** outside what is explicitly described.
3. **Do not delete any existing page files** — only move/restructure routes.
4. **Match existing brand colors** — use the amber/golden color already used on buttons and active states.
5. **Do not modify** the Backend at `/var/www/Master_Sankalphub/Backend/`.
6. **Build must pass** (`npm run build`) before pushing.

---

## FINAL VERIFICATION CHECKLIST

**Sidebar:**
- [ ] Sidebar shows exactly 6 items: Dashboard, Projects, Inspections, Factories, Analytics, Settings
- [ ] Templates and Users & Roles are gone from the main sidebar

**Settings:**
- [ ] `/settings` redirects to `/settings/general`
- [ ] Settings shows two-column layout with sub-nav on left
- [ ] `/settings/general` loads existing general settings content
- [ ] `/settings/templates` loads Templates page correctly
- [ ] `/settings/users` loads Users & Roles page correctly
- [ ] `/settings/permissions` loads permission matrix
- [ ] `/settings/billing` loads billing page
- [ ] Active sub-nav item highlighted with brand color

**Permissions:**
- [ ] All 5 roles shown as description cards
- [ ] All 4 categories shown in matrix: Projects, Inspections, Factories, Analytics, Templates, Team & Settings
- [ ] Checkmarks and X marks render correctly
- [ ] Role-gated buttons match the matrix across the platform

**Build:**
- [ ] `npm run build` — zero errors
- [ ] All existing features still work after restructure

---

*SankalpHub V3 Frontend — Sidebar Restructure + Permissions System*
*March 28, 2026*
