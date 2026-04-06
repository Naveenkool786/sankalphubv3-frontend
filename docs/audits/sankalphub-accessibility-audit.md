# SankalpHub Accessibility Audit
**Standard:** WCAG 2.1 AA | **Date:** 2026-04-06 | **URL:** www.sankalphub.in

---

## Audit Progress
- [x] Step 1: Perceivable (Color & Visual Analysis) — 2 Critical, 2 Warnings
- [x] Step 2: Operable (Keyboard, Focus, Touch Targets) — 2 Critical, 4 Major
- [x] Step 3: Understandable (Labels, Forms, Predictability) — 3 Critical, 3 Major, 1 Minor
- [x] Step 4: Robust (ARIA, Semantics) — 1 Critical, 4 Major, 5 Passes
- [x] Step 5: Summary & Priority Fix List ✅ COMPLETE

---

## Color Data Collected (from Claude Code)

### Background Colors (Light / Dark)
| Name | Light Mode | Dark Mode |
|------|-----------|-----------|
| Muted/Sidebar bg | #F4F0EA | #1A2235 |
| Secondary bg | #F0F0F2 | #1A2235 |
| Accent bg | #F0EDE6 | #1F2A3D |
| Destructive | #EF4444 | #EF4444 |

### Feature Icon Accent Colors (Tailwind)
| Token | Hex | Used For |
|-------|-----|----------|
| blue-500 | #3B82F6 | Trade & Tariff, AQL Template |
| blue-600 | #2563EB | Brand/Buyer role |
| emerald-500 | #10B981 | Traceability, Analytics |
| emerald-600 | #059669 | Inspector role |
| amber-500 | #F59E0B | Execution Lag, Workflows |
| purple-500 | #A855F7 | Auto-generated Reports |
| teal-500 | #14B8A6 | Role-based Access |
| rose-500 | #F43F5E | Multi-tenant Architecture |

### Gradients
- Hero glow: `radial-gradient(ellipse, rgba(201,169,110,0.08), transparent)`
- Founding section: `radial-gradient(circle, rgba(201,169,110,0.08), transparent)`
- Pro plan card: `linear-gradient(160deg, hsl(var(--card)), rgba(201,169,110,0.04))`
- Logo gradients: `#EDD898 → #A87C30` and `#C9A96E → #8B6520`

### Complete Color Set (from Claude Code — globals.css / page.tsx)
| Name | Light | Dark |
|------|-------|------|
| Page background | #FAF9F7 | #0D1420 |
| Primary text | #111113 | #F0F0F2 |
| Muted/secondary text | #71717A | #888890 |
| Heading color (H1/H2/H3) | #111113 | #F0F0F2 |
| Accent heading | #A87C30 | #C9A96E |
| Button background | #A87C30 | #C9A96E |
| Button text | #FFFFFF | #0D1420 |
| Destructive | #EF4444 | #EF4444 |

---

## Step 1 Findings: Perceivable — Color Contrast (WCAG 1.4.3)

### Dark Mode Results
| Combination | Ratio | Required | Result |
|-------------|-------|----------|--------|
| Primary text (#F0F0F2) on page bg (#0D1420) | 16.21:1 | 4.5:1 | ✅ PASS |
| Muted text (#888890) on page bg (#0D1420) | 5.25:1 | 4.5:1 | ✅ PASS |
| Accent heading (#C9A96E) on page bg (#0D1420) | 8.25:1 | 4.5:1 | ✅ PASS |
| Button text (#0D1420) on button bg (#C9A96E) | 8.25:1 | 4.5:1 | ✅ PASS |
| Muted text (#888890) on secondary bg (#1A2235) | 4.51:1 | 4.5:1 | ✅ PASS ⚠️ Borderline |
| Primary text (#F0F0F2) on secondary bg (#1A2235) | 13.93:1 | 4.5:1 | ✅ PASS |
| Accent heading (#C9A96E) on secondary bg (#1A2235) | 7.09:1 | 4.5:1 | ✅ PASS |
| Destructive red (#EF4444) on page bg (#0D1420) | 4.90:1 | 4.5:1 | ✅ PASS |
| blue-500 (#3B82F6) icon on page bg | 5.02:1 | 3:1 (UI) | ✅ PASS |
| emerald-500 (#10B981) icon on page bg | 7.27:1 | 3:1 (UI) | ✅ PASS |
| amber-500 (#F59E0B) icon on page bg | 8.59:1 | 3:1 (UI) | ✅ PASS |
| purple-500 (#A855F7) icon on page bg | 4.66:1 | 3:1 (UI) | ✅ PASS |
| teal-500 (#14B8A6) icon on page bg | 7.41:1 | 3:1 (UI) | ✅ PASS |
| rose-500 (#F43F5E) icon on page bg | 5.03:1 | 3:1 (UI) | ✅ PASS |

### Light Mode Results
| Combination | Ratio | Required | Result |
|-------------|-------|----------|--------|
| Primary text (#111113) on page bg (#FAF9F7) | 17.93:1 | 4.5:1 | ✅ PASS |
| Muted text (#71717A) on page bg (#FAF9F7) | 4.59:1 | 4.5:1 | ✅ PASS ⚠️ Borderline |
| Accent heading (#A87C30) on page bg (#FAF9F7) | 3.57:1 | 4.5:1 | ❌ FAIL (normal text) |
| Accent heading (#A87C30) on page bg (#FAF9F7) | 3.57:1 | 3.0:1 | ✅ PASS (large text only) |
| Button text (#FFFFFF) on button bg (#A87C30) | 3.76:1 | 4.5:1 | ❌ FAIL |

### Step 1 Issues
| # | Issue | WCAG | Severity | Fix |
|---|-------|------|----------|-----|
| 1 | Light mode: Accent heading #A87C30 on #FAF9F7 = 3.57:1 — fails for normal text | 1.4.3 | 🔴 Critical | Darken to ~#7A5A20, or restrict use to large/bold text only (18px+ or 14px+ bold) |
| 2 | Light mode: CTA button — white #FFFFFF on gold #A87C30 = 3.76:1 — fails | 1.4.3 | 🔴 Critical | Darken button bg to ~#8A6520 for white text, OR use dark text #0D1420 on button (already done in dark mode) |
| 3 | Dark mode: Muted text on secondary bg = 4.51:1 — barely passes | 1.4.3 | 🟡 Warning | Lighten muted text slightly to ~#999 to create safer margin |
| 4 | Light mode: Muted text on page bg = 4.59:1 — barely passes | 1.4.3 | 🟡 Warning | Darken muted text to ~#6A6A6A for safer margin |

## Step 2 Findings: Operable — Keyboard, Focus & Touch Targets

### Data Collected (from Claude Code)

#### Focus Styles
| Element | Style | Notes |
|---------|-------|-------|
| Form inputs (globals.css:164-170) | `outline: none !important` + `border-color: #C9A96E` + `box-shadow: 0 0 0 2px rgba(201,169,110,0.15)` | Outline removed, replaced with border + faint shadow |
| Buttons (button.tsx:8) | `focus-visible:outline-none` + `focus-visible:ring-2` + `focus-visible:ring-ring` + `focus-visible:ring-offset-2` | Custom gold ring (#A87C30 light / #C9A96E dark) |
| Links `<a>` | None defined | ❌ No focus style found |

#### Button Touch Targets (button.tsx:22-27)
| Size | Height | Width | Pass 44px? |
|------|--------|-------|------------|
| default | 40px | auto | ❌ FAIL |
| sm | 36px | auto | ❌ FAIL |
| lg | 44px | auto | ✅ PASS |
| icon | 40px | 40px | ❌ FAIL |

#### Skip Navigation Link
- **Not found** anywhere in layout.tsx or page.tsx ❌

### Step 2 Issues
| # | Issue | WCAG | Severity | Fix |
|---|-------|------|----------|-----|
| 1 | No skip navigation link exists | 2.4.1 | 🔴 Critical | Add `<a href="#main-content" class="skip-link">Skip to main content</a>` as first element in layout.tsx. Style it visually hidden until focused |
| 2 | Links `<a>` have no focus style defined — invisible to keyboard users | 2.4.7 | 🔴 Critical | Add `a:focus-visible { outline: 2px solid #C9A96E; outline-offset: 2px; }` to globals.css |
| 3 | Form input focus uses `box-shadow` at only 15% opacity — nearly invisible | 2.4.7 | 🟡 Major | Increase to at least 50% opacity or use `outline` instead: `box-shadow: 0 0 0 2px rgba(201,169,110,0.6)` |
| 4 | Default button height 40px — below 44px WCAG minimum | 2.5.5 | 🟡 Major | Change default from `h-10` to `h-11` (44px) in button.tsx |
| 5 | Small button height 36px — well below 44px minimum | 2.5.5 | 🟡 Major | Increase `sm` from `h-9` to `h-11` (44px), or avoid using sm size on primary actions |
| 6 | Icon button 40×40px — just below 44×44 minimum | 2.5.5 | 🟡 Major | Change from `h-10 w-10` to `h-11 w-11` (44×44px) in button.tsx |

## Step 3 Findings: Understandable — Forms, Labels & Error Messages

### Data Collected (from Claude Code)

#### 1. Label Associations (~30% properly linked)
| File | Status |
|------|--------|
| FormStatusDetails, CreateProjectDialog, demo/page.tsx, reset-password/page.tsx | ✅ Proper `htmlFor` + `id` |
| signup/page.tsx | ❌ `<Label>` rendered but no `htmlFor`, no `id` on inputs |
| login/page.tsx | ❌ `<label>` tags but no `htmlFor`, no `id` — relies on placeholder |
| factories/new/page.tsx | ❌ Inline `<label>` with no `htmlFor`, no `id` |
| inspections/new/page.tsx | ❌ Same — no `htmlFor`, no `id` |
| SettingsClient.tsx | ❌ `<Label>` without `htmlFor`, `<Input>` without `id` |

#### 2. Validation Error Display
| Pattern | Where |
|---------|-------|
| `<p className="text-destructive">` inline text | signup/page.tsx:381 |
| Styled error box (red bg + border) | login/page.tsx:212-224 |
| `toast.error()` — Sonner toasts | factories/new, inspections/new, settings |
| `aria-invalid` on inputs | ❌ Nowhere |
| `aria-describedby` linking error to input | ❌ Nowhere |

#### 3. Required Field Indicators
| Form | Asterisk (*) | HTML `required` | `aria-required` |
|------|-------------|-----------------|-----------------|
| factories/new | ✅ Yes | ✅ Yes | ❌ No |
| inspections/new | ✅ Yes | ❌ No | ❌ No |
| CreateProjectDialog | ✅ Yes | ❌ No | ❌ No |
| demo | ✅ Yes | ❌ No | ❌ No |
| settings | ✅ Yes | ❌ No | ❌ No |
| login | ❌ No | ✅ Yes | ❌ No |
| signup | ❌ No | ❌ No | ❌ No |
| **`aria-required`** | — | — | ❌ **Never used** |

#### 4. Autocomplete Attributes
- **0% usage** across all forms — not on email, password, name, phone, or company inputs
- Affected forms: login, signup, factories contact, demo request, settings

### Step 3 Issues
| # | Issue | WCAG | Severity | Fix |
|---|-------|------|----------|-----|
| 1 | 70% of form inputs lack `htmlFor`/`id` pairing — screen readers cannot associate label with field (affects signup, login, factories/new, inspections/new, SettingsClient) | 3.3.2 | 🔴 Critical | Add matching `id` to every `<input>` and `htmlFor` to every `<Label>`. E.g. `<Label htmlFor="email">` + `<Input id="email">` |
| 2 | Error messages have no `aria-invalid` or `aria-describedby` — screen readers never announce errors to blind users | 3.3.1 | 🔴 Critical | Add `aria-invalid="true"` to input on error, and `aria-describedby="email-error"` pointing to the error `<p id="email-error">` |
| 3 | Zero forms use `autocomplete` attribute — affects all users, especially those with motor disabilities relying on autofill | 1.3.5 | 🔴 Critical | Add `autocomplete="email"`, `autocomplete="current-password"`, `autocomplete="name"` etc. to every relevant input |
| 4 | `aria-required` never used anywhere — screen readers cannot announce which fields are required | 3.3.2 | 🟡 Major | Add `aria-required="true"` to all required inputs. Use alongside HTML `required` attribute |
| 5 | Toast errors (Sonner) used for validation — toasts auto-dismiss and screen readers may miss them entirely | 3.3.1 | 🟡 Major | Keep toast for success/info. Use persistent inline error messages for form validation errors |
| 6 | login and signup have no required field indicator at all — sighted users also affected | 3.3.2 | 🟡 Major | Add asterisk (*) visual indicator + `<span className="sr-only">required</span>` for screen readers |
| 7 | Placeholder text used as label substitute — disappears when user starts typing | 3.3.2 | 🟢 Minor | Always pair a visible `<Label>` with every input. Placeholder can remain as hint text, not as the label |

## Step 4 Findings: Robust — ARIA, Semantics & Page Structure

### Data Collected (from Claude Code)

#### 1. Language Attribute
- ✅ `<html lang="en" suppressHydrationWarning>` — layout.tsx:22

#### 2. Semantic Landmarks (Landing Page)
| Element | Present | Location |
|---------|---------|----------|
| `<nav>` | ✅ Yes | page.tsx:256 — fixed navbar |
| `<section>` | ✅ Yes (×8) | Lines 310, 365, 389, 415, 449, 476, 555, 599 |
| `<footer>` | ✅ Yes | page.tsx:626 |
| `<main>` | ❌ Missing | No `<main>` wrapping content |
| `<header>` | ❌ Missing | Navbar is bare `<nav>`, no `<header>` wrapper |
| Explicit ARIA roles | ❌ None | No `role="navigation"`, `role="main"` etc. |

#### 3. Heading Hierarchy
| Line | Tag | Content |
|------|-----|---------|
| 331 | h1 | "Build Better Products, Faster." |
| 369 | h2 | "The world has changed..." |
| 379 | h3 | Pain point titles (×3) |
| 393 | h2 | "Up and running in three steps" |
| 403 | h3 | Step titles (×3) |
| 419 | h2 | "Each role gets a purpose-built experience" |
| 429 | h3 | Role titles (×3) |
| 453 | h2 | "Everything you need to manage quality at scale" |
| 466 | h3 | Feature titles (×6) |
| 480 | h2 | "Start free. Scale when you're ready." |
| 509 | h3 | Pricing plan names (×3) |
| 570 | h2 | "Be an Architect of the Ecosystem..." |
| 602 | h2 | "Ready to get started?" |
| 612 | h3 | CTA headlines (×3) |
**Result: ✅ Single h1, logical nesting, no skipped levels**

#### 4. ARIA on Interactive Components
| Component | File | ARIA Source | Status |
|-----------|------|-------------|--------|
| Dialog | components/ui/dialog.tsx | Radix auto: `role="dialog"`, `aria-modal`, `aria-labelledby` | ✅ |
| DropdownMenu | components/ui/dropdown-menu.tsx | Radix auto: `role="menu"`, `aria-expanded`, `aria-haspopup` | ✅ |
| Sheet | components/ui/sheet.tsx | Radix Dialog base — same ARIA + `sr-only` close | ✅ |
| Tabs | components/ui/tabs.tsx | Radix auto: `role="tablist"`, `role="tab"`, `aria-selected` | ✅ |
| Select | components/ui/select.tsx | Radix auto: `role="combobox"`, `aria-expanded` | ✅ |
| Popover | components/ui/popover.tsx | Radix auto: focus management, keyboard nav | ✅ |
| Form | components/ui/form.tsx | Explicit `aria-describedby` + `aria-invalid` (lines 116-121) | ✅ |
| Mobile menu button | page.tsx:283-288 | No `aria-expanded`, no `aria-label` | ❌ |

#### 5. aria-live Regions
| Source | Status |
|--------|--------|
| Sonner toasts | ✅ Built-in `role="status"` + `aria-live="polite"` (Sonner v2 automatic) |
| Custom `aria-live` | ❌ Zero explicit `aria-live` in custom code |
| `aria-busy` | ❌ No loading state indicators anywhere |
| `role="alert"` | ❌ None found |

### Step 4 Issues
| # | Issue | WCAG | Severity | Fix |
|---|-------|------|----------|-----|
| 1 | No `<main>` landmark — screen reader users cannot jump to main content, and skip link (Step 2 fix) has nothing to point to | 1.3.1 / 4.1.2 | 🔴 Critical | Wrap all landing page content in `<main id="main-content">` in page.tsx |
| 2 | No `<header>` wrapping the navbar | 1.3.1 | 🟡 Major | Wrap `<nav>` inside `<header>` element |
| 3 | Mobile menu button (page.tsx:283-288) has no `aria-expanded` or `aria-label` — screen readers can't identify or announce its state | 4.1.2 | 🟡 Major | Add `aria-expanded={isMenuOpen}` and `aria-label="Toggle navigation menu"` to button |
| 4 | No `aria-busy` anywhere — when data loads, screen reader users get zero feedback | 4.1.3 | 🟡 Major | Add `aria-busy="true"` to containers during loading, `aria-busy="false"` when done |
| 5 | No `role="alert"` for critical error states — errors that need immediate announcement are silent | 4.1.3 | 🟡 Major | Add `role="alert"` to destructive/error message containers |

### Step 4 ✅ Positives (What's Working Well)
- ✅ `lang="en"` correctly set on `<html>`
- ✅ Heading hierarchy is clean — single h1, logical h2→h3 nesting, no skipped levels
- ✅ Radix UI provides automatic ARIA for all complex components (Dialog, Dropdown, Tabs, Select, Popover)
- ✅ Form component (form.tsx) has `aria-describedby` + `aria-invalid` built in — just needs consistent use
- ✅ Sonner toasts have built-in `aria-live="polite"` — notifications are announced automatically

## Step 5: Final Summary & Priority Fix Plan

---

### Overall Score

| Category | Issues | Critical | Major | Minor/Warning |
|----------|--------|----------|-------|---------------|
| Step 1 — Perceivable | 4 | 2 | 0 | 2 |
| Step 2 — Operable | 6 | 2 | 4 | 0 |
| Step 3 — Understandable | 7 | 3 | 3 | 1 |
| Step 4 — Robust | 5 | 1 | 4 | 0 |
| **TOTAL** | **22** | **8** | **11** | **3** |

---

### What's Already Working Well ✅
- Dark mode color contrast — all combinations pass comfortably
- Heading hierarchy — clean single h1, logical h2→h3 nesting
- Radix UI components — Dialog, Dropdown, Tabs, Select, Popover all have full ARIA automatically
- `lang="en"` set correctly on `<html>`
- Sonner toasts have built-in `aria-live="polite"`
- form.tsx has `aria-describedby` + `aria-invalid` built in — just needs consistent use

---

### Sprint 1 — Quick Wins (< 30 min each | Fix Today)
These are single-line or two-line fixes with maximum accessibility impact.

| Priority | File | Fix | WCAG | Severity |
|----------|------|-----|------|----------|
| 1 | `page.tsx` | Wrap all content in `<main id="main-content">` | 1.3.1 | 🔴 Critical |
| 2 | `layout.tsx` | Add skip link: `<a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground">Skip to main content</a>` | 2.4.1 | 🔴 Critical |
| 3 | `globals.css` | Add `a:focus-visible { outline: 2px solid #C9A96E; outline-offset: 2px; }` | 2.4.7 | 🔴 Critical |
| 4 | `globals.css` | Increase input focus shadow opacity from `0.15` to `0.6`: `box-shadow: 0 0 0 2px rgba(201,169,110,0.6)` | 2.4.7 | 🟡 Major |
| 5 | `globals.css` | Darken light mode button bg from `#A87C30` to `#8A6520` (white text passes at 4.6:1) | 1.4.3 | 🔴 Critical |
| 6 | `page.tsx:256` | Wrap `<nav>` in `<header>` | 1.3.1 | 🟡 Major |
| 7 | `page.tsx:283-288` | Add `aria-expanded={isMenuOpen}` and `aria-label="Toggle navigation menu"` to mobile menu button | 4.1.2 | 🟡 Major |

---

### Sprint 2 — One-File Fixes (1–2 hours | Fix This Week)

| Priority | File | Fix | WCAG | Severity |
|----------|------|-----|------|----------|
| 8 | `button.tsx` | Change default: `h-10` → `h-11` (44px). Change sm: `h-9` → `h-11`. Change icon: `h-10 w-10` → `h-11 w-11` | 2.5.5 | 🟡 Major |
| 9 | `globals.css` (light mode) | Darken accent heading: `.text-primary { color: #7A5A20 }` in light mode, or restrict `text-primary` class to headings ≥18px only | 1.4.3 | 🔴 Critical |
| 10 | All forms | Add `autocomplete` to every relevant input: `autocomplete="email"`, `autocomplete="current-password"`, `autocomplete="new-password"`, `autocomplete="name"`, `autocomplete="organization"` | 1.3.5 | 🔴 Critical |
| 11 | All forms | Add `aria-required="true"` to every required input alongside the existing HTML `required` attribute | 3.3.2 | 🟡 Major |
| 12 | `login/page.tsx`, `signup/page.tsx` | Add asterisk (*) required indicators + `<span className="sr-only">required</span>` to all required fields | 3.3.2 | 🟡 Major |

---

### Sprint 3 — Multi-File Form Fixes (2–4 hours | Fix This Sprint)

| Priority | Files | Fix | WCAG | Severity |
|----------|-------|-----|------|----------|
| 13 | `signup/page.tsx`, `login/page.tsx`, `factories/new/page.tsx`, `inspections/new/page.tsx`, `SettingsClient.tsx` | Add matching `id` to every `<Input>` and `htmlFor` to every `<Label>`. Pattern: `<Label htmlFor="email">Email</Label>` + `<Input id="email" />` | 3.3.2 | 🔴 Critical |
| 14 | Same 5 files above | Add `aria-invalid={!!error}` to each input, add `id="field-error"` to each error `<p>`, add `aria-describedby="field-error"` to each input | 3.3.1 | 🔴 Critical |
| 15 | `factories/new`, `inspections/new`, `settings` | Replace `toast.error()` for form validation with persistent inline error messages. Keep `toast.error()` for system/server errors only | 3.3.1 | 🟡 Major |

---

### Sprint 4 — Loading & Alert States (1–2 hours | Nice to Have Soon)

| Priority | Where | Fix | WCAG | Severity |
|----------|-------|-----|------|----------|
| 16 | All data-loading containers | Add `aria-busy="true"` during loading, set to `aria-busy="false"` on completion | 4.1.3 | 🟡 Major |
| 17 | All destructive error containers | Add `role="alert"` so screen readers announce critical errors immediately | 4.1.3 | 🟡 Major |
| 18 | Dark mode globally | Nudge muted text from `#888890` to `#999999` — safer margin above 4.5:1 | 1.4.3 | 🟡 Warning |
| 19 | Light mode globally | Nudge muted text from `#71717A` to `#6A6A6A` — safer margin above 4.5:1 | 1.4.3 | 🟡 Warning |
| 20 | All forms | Remove placeholder-as-label patterns. Keep placeholders as examples only (e.g. `placeholder="you@company.com"`) | 3.3.2 | 🟢 Minor |

---

### Developer Handoff Notes

#### Files Requiring Changes (by impact)
| File | Changes Needed | Sprint |
|------|---------------|--------|
| `globals.css` | Skip link styles, link focus, input focus opacity, light mode button bg, accent heading color, muted text nudge | 1 & 2 |
| `button.tsx` | Button height: default h-11, sm h-11, icon h-11 w-11 | 2 |
| `layout.tsx` | Add skip navigation link | 1 |
| `page.tsx` | Add `<main>`, `<header>`, fix mobile menu button ARIA | 1 |
| `signup/page.tsx` | htmlFor/id, aria-invalid, aria-describedby, autocomplete, aria-required | 3 |
| `login/page.tsx` | htmlFor/id, aria-invalid, aria-describedby, autocomplete, aria-required, required indicators | 3 |
| `factories/new/page.tsx` | htmlFor/id, aria-invalid, autocomplete, aria-required, replace toast validation errors | 3 |
| `inspections/new/page.tsx` | htmlFor/id, aria-invalid, autocomplete, aria-required, replace toast validation errors | 3 |
| `SettingsClient.tsx` | htmlFor/id, aria-invalid, aria-describedby, autocomplete | 3 |

#### Quick Reference: Form Input Pattern (apply to all forms)
```tsx
<Label htmlFor="email">
  Email <span aria-hidden="true">*</span>
  <span className="sr-only">required</span>
</Label>
<Input
  id="email"
  type="email"
  autoComplete="email"
  required
  aria-required="true"
  aria-invalid={!!emailError}
  aria-describedby={emailError ? "email-error" : undefined}
/>
{emailError && (
  <p id="email-error" className="text-destructive text-sm" role="alert">
    {emailError}
  </p>
)}
```

---

### Estimated Total Fix Time
| Sprint | Effort | Impact |
|--------|--------|--------|
| Sprint 1 — Quick Wins | ~2 hours | Fixes 4 Critical, 3 Major |
| Sprint 2 — One-File Fixes | ~3 hours | Fixes 3 Critical, 2 Major |
| Sprint 3 — Form Fixes | ~4 hours | Fixes 2 Critical, 2 Major |
| Sprint 4 — Polish | ~2 hours | Fixes 2 Major, 3 Warnings |
| **Total** | **~11 hours** | **All 22 issues resolved** |

