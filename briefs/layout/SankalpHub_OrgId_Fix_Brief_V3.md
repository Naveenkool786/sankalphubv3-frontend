# SankalpHub — Critical Bug Fix: org_id Column Name (V3 Frontend)
**For: Claude Code**
**Date:** April 2, 2026
**Scope:** Fix all wrong column references throughout the codebase — org_id not organization_id
**Priority:** CRITICAL — blocks Projects, Factories, Planning, and all data operations
**Mode:** Search and fix. Do not add new features. Fix only.

> ⚠️ **WORKING DIRECTORY: V3 Frontend ONLY**
> All work is in `/var/www/Master_Sankalphub/V3.0_Frontend/`

---

## ROOT CAUSE

The Supabase `profiles` table uses `org_id` as the column name.
Every query using `organization_id` fails silently or throws a server error.

**Confirmed schema from Supabase:**
```
profiles table columns:
- id (uuid)
- org_id (uuid)          ← CORRECT name
- full_name (text)
- role (text)
- is_active (boolean)
- created_at (timestamptz)
- updated_at (timestamptz)
NOTE: NO email column — email is in auth.users
NOTE: NO organization_id column — it is org_id
NOTE: NO onboarding_complete column
```

---

## THREE BROKEN THINGS TO FIX

### Bug 1 — Factories: "Failed to save"
Factory creation throws Server Components render error.
The factory insert action uses `organization_id` instead of `org_id`.

### Bug 2 — Projects: "No factories added yet"
Project creation modal shows no factories in dropdown.
The factories query filters by `organization_id` instead of `org_id`.

### Bug 3 — Planning: "Loading planning data..." forever
The `usePlanningData` hook queries with `organization_id` and gets nothing back.
The page loads forever because data never arrives.

---

## STEP 1 — Find ALL wrong references

```bash
cd /var/www/Master_Sankalphub/V3.0_Frontend

echo "=== Files using organization_id ==="
grep -rn "organization_id" app/ lib/ hooks/ --include="*.ts" --include="*.tsx" \
  | grep -v node_modules | grep -v .next | grep -v ".test."

echo "=== Files using .email on profiles ==="
grep -rn "profiles.*email\|\.email.*profiles" app/ lib/ hooks/ --include="*.ts" --include="*.tsx" \
  | grep -v node_modules | grep -v .next

echo "=== Files using onboarding_complete ==="
grep -rn "onboarding_complete" app/ lib/ hooks/ --include="*.ts" --include="*.tsx" \
  | grep -v node_modules | grep -v .next
```

---

## STEP 2 — Fix ALL instances automatically

```bash
# Fix organization_id → org_id in all TypeScript/TSX files
find /var/www/Master_Sankalphub/V3.0_Frontend/app \
     /var/www/Master_Sankalphub/V3.0_Frontend/lib \
     /var/www/Master_Sankalphub/V3.0_Frontend/hooks \
  -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*" \
  -exec sed -i 's/organization_id/org_id/g' {} +

echo "Done replacing organization_id with org_id"

# Verify no instances remain
echo "=== Remaining organization_id references ==="
grep -rn "organization_id" app/ lib/ hooks/ --include="*.ts" --include="*.tsx" \
  | grep -v node_modules | grep -v .next | grep -v "// " | head -20
```

---

## STEP 3 — Fix the Factory save action specifically

Find the factory creation server action:
```bash
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "Add Factory\|addFactory\|insert.*factories\|factories.*insert" \
  | grep -v node_modules | grep -v .next | head -5
```

Show the file content and fix the insert to use `org_id`:

```typescript
// WRONG
await supabase.from('factories').insert({
  organization_id: orgId,
  name: factoryName,
  // ...
})

// CORRECT
await supabase.from('factories').insert({
  org_id: orgId,
  name: factoryName,
  // ...
})
```

Also check what columns the `factories` table actually has:
```sql
-- Run this in Supabase SQL Editor to confirm factories schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'factories' 
ORDER BY ordinal_position;
```

If the factories table uses `organization_id` as the actual column name
(not `org_id`), then the fix is different — we keep `organization_id` 
in the factories queries but use `org_id` only for profiles queries.

**IMPORTANT:** Only change profile queries to use `org_id`.
For other tables (factories, projects, orders, inspections etc.)
use whatever column name that table actually has.

---

## STEP 4 — Fix the getUserContext / org fetching

Find `getUserContext.ts` or similar:
```bash
find . -name "getUserContext*" -o -name "getUser*" | grep -v node_modules | xargs cat 2>/dev/null
```

The correct way to get org_id from profiles:
```typescript
// CORRECT — use org_id when querying profiles
const { data: profile } = await supabase
  .from('profiles')
  .select('*, organizations(*)')
  .eq('id', user.id)
  .single()

// Access org_id as:
const orgId = profile?.org_id
```

---

## STEP 5 — Fix Planning page infinite load

Find the planning data hook:
```bash
find . -path "*planning*" -name "*.ts" -o -path "*planning*" -name "*.tsx" \
  | grep -v node_modules | grep -v .next | xargs grep -l "fetch\|supabase\|loading" 2>/dev/null
```

The planning page shows "Loading planning data..." forever because:
1. The data hook fails silently due to wrong column names
2. `loading` state never gets set to `false`

Fix: Add proper error handling so loading always stops:

```typescript
// In usePlanningData or similar hook:
useEffect(() => {
  async function fetchData() {
    try {
      // ... fetch data
    } catch (err) {
      console.error('Planning data fetch failed:', err)
    } finally {
      setLoading(false)  // ← ALWAYS stop loading, even on error
    }
  }
  fetchData()
}, [])
```

Also check if the `orders` table exists:
```bash
grep -rn "from('orders')\|from(\"orders\")" app/ lib/ hooks/ \
  --include="*.ts" --include="*.tsx" | grep -v node_modules | head -5
```

If the orders table doesn't exist in Supabase, the planning page will 
load forever. Add a check:

```typescript
const { data: orders, error: ordersError } = await supabase
  .from('orders')
  .select('*')
  .eq('org_id', orgId)  // use correct column

if (ordersError) {
  console.error('Orders table error:', ordersError.message)
  // Return empty data instead of hanging
  return { orders: [], factories: [], dailyProduction: [] }
}
```

---

## STEP 6 — Fix Projects factory dropdown

Find where projects page fetches factories for the dropdown:
```bash
find . -path "*project*" -name "*.tsx" | grep -v node_modules | grep -v .next \
  | xargs grep -l "factory\|factories" 2>/dev/null | head -5
```

The dropdown shows "No factories added yet" because the factories query
returns empty. Fix the query to use the correct column:

```typescript
// The query should be filtering by the org's factories
// Check what column factories table uses for org reference
const { data: factories } = await supabase
  .from('factories')
  .select('id, name')
  .eq('org_id', orgId)  // or organization_id — depends on factories table schema
  .eq('is_active', true)
  .order('name')
```

---

## STEP 7 — Verify factories table schema

Before fixing factories, check the ACTUAL column names:

```bash
# Check what the factories insert action currently sends
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "from('factories')" \
  | grep -v node_modules | grep -v .next | xargs grep -A5 "\.insert\|\.select\|\.eq"
```

If factories table uses `organization_id` (not `org_id`), then the factory 
save error is a different issue — likely an RLS policy blocking the insert.

In that case, fix the RLS policy in Supabase:
```sql
-- Drop and recreate factory RLS to use correct profile column
DROP POLICY IF EXISTS "org_factories" ON factories;
CREATE POLICY "org_factories" ON factories FOR ALL
USING (
  organization_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "super_admin_factories" ON factories;
CREATE POLICY "super_admin_factories" ON factories FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);
```

---

## STEP 8 — Build and verify

```bash
cd /var/www/Master_Sankalphub/V3.0_Frontend
npm run build 2>&1 | tail -30

if [ $? -eq 0 ]; then
  git add -A
  git commit -m "fix: org_id column name throughout codebase — fixes factories, projects, planning"
  git push origin main
  echo "DEPLOYED SUCCESSFULLY"
else
  echo "BUILD FAILED"
  npm run build 2>&1 | grep -E "Error|error" | head -20
fi
```

---

## VERIFICATION AFTER DEPLOY

Test all three pages:

1. **Factories page** (`/factories`)
   - [ ] Click "+ Add Factory"
   - [ ] Fill in details and click "Add Factory"
   - [ ] Factory saves successfully — no "Failed to save" error
   - [ ] Factory appears in the list

2. **Projects page** (`/projects`)
   - [ ] Click "+ New Project"
   - [ ] Factory dropdown shows available factories (not "No factories added yet")
   - [ ] Project saves successfully

3. **Planning page** (`/planning`)
   - [ ] Page loads without spinning forever
   - [ ] Shows empty state or data (not "Loading planning data...")
   - [ ] Production Planner dropdown works

---

## IMPORTANT NOTES FOR CLAUDE CODE

1. The `profiles` table ALWAYS uses `org_id` — fix these everywhere
2. Other tables (factories, projects, inspections, orders) may use either 
   `org_id` or `organization_id` — check their actual schema before changing
3. Never use `profiles.email` — always use `auth.users` for email
4. Never check `profiles.onboarding_complete` — this column does not exist
5. Always add `finally { setLoading(false) }` in data hooks

---

*SankalpHub V3 — Critical org_id fix*
*Fixes: Factories save error + Projects factory dropdown + Planning infinite load*
*April 2, 2026*
