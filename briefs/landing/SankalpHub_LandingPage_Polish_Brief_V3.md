# SankalpHub — Landing Page Polish Brief (V3 Frontend)
**For: Claude Code + Sub-Agents**
**Date:** March 28, 2026
**Scope:** 3 small landing page fixes — branding consistency, hero stat, footer legal links
**Mode:** Fix only. Do NOT redesign, restructure, or touch anything outside the specified files.

> ⚠️ **WORKING DIRECTORY: V3 Frontend ONLY**
> All work is exclusively in `/var/www/Master_Sankalphub/V3.0_Frontend/`
> Do NOT touch `/var/www/Master_Sankalphub/Backend/` — that is the V1/V2 Django backend. Out of scope entirely.

---

## PLATFORM CONTEXT

| Item | Detail |
|------|--------|
| **Frontend Framework** | Next.js 15.2.1, React 19.2.4, TypeScript, Tailwind CSS |
| **UI Library** | shadcn/ui (Radix primitives) |
| **Frontend Path** | `/var/www/Master_Sankalphub/V3.0_Frontend/` |
| **Repo** | GitHub: `Naveenkool786/sankalphubv3-frontend` → Vercel auto-deploy on push |
| **Live URL** | https://sankalphub.in |

---

## TASK OVERVIEW

| Task | Description | Priority | Agent |
|------|-------------|----------|-------|
| Task 1 | Fix inconsistent product name across the site | 🟡 Medium | Sub-Agent 1 |
| Task 2 | Replace weak hero stat "3 Industry Types" | 🟡 Medium | Sub-Agent 1 |
| Task 3 | Add footer legal links + create /privacy and /terms pages | 🟡 Medium | Sub-Agent 2 |

Tasks 1 and 2 touch the same files — assign to **Sub-Agent 1** and run sequentially.
Task 3 touches only the footer component and creates new route files — assign to **Sub-Agent 2** and run in parallel.

---

## TASK 1 — Fix Inconsistent Product Name

**Agent:** Sub-Agent 1
**Files affected:** `app/layout.tsx`, `app/page.tsx` (or landing page component), any metadata files

### Problem
The site currently uses two different names in different places:
- Page `<title>` tag: **"SankalpHub — Quality Management Platform"**
- Hero section: **"Production Intelligence Platform"**
- Footer: **"SankalpHub— Production Intelligence Platform"** ✅ (already correct)

This creates brand confusion for first-time visitors.

### Fix
Standardize to **"Production Intelligence Platform"** everywhere. This is the chosen brand name.

### Step-by-Step

**Step 1 — Find all occurrences of the old name**
```bash
grep -r "Quality Management Platform" /var/www/Master_Sankalphub/V3.0_Frontend --include="*.tsx" --include="*.ts" --include="*.js" --include="*.jsx" -l | grep -v node_modules | grep -v .next
```

**Step 2 — Update each file found**

For every file returned, replace:
```
Quality Management Platform
```
with:
```
Production Intelligence Platform
```

**Step 3 — Update metadata specifically**

In `app/layout.tsx` (or wherever metadata is defined), update:

```typescript
// BEFORE
export const metadata: Metadata = {
  title: 'SankalpHub — Quality Management Platform',
  description: '...Quality Management Platform...',
  openGraph: {
    title: 'SankalpHub — Quality Management Platform',
    ...
  }
}

// AFTER
export const metadata: Metadata = {
  title: 'SankalpHub — Production Intelligence Platform',
  description: 'A unified operating platform for manufacturing quality, inspection workflows, and supply chain visibility.',
  openGraph: {
    title: 'SankalpHub — Production Intelligence Platform',
    ...
  }
}
```

Only update the fields that contain "Quality Management Platform". Do not change any other metadata fields.

**Step 4 — Verify**
```bash
grep -r "Quality Management Platform" /var/www/Master_Sankalphub/V3.0_Frontend --include="*.tsx" --include="*.ts" --include="*.js" --include="*.jsx" | grep -v node_modules | grep -v .next
```
This should return zero results.

### Acceptance Criteria — Task 1
- [ ] Zero occurrences of "Quality Management Platform" remain in the codebase
- [ ] Page `<title>` reads: `SankalpHub — Production Intelligence Platform`
- [ ] `og:title` and `og:description` are updated if they existed
- [ ] No other content on the page was changed

---

## TASK 2 — Replace Weak Hero Stat

**Agent:** Sub-Agent 1 (run immediately after Task 1)
**Files affected:** Landing page component — `app/page.tsx` or a `HeroSection` or `StatsBar` component

### Problem
The hero stats bar currently shows:
```
50 Founding Slots  |  3 Industry Types  |  < 24 hr Onboarding  |  5 Roles Supported
```

**"3 Industry Types"** is a weak stat. It does not communicate value to a prospective customer.

### Fix
Replace **"3 Industry Types"** with:
- **Number/Value:** `100%`
- **Label:** `Digital. No Paper`

### Step-by-Step

**Step 1 — Locate the stats bar**
```bash
grep -r "Industry Types" /var/www/Master_Sankalphub/V3.0_Frontend --include="*.tsx" --include="*.ts" --include="*.jsx" -l | grep -v node_modules | grep -v .next
```

**Step 2 — Find the exact stat item**

The stat block will look something like this (exact syntax may vary):
```tsx
// Example structure — find the actual one in your codebase
{ value: "3", label: "Industry Types" }
// or
<StatItem value="3" label="Industry Types" />
// or inline JSX
<div>
  <span>3</span>
  <span>Industry Types</span>
</div>
```

**Step 3 — Replace only that one stat item**
```tsx
// BEFORE
{ value: "3", label: "Industry Types" }

// AFTER
{ value: "100%", label: "Digital. No Paper" }
```

If it is inline JSX, replace the text content of those two spans only. Do not change the surrounding structure, styling, or any other stat items.

**Step 4 — Verify**
The stats bar should now read:
```
50 Founding Slots  |  100% Digital. No Paper  |  < 24 hr Onboarding  |  5 Roles Supported
```

### Acceptance Criteria — Task 2
- [ ] "3 Industry Types" no longer appears on the landing page
- [ ] New stat shows "100%" with label "Digital. No Paper"
- [ ] The other 3 stats (Founding Slots, Onboarding, Roles) are unchanged
- [ ] No styling or layout changes were made

---

## TASK 3 — Add Footer Legal Links + Create /privacy and /terms Pages

**Agent:** Sub-Agent 2 (run in parallel with Sub-Agent 1)
**Files affected:** Footer component, new files: `app/privacy/page.tsx`, `app/terms/page.tsx`

### Problem
The footer currently only shows:
```
Features · Who It's For · Request Demo · Login
© 2026 SankalpHub
```

No Privacy Policy or Terms of Service links exist. Enterprise buyers and international brands require these before trusting a platform. Their absence makes the product look unfinished.

### Fix in 3 steps:

---

### Step 3A — Locate the footer component
```bash
find /var/www/Master_Sankalphub/V3.0_Frontend -type f \( -name "*.tsx" -o -name "*.ts" \) | xargs grep -l "© 2026 SankalpHub" | grep -v node_modules | grep -v .next
```

Open the file. Read it fully before editing.

### Step 3B — Add legal links to footer

Add the following links to the footer, placed on the same line as or directly below the copyright text:

```
Privacy Policy  ·  Terms of Service  ·  Contact
```

Use Next.js `<Link>` component:
```tsx
import Link from 'next/link'

// Add these links near the copyright line
<Link href="/privacy">Privacy Policy</Link>
<span>·</span>
<Link href="/terms">Terms of Service</Link>
<span>·</span>
<a href="mailto:hello@sankalphub.in">Contact</a>
```

**Styling rules:**
- Match the exact font size, color, and opacity of the existing footer links
- Match the existing hover behavior (color change on hover)
- Do NOT change the footer layout, background, or any existing links
- If the existing footer uses a specific text color class (e.g., `text-gray-400`), use the same class for the new links

---

### Step 3C — Create /privacy placeholder page

Create file: `app/privacy/page.tsx`

```tsx
import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — SankalpHub',
}

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-gray-600">
        This page is being updated. For any privacy-related queries, 
        please contact us at{' '}
        <a 
          href="mailto:hello@sankalphub.in" 
          className="text-blue-600 underline"
        >
          hello@sankalphub.in
        </a>
        .
      </p>
      <Link href="/" className="mt-8 inline-block text-sm text-gray-500 hover:text-gray-700">
        ← Back to home
      </Link>
    </main>
  )
}
```

**Important:** Wrap the content with the site's existing layout (navbar + footer) if the project uses a shared layout file (e.g., `app/layout.tsx`). If the layout is applied globally via `app/layout.tsx`, no additional wrapping is needed — it will be applied automatically.

---

### Step 3D — Create /terms placeholder page

Create file: `app/terms/page.tsx`

```tsx
import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — SankalpHub',
}

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-gray-600">
        This page is being updated. For any queries related to our terms, 
        please contact us at{' '}
        <a 
          href="mailto:hello@sankalphub.in" 
          className="text-blue-600 underline"
        >
          hello@sankalphub.in
        </a>
        .
      </p>
      <Link href="/" className="mt-8 inline-block text-sm text-gray-500 hover:text-gray-700">
        ← Back to home
      </Link>
    </main>
  )
}
```

---

### Step 3E — Ensure both new pages are publicly accessible

Check `middleware.ts` — confirm `/privacy` and `/terms` are NOT in any protected routes list. They must be publicly accessible without authentication.

### Acceptance Criteria — Task 3
- [ ] Footer shows "Privacy Policy · Terms of Service · Contact" links
- [ ] New links match the styling of existing footer links
- [ ] `/privacy` page loads with placeholder content and site layout
- [ ] `/terms` page loads with placeholder content and site layout
- [ ] Contact link opens email to `hello@sankalphub.in`
- [ ] Both new pages are accessible without logging in
- [ ] No existing footer content or links were changed or removed

---

## BUILD & DEPLOY (After All Tasks Complete)

```bash
# 1. Run build check
cd /var/www/Master_Sankalphub/V3.0_Frontend
npm run build

# 2. If build passes — commit and push
git add -A
git commit -m "fix: consistent branding, hero stat update, footer legal links"
git push origin main

# 3. Vercel auto-deploys on push — monitor deploy logs for errors
```

**Do not push if `npm run build` fails.** Fix all TypeScript/build errors first.

---

## RULES FOR ALL AGENTS

1. **Read every file fully before editing.**
2. **Touch only the files specified in your task.**
3. **Do not change any UI styling** — colors, fonts, spacing, layout — unless explicitly required by the task.
4. **Do not remove any existing landing page content.**
5. **Do not touch** `/var/www/Master_Sankalphub/Backend/` — V1/V2 Django backend, completely out of scope.
6. **Use existing components and patterns** already in the codebase. Do not introduce new libraries.
7. **Build must pass** (`npm run build`) before pushing.

---

## FINAL VERIFICATION CHECKLIST

After Vercel deploys, verify live at https://sankalphub.in:

- [ ] Page `<title>` reads: `SankalpHub — Production Intelligence Platform`
- [ ] No instance of "Quality Management Platform" visible anywhere on the site
- [ ] Hero stats bar shows: `50 Founding Slots · 100% Digital. No Paper · < 24 hr Onboarding · 5 Roles Supported`
- [ ] Footer shows: `Privacy Policy · Terms of Service · Contact` links
- [ ] `https://sankalphub.in/privacy` loads without redirect or error
- [ ] `https://sankalphub.in/terms` loads without redirect or error
- [ ] All existing landing page sections are intact and unchanged
- [ ] `npm run build` — zero errors

---

*SankalpHub V3 Frontend — Landing Page Polish Sprint*
*March 28, 2026*
