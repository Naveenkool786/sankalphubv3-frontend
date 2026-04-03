# SankalpHub — Platform-Wide UI Fixes Brief (V3 Frontend)
**For: Claude Code + Sub-Agents**
**Date:** April 3, 2026
**Scope:** Dashboard slicer cards + equal containers + back buttons + KPI cards + Factory Audits fix
**Mode:** UI fixes only. No business logic changes.

> ⚠️ **WORKING DIRECTORY: V3 Frontend ONLY**
> All work is in `/var/www/Master_Sankalphub/V3.0_Frontend/`

---

## TASK ASSIGNMENT

| Task | Agent | Description |
|---|---|---|
| Task 1 | Sub-Agent 1 | Dashboard — slicer cards redesign + KPI cards + remove buttons |
| Task 2 | Sub-Agent 2 | Projects wizard — equal containers + back button |
| Task 3 | Sub-Agent 2 | Factories wizard — equal containers + back button + draft banner |
| Task 4 | Sub-Agent 2 | Inspections wizard — equal containers + back button |
| Task 5 | Sub-Agent 1 | Factory Audits — full width + fix empty state button label |

---

## TASK 1 — DASHBOARD: SLICER CARDS + KPI CARDS + REMOVE BUTTONS

**Agent:** Sub-Agent 1
**File:** `app/(dashboard)/dashboard/page.tsx`

---

### 1A — Remove header buttons

Remove BOTH of these buttons from the dashboard header completely:
- "View reports" button
- "+ New inspection" button

The header should only show the greeting and date. No buttons.

```tsx
// BEFORE:
<div>
  <button>View reports</button>
  <button>+ New inspection</button>
</div>

// AFTER: nothing — remove entirely
```

---

### 1B — KPI cards redesign

Follow the Dribbble reference style:
- Content centered (not left-aligned)
- More breathing room inside each card
- Value large and prominent
- Label below in muted color
- Subtle hover lift effect

```tsx
// Each KPI card:
<div
  onClick={() => router.push(kpi.link)}
  style={{
    background: 'var(--card)',
    borderRadius: '14px',
    border: '0.5px solid var(--border)',
    padding: '20px',
    cursor: 'pointer',
    textAlign: 'center',           // ← centered like Dribbble reference
    transition: 'all .2s ease',
  }}
  onMouseEnter={e => {
    e.currentTarget.style.transform = 'translateY(-2px)'
    e.currentTarget.style.borderColor = '#C9A96E'
  }}
  onMouseLeave={e => {
    e.currentTarget.style.transform = 'translateY(0)'
    e.currentTarget.style.borderColor = 'var(--border)'
  }}>

  {/* Icon centered */}
  <div style={{
    width: '40px', height: '40px',
    borderRadius: '10px',
    background: kpi.iconBg,
    display: 'flex', alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
  }}>
    {kpi.icon}
  </div>

  {/* Value — large and centered */}
  <div style={{
    fontSize: '32px',
    fontWeight: 500,
    lineHeight: 1,
    marginBottom: '6px',
    color: 'var(--foreground)',
  }}>
    {kpi.value}
  </div>

  {/* Label */}
  <div style={{
    fontSize: '12px',
    color: 'var(--muted-foreground)',
    marginBottom: '4px',
    fontWeight: 500,
  }}>
    {kpi.label}
  </div>

  {/* Sub text */}
  <div style={{
    fontSize: '11px',
    color: 'var(--muted-foreground)',
    opacity: 0.7,
  }}>
    {kpi.sub}
  </div>
</div>
```

---

### 1C — Slicer cards redesign

Follow the Dribbble "Card Magic" reference exactly:
- Cards are taller: **220px minimum height**
- Generous internal padding: **18px**
- Full visible border on all sides — active card border NOT cut off
- Proper margin above the slicer row so active card's lift (translateY) is not clipped
- Cards feel like physical cards with weight and presence

```tsx
// CRITICAL — Add top padding to slicer row wrapper
// so the active card's translateY(-8px) doesn't get clipped
<div style={{
  paddingTop: '12px',   // ← prevents active card being cut off at top
  marginTop: '-12px',
  overflow: 'visible',  // ← must be visible not hidden
}}>
  <div style={{
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    overflowY: 'visible',  // ← critical — allows card to lift upward
    paddingBottom: '8px',
    paddingTop: '8px',     // ← breathing room for lift
    scrollbarWidth: 'none',
    alignItems: 'flex-end', // ← cards align to bottom so lift looks natural
  }}>
    {/* slicer cards */}
  </div>
</div>
```

**Card base style — all states:**
```typescript
const cardBase: React.CSSProperties = {
  flexShrink: 0,
  width: '190px',           // wider than before
  minHeight: '220px',       // taller — like Dribbble reference
  borderRadius: '16px',
  padding: '18px',
  cursor: 'pointer',
  transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid var(--border)',    // always visible border
  background: 'var(--card)',
}
```

**DONE state** — fades back, green tint:
```typescript
const doneStyle: React.CSSProperties = {
  ...cardBase,
  opacity: 0.45,
  border: '1px solid #9FE1CB',
  background: '#E1F5EE',
  transform: 'scale(0.97)',
  filter: 'saturate(0.6)',
}
```

**ACTIVE state** — pops forward, shines:
```typescript
const activeStyle: React.CSSProperties = {
  ...cardBase,
  opacity: 1,
  border: '2px solid #BA7517',
  background: 'var(--card)',
  transform: 'scale(1.06) translateY(-8px)',  // more lift than before
  filter: 'none',
  // Subtle ambient glow using box-shadow (not drop-shadow)
  boxShadow: '0 8px 24px rgba(186, 117, 23, 0.15)',
}
```

**UPCOMING states** — progressively more faded:
```typescript
const upcomingStyles: React.CSSProperties[] = [
  { ...cardBase, opacity: 0.72, transform: 'scale(0.99)', filter: 'saturate(0.85)' },
  { ...cardBase, opacity: 0.55, transform: 'scale(0.98)', filter: 'saturate(0.6)' },
  { ...cardBase, opacity: 0.40, transform: 'scale(0.97)', filter: 'saturate(0.4)' },
  { ...cardBase, opacity: 0.28, transform: 'scale(0.96)', filter: 'saturate(0.3)' },
  { ...cardBase, opacity: 0.18, transform: 'scale(0.95)', filter: 'saturate(0.2)' },
]
```

**Card internal layout** — following Dribbble reference spacing:
```tsx
<div style={getCardStyle(i, doneCount)}>

  {/* Top: icon + step badge — space between */}
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '16px',
  }}>
    <div style={{
      width: '42px', height: '42px',
      borderRadius: '12px',
      background: isDone ? '#E1F5EE' : isActive ? '#FAEEDA' : 'var(--muted)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {step.icon}
    </div>
    <span style={{
      fontSize: '9px', padding: '3px 8px',
      borderRadius: '10px', fontWeight: 500,
      background: isDone ? '#E1F5EE'
               : isActive ? '#BA7517'
               : 'var(--muted)',
      color: isDone ? '#085041'
           : isActive ? '#fff'
           : 'var(--muted-foreground)',
    }}>
      {isDone ? 'Done' : isActive ? 'Next up' : `Step ${i + 1}`}
    </span>
  </div>

  {/* Title — larger than before */}
  <div style={{
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '6px',
    lineHeight: 1.3,
    color: isDone ? '#085041'
         : isActive ? 'var(--foreground)'
         : 'var(--muted-foreground)',
  }}>
    {step.title}
  </div>

  {/* Subtitle */}
  <div style={{
    fontSize: '11px',
    color: 'var(--muted-foreground)',
    lineHeight: 1.6,
    flex: 1,  // pushes action to bottom
  }}>
    {step.sub}
  </div>

  {/* Action — pinned to bottom */}
  <div style={{
    display: 'flex', alignItems: 'center', gap: '4px',
    fontSize: '12px', fontWeight: 500,
    marginTop: '16px',
    color: isDone ? '#1D9E75'
         : isActive ? '#BA7517'
         : 'var(--muted-foreground)',
  }}>
    {isDone ? (
      <>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5">
          <path d="M9 11l3 3L22 4"/>
        </svg>
        Completed
      </>
    ) : isActive ? (
      <>
        Get started
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </>
    ) : 'Locked'}
  </div>

  {/* Bottom progress bar */}
  <div style={{
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
  }}>
    <div style={{
      height: '100%',
      width: isDone ? '100%' : '0%',
      background: isDone ? '#1D9E75' : '#BA7517',
      transition: 'width 0.5s ease',
    }} />
  </div>
</div>
```

**Dot indicators** — below the slicer row:
```tsx
<div style={{
  display: 'flex', gap: '6px',
  justifyContent: 'center',
  marginTop: '12px',
}}>
  {slicerSteps.map((_, i) => (
    <div key={i} style={{
      height: '6px',
      width: i === doneCount ? '20px' : '6px',
      borderRadius: i === doneCount ? '3px' : '50%',
      background: i < doneCount ? '#1D9E75'
               : i === doneCount ? '#BA7517'
               : 'var(--border)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    }} />
  ))}
</div>
```

---

## TASK 2 — PROJECTS WIZARD: EQUAL CONTAINERS + BACK BUTTON

**Agent:** Sub-Agent 2
**File:** `app/(dashboard)/projects/new/page.tsx`

---

### 2A — Back button

Replace the current "← Back to Projects" text link with a styled button:

```tsx
// REMOVE this:
<a href="/projects">← Back to Projects</a>
// OR whatever the current implementation is

// REPLACE with this:
<button
  onClick={() => router.push('/projects')}
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    borderRadius: '8px',
    border: '0.5px solid var(--border)',
    background: 'var(--background)',
    color: 'var(--muted-foreground)',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    marginBottom: '16px',
    transition: 'all .15s',
  }}
  onMouseEnter={e => {
    e.currentTarget.style.borderColor = '#C9A96E'
    e.currentTarget.style.color = '#BA7517'
  }}
  onMouseLeave={e => {
    e.currentTarget.style.borderColor = 'var(--border)'
    e.currentTarget.style.color = 'var(--muted-foreground)'
  }}>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
  Back to Projects
</button>
```

---

### 2B — Equal containers on ALL steps

Every step that has two columns must use exactly `1fr 1fr`:

```tsx
// Apply to ALL steps: Step 1, Step 2, Step 3, Step 4
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',   // ← always equal
  gap: '16px',
  alignItems: 'start',
  width: '100%',
}}>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {/* Left card */}
    <div style={{
      background: 'var(--card)',
      borderRadius: '12px',
      border: '0.5px solid var(--border)',
      padding: '20px',            // ← generous internal padding
    }}>
      {/* content */}
    </div>
  </div>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {/* Right card */}
    <div style={{
      background: 'var(--card)',
      borderRadius: '12px',
      border: '0.5px solid var(--border)',
      padding: '20px',            // ← same padding as left
    }}>
      {/* content */}
    </div>
  </div>
</div>
```

Mobile (< 640px): stack to single column:
```tsx
// Add responsive class or media query:
// gridTemplateColumns: window.width < 640 ? '1fr' : '1fr 1fr'
// OR use Tailwind: className="grid grid-cols-1 md:grid-cols-2 gap-4"
```

---

## TASK 3 — FACTORIES WIZARD: EQUAL CONTAINERS + BACK BUTTON + DRAFT BANNER

**Agent:** Sub-Agent 2
**File:** `app/(dashboard)/factories/new/page.tsx`

---

### 3A — Back button

Same exact styled button as Projects:

```tsx
<button
  onClick={() => router.push('/factories')}
  style={{
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '6px 14px', borderRadius: '8px',
    border: '0.5px solid var(--border)', background: 'var(--background)',
    color: 'var(--muted-foreground)', fontSize: '12px', fontWeight: 500,
    cursor: 'pointer', marginBottom: '16px', transition: 'all .15s',
  }}
  onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.color = '#BA7517' }}
  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted-foreground)' }}>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
  Back to Factories
</button>
```

---

### 3B — Draft banner — fix button spacing

The "Continue draft" and "Start fresh" buttons in the draft banner are too far apart. Fix:

```tsx
<div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 16px',
  background: '#FAEEDA',
  border: '0.5px solid #C9A96E',
  borderRadius: '10px',
  marginBottom: '16px',
}}>
  {/* Left — draft info */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="#BA7517" strokeWidth="2" strokeLinecap="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
    </svg>
    <div>
      <span style={{ fontSize: '12px', fontWeight: 500, color: '#633806' }}>
        Unsaved draft found — {draftName}
      </span>
      <span style={{ fontSize: '10px', color: '#854F0B', marginLeft: '8px' }}>
        Saved {savedTime}
      </span>
    </div>
  </div>

  {/* Right — buttons CLOSE together */}
  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
    <button
      onClick={continueDraft}
      style={{
        padding: '5px 14px', borderRadius: '7px',
        background: '#BA7517', color: '#fff',
        border: 'none', fontSize: '11px',
        fontWeight: 500, cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}>
      Continue draft →
    </button>
    <button
      onClick={startFresh}
      style={{
        padding: '5px 14px', borderRadius: '7px',
        background: 'transparent', color: '#633806',
        border: '0.5px solid #C9A96E',
        fontSize: '11px', cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}>
      Start fresh
    </button>
  </div>
</div>
```

---

### 3C — Equal containers on ALL steps

Same `1fr 1fr` rule as Projects — apply to:
- Step 1: Factory details + Photo/Upload
- Step 2: Capacity & QC (if two columns)
- Step 3: Review & Save

```tsx
// Same grid as Projects Task 2B above
// padding: '20px' inside both left and right cards
```

---

## TASK 4 — INSPECTIONS WIZARD: EQUAL CONTAINERS + BACK BUTTON

**Agent:** Sub-Agent 2
**File:** `app/(dashboard)/inspections/new/page.tsx`

---

### 4A — Back button

```tsx
<button
  onClick={() => router.push('/inspections')}
  style={{
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '6px 14px', borderRadius: '8px',
    border: '0.5px solid var(--border)', background: 'var(--background)',
    color: 'var(--muted-foreground)', fontSize: '12px', fontWeight: 500,
    cursor: 'pointer', marginBottom: '16px', transition: 'all .15s',
  }}
  onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.color = '#BA7517' }}
  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted-foreground)' }}>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
  Back to Inspections
</button>
```

---

### 4B — Equal containers on ALL steps

Apply `1fr 1fr` with `padding: '20px'` to:
- Step 1: Inspection Details + Inspector Details
- Step 2: Category + AQL/Template
- Step 3: Photos — DO NOT CHANGE (confirmed by Naveen)
- Step 4: Checklist — left list + right active item panel
- Step 5: Defect log — left list + right add panel
- Step 6: AQL breakdown + Result
- Step 7: Summary + Submit

```tsx
// Standard for ALL steps except Step 3:
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
  alignItems: 'start',
  width: '100%',
}}>
```

---

### 4C — Containers need left/right padding inside

Currently the cards inside the inspection wizard touch the edges. Fix:

```tsx
// Every card inside inspection wizard:
<div style={{
  background: 'var(--card)',
  borderRadius: '12px',
  border: '0.5px solid var(--border)',
  padding: '20px',          // ← was 14px, now 20px
  height: '100%',
}}>
```

---

## TASK 5 — FACTORY AUDITS: FULL WIDTH + BUTTON LABEL FIX

**Agent:** Sub-Agent 1
**File:** `app/(dashboard)/audits/factory/page.tsx`

---

### 5A — Page fills full width

The Factory Audits page has the same width issue. Find the page wrapper and ensure it uses full width:

```bash
find . -path "*audits*" -name "page.tsx" | grep -v node_modules | grep -v .next | head -5
grep -rn "max-w\|container\|mx-auto" app/\(dashboard\)/audits/ --include="*.tsx" | grep -v node_modules
```

Remove any `max-w-*` or `container` class that is restricting the width.

---

### 5B — Fix empty state button label

The empty state currently has TWO buttons both saying "New Audit". Fix the center empty state button:

```tsx
// FIND this in the empty state section:
<button>New Audit</button>  // ← the one in the CENTER of the page

// CHANGE to:
<button
  onClick={() => router.push('/audits/factory/new')}
  style={{
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 20px', borderRadius: '20px',
    background: '#BA7517', color: '#fff',
    border: 'none', fontSize: '13px',
    fontWeight: 500, cursor: 'pointer',
  }}>
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
  Start your first audit
</button>

// The top-right button STAYS as "New Audit" — do not change that one
```

---

## REUSABLE BACK BUTTON COMPONENT

Create a shared component so all pages use the same back button:

**File:** `components/ui/BackButton.tsx`

```tsx
'use client'
import { useRouter } from 'next/navigation'

interface BackButtonProps {
  href: string
  label: string
}

export function BackButton({ href, label }: BackButtonProps) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(href)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '6px 14px', borderRadius: '8px',
        border: '0.5px solid var(--border)',
        background: 'var(--background)',
        color: 'var(--muted-foreground)',
        fontSize: '12px', fontWeight: 500,
        cursor: 'pointer', marginBottom: '16px',
        transition: 'border-color .15s, color .15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#C9A96E'
        e.currentTarget.style.color = '#BA7517'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.color = 'var(--muted-foreground)'
      }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      {label}
    </button>
  )
}
```

Use in all wizard pages:
```tsx
import { BackButton } from '@/components/ui/BackButton'

// Projects:
<BackButton href="/projects" label="Back to Projects" />

// Factories:
<BackButton href="/factories" label="Back to Factories" />

// Inspections:
<BackButton href="/inspections" label="Back to Inspections" />

// Factory Audits:
<BackButton href="/audits/factory" label="Back to Factory Audits" />
```

---

## BUILD & DEPLOY

```bash
cd /var/www/Master_Sankalphub/V3.0_Frontend

npm run build 2>&1 | tail -20

if [ $? -eq 0 ]; then
  git add -A
  git commit -m "fix: platform UI — slicer cards Dribbble style, equal 1fr containers, back buttons, KPI centered, factory audits full width"
  git push origin main
  echo "DEPLOYED"
else
  echo "BUILD FAILED"
  npm run build 2>&1 | grep -E "Error|error|×" | head -20
fi
```

---

## FINAL VERIFICATION CHECKLIST

**Dashboard:**
- [ ] "View reports" button removed
- [ ] "+ New inspection" button removed
- [ ] KPI cards: icon centered, value 32px, centered layout
- [ ] KPI cards: hover lifts with translateY(-2px)
- [ ] Slicer cards: 190px wide, 220px+ tall
- [ ] Slicer cards: active card has visible full border (not cut off at top)
- [ ] Slicer cards: active card lifts with scale(1.06) translateY(-8px) + amber glow
- [ ] Slicer cards: done cards fade to 0.45 opacity with green tint
- [ ] Slicer cards: upcoming progressively fade 72% → 55% → 40% → 28% → 18%
- [ ] Dot indicators: active dot is wider pill, done dots green, upcoming gray
- [ ] No overflow clipping on slicer row

**Projects wizard:**
- [ ] "← Back to Projects" styled button with hover gold effect
- [ ] All wizard steps: 1fr 1fr equal columns
- [ ] All cards: 20px internal padding on both sides
- [ ] Mobile: collapses to single column

**Factories wizard:**
- [ ] "← Back to Factories" styled button
- [ ] Draft banner: Continue/Start Fresh buttons are close together (right side)
- [ ] All steps: 1fr 1fr equal columns
- [ ] All cards: 20px internal padding

**Inspections wizard:**
- [ ] "← Back to Inspections" styled button
- [ ] Step 1: equal containers with 20px padding
- [ ] Step 2: equal containers
- [ ] Step 3: unchanged (photos — confirmed)
- [ ] Steps 4-7: equal containers
- [ ] All containers have breathing room on left and right

**Factory Audits:**
- [ ] Page fills full width
- [ ] Center empty state button says "Start your first audit"
- [ ] Top-right button still says "New Audit" (unchanged)

**BackButton component:**
- [ ] Created at `components/ui/BackButton.tsx`
- [ ] Used on all 4 wizard pages
- [ ] Hover: border turns gold, text turns amber

---

*SankalpHub V3 — Platform-Wide UI Fixes*
*Slicer cards Dribbble style · Equal 1fr containers · Back buttons · KPI centered · Factory Audits*
*April 3, 2026*
