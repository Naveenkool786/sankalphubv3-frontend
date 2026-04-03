# Bug Fix: Product Image Container Expanding Beyond Intended Size

**Framework:** Next.js (App Router) with Turbopack  
**Page:** `/projects/new` — Step 1 "Create New Project"

---

## Problem

On the **"Product image"** card (right panel of the two-column grid on step 1), the image preview slot is expanding to fill the full height of the grid row (~700px) instead of staying at a fixed, compact height. This makes the uploaded image render huge.

**Root cause:** The image slot wrapper div has `flex: 1 1 0%` applied as an inline style, which causes it to grow and consume all remaining vertical space inside the card. The card itself uses `display: flex; flex-direction: column`, so the slot stretches to fill it.

---

## What to Fix

Find the component that renders the **"Product image"** card. It is a `flex-direction: column` card containing:

1. A title div with `"Product image"` text
2. An **image slot wrapper div** — this is the element to fix

The image slot wrapper currently has an inline style that includes `flex: 1 1 0%` (among other properties like `border-radius`, `overflow`, `background`, `display: flex`, `align-items: center`, `justify-content: center`, `padding: 0px`).

**Change this:**

```js
// current (broken)
flex: '1 1 0%'
```

**To this:**

```js
// fixed
flex: 'none',
height: '300px',
width: '100%',
```

Keep all other existing properties on that element unchanged (`border-radius`, `overflow`, `background`, `display`, `alignItems`, `justifyContent`, `padding`).

---

## The Inner Image Element

The `<img>` inside already has correct styles — **do not touch these:**

```js
width: '100%',
height: '100%',
objectFit: 'contain',
objectPosition: 'center',
```

`object-fit: contain` ensures the full image is always visible without cropping.

---

## Expected Result After Fix

- The image slot is a fixed `300px` tall box
- The full uploaded image is visible inside it (no cropping, no stretching)
- The card does not grow to dominate the layout
- Both left (Project Basics) and right (Product image) panels sit at a consistent height in the grid
