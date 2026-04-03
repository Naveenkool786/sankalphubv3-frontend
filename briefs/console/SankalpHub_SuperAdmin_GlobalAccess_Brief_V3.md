# SankalpHub — Super Admin Global Access Brief (V3 Frontend)
**For: Claude Code + Sub-Agents**
**Date:** March 29, 2026
**Scope:** Enforce a single global rule — super_admin bypasses ALL restrictions everywhere
**Mode:** Systematic fix across the entire codebase. Touch every file where role or plan gating exists.

> ⚠️ **WORKING DIRECTORY: V3 Frontend ONLY**
> All work is exclusively in `/var/www/Master_Sankalphub/V3.0_Frontend/`
> Do NOT touch `/var/www/Master_Sankalphub/Backend/`

---

## THE ONE RULE — READ THIS FIRST

```
super_admin sees everything.
super_admin can do everything.
super_admin is NEVER shown an upgrade prompt.
super_admin is NEVER blocked by a plan check.
super_admin is NEVER hidden from any feature, button, page, or module.
No exceptions. No edge cases. No "unless".
```

This rule must be implemented as a **global utility function** that is used consistently across every component in the platform. It must never be re-implemented inline — always imported from one single source of truth.

---

## PLATFORM CONTEXT

| Item | Detail |
|------|--------|
| **Frontend Framework** | Next.js 15.2.1, React 19.2.4, TypeScript, Tailwind CSS |
| **Auth** | Supabase Auth |
| **Database** | Supabase — `jirhyxpcbfeelgiyxqdi.supabase.co` |
| **Founder account** | `naveenkool786@gmail.com` — role: `super_admin` |
| **Frontend Path** | `/var/www/Master_Sankalphub/V3.0_Frontend/` |

---

## TASK ASSIGNMENT

| Task | Description | Agent |
|------|-------------|-------|
| Task 1 | Create global `isSuperAdmin` utility + update auth context | Sub-Agent 1 |
| Task 2 | Fix all plan-based gates — PremiumHub and feature locks | Sub-Agent 2 |
| Task 3 | Fix all role-based gates — hidden buttons, restricted pages | Sub-Agent 2 |
| Task 4 | Fix Supabase RLS — super_admin reads/writes everything | Sub-Agent 1 |
| Task 5 | Audit and verify — grep for any remaining gates | Sub-Agent 1 |

Sub-Agent 1 runs Tasks 1, 4, 5 sequentially.
Sub-Agent 2 runs Tasks 2 and 3 in parallel with Sub-Agent 1 after Task 1 is complete.

---

## TASK 1 — Create Global Utility + Update Auth Context

**Agent:** Sub-Agent 1

### Step 1 — Create the single source of truth utility

Create `lib/permissions.ts` (or add to existing if it exists):

```typescript
// ============================================================
// SANKALPHUB PERMISSION SYSTEM
// Single source of truth for all access control
// ============================================================

export type UserRole =
  | 'super_admin'
  | 'brand_manager'
  | 'factory_manager'
  | 'inspector'
  | 'viewer'

export type PlanType =
  | 'free'
  | 'pro'
  | 'enterprise'
  | 'founding_member'

// ─── CORE RULE ───────────────────────────────────────────────
// super_admin ALWAYS bypasses everything.
// Check this FIRST before any other permission check.
// ─────────────────────────────────────────────────────────────

export function isSuperAdmin(role: UserRole | string | null | undefined): boolean {
  return role === 'super_admin'
}

// ─── PLAN CHECKS ─────────────────────────────────────────────
// super_admin bypasses all plan checks.
// For all other roles, check their plan tier.
// ─────────────────────────────────────────────────────────────

export function hasPremiumAccess(
  role: UserRole | string | null | undefined,
  plan: PlanType | string | null | undefined
): boolean {
  if (isSuperAdmin(role)) return true  // super_admin always has premium
  return plan === 'pro' || plan === 'enterprise' || plan === 'founding_member'
}

export function hasProAccess(
  role: UserRole | string | null | undefined,
  plan: PlanType | string | null | undefined
): boolean {
  if (isSuperAdmin(role)) return true
  return plan === 'pro' || plan === 'enterprise' || plan === 'founding_member'
}

export function hasEnterpriseAccess(
  role: UserRole | string | null | undefined,
  plan: PlanType | string | null | undefined
): boolean {
  if (isSuperAdmin(role)) return true
  return plan === 'enterprise'
}

// ─── ROLE-BASED PERMISSIONS ───────────────────────────────────
// super_admin bypasses all role checks.
// ─────────────────────────────────────────────────────────────

export function canCreateProjects(role: UserRole | string | null | undefined): boolean {
  if (isSuperAdmin(role)) return true
  return role === 'brand_manager'
}

export function canStartInspection(role: UserRole | string | null | undefined): boolean {
  if (isSuperAdmin(role)) return true
  return ['brand_manager', 'factory_manager', 'inspector'].includes(role as string)
}

export function canApproveReport(role: UserRole | string | null | undefined): boolean {
  if (isSuperAdmin(role)) return true
  return role === 'brand_manager'
}

export function canAddFactory(role: UserRole | string | null | undefined): boolean {
  if (isSuperAdmin(role)) return true
  return role === 'brand_manager'
}

export function canManageTemplates(role: UserRole | string | null | undefined): boolean {
  if (isSuperAdmin(role)) return true
  return role === 'brand_manager'
}

export function canInviteMembers(role: UserRole | string | null | undefined): boolean {
  if (isSuperAdmin(role)) return true
  return role === 'brand_manager'
}

export function canManageBilling(role: UserRole | string | null | undefined): boolean {
  if (isSuperAdmin(role)) return true
  return false  // only super_admin manages billing
}

export function canViewAnalytics(role: UserRole | string | null | undefined): boolean {
  if (isSuperAdmin(role)) return true
  return ['brand_manager', 'factory_manager'].includes(role as string)
}

export function canEditOrgSettings(role: UserRole | string | null | undefined): boolean {
  if (isSuperAdmin(role)) return true
  return false
}

export function canAccessFounderConsole(role: UserRole | string | null | undefined): boolean {
  return isSuperAdmin(role)  // console is super_admin only — no bypass needed
}

export function canManageRoles(role: UserRole | string | null | undefined): boolean {
  return isSuperAdmin(role)
}

// ─── VIEW PERMISSIONS ─────────────────────────────────────────
export function canViewReports(role: UserRole | string | null | undefined): boolean {
  if (isSuperAdmin(role)) return true
  return true  // all roles can view reports
}

export function canViewProjects(role: UserRole | string | null | undefined): boolean {
  if (isSuperAdmin(role)) return true
  return true  // all roles can view projects
}

export function canViewFactories(role: UserRole | string | null | undefined): boolean {
  if (isSuperAdmin(role)) return true
  return true  // all roles can view factories
}
```

---

### Step 2 — Update the auth context to expose role and plan

Find the existing auth context or hook (likely `lib/auth.ts`, `hooks/useAuth.ts`, or `context/AuthContext.tsx`):

```bash
find /var/www/Master_Sankalphub/V3.0_Frontend -type f \( -name "*.tsx" -o -name "*.ts" \) | xargs grep -l "useAuth\|AuthContext\|getUser\|userRole" | grep -v node_modules | grep -v .next
```

Ensure the auth context exposes BOTH `role` AND `plan`:

```typescript
interface AuthContextType {
  user: User | null
  profile: Profile | null
  role: UserRole | null        // from profiles.role
  plan: PlanType | null        // from organizations.plan
  organization: Organization | null
  loading: boolean
}
```

If `plan` is not currently fetched, add a join to get it from the `organizations` table:

```typescript
// When fetching profile, also fetch organization plan
const { data: profile } = await supabase
  .from('profiles')
  .select(`
    *,
    organizations (
      id,
      name,
      plan,
      trial_ends_at
    )
  `)
  .eq('id', user.id)
  .single()

// Expose both
const role = profile?.role
const plan = profile?.organizations?.plan
```

---

### Acceptance Criteria — Task 1
- [ ] `lib/permissions.ts` exists with all exported functions
- [ ] Every permission function checks `isSuperAdmin` first
- [ ] Auth context exposes both `role` and `plan`
- [ ] `isSuperAdmin('super_admin')` returns `true`
- [ ] `hasPremiumAccess('super_admin', 'free')` returns `true`
- [ ] `hasPremiumAccess('viewer', 'free')` returns `false`
- [ ] `hasPremiumAccess('brand_manager', 'pro')` returns `true`

---

## TASK 2 — Fix All Plan-Based Gates (PremiumHub + Feature Locks)

**Agent:** Sub-Agent 2

### Step 1 — Find all plan-based checks in the codebase

```bash
grep -r "premium\|Premium\|pro\|Pro plan\|upgrade\|Upgrade\|plan ==\|plan ===\|PremiumHub" \
  /var/www/Master_Sankalphub/V3.0_Frontend/app \
  --include="*.tsx" --include="*.ts" -l | grep -v node_modules | grep -v .next
```

### Step 2 — Fix the PremiumHub button

Find where the PremiumHub button renders. It likely looks like:

```tsx
// WRONG — only checking plan
{user.plan !== 'pro' && <PremiumHubButton />}
// or
{isPremium ? <Feature /> : <UpgradePrompt />}
```

Fix to:

```tsx
import { hasPremiumAccess } from '@/lib/permissions'

// CORRECT — super_admin bypasses plan check
{!hasPremiumAccess(role, plan) && <PremiumHubButton />}
// or
{hasPremiumAccess(role, plan) ? <Feature /> : <UpgradePrompt />}
```

**For super_admin specifically:** The PremiumHub upgrade button should be completely hidden. Super admin should never see "Upgrade to Premium" anywhere on the platform.

```tsx
// Hide upgrade prompts entirely for super_admin
{!isSuperAdmin(role) && !hasPremiumAccess(role, plan) && (
  <UpgradePrompt />
)}
```

### Step 3 — Fix all feature lock overlays

Search for any components that show a lock icon, "upgrade required", or blur overlay over features:

```bash
grep -r "lock\|Lock\|blur\|upgrade required\|Upgrade required\|feature-gate\|FeatureGate" \
  /var/www/Master_Sankalphub/V3.0_Frontend/app \
  --include="*.tsx" -l | grep -v node_modules | grep -v .next
```

For each found instance, wrap with `isSuperAdmin` check:

```tsx
import { isSuperAdmin } from '@/lib/permissions'

// Never show lock/gate to super_admin
{!isSuperAdmin(role) && <FeatureLockOverlay />}
```

### Acceptance Criteria — Task 2
- [ ] PremiumHub upgrade button is hidden for super_admin
- [ ] No upgrade prompts visible anywhere for super_admin
- [ ] No feature lock overlays visible for super_admin
- [ ] Plan-gated features are fully accessible for super_admin
- [ ] Plan gates still work correctly for other roles (viewer on free plan still sees upgrade prompts)

---

## TASK 3 — Fix All Role-Based Gates (Hidden Buttons + Restricted Pages)

**Agent:** Sub-Agent 2 (parallel with Task 2)

### Step 1 — Find all role-based checks

```bash
grep -r "userRole\|user\.role\|role ===\|role !==\|role ==" \
  /var/www/Master_Sankalphub/V3.0_Frontend/app \
  --include="*.tsx" --include="*.ts" -l | grep -v node_modules | grep -v .next
```

### Step 2 — Replace all inline role checks with permission functions

Every place that checks role inline must be replaced with the imported permission function.

**Common patterns to find and fix:**

```tsx
// ── WRONG patterns (find these) ──────────────────────────────

// Pattern 1: direct role check without super_admin bypass
{role === 'brand_manager' && <AddFactoryButton />}

// Pattern 2: array check without super_admin
{['brand_manager', 'factory_manager'].includes(role) && <StartInspectionButton />}

// Pattern 3: role !== check
{role !== 'viewer' && <AnalyticsLink />}


// ── CORRECT patterns (replace with) ──────────────────────────

import {
  canAddFactory,
  canStartInspection,
  canViewAnalytics,
  isSuperAdmin
} from '@/lib/permissions'

// Pattern 1 fixed
{canAddFactory(role) && <AddFactoryButton />}

// Pattern 2 fixed
{canStartInspection(role) && <StartInspectionButton />}

// Pattern 3 fixed
{canViewAnalytics(role) && <AnalyticsLink />}
```

### Step 3 — Fix page-level access guards

Find any pages that redirect away if the role doesn't match:

```bash
grep -r "redirect\|router\.push" \
  /var/www/Master_Sankalphub/V3.0_Frontend/app \
  --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v .next | grep -v "login\|signup"
```

For each redirect based on role, ensure super_admin is never redirected away from any page:

```typescript
// WRONG
if (role !== 'brand_manager') {
  router.push('/dashboard')
}

// CORRECT
import { isSuperAdmin } from '@/lib/permissions'

if (!isSuperAdmin(role) && role !== 'brand_manager') {
  router.push('/dashboard')
}
```

### Acceptance Criteria — Task 3
- [ ] All inline role checks replaced with permission functions from `lib/permissions.ts`
- [ ] super_admin is never redirected away from any page
- [ ] All action buttons (Add Factory, Start Inspection, Invite Members, etc.) visible for super_admin
- [ ] Analytics page accessible for super_admin
- [ ] Founder Console still requires super_admin (this is correct — it's not a restriction, it's the right gate)
- [ ] Other roles still respect their permission limits correctly

---

## TASK 4 — Fix Supabase RLS for Super Admin

**Agent:** Sub-Agent 1

### Step 1 — Add super_admin bypass to all RLS policies

In Supabase SQL Editor, run the following to update RLS policies so super_admin can read and write all data across all tables:

```sql
-- ── PROFILES ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "super_admin_all_profiles" ON profiles;
CREATE POLICY "super_admin_all_profiles"
ON profiles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
);

-- ── ORGANIZATIONS ─────────────────────────────────────────────
DROP POLICY IF EXISTS "super_admin_all_organizations" ON organizations;
CREATE POLICY "super_admin_all_organizations"
ON organizations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
);

-- ── FACTORIES ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "super_admin_all_factories" ON factories;
CREATE POLICY "super_admin_all_factories"
ON factories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
);

-- ── PROJECTS ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "super_admin_all_projects" ON projects;
CREATE POLICY "super_admin_all_projects"
ON projects FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
);

-- ── INSPECTIONS ───────────────────────────────────────────────
DROP POLICY IF EXISTS "super_admin_all_inspections" ON inspections;
CREATE POLICY "super_admin_all_inspections"
ON inspections FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
);

-- ── TEMPLATES ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "super_admin_all_templates" ON templates;
CREATE POLICY "super_admin_all_templates"
ON templates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
);

-- ── DOCUMENTS ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "super_admin_all_documents" ON documents;
CREATE POLICY "super_admin_all_documents"
ON documents FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
);

-- ── TASKS ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "super_admin_all_tasks" ON tasks;
CREATE POLICY "super_admin_all_tasks"
ON tasks FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
);

-- ── DEMO REQUESTS ─────────────────────────────────────────────
DROP POLICY IF EXISTS "super_admin_all_demo_requests" ON demo_requests;
CREATE POLICY "super_admin_all_demo_requests"
ON demo_requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
);
```

### Step 2 — Verify your profile has the correct role

```sql
-- Confirm naveenkool786@gmail.com is super_admin
SELECT p.id, p.email, p.role, o.name, o.plan
FROM profiles p
JOIN organizations o ON o.id = p.organization_id
WHERE p.email = 'naveenkool786@gmail.com';
```

If `role` is not `super_admin`, fix it:

```sql
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'naveenkool786@gmail.com';
```

### Acceptance Criteria — Task 4
- [ ] All 9 tables have a `super_admin_all_*` RLS policy
- [ ] `naveenkool786@gmail.com` has `role = 'super_admin'` in profiles table
- [ ] super_admin can SELECT, INSERT, UPDATE, DELETE on all tables
- [ ] Other users' RLS policies are not affected or removed

---

## TASK 5 — Full Audit (Zero Remaining Gates)

**Agent:** Sub-Agent 1 (after Tasks 2, 3, 4 complete)

Run a final audit to ensure no gates remain for super_admin:

```bash
# Find any remaining raw plan checks
grep -rn "plan.*pro\|plan.*premium\|plan.*enterprise\|isPremium\|isUpgraded" \
  /var/www/Master_Sankalphub/V3.0_Frontend/app \
  --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v .next

# Find any remaining raw role checks not using permission functions
grep -rn "role === \|role !== \|role ==" \
  /var/www/Master_Sankalphub/V3.0_Frontend/app \
  --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v .next | grep -v "permissions.ts"

# Find upgrade/lock UI elements
grep -rn "Upgrade\|upgrade\|PremiumHub\|premium-hub\|feature-lock\|featureLock" \
  /var/www/Master_Sankalphub/V3.0_Frontend/app \
  --include="*.tsx" | grep -v node_modules | grep -v .next
```

For every result returned:
- If it's a plan check not using `hasPremiumAccess` → fix it
- If it's a role check not using the permission functions → fix it
- If it's an upgrade prompt not wrapped with `!isSuperAdmin` → fix it

### Acceptance Criteria — Task 5
- [ ] Zero raw `role ===` checks outside of `lib/permissions.ts`
- [ ] Zero raw `plan ===` checks outside of `lib/permissions.ts`
- [ ] Zero upgrade prompts visible to super_admin
- [ ] All feature gates use functions from `lib/permissions.ts`

---

## BUILD & DEPLOY

```bash
cd /var/www/Master_Sankalphub/V3.0_Frontend
npm run build
git add -A
git commit -m "fix: super_admin global access — bypasses all plan and role gates"
git push origin main
```

---

## FINAL VERIFICATION CHECKLIST

Log in as `naveenkool786@gmail.com` and verify:

- [ ] No PremiumHub upgrade button visible anywhere
- [ ] No "upgrade your plan" prompts visible anywhere
- [ ] No feature lock overlays visible anywhere
- [ ] Dashboard fully accessible with all features
- [ ] Projects — can create, edit, delete
- [ ] Inspections — can start, run, submit, approve
- [ ] Factories — can add, edit, view all
- [ ] Templates — can create, edit, delete (no failed insert)
- [ ] Analytics — fully accessible
- [ ] Settings → all 7 tabs accessible
- [ ] Founder Console — accessible at `/console`
- [ ] Users & Roles — shows "Super Admin" badge in purple
- [ ] All Supabase operations succeed without RLS errors
- [ ] `npm run build` — zero errors

---

## THE GOLDEN RULE (permanent reference)

```
if (role === 'super_admin') {
  // Access granted. Always. No questions asked.
}
```

This rule lives in `lib/permissions.ts`.
It is imported everywhere.
It is never overridden.
It is never forgotten.

---

*SankalpHub V3 Frontend — Super Admin Global Access Fix*
*The founder sees everything. Always.*
*March 29, 2026*
