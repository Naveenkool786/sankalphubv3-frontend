# SankalpHub — Precise Surgical Fixes (V3 Frontend)
**For: Claude Code**
**Date:** April 3, 2026
**Mode:** SURGICAL — read file first, then make ONLY the specified changes. Nothing else.

> ⚠️ All work in `/var/www/Master_Sankalphub/V3.0_Frontend/`

---

## BEFORE DOING ANYTHING — READ THE FILES FIRST

```bash
# Step 1: Find the exact files
find . -path "*/factory-audits/new*" -name "*.tsx" | grep -v node_modules | grep -v .next
find . -path "*/audits*new*" -name "*.tsx" | grep -v node_modules | grep -v .next
find . -path "*/projects/new*" -name "*.tsx" | grep -v node_modules | grep -v .next

# Step 2: Read them completely before touching anything
cat [factory audit page path]
cat [projects new page path]
```

---

## FIX 1 — FACTORY AUDIT PAGE

**The problem:** Everything is stacked in one column. The page has:
- Audit Details (full width)
- Section Scores (full width below)
- Report & Findings (full width below that)
- Total audit score (full width at bottom)

**What is needed:** Two equal columns side by side:
- LEFT column: Audit Details only (factory, inspector name, audit type)
- RIGHT column: Audit date + Inspector type + Section Scores + Total score
- Report & Findings section: REMOVE IT COMPLETELY — it was never requested
- Everything fits on ONE page — no vertical scroll

**Step 1 — Remove Report & Findings entirely:**

Find and DELETE everything between these markers — the entire Report & Findings section:
```
Any JSX block containing: "Report & Findings" OR "Upload audit report" OR
"Key findings" OR "Corrective actions" OR "Next audit due"
```
DELETE all of it. It should not exist on this page.

**Step 2 — Restructure into two columns:**

Find the current layout. It will look something like this:
```tsx
<div>  {/* Audit Details — full width */}
  ...factory, inspector, audit type...
</div>
<div>  {/* Section Scores — full width */}
  ...scores...
</div>
```

Replace the ENTIRE layout (from after the page title/subtitle down to the submit button) with this two-column structure:

```tsx
{/* TWO COLUMN LAYOUT */}
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
  alignItems: 'stretch',
  width: '100%',
  marginBottom: '16px',
}}>

  {/* ── LEFT: Audit Details ── */}
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <div style={{
      background: 'var(--card)',
      borderRadius: '12px',
      border: '0.5px solid var(--border)',
      padding: '20px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <div style={{ fontSize: '14px', fontWeight: 500 }}>Audit Details</div>

      {/* Factory select — keep existing state binding */}
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500,
          color: 'var(--muted-foreground)', marginBottom: '5px' }}>Factory *</label>
        {/* KEEP existing factory select JSX here — just move it */}
      </div>

      {/* Inspector name — keep existing state binding */}
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500,
          color: 'var(--muted-foreground)', marginBottom: '5px' }}>Inspector name *</label>
        {/* KEEP existing inspector name input JSX here — just move it */}
      </div>

      {/* Audit type — keep existing state binding */}
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500,
          color: 'var(--muted-foreground)', marginBottom: '8px' }}>Audit type</label>
        {/* KEEP existing audit type buttons JSX here — just move it */}
      </div>
    </div>
  </div>

  {/* ── RIGHT: Date + Inspector type + Section Scores + Total ── */}
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <div style={{
      background: 'var(--card)',
      borderRadius: '12px',
      border: '0.5px solid var(--border)',
      padding: '20px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>

      {/* Audit date + Inspector type — side by side row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500,
            color: 'var(--muted-foreground)', marginBottom: '5px' }}>Audit date *</label>
          {/* KEEP existing audit date input — just move it */}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500,
            color: 'var(--muted-foreground)', marginBottom: '5px' }}>Inspector type</label>
          {/* KEEP existing inspector type select — just move it */}
        </div>
      </div>

      {/* Thin divider */}
      <div style={{ height: '0.5px', background: 'var(--border)' }} />

      {/* Section scores header */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '2px' }}>
          Section scores
        </div>
        <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
          Score each section — total calculated automatically
        </div>
      </div>

      {/* Section score rows — KEEP existing score rows JSX, just move them here */}
      {/* These are the Legal, Health, Working, Capacity, Quality, Environmental rows */}

      {/* Total score — at bottom of right card */}
      {/* KEEP existing total score calculation and display — just move it here */}
      {/* The total score card changes color: green ≥75, amber 50-74, red <50 */}

    </div>
  </div>
</div>

{/* Submit button — bottom right */}
{/* KEEP existing submit button but with this change: */}
{/* background: allSectionsScored ? '#1D9E75' : 'var(--muted)' */}
{/* allSectionsScored = every section score input has a value > 0 */}
{/* Button should NOT be green when scores are all 0 */}
```

**Step 3 — Fix submit button color logic:**

Find the submit button. Change its disabled/color logic so it is GRAY when all scores are 0, and GREEN only when all 6 sections have a score > 0:

```typescript
// Find the variable that controls submit button state
// Add this calculation:
const allSectionsScored = [
  scores.legal,
  scores.health,
  scores.working,
  scores.capacity,
  scores.quality,
  scores.environmental,
].every(score => score > 0)

// Apply to submit button:
// background: allSectionsScored ? '#1D9E75' : '#D3D1C7'
// cursor: allSectionsScored ? 'pointer' : 'not-allowed'
// disabled: !allSectionsScored
```

---

## FIX 2 — PROJECTS WIZARD (Create New Project — Step 1)

**The problem:** Right container (Upload & auto-fill) has a large empty white gap below the content. The two containers are not the same height.

**What is needed:** Both containers align to the TOP. Each container is only as tall as its content. No stretching, no empty space.

**Step 1 — Find the grid wrapper:**

```bash
grep -n "gridTemplateColumns\|alignItems\|grid-cols" \
  [projects new page path] | head -20
```

**Step 2 — Change alignItems:**

Find the div with `gridTemplateColumns: '1fr 1fr'` (or similar). Change ONE thing only:

```tsx
// FIND:
alignItems: 'stretch'
// OR
alignItems: 'start'
// OR
className="... items-stretch ..."

// CHANGE TO:
alignItems: 'start'
```

If using Tailwind classes, change `items-stretch` to `items-start`.

**Step 3 — Remove flex:1 from right card:**

Find the right card (the Upload & auto-fill card). Remove `flex: 1` and `minHeight` from it:

```tsx
// FIND on the right card div:
flex: 1,          // ← REMOVE this line
minHeight: '...',  // ← REMOVE this line if present
height: '100%',   // ← REMOVE this line if present

// The right card should have NO height-related properties
// It should only be as tall as its content
```

**Step 4 — Verify right card content:**

The Upload & auto-fill card should contain ONLY:
1. Title "Upload & auto-fill" with AI badge
2. Dashed drop zone with upload icon + "Drop PO or tech pack" + file type badges (Excel, PDF, Word, CSV)
3. AI description text below the drop zone

Nothing else. No empty divs, no flex spacers, no min-height forcing it to be tall.

---

## BUILD & DEPLOY

```bash
cd /var/www/Master_Sankalphub/V3.0_Frontend

npm run build 2>&1 | tail -20

if [ $? -eq 0 ]; then
  git add -A
  git commit -m "fix: factory audit two-column layout + remove report section + projects right card natural height"
  git push origin main
  echo "DEPLOYED"
else
  echo "BUILD FAILED"
  npm run build 2>&1 | grep -E "Error|error|×" | head -20
fi
```

---

## VERIFICATION

**Factory Audit:**
- [ ] Page has TWO columns side by side — left and right equal width
- [ ] LEFT: Factory select + Inspector name + Audit type toggle ONLY
- [ ] RIGHT: Audit date + Inspector type + 6 section score rows + total score card
- [ ] Report & Findings section is GONE — completely removed
- [ ] Total score shows 0% in red when no scores entered
- [ ] Submit button is GRAY when all scores are 0
- [ ] Submit button turns GREEN only when all 6 sections have score > 0
- [ ] No vertical page scroll needed — everything visible at once

**Projects wizard:**
- [ ] Left container: natural height (as tall as form fields)
- [ ] Right container: natural height (as tall as upload zone content only)
- [ ] NO large empty white space below file type badges in right container
- [ ] Both containers align to top of page — not stretched

---

*SankalpHub V3 — Precise Surgical Fixes*
*Factory Audit two-column · Projects right card natural height*
*April 3, 2026*
