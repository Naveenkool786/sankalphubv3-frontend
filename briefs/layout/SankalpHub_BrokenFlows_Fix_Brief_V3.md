# SankalpHub — Broken Flows Fix Brief (V3 Frontend)
**For: Claude Code + Sub-Agents**
**Date:** March 28, 2026
**Scope:** Fix 2 broken flows — /demo form + /pricing redirect
**Mode:** Fix only. Do NOT redesign, restructure, or touch anything outside the specified files.

> ⚠️ **IMPORTANT — VERSION CLARITY**
> SankalpHub has three versions:
> - **V1 / V2** — Old Django backend. Path: `/var/www/Master_Sankalphub/Backend/`. **DO NOT TOUCH.**
> - **V3 Frontend** — Current live frontend. Path: `/var/www/Master_Sankalphub/V3.0_Frontend/`. **THIS IS YOUR ONLY WORKING DIRECTORY.**
>
> All work in this brief is exclusively on the **V3 Frontend**. Never navigate to or modify anything in the Backend path.

---

## PLATFORM CONTEXT (Read First)

| Item | Detail |
|------|--------|
| **Frontend Framework** | Next.js 15.2.1, React 19.2.4, TypeScript, Tailwind CSS |
| **UI Library** | shadcn/ui (Radix primitives) |
| **Auth** | Supabase Auth (email/password + magic link) |
| **Frontend Path** | `/var/www/Master_Sankalphub/V3.0_Frontend/` |
| **Process** | PM2 (`sankalphub-v2`) on port 3000 |
| **Repo** | GitHub: `Naveenkool786/sankalphubv3-frontend` → Vercel auto-deploy on push |
| **Database** | Supabase (hosted Postgres) — `jirhyxpcbfeelgiyxqdi.supabase.co` |
| **Supabase Tables** | organizations, profiles, projects, inspections, factories, templates, tasks, documents, **demo_requests** |
| **Backend** | Django + Gunicorn on port 8000 (separate — do NOT touch) |
| **Live URL** | https://sankalphub.in |

---

## CONFIRMED BROKEN FLOWS (Verified March 28, 2026)

### Flow 1 — /demo
- **URL:** https://sankalphub.in/demo
- **Symptom:** Page shows "Loading..." indefinitely. The form never renders.
- **Impact:** Every CTA on the landing page ("Request a Demo", "Become a Founding Member", "Claim Your Founding Spot") points here. This is a total conversion failure.

### Flow 2 — /pricing
- **URL:** https://sankalphub.in/pricing
- **Symptom:** Page redirects to `/login` instead of rendering the pricing content.
- **Impact:** The "See full feature comparison →" link on the landing page is broken. Prospective customers cannot view pricing without logging in.

---

## TASK ASSIGNMENT

```
Sub-Agent 1 → Task 1: Fix /demo broken form         [CRITICAL]
Sub-Agent 1 → Task 2: Fix /pricing redirect bug      [CRITICAL]  (run after Task 1)
Sub-Agent 2 → Can be idle or on standby for this sprint
Sub-Agent 3 → Can be idle or on standby for this sprint
```

Both tasks go to Sub-Agent 1 sequentially. They are independent files so there is no conflict, but keeping them on one agent avoids race conditions on middleware/config files.

---

## TASK 1 — Fix /demo Page (Broken Form)

**Priority:** 🔴 Critical
**Agent:** Sub-Agent 1

### Step 1 — Locate the file
```bash
find /var/www/Master_Sankalphub/V3.0_Frontend -type f \( -name "*.tsx" -o -name "*.ts" \) | grep -i demo | grep -v node_modules | grep -v .next
```
Expected: `app/demo/page.tsx` or `app/(public)/demo/page.tsx` or similar route group.

### Step 2 — Diagnose the "Loading..." issue
Read the file fully. The infinite loading is caused by one of these — identify which:

| Cause | What to look for |
|-------|-----------------|
| **A. Failed API/Supabase fetch** | `useEffect` fetching data that errors silently, leaving state as loading |
| **B. Broken dynamic import** | `next/dynamic(() => import(...), { ssr: false })` where the imported component throws an error |
| **C. Suspended component** | `<Suspense>` fallback never resolving because child component errors out |
| **D. Missing env variable** | A fetch to Supabase or an API using an env var that is undefined in production |
| **E. Auth guard** | Middleware or a `useEffect` checking auth and redirecting/blocking unauthenticated users |

Check `middleware.ts` immediately — it may be protecting `/demo` as an auth route. The `/demo` page must be **publicly accessible** with no auth required.

### Step 3 — Fix the root cause
- If it is **Cause A**: Add proper error handling and a fallback UI. Do not let failed fetches silently keep the loading state.
- If it is **Cause B**: Fix the dynamic import or replace with a static import if SSR is not a concern.
- If it is **Cause C**: Wrap with proper error boundaries or fix the suspended component.
- If it is **Cause D**: Check `.env.local` and Vercel environment variables. Add the missing variable.
- If it is **Cause E**: Remove `/demo` from any auth middleware matcher. Add it to the public routes list.

### Step 4 — Ensure the form renders with these fields
The demo request form must have the following fields. If the form already exists in the code but is not rendering, fix the render issue. If the form needs to be (re)built, use these specs:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Full Name | Text input | Yes | |
| Work Email | Email input | Yes | Validate email format |
| Company Name | Text input | Yes | |
| Your Role | Select dropdown | Yes | Options: Brand / Buyer, Factory / Manufacturer, Inspection Agency, Other |
| Phone / WhatsApp | Text input | No | Label it "Phone / WhatsApp (optional)" |
| Message | Textarea | No | Placeholder: "Tell us about your business and what you need" |
| Submit | Button | — | Label: "Request Demo" |

**Role pre-selection from URL param:**
If the URL contains `?role=factory` → pre-select "Factory / Manufacturer"
If the URL contains `?role=brand` → pre-select "Brand / Buyer"
If the URL contains `?role=agency` → pre-select "Inspection Agency"
Use `useSearchParams()` from `next/navigation` to read the param on the client side.

### Step 5 — Form submission
The `demo_requests` table already exists in Supabase. On form submit:

```typescript
// Insert into Supabase demo_requests table
const { error } = await supabase
  .from('demo_requests')
  .insert({
    full_name: formData.fullName,
    email: formData.email,
    company_name: formData.companyName,
    role: formData.role,
    phone: formData.phone || null,
    message: formData.message || null,
    created_at: new Date().toISOString(),
  });
```

Check the actual column names in the `demo_requests` table schema before writing the insert. Use the Supabase client already configured in the project — do not create a new one.

**On success:** Replace the form with a success message:
```
"Thank you, [First Name]! We'll be in touch within 24 hours."
```
Do NOT redirect. Keep the user on `/demo`.

**On error:** Show an inline error below the submit button:
```
"Something went wrong. Please try again or email us at hello@sankalphub.in"
```
Do NOT fail silently.

### Step 6 — Preserve existing page content
The Founding Member section (currently visible on the page) must stay intact:
- "Join the first 50 partners building the future of manufacturing."
- Industry type labels: Garments & Apparel, Footwear & Technical Molds, Gloves, Headwear & Accessories

Do not remove or reposition this content.

### Acceptance Criteria — Task 1
- [ ] `/demo` loads immediately with no "Loading..." state visible to user
- [ ] Form shows all 4 required fields + 2 optional fields
- [ ] `?role=` URL param correctly pre-selects the role dropdown
- [ ] Successful submission inserts a row into Supabase `demo_requests` table
- [ ] Successful submission shows confirmation message (no redirect)
- [ ] Failed submission shows inline error message (no silent failure)
- [ ] Founding Member content remains on the page
- [ ] Page is accessible without being logged in

---

## TASK 2 — Fix /pricing Route Redirect Bug

**Priority:** 🔴 Critical
**Agent:** Sub-Agent 1 (run after Task 1 is complete)

### Step 1 — Confirm the symptom
Visiting `https://sankalphub.in/pricing` redirects to `/login`. This is confirmed live as of March 28, 2026.

### Step 2 — Locate the cause (check in this order)

**Check 1: `middleware.ts`**
```bash
cat /var/www/Master_Sankalphub/V3.0_Frontend/middleware.ts
```
Look for a `matcher` array or route protection logic. `/pricing` must NOT be in the protected routes list. It must be in the public routes list.

Example of what to look for and fix:
```typescript
// WRONG — pricing is protected
const protectedRoutes = ['/dashboard', '/projects', '/pricing', '/inspections'];

// CORRECT — pricing must be public
const protectedRoutes = ['/dashboard', '/projects', '/inspections', '/app'];
const publicRoutes = ['/', '/pricing', '/demo', '/login', '/onboarding'];
```

**Check 2: `next.config.js` or `next.config.ts`**
```bash
cat /var/www/Master_Sankalphub/V3.0_Frontend/next.config.js
# or
cat /var/www/Master_Sankalphub/V3.0_Frontend/next.config.ts
```
Look for a `redirects` async function. If `/pricing` is listed there pointing to `/login`, remove that entry.

**Check 3: The pricing page file itself**
```bash
find /var/www/Master_Sankalphub/V3.0_Frontend -type f -name "*.tsx" | grep -i pricing | grep -v node_modules | grep -v .next
```
Open the file. Check if there is a `useEffect` or `getServerSideProps` or `redirect()` call that sends unauthenticated users to `/login`. If found, remove the auth guard from this file — `/pricing` is a public marketing page.

### Step 3 — Apply the fix
Whichever cause is identified, apply the minimal fix:
- Remove `/pricing` from protected route matchers
- Remove any redirect rule pointing `/pricing` → `/login`
- Remove any auth guard inside the pricing page component

### Step 4 — Verify public routes are all correct
After fixing `/pricing`, confirm these routes all load without redirecting:
- `/` (landing page)
- `/pricing`
- `/demo`
- `/login`
- `/onboarding`

And confirm these routes still correctly redirect to `/login` when not authenticated:
- `/dashboard` (or `/app/dashboard`)
- `/projects`
- `/inspections`
- `/console` (Founder Console)

### Acceptance Criteria — Task 2
- [ ] `https://sankalphub.in/pricing` loads without redirecting
- [ ] `/pricing` is accessible without being logged in
- [ ] "See full feature comparison →" link from landing page works
- [ ] All auth-protected routes (`/dashboard`, `/projects`, `/inspections`, `/console`) still redirect to `/login` when unauthenticated
- [ ] No other public routes were accidentally broken

---

## FINAL BUILD & DEPLOY STEPS (After Both Tasks)

Since the repo deploys to **Vercel automatically on push to GitHub**, the process is:

```bash
# 1. Run a local build check first
cd /var/www/Master_Sankalphub/V3.0_Frontend
npm run build

# 2. If build passes with zero errors, commit and push
git add -A
git commit -m "fix: demo form render + pricing page auth redirect"
git push origin main

# 3. Vercel will auto-deploy on push
# Monitor at: https://vercel.com (check deploy logs for errors)

# 4. After deploy, verify live:
# - https://sankalphub.in/demo  → form renders, no "Loading..."
# - https://sankalphub.in/pricing → loads without redirect
```

**If `npm run build` fails:** Fix all TypeScript/build errors before pushing. Do not push broken code.

---

## RULES FOR ALL AGENTS

1. **Read every file fully before editing it.** Never make blind edits.
2. **Touch only the files related to your task.** Do not refactor unrelated code.
3. **Do not change any UI styling** — colors, layout, fonts, spacing are out of scope.
4. **Do not remove any existing landing page content.**
8. **Your working directory is exclusively** `/var/www/Master_Sankalphub/V3.0_Frontend/`. Do not navigate to, read, or modify anything in `/var/www/Master_Sankalphub/Backend/` — that is the V1/V2 Django backend and is completely out of scope.
6. **Use the existing Supabase client** already configured in the project. Do not create a new instance.
7. **If you encounter a file that doesn't exist where expected**, use `find` to locate it. Do not assume the structure.
8. **Build must pass** (`npm run build`) before pushing to GitHub.

---

## FINAL VERIFICATION CHECKLIST

Run these checks after Vercel deploys:

- [ ] `https://sankalphub.in/demo` — form renders immediately, all fields visible, no "Loading..."
- [ ] `https://sankalphub.in/demo?role=factory` — Role dropdown pre-selects "Factory / Manufacturer"
- [ ] `https://sankalphub.in/demo?role=brand` — Role dropdown pre-selects "Brand / Buyer"
- [ ] `https://sankalphub.in/demo?role=agency` — Role dropdown pre-selects "Inspection Agency"
- [ ] Submit demo form with valid data — row appears in Supabase `demo_requests` table
- [ ] Submit demo form with invalid data — inline validation errors shown
- [ ] `https://sankalphub.in/pricing` — loads correctly, no redirect to /login
- [ ] `https://sankalphub.in/` — landing page unchanged
- [ ] `https://sankalphub.in/login` — still works
- [ ] `https://sankalphub.in/dashboard` — still redirects to /login when not authenticated
- [ ] `npm run build` — zero errors, zero warnings (or only pre-existing warnings)

---

*Brief V3 — SankalpHub V3 Frontend Only*
*Broken Flows Fix Sprint — /demo + /pricing*
*Verified live: March 28, 2026*
