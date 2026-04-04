# Fix #1 — Upload & Auto-fill Drop Box: Description Text Outside Border

## Page
`/projects/new` → **Upload & auto-fill** section

---

## Problem

The `<p>` description tag ("AI reads your PO or tech pack...") was a **flex sibling** of the dashed Drop Box `<div>`, not a child inside it.

Since the outer wrapper is `display: flex; flex-direction: row`, the `<p>` was placed **beside** the dashed box — visually outside the border.

### Broken Structure
```jsx
<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

  <div style={{ border: '1.5px dashed var(--border)', flex: 1 }}>
    {/* icon, "Drop PO or tech pack", format badges */}
  </div>

  {/* ❌ sibling of the dashed box — renders outside */}
  <p style={{ fontSize: '9px', maxWidth: '200px', ... }}>
    AI reads your PO or tech pack and fills project name, factory, sizes,
    PO number, delivery date, AQL level
  </p>

</div>
```

---

## Fix

### 1. Move `<p>` inside the dashed box
Close the dashed `<div>` **after** the `<p>` tag, not before it.

### 2. Update `<p>` styles

| Property | Before | After |
|---|---|---|
| `maxWidth` | `200px` | `none` |
| `width` | _(not set)_ | `100%` |
| `whiteSpace` | _(not set)_ | `nowrap` |
| `textAlign` | _(not set)_ | `center` |
| `fontSize` | `9px` | `11px` |
| `marginTop` | _(not set)_ | `8px` |

### Fixed Structure
```jsx
<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

  <div style={{ border: '1.5px dashed var(--border)', flex: 1 }}>
    {/* icon, "Drop PO or tech pack", format badges */}

    {/* ✅ child of the dashed box — renders inside */}
    <p style={{
      fontSize: '11px',
      color: 'var(--muted-foreground)',
      lineHeight: 1.5,
      maxWidth: 'none',
      width: '100%',
      whiteSpace: 'nowrap',
      textAlign: 'center',
      marginTop: '8px',
    }}>
      AI reads your PO or tech pack and fills project name, factory, sizes,
      PO number, delivery date, AQL level
    </p>

  </div>

</div>
```

---

## Root Cause Summary
Wrong DOM nesting — `<p>` was closed outside the dashed border `<div>`, combined with a `max-width: 200px` constraint that forced the text to wrap into multiple lines instead of sitting as a single centered line.
