# SankalpHub — Platform-wide Layout + Input Consistency Fix Brief (V3 Frontend)
**For: Claude Code**
**Date:** April 3, 2026
**Scope:** Fix empty page space, unequal columns, and inconsistent input/select heights across entire platform
**Mode:** CSS and layout fixes only. Do NOT touch any business logic.

> ⚠️ **WORKING DIRECTORY: V3 Frontend ONLY**
> All work is in `/var/www/Master_Sankalphub/V3.0_Frontend/`

---

## PROBLEMS TO FIX (from screenshot)

1. Page content not filling full width — empty space on left and right sides
2. Two-column layout has unequal column widths
3. Select/dropdown fields are shorter than input fields — inconsistent height
4. Overall spacing feels too loose

---

## STEP 1 — FIND THE ROOT FILES

```bash
# Find the dashboard layout wrapper
find . -path "*/dashboard*/layout.tsx" | grep -v node_modules | grep -v .next

# Find globals.css
find . -name "globals.css" | grep -v node_modules | grep -v .next

# Find any max-width container class
grep -rn "max-w-\|maxWidth\|max-width" \
  app/\(dashboard\)/ --include="*.tsx" --include="*.ts" \
  | grep -v node_modules | grep -v .next | head -20

# Check what Tailwind container config exists
cat tailwind.config.ts 2>/dev/null || cat tailwind.config.js 2>/dev/null
```

---

## STEP 2 — FIX 1: PAGE FILLS FULL WIDTH

The dashboard content area must use full available width.
Find the main content wrapper in the dashboard layout and remove or increase max-width.

```bash
# Find the content area wrapper
grep -rn "max-w\|px-4\|px-6\|px-8\|container\|mx-auto" \
  app/\(dashboard\)/layout.tsx --include="*.tsx" 2>/dev/null || \
grep -rn "max-w\|px-4\|px-6\|px-8\|container\|mx-auto" \
  app/layout.tsx --include="*.tsx" 2>/dev/null
```

Fix: The main content area should use full width with comfortable padding:

```tsx
// BEFORE (too narrow):
<main className="max-w-4xl mx-auto px-6">

// AFTER (full width with padding):
<main className="w-full px-6 py-4">
// OR if using inline styles:
<main style={{ width: '100%', padding: '16px 24px' }}>
```

If there is a container div wrapping the page content, change:
```tsx
// Remove max-w-* constraint on the dashboard content wrapper
// Keep the sidebar fixed width, let content fill remaining space
```

The layout structure should be:
```
[Sidebar: 200px fixed] [Content: flex-1, fills remaining width]
```

Verify the sidebar + content layout:
```bash
grep -rn "flex\|grid\|sidebar\|Sidebar" \
  app/\(dashboard\)/layout.tsx | grep -v node_modules | head -10
```

Fix the dashboard layout to use:
```tsx
<div style={{ display: 'flex', height: '100vh' }}>
  <aside style={{ width: '200px', flexShrink: 0 }}>
    {/* Sidebar */}
  </aside>
  <main style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
    {/* Page content — fills ALL remaining width */}
    {children}
  </main>
</div>
```

---

## STEP 3 — FIX 2: EQUAL WIDTH TWO-COLUMN LAYOUT

All two-column layouts across the platform must use equal 1fr + 1fr columns.

Find all grid/two-column layouts:
```bash
grep -rn "grid-cols\|gridTemplateColumns\|grid-template-columns" \
  app/\(dashboard\)/ --include="*.tsx" \
  | grep -v node_modules | grep -v .next
```

Fix every two-column layout to use equal columns:

```tsx
// WRONG — unequal columns:
<div className="grid grid-cols-3 gap-4">  // 2/3 + 1/3 split

// CORRECT — equal columns:
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',  // always equal
  gap: '16px',
  alignItems: 'start',
}}>
```

Specific pages to fix:
- `/inspections/new` — Step 1 two columns
- `/projects/new` — all wizard steps
- `/factories/new` — wizard steps
- Any page with a two-column form layout

---

## STEP 4 — FIX 3: CONSISTENT INPUT/SELECT/TEXTAREA HEIGHT

This is a platform-wide fix. ALL form elements must be the same height.

Add to `globals.css`:

```css
/* ─── SankalpHub — Consistent form element heights ─────────── */

/* All inputs, selects and textareas: same height, same padding */
input[type="text"],
input[type="email"],
input[type="password"],
input[type="number"],
input[type="tel"],
input[type="url"],
input[type="date"],
input[type="search"],
select,
textarea {
  height: 40px !important;
  min-height: 40px !important;
  padding: 0 12px !important;
  font-size: 13px !important;
  border-radius: 8px !important;
  border: 0.5px solid hsl(var(--border)) !important;
  background: hsl(var(--background)) !important;
  color: hsl(var(--foreground)) !important;
  width: 100% !important;
  line-height: 1 !important;
  box-sizing: border-box !important;
  -webkit-appearance: none !important;
  appearance: none !important;
}

/* Textarea is taller — override height */
textarea {
  height: auto !important;
  min-height: 80px !important;
  padding: 10px 12px !important;
  line-height: 1.5 !important;
  resize: vertical !important;
}

/* Select arrow — restore since we used appearance:none */
select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") !important;
  background-repeat: no-repeat !important;
  background-position: right 10px center !important;
  padding-right: 32px !important;
}

/* Focus states */
input:focus,
select:focus,
textarea:focus {
  outline: none !important;
  border-color: #C9A96E !important;
  box-shadow: 0 0 0 2px rgba(201, 169, 110, 0.15) !important;
}

/* Placeholders — 9px as already set */
input::placeholder,
textarea::placeholder {
  font-size: 9px !important;
  opacity: 0.6 !important;
}

/* shadcn/ui overrides — ensure shadcn components also match */
.h-10 { height: 40px !important; }
.h-9  { height: 40px !important; }  /* normalize h-9 to 40px */

/* shadcn Input component */
[class*="input"] {
  height: 40px !important;
}

/* shadcn Select trigger */
[role="combobox"],
[data-radix-select-trigger] {
  height: 40px !important;
  min-height: 40px !important;
  font-size: 13px !important;
  padding: 0 12px !important;
}
```

---

## STEP 5 — FIX 4: PAGE CONTENT PADDING + SPACING

Find each dashboard page and ensure consistent padding:

```bash
# Check what padding pages currently use
grep -rn "p-4\|p-6\|p-8\|padding\|px-\|py-" \
  app/\(dashboard\)/ --include="*.tsx" \
  | grep -v node_modules | grep -v .next | head -30
```

Standard page padding should be:
```tsx
// Every dashboard page wrapper:
<div className="p-6 w-full">   // 24px padding all sides
  {/* page content */}
</div>
```

Or with inline styles:
```tsx
<div style={{ padding: '24px', width: '100%' }}>
```

---

## STEP 6 — FIX 5: FORM LABEL CONSISTENCY

All form labels should be consistent:

```css
/* Add to globals.css */
label {
  display: block !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  color: hsl(var(--muted-foreground)) !important;
  margin-bottom: 5px !important;
}
```

---

## STEP 7 — FIX 6: CARD CONSISTENCY

All form cards should have consistent padding and border:

```css
/* Add to globals.css */
.form-card {
  background: hsl(var(--card)) !important;
  border-radius: 10px !important;
  border: 0.5px solid hsl(var(--border)) !important;
  padding: 16px !important;
  margin-bottom: 12px !important;
}
```

---

## STEP 8 — VERIFY SPECIFIC PAGES

After applying fixes, manually check these pages:

```bash
# Check inspections/new layout
grep -rn "grid\|flex\|container\|max-w" \
  app/\(dashboard\)/inspections/new/ --include="*.tsx" \
  | grep -v node_modules | head -20

# Check projects/new layout  
grep -rn "grid\|flex\|container\|max-w" \
  app/\(dashboard\)/projects/new/ --include="*.tsx" \
  | grep -v node_modules | head -20
```

For the inspections/new page specifically — fix the two-column layout:

```tsx
// The two column layout must be:
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',  // equal columns
  gap: '16px',
  width: '100%',  // fills full content area
}}>
  <div>  {/* Inspection Details card */}  </div>
  <div>  {/* Inspector Details card */}   </div>
</div>
```

---

## STEP 9 — BUILD AND DEPLOY

```bash
cd /var/www/Master_Sankalphub/V3.0_Frontend

npm run build 2>&1 | tail -20

if [ $? -eq 0 ]; then
  git add -A
  git commit -m "fix: platform-wide layout — full width, equal columns, consistent input/select heights"
  git push origin main
  echo "DEPLOYED"
else
  echo "BUILD FAILED"
  npm run build 2>&1 | grep -E "Error|error|×" | head -20
fi
```

---

## VERIFICATION CHECKLIST

**Full width:**
- [ ] Dashboard content fills full width of browser — no empty side margins
- [ ] Sidebar is fixed, content flexes to fill remaining space

**Equal columns:**
- [ ] Inspections/new Step 1: left and right cards equal width
- [ ] Projects/new: all wizard steps equal columns
- [ ] Factories/new: equal columns
- [ ] Any other two-column form pages equal

**Input consistency:**
- [ ] All `input` elements: 40px height
- [ ] All `select` elements: 40px height (same as inputs)
- [ ] All elements: same font-size (13px)
- [ ] All elements: same border-radius (8px)
- [ ] All elements: same focus ring (gold #C9A96E)
- [ ] Select has dropdown arrow visible
- [ ] Textarea: auto height, min 80px

**Spacing:**
- [ ] All dashboard pages: 24px padding
- [ ] Form labels: 12px, font-weight 500
- [ ] Cards: 16px padding, 10px border-radius

---

*SankalpHub V3 — Platform-wide Layout + Input Consistency Fix*
*Full width · Equal columns · Consistent 40px form elements*
*April 3, 2026*
