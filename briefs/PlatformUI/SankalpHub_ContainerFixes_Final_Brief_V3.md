# SankalpHub — Final Container Fixes Brief (V3 Frontend)
**For: Claude Code**
**Date:** April 3, 2026
**Scope:** 4 pages — Projects, Factories, Inspections, Factory Audit — container equality + layout fixes
**Mode:** Surgical. Read every instruction carefully. Fix exactly what is specified.

> ⚠️ **WORKING DIRECTORY: V3 Frontend ONLY**
> All work is in `/var/www/Master_Sankalphub/V3.0_Frontend/`

---

## GOLDEN RULE — applies to ALL 4 pages

Every page that has a two-column layout must follow this exact pattern:

```tsx
// TWO EQUAL COLUMNS — this is the standard for ALL wizard pages
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',   // always equal
  gap: '16px',
  alignItems: 'stretch',            // both columns always same height
  width: '100%',
}}>
  {/* LEFT column */}
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <div style={{
      background: 'var(--card)',
      borderRadius: '12px',
      border: '0.5px solid var(--border)',
      padding: '20px',              // 20px breathing room on ALL sides
      flex: 1,                      // fills full column height
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      {/* content */}
    </div>
  </div>

  {/* RIGHT column */}
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <div style={{
      background: 'var(--card)',
      borderRadius: '12px',
      border: '0.5px solid var(--border)',
      padding: '20px',              // SAME 20px as left — no exceptions
      flex: 1,                      // fills full column height — matches left exactly
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      {/* content */}
    </div>
  </div>
</div>
```

**On mobile (< 640px):** Stack to single column:
```tsx
// Use Tailwind or inline media:
// gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'
```

---

## BACK BUTTON — standard for ALL wizard pages

Create this component ONCE and reuse everywhere:

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

---

## FIX 1 — PROJECTS WIZARD

**File:** Find with:
```bash
find . -path "*/projects/new*" -name "page.tsx" | grep -v node_modules | grep -v .next
```

### Step 1 — Back button
```tsx
// REMOVE whatever current back link exists
// ADD:
import { BackButton } from '@/components/ui/BackButton'
<BackButton href="/projects" label="Back to Projects" />
```

### Step 2 — Two equal columns, alignItems: start

For projects the right card (Upload & auto-fill) should NOT stretch to match the left — it should be its natural height. Use `alignItems: 'start'`:

```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
  alignItems: 'start',    // ← start not stretch — right card natural height
  width: '100%',
}}>
```

### Step 3 — Left card: Project Basics — consistent row spacing

Every field row inside the left card must have consistent spacing:

```tsx
// Each field:
<div style={{ marginBottom: '14px' }}>
  <label style={{
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--muted-foreground)',
    marginBottom: '5px',
  }}>
    Field label *
  </label>
  <input/select/textarea style={{
    width: '100%',
    height: '40px',           // all inputs/selects 40px — no exceptions
    borderRadius: '8px',
    border: '0.5px solid var(--border)',
    padding: '0 12px',
    fontSize: '13px',
    background: 'var(--background)',
    color: 'var(--foreground)',
  }} />
</div>
```

Season + Category fields: side by side in a row:
```tsx
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
  <div>{/* Season select */}</div>
  <div>{/* Category select */}</div>
</div>
```

### Step 4 — Right card: Upload & auto-fill — natural content height

The right card should be as tall as its content, no extra white space:

```tsx
<div style={{
  background: 'var(--card)',
  borderRadius: '12px',
  border: '0.5px solid var(--border)',
  padding: '20px',
}}>
  {/* Header */}
  <div style={{
    display: 'flex', alignItems: 'center', gap: '8px',
    marginBottom: '16px',
  }}>
    <span style={{ fontSize: '13px', fontWeight: 500 }}>Upload & auto-fill</span>
    <span style={{
      fontSize: '9px', padding: '2px 6px', borderRadius: '5px',
      background: '#EEEDFE', color: '#3C3489', fontWeight: 500,
    }}>AI</span>
  </div>

  {/* Drop zone */}
  <div
    style={{
      border: '1.5px dashed var(--border)',
      borderRadius: '10px',
      padding: '32px 20px',
      textAlign: 'center',
      cursor: 'pointer',
      background: 'var(--muted)',
      marginBottom: '14px',
      transition: 'border-color .15s, background .15s',
    }}
    onDragOver={e => e.preventDefault()}
    onDrop={handleFileDrop}
    onClick={() => fileInputRef.current?.click()}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="#BA7517" strokeWidth="1.5" strokeLinecap="round"
      style={{ margin: '0 auto 10px', display: 'block' }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
    <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '5px',
      color: 'var(--foreground)' }}>
      Drop PO or tech pack
    </div>
    <div style={{ fontSize: '11px', color: 'var(--muted-foreground)',
      marginBottom: '12px' }}>
      Excel, PDF, Word, CSV
    </div>
    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
      {[
        { label: 'Excel', bg: '#E6F1FB', color: '#0C447C' },
        { label: 'PDF',   bg: '#E1F5EE', color: '#085041' },
        { label: 'Word',  bg: '#EEEDFE', color: '#3C3489' },
        { label: 'CSV',   bg: '#E1F5EE', color: '#085041' },
      ].map(t => (
        <span key={t.label} style={{
          fontSize: '10px', padding: '2px 8px', borderRadius: '5px',
          fontWeight: 500, background: t.bg, color: t.color,
        }}>{t.label}</span>
      ))}
    </div>
  </div>

  {/* AI description */}
  <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
    AI reads your PO or tech pack and fills project name, factory, sizes,
    PO number, delivery date, AQL level automatically.
  </p>

  <input ref={fileInputRef} type="file" style={{ display: 'none' }}
    accept=".xlsx,.xls,.pdf,.doc,.docx,.csv"
    onChange={e => e.target.files?.[0] && handleFileDrop(e)} />
</div>
```

---

## FIX 2 — FACTORIES WIZARD

**File:** Find with:
```bash
find . -path "*/factories/new*" -name "page.tsx" | grep -v node_modules | grep -v .next
```

### Step 1 — Back button
```tsx
<BackButton href="/factories" label="Back to Factories" />
```

### Step 2 — Two equal columns, alignItems: stretch

For factories the right card must MATCH the left card height exactly:

```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
  alignItems: 'stretch',   // ← stretch: right matches left height always
  width: '100%',
}}>
```

### Step 3 — Right card: Photo upload + AI auto-fill, fills full height

The right card has two upload zones. They must fill the available height equally:

```tsx
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
  {/* Zone 1: Factory photo — top half */}
  <div
    onClick={() => photoRef.current?.click()}
    style={{
      flex: 1,                          // ← half the height
      border: '1.5px dashed var(--border)',
      borderRadius: '10px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      cursor: 'pointer',
      background: 'var(--muted)',
      padding: '16px',
      transition: 'border-color .15s',
      minHeight: '140px',
    }}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="#BA7517" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--foreground)' }}>
      Upload factory photo
    </div>
    <div style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>
      JPG, PNG, WebP · max 5MB
    </div>
  </div>

  {/* Zone 2: AI auto-fill — bottom half */}
  <div
    onClick={() => docRef.current?.click()}
    style={{
      flex: 1,                          // ← other half of height
      border: '1.5px dashed var(--border)',
      borderRadius: '10px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      cursor: 'pointer',
      background: 'var(--muted)',
      padding: '16px',
      transition: 'border-color .15s',
      minHeight: '140px',
    }}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="#BA7517" strokeWidth="1.5" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--foreground)' }}>
      Upload & auto-fill
    </div>
    <div style={{ fontSize: '10px', color: 'var(--muted-foreground)',
      textAlign: 'center', lineHeight: 1.4 }}>
      Drop vendor assessment or compliance doc
    </div>
    <div style={{ display: 'flex', gap: '5px' }}>
      {[
        { label: 'Excel', bg: '#E6F1FB', color: '#0C447C' },
        { label: 'PDF',   bg: '#E1F5EE', color: '#085041' },
        { label: 'Word',  bg: '#EEEDFE', color: '#3C3489' },
      ].map(t => (
        <span key={t.label} style={{
          fontSize: '10px', padding: '2px 7px', borderRadius: '5px',
          fontWeight: 500, background: t.bg, color: t.color,
        }}>{t.label}</span>
      ))}
    </div>
  </div>

  <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }}
    onChange={handlePhotoSelect} />
  <input ref={docRef} type="file" accept=".xlsx,.xls,.pdf,.doc,.docx"
    style={{ display: 'none' }} onChange={handleDocSelect} />
</div>
```

---

## FIX 3 — INSPECTIONS WIZARD

**File:** Find with:
```bash
find . -path "*/inspections/new*" -name "page.tsx" | grep -v node_modules | grep -v .next
```

### Step 1 — Back button
```tsx
<BackButton href="/inspections" label="Back to Inspections" />
```

### Step 2 — Step 1 (Setup): Two equal columns, alignItems: stretch

Both containers must be exactly the same height at all times:

```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
  alignItems: 'stretch',
  width: '100%',
}}>
  {/* LEFT — Inspection Details */}
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <div style={{
      background: 'var(--card)',
      borderRadius: '12px',
      border: '0.5px solid var(--border)',
      padding: '20px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      <div style={{ fontSize: '14px', fontWeight: 500 }}>Inspection Details</div>

      {/* Project */}
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500,
          color: 'var(--muted-foreground)', marginBottom: '5px' }}>Project *</label>
        <select style={{ width: '100%', height: '40px', borderRadius: '8px',
          border: '0.5px solid var(--border)', padding: '0 12px',
          fontSize: '13px', background: 'var(--background)' }}>
          <option value="">Select project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Inspection date */}
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500,
          color: 'var(--muted-foreground)', marginBottom: '5px' }}>Inspection date *</label>
        <input type="date" value={formData.date}
          onChange={e => setFormData(p => ({...p, date: e.target.value}))}
          style={{ width: '100%', height: '40px', borderRadius: '8px',
            border: '0.5px solid var(--border)', padding: '0 12px',
            fontSize: '13px', background: 'var(--background)' }} />
      </div>

      {/* Inspection type */}
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500,
          color: 'var(--muted-foreground)', marginBottom: '5px' }}>Inspection type *</label>
        <select style={{ width: '100%', height: '40px', borderRadius: '8px',
          border: '0.5px solid var(--border)', padding: '0 12px',
          fontSize: '13px', background: 'var(--background)' }}>
          <option>Final inspection</option>
          <option>Pre-production</option>
          <option>During production</option>
          <option>Loading check</option>
        </select>
      </div>

      {/* Factory */}
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500,
          color: 'var(--muted-foreground)', marginBottom: '5px' }}>Factory *</label>
        <select style={{ width: '100%', height: '40px', borderRadius: '8px',
          border: '0.5px solid var(--border)', padding: '0 12px',
          fontSize: '13px', background: 'var(--background)' }}>
          <option value="">Select factory</option>
          {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>
    </div>
  </div>

  {/* RIGHT — Inspector Details */}
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <div style={{
      background: 'var(--card)',
      borderRadius: '12px',
      border: '0.5px solid var(--border)',
      padding: '20px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      <div style={{ fontSize: '14px', fontWeight: 500 }}>Inspector Details</div>

      {/* Inspector name */}
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500,
          color: 'var(--muted-foreground)', marginBottom: '5px' }}>Inspector name *</label>
        <input type="text" placeholder="Full name"
          style={{ width: '100%', height: '40px', borderRadius: '8px',
            border: '0.5px solid var(--border)', padding: '0 12px',
            fontSize: '13px', background: 'var(--background)' }} />
      </div>

      {/* Inspector type */}
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500,
          color: 'var(--muted-foreground)', marginBottom: '5px' }}>Inspector type</label>
        <select style={{ width: '100%', height: '40px', borderRadius: '8px',
          border: '0.5px solid var(--border)', padding: '0 12px',
          fontSize: '13px', background: 'var(--background)' }}>
          <option>Brand inspector</option>
          <option>Third-party agency</option>
          <option>Internal QC</option>
        </select>
      </div>

      {/* Contact */}
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500,
          color: 'var(--muted-foreground)', marginBottom: '5px' }}>Contact</label>
        <input type="tel" placeholder="+91 98765 43210"
          style={{ width: '100%', height: '40px', borderRadius: '8px',
            border: '0.5px solid var(--border)', padding: '0 12px',
            fontSize: '13px', background: 'var(--background)' }} />
      </div>

      {/* Completion checklist — uses flex: 1 to fill remaining height */}
      <div style={{
        flex: 1,
        padding: '12px 14px',
        background: 'var(--muted)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '8px',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 500, marginBottom: '4px' }}>
          Completion checklist
        </div>
        {[
          { label: 'Project selected',      done: !!formData.projectId },
          { label: 'Factory confirmed',     done: !!formData.factoryId },
          { label: 'Inspector name entered',done: !!formData.inspectorName },
          { label: 'Date selected',         done: !!formData.date },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center',
            gap: '8px', fontSize: '12px' }}>
            <div style={{
              width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
              background: item.done ? '#1D9E75' : 'transparent',
              border: item.done ? 'none' : '1.5px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {item.done && (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none"
                  stroke="#fff" strokeWidth="3">
                  <path d="M9 11l3 3L22 4"/>
                </svg>
              )}
            </div>
            <span style={{ color: item.done ? '#1D9E75' : 'var(--muted-foreground)' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>

{/* ONE Continue button — bottom right only */}
<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
  <button
    onClick={handleContinue}
    disabled={!isStep1Complete}
    style={{
      padding: '8px 24px', borderRadius: '8px',
      background: isStep1Complete ? '#BA7517' : 'var(--muted)',
      color: isStep1Complete ? '#fff' : 'var(--muted-foreground)',
      border: 'none', fontSize: '13px', fontWeight: 500,
      cursor: isStep1Complete ? 'pointer' : 'not-allowed',
      display: 'flex', alignItems: 'center', gap: '6px',
      transition: 'background .2s',
    }}>
    Continue
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  </button>
</div>
```

`isStep1Complete` = `!!formData.projectId && !!formData.factoryId && !!formData.inspectorName && !!formData.date`

### Step 3 — Apply same equal container rule to ALL other steps (2, 4, 5, 6, 7)

For every other step that has two columns — apply `gridTemplateColumns: '1fr 1fr'`, `gap: '16px'`, `alignItems: 'stretch'`, `padding: '20px'` on both cards.

Step 3 (Photos) — DO NOT CHANGE.

---

## FIX 4 — FACTORY AUDIT (NEW AUDIT PAGE)

**File:** Find with:
```bash
find . -path "*audit*new*" -name "page.tsx" | grep -v node_modules | grep -v .next
find . -path "*factory-audit*" -name "page.tsx" | grep -v node_modules | grep -v .next
```

### Step 1 — Back button
```tsx
<BackButton href="/audits/factory" label="Back to Factory Audits" />
```

### Step 2 — Layout: TWO COLUMNS, everything on ONE PAGE, NO SCROLL

```tsx
// Page wrapper — no overflow scroll
<div style={{ padding: '24px', width: '100%' }}>
  <BackButton href="/audits/factory" label="Back to Factory Audits" />

  <h1 style={{ fontSize: '22px', fontWeight: 500, marginBottom: '4px' }}>Factory Audit</h1>
  <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '20px' }}>
    Step-by-step audit of a manufacturing facility
  </p>

  {/* TWO EQUAL COLUMNS — everything in one view */}
  <div style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    alignItems: 'stretch',
    width: '100%',
    marginBottom: '16px',
  }}>

    {/* LEFT — Audit Details */}
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: 'var(--card)',
        borderRadius: '12px',
        border: '0.5px solid var(--border)',
        padding: '20px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 500 }}>Audit Details</div>

        {/* Factory */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500,
            color: 'var(--muted-foreground)', marginBottom: '5px' }}>Factory *</label>
          <select style={{ width: '100%', height: '40px', borderRadius: '8px',
            border: '0.5px solid var(--border)', padding: '0 12px',
            fontSize: '13px', background: 'var(--background)' }}>
            <option value="">Select factory</option>
            {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>

        {/* Inspector name */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500,
            color: 'var(--muted-foreground)', marginBottom: '5px' }}>Inspector name *</label>
          <input type="text" placeholder="Full name"
            style={{ width: '100%', height: '40px', borderRadius: '8px',
              border: '0.5px solid var(--border)', padding: '0 12px',
              fontSize: '13px', background: 'var(--background)' }} />
        </div>

        {/* Audit type */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500,
            color: 'var(--muted-foreground)', marginBottom: '8px' }}>Audit type</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Initial audit', 'Follow-up', 'Annual re-audit'].map(type => (
              <button key={type}
                onClick={() => setAuditType(type)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: '0.5px solid var(--border)',
                  background: auditType === type ? '#BA7517' : 'var(--background)',
                  color: auditType === type ? '#fff' : 'var(--muted-foreground)',
                  transition: 'all .15s',
                }}>
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* RIGHT — Scores + Report */}
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: 'var(--card)',
        borderRadius: '12px',
        border: '0.5px solid var(--border)',
        padding: '20px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {/* Audit date + Inspector type — two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500,
              color: 'var(--muted-foreground)', marginBottom: '5px' }}>Audit date *</label>
            <input type="date"
              style={{ width: '100%', height: '40px', borderRadius: '8px',
                border: '0.5px solid var(--border)', padding: '0 10px',
                fontSize: '13px', background: 'var(--background)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500,
              color: 'var(--muted-foreground)', marginBottom: '5px' }}>Inspector type</label>
            <select style={{ width: '100%', height: '40px', borderRadius: '8px',
              border: '0.5px solid var(--border)', padding: '0 10px',
              fontSize: '13px', background: 'var(--background)' }}>
              <option>Brand inspector</option>
              <option>Third-party agency</option>
              <option>Internal QC</option>
            </select>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '0.5px', background: 'var(--border)' }} />

        {/* Section scores label */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '2px' }}>
            Section scores
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
            Score each section — total calculated automatically
          </div>
        </div>

        {/* 6 section score rows */}
        {[
          { name: 'Legal & compliance',  sub: 'Licenses, permits, certifications',    max: 20, key: 'legal' },
          { name: 'Health & safety',     sub: 'Fire exits, PPE, emergency procedures',max: 20, key: 'health' },
          { name: 'Working conditions',  sub: 'Hours, wages, worker welfare',          max: 20, key: 'working' },
          { name: 'Production capacity', sub: 'Lines, equipment, output capability',   max: 15, key: 'capacity' },
          { name: 'Quality systems',     sub: 'QC processes, defect tracking',         max: 15, key: 'quality' },
          { name: 'Environmental',       sub: 'Waste management, water, emissions',    max: 10, key: 'environmental' },
        ].map(section => (
          <div key={section.key} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: 'var(--muted)',
            borderRadius: '8px',
          }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 500 }}>{section.name}</div>
              <div style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>
                {section.sub}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="number" min={0} max={section.max}
                value={scores[section.key] ?? 0}
                onChange={e => {
                  const val = Math.min(Math.max(parseInt(e.target.value)||0, 0), section.max)
                  setScores(prev => ({ ...prev, [section.key]: val }))
                }}
                style={{
                  width: '50px', height: '34px',
                  textAlign: 'center',
                  borderRadius: '7px',
                  border: '0.5px solid var(--border)',
                  fontSize: '13px', fontWeight: 500,
                  background: 'var(--background)',
                }} />
              <span style={{ fontSize: '12px', color: 'var(--muted-foreground)',
                minWidth: '28px' }}>
                /{section.max}
              </span>
            </div>
          </div>
        ))}

        {/* Total score — bottom of right card */}
        <div style={{
          marginTop: 'auto',
          padding: '12px 16px',
          borderRadius: '10px',
          background: totalScore >= 75 ? '#E1F5EE'
                    : totalScore >= 50 ? '#FAEEDA' : '#FCEBEB',
          border: `1.5px solid ${totalScore >= 75 ? '#1D9E75'
                    : totalScore >= 50 ? '#BA7517' : '#E24B4A'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 500,
              color: totalScore >= 75 ? '#085041'
                   : totalScore >= 50 ? '#633806' : '#791F1F' }}>
              Total audit score
            </div>
            <div style={{ fontSize: '11px',
              color: totalScore >= 75 ? '#1D9E75'
                   : totalScore >= 50 ? '#BA7517' : '#E24B4A' }}>
              {totalScore >= 75 ? '✓ Approved'
             : totalScore >= 50 ? '⚠ Conditional' : '✗ Failed'}
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 500,
            color: totalScore >= 75 ? '#1D9E75'
                 : totalScore >= 50 ? '#BA7517' : '#E24B4A' }}>
            {totalScore}%
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Submit button — bottom right, green when all sections scored > 0 */}
  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
    <button
      onClick={handleSubmit}
      disabled={!allSectionsScored}
      style={{
        padding: '8px 24px', borderRadius: '8px',
        background: allSectionsScored ? '#1D9E75' : 'var(--muted)',
        color: allSectionsScored ? '#fff' : 'var(--muted-foreground)',
        border: 'none', fontSize: '13px', fontWeight: 500,
        cursor: allSectionsScored ? 'pointer' : 'not-allowed',
        display: 'flex', alignItems: 'center', gap: '6px',
        transition: 'background .2s',
      }}>
      Submit audit →
    </button>
  </div>
</div>
```

**Score state and calculations:**
```typescript
const [scores, setScores] = useState({
  legal: 0, health: 0, working: 0,
  capacity: 0, quality: 0, environmental: 0,
})

// Live total: sum of all scores as percentage of 100
const totalScore = scores.legal + scores.health + scores.working +
  scores.capacity + scores.quality + scores.environmental

// All sections scored = every section has at least 1 point entered
const allSectionsScored = Object.values(scores).every(v => v > 0)
```

---

## BUILD & DEPLOY

```bash
cd /var/www/Master_Sankalphub/V3.0_Frontend

# Verify BackButton component created
ls components/ui/BackButton.tsx

npm run build 2>&1 | tail -30

if [ $? -eq 0 ]; then
  git add -A
  git commit -m "fix: perfect container layout — equal 1fr columns, back buttons, factory audit one-page, inspections equal height"
  git push origin main
  echo "✅ DEPLOYED"
else
  echo "❌ BUILD FAILED"
  npm run build 2>&1 | grep -E "Error|error|×" | head -30
fi
```

---

## FINAL VERIFICATION CHECKLIST

**Projects wizard:**
- [ ] Back button styled correctly — hover turns gold
- [ ] `alignItems: start` — right card natural height, no empty white space
- [ ] Left card: 20px padding, all fields consistent 40px height
- [ ] Season + Category side by side in one row
- [ ] Right card: drop zone with file badges + AI description, no excessive empty space

**Factories wizard:**
- [ ] Back button styled correctly
- [ ] `alignItems: stretch` — right card matches left card height exactly
- [ ] Right card: two zones (factory photo + AI auto-fill) each `flex: 1` — fill equally
- [ ] No empty white space at bottom of right card

**Inspections wizard:**
- [ ] Back button styled correctly
- [ ] `alignItems: stretch` — both containers same height always
- [ ] Left: Project, Date, Type, Factory — all 40px fields, 20px padding
- [ ] Right: Inspector name, type, contact + completion checklist fills remaining space
- [ ] Completion checklist dots update live as fields are filled
- [ ] ONE Continue button only — bottom right, amber when complete

**Factory Audit:**
- [ ] Back button styled correctly
- [ ] Everything on ONE page — no page scroll
- [ ] Left: Factory + Inspector name + Audit type toggle
- [ ] Right: Date + Inspector type + 6 section scores + total score
- [ ] Total score calculates live: green ≥75, amber 50–74, red <50
- [ ] Submit button bottom right: gray until all sections scored, then green

---

*SankalpHub V3 — Final Container Fixes*
*One brief · Four pages · Perfect first time*
*April 3, 2026*
