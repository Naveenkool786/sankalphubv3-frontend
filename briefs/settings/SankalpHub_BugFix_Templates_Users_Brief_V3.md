# SankalpHub — Bug Fix Brief: Templates + Users & Roles (V3 Frontend)
**For: Claude Code + Sub-Agents**
**Date:** March 28, 2026
**Scope:** Fix 2 confirmed bugs — Template creation failure + User role display wrong
**Mode:** Bug fix only. Do NOT touch any other module or page.

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
| **Database** | Supabase (hosted Postgres) — `jirhyxpcbfeelgiyxqdi.supabase.co` |
| **Supabase Tables** | organizations, profiles, projects, inspections, factories, templates, tasks, documents, demo_requests |
| **Frontend Path** | `/var/www/Master_Sankalphub/V3.0_Frontend/` |
| **Repo** | GitHub: `Naveenkool786/sankalphubv3-frontend` → Vercel auto-deploy on push |
| **Founder Account** | `naveenkool786@gmail.com` — should be `super_admin` role |

---

## CONFIRMED BUGS (Verified via screenshots — March 28, 2026)

### Bug 1 — Templates: "Failed to create template"
- **Location:** `/templates` → New Template modal → fill fields → click Create
- **Symptom:** Red error toast appears: "Failed to create template"
- **Tested with:** Template Name = "Inline Inspection", Type = "Inspection", Industry = "Fashion"
- **Result:** Insert fails, template not created, modal stays open

### Bug 2 — Users & Roles: Naveen showing as "Viewer" not "Super Admin"
- **Location:** `/users` → Members list
- **Symptom:** `naveenkool786@gmail.com` (Naveen) shows role badge "Viewer"
- **Expected:** Should show "Super Admin" — this is the founder account with `super_admin` role in Supabase
- **Impact:** Role-based access control throughout the platform may be broken for all gated features

---

## TASK ASSIGNMENT

| Task | Bug | Agent | Run Order |
|------|-----|-------|-----------|
| Task 1 | Fix "Failed to create template" | Sub-Agent 1 | First |
| Task 2 | Fix Naveen role display (Viewer → Super Admin) | Sub-Agent 2 | Parallel with Task 1 |

---

## TASK 1 — Fix "Failed to create template" Error

**Agent:** Sub-Agent 1
**Files:** Templates page, Supabase `templates` table

---

### Step 1 — Locate the template creation code

```bash
# Find the templates page
find /var/www/Master_Sankalphub/V3.0_Frontend -type f -name "*.tsx" | grep -i template | grep -v node_modules | grep -v .next

# Find where the insert happens — look for supabase insert on templates table
grep -r "templates" /var/www/Master_Sankalphub/V3.0_Frontend/app --include="*.tsx" --include="*.ts" -l | grep -v node_modules | grep -v .next
```

Read the full file before making any changes.

---

### Step 2 — Check the Supabase `templates` table schema

The insert is failing — this means either:
- A required column is missing from what the frontend is sending
- A `NOT NULL` constraint exists on a column the modal doesn't fill
- An RLS policy is blocking the insert
- The `organization_id` is not being attached to the insert (most common cause)

**Check the templates table schema via Supabase client:**

```typescript
// Run this query to see the table structure
const { data, error } = await supabase
  .rpc('get_table_info', { table_name: 'templates' })

// OR check directly in Supabase Dashboard → Table Editor → templates
// Look for: NOT NULL columns, DEFAULT values, RLS policies
```

**Most likely missing fields in the insert payload:**
```typescript
// The frontend modal collects: name, type, industry
// But the table likely also requires:
// - organization_id  (which org does this template belong to?)
// - created_by       (which user created it?)
// - status           (active/draft — may have no default)
// - sections         (JSONB field for template content — may be NOT NULL)
```

---

### Step 3 — Find the exact insert payload and fix it

Locate the form submit handler. It will look something like:

```typescript
// Current broken insert — likely missing required fields
const { error } = await supabase
  .from('templates')
  .insert({
    name: formData.name,
    type: formData.type,
    industry: formData.industry,
    // MISSING: organization_id, created_by, status, sections
  })
```

**Fix — add all required fields:**

```typescript
// Get current user and their organization
const { data: { user } } = await supabase.auth.getUser()

const { data: profile } = await supabase
  .from('profiles')
  .select('organization_id')
  .eq('id', user.id)
  .single()

// Fixed insert with all required fields
const { error } = await supabase
  .from('templates')
  .insert({
    name: formData.name,
    type: formData.type,          // 'inspection' | 'report' | 'workflow'
    industry: formData.industry,
    organization_id: profile.organization_id,
    created_by: user.id,
    status: 'draft',              // default status
    sections: [],                 // empty array — template builder fills this later
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

if (error) {
  console.error('Template insert error:', error)
  // Show specific error in toast, not generic "Failed to create template"
  toast.error(error.message) // helps diagnose future issues
  return
}
```

---

### Step 4 — Check RLS policies on templates table

If the insert still fails after Step 3, the issue is RLS. Check and fix:

```sql
-- In Supabase SQL Editor, run:
SELECT * FROM pg_policies WHERE tablename = 'templates';

-- If no INSERT policy exists, add one:
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_can_insert_templates"
ON templates FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "org_members_can_read_templates"
ON templates FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "org_members_can_update_templates"
ON templates FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);
```

---

### Step 5 — Fix the error message

Currently the toast just says "Failed to create template" with no detail. Update the error handler to log the actual Supabase error to the console AND show it in the toast temporarily during debugging:

```typescript
if (error) {
  console.error('[Templates] Insert failed:', error.code, error.message, error.details)
  toast.error(`Failed to create template: ${error.message}`)
  return
}
```

This way, even if the fix doesn't fully work first time, you can see the exact error in the browser console.

---

### Step 6 — Verify the fix

After fix is applied:
1. Go to `/templates`
2. Click "New Template"
3. Enter: Template Name = "Test Template", Type = "Inspection", Industry = "Garments"
4. Click "Create"
5. Modal should close, template should appear in the list
6. Check Supabase → Table Editor → templates → confirm row exists with correct `organization_id`

---

### Acceptance Criteria — Task 1
- [ ] Creating a template with name + type + industry succeeds
- [ ] Template appears in the list after creation
- [ ] Row exists in Supabase `templates` table with correct `organization_id` and `created_by`
- [ ] Error toast no longer appears on valid submission
- [ ] Console logs the actual error if something goes wrong (for future debugging)

---

## TASK 2 — Fix User Role Display (Viewer → Super Admin)

**Agent:** Sub-Agent 2
**Files:** Users & Roles page, Supabase `profiles` table

---

### Step 1 — Understand the bug

The Users & Roles page shows Naveen (`naveenkool786@gmail.com`) with role "Viewer".

The correct role is `super_admin` — this is set in the Supabase `profiles` table.

This bug has two possible causes:

**Cause A — Database issue:** The `profiles` table has the wrong role value for Naveen's record. The role field may say `viewer` instead of `super_admin`.

**Cause B — Frontend issue:** The role is correct in the database but the Users page is reading from the wrong field or mapping roles incorrectly.

---

### Step 2 — Check the database first

In Supabase Dashboard → Table Editor → `profiles`:

Find the row where `id` matches Naveen's auth user ID (or where email = `naveenkool786@gmail.com` if email is stored in profiles).

Check the `role` column value. It should be `super_admin`.

**If it says `viewer` or is empty — fix it directly:**

```sql
-- In Supabase SQL Editor:
UPDATE profiles
SET role = 'super_admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'naveenkool786@gmail.com'
);
```

**Also check the `organizations` table** — there may be an `owner_id` or `admin_id` field that should reference Naveen's profile ID:

```sql
-- Verify Naveen is the org owner
SELECT * FROM organizations WHERE id = (
  SELECT organization_id FROM profiles
  WHERE id = (SELECT id FROM auth.users WHERE email = 'naveenkool786@gmail.com')
);
```

---

### Step 3 — Check the frontend role display logic

Locate the Users & Roles page:

```bash
find /var/www/Master_Sankalphub/V3.0_Frontend -type f -name "*.tsx" | grep -i user | grep -v node_modules | grep -v .next
```

Find where the role badge is rendered. It will look something like:

```typescript
// Find how role is fetched and displayed
<span>{member.role}</span>
// or
<Badge>{member.role}</Badge>
```

Check what query fetches the members list. It likely queries `profiles` — verify it selects the `role` column:

```typescript
const { data: members } = await supabase
  .from('profiles')
  .select('id, full_name, email, role, avatar_url')  // ← 'role' must be here
  .eq('organization_id', currentOrgId)
```

If `role` is not in the select, add it.

---

### Step 4 — Fix the role label display

The role value in the database is likely stored as `super_admin` (snake_case). The UI should display it as "Super Admin" (human-readable). Add a role label mapping:

```typescript
// Add this utility function — find where role badges are rendered and apply it
const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  brand_manager: 'Brand Manager',
  factory_manager: 'Factory Manager',
  inspector: 'Inspector',
  viewer: 'Viewer',
}

// Usage
<Badge>{roleLabels[member.role] ?? member.role}</Badge>
```

Also add role-specific badge colors:

```typescript
const roleBadgeStyles: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700 border-purple-200',
  brand_manager: 'bg-blue-100 text-blue-700 border-blue-200',
  factory_manager: 'bg-teal-100 text-teal-700 border-teal-200',
  inspector: 'bg-amber-100 text-amber-700 border-amber-200',
  viewer: 'bg-gray-100 text-gray-600 border-gray-200',
}
```

---

### Step 5 — Fix the role throughout the platform

The `super_admin` role is used for access control across the platform (showing/hiding buttons, gating features). If Naveen's role was displaying as `viewer`, it means all role-based gating has been failing for him.

After fixing the database value and the display:

1. Check `middleware.ts` or any `useRole()` hook — confirm it reads from `profiles.role`
2. Confirm the role is being passed correctly through the auth context
3. Test that after fix, Naveen sees all Super Admin features (all buttons, all modules, Founder Console)

---

### Step 6 — Verify the fix

1. Go to `/users`
2. Naveen should now show "Super Admin" badge in purple
3. Log out and log back in as `naveenkool786@gmail.com`
4. Confirm all modules are accessible
5. Confirm role-gated buttons (like "+ Add Factory", "Invite Member") are visible

---

### Acceptance Criteria — Task 2
- [ ] `profiles` table has `role = 'super_admin'` for `naveenkool786@gmail.com`
- [ ] Users & Roles page shows "Super Admin" badge (purple) for Naveen
- [ ] Role label mapping covers all 5 roles: Super Admin, Brand Manager, Factory Manager, Inspector, Viewer
- [ ] Role badge colors are distinct per role
- [ ] After fix, Naveen has full access to all platform features
- [ ] Other users' roles are unaffected

---

## BUILD & DEPLOY (After Both Tasks)

```bash
# 1. Run build check
cd /var/www/Master_Sankalphub/V3.0_Frontend
npm run build

# 2. If build passes — commit and push
git add -A
git commit -m "fix: template creation insert bug + super_admin role display"
git push origin main

# 3. Vercel auto-deploys on push — monitor deploy logs
```

**Do not push if `npm run build` fails.**

---

## GENERAL RULES

1. **Read every file fully before editing.**
2. **Check the database before assuming it's a frontend bug** — both these bugs may be data issues.
3. **Log actual errors to console** during debugging — never swallow errors silently.
4. **Do not touch** any other module, page, or component outside the scope of these two bugs.
5. **Do not modify** `/var/www/Master_Sankalphub/Backend/` — out of scope entirely.
6. **Build must pass** before pushing.

---

## FINAL VERIFICATION CHECKLIST

- [ ] `/templates` → Create template → succeeds, row appears in list
- [ ] Supabase `templates` table has new row with correct `organization_id`
- [ ] `/templates` → error toast no longer appears on valid submission
- [ ] `/users` → Naveen shows "Super Admin" badge in purple
- [ ] All 5 role labels display correctly with distinct colors
- [ ] Naveen has full Super Admin access after role fix
- [ ] `npm run build` — zero errors

---

*SankalpHub V3 Frontend — Bug Fix Sprint: Templates + Users Role*
*March 28, 2026*
