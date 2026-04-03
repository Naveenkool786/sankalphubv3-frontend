# Layout Redesign: Step 1 "Create New Project"

**Framework:** Next.js (App Router) with Turbopack
**Page:** `/projects/new` — Step 1
**Find:** The component that renders Step 1 of the project creation wizard

---

## Current Layout (what exists now)

```
┌─────────────────────────┬──────────────────────────┐
│     Project Basics      │    Upload & auto-fill     │
│  - Project name         │  - Drop PO / tech pack    │
│  - Season / Category    │  - Excel/PDF/Word/CSV      │
│  - Product type         │  - AI helper text         │
│  - Description          │                           │
│  - Product image        │                           │
│    (upload widget)      │                           │
└─────────────────────────┴──────────────────────────┘
```

The "Product image" field (label + upload widget) currently lives as the **last child** inside the "Project Basics" card.

---

## Target Layout (what to build)

```
┌─────────────────────────┬──────────────────────────┐
│     Project Basics      │     Product image         │
│  - Project name         │  [upload widget fills     │
│  - Season / Category    │   the full card height]   │
│  - Product type         │                           │
│  - Description          │                           │
└─────────────────────────┴──────────────────────────┘
┌──────────────────────────────────────────────────────┐
│               Upload & auto-fill        AI           │
│  [Drop PO or tech pack — full width]                 │
└──────────────────────────────────────────────────────┘
```

---

## Changes Required

### 1. Remove "Product image" from the Project Basics card

In the Project Basics card, **remove the last child** which is the "Product image" field group (contains: a `<label>` "Product image", the dashed upload box div, and a hidden `<input type="file">`).

The Project Basics card should now only contain:
- H2 title: "Project Basics"
- Project name field
- Season / Category row
- Product type field
- Description textarea

---

### 2. Create a new standalone "Product image" card

Create a new card with **exactly this style** (same as the Project Basics card):

```js
style="background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 20px; flex: 1 1 0%; display: flex; flex-direction: column; gap: 14px;"
```

Inside this card:

**a) H2 title — "Product image":**
```js
style="font-size: 14px; font-weight: 600; color: var(--foreground);"
```
> Do NOT add a `<label>` — only the `<h2>`. This avoids the duplicate "Product image" text.

**b) Slot wrapper div** — wraps the upload widget and image preview, fills remaining card height:
```js
style="flex: 1 1 0%; width: 100%; display: flex; flex-direction: column;"
```

Inside the slot wrapper, render the **existing image upload/preview widget** (move it from Project Basics — keep all state, handlers, and logic intact):

- **Empty state** (no image): dashed upload box, cursor pointer, camera icon, "Click to upload product image", "JPG, PNG, WebP · max 5MB"
  - The dashed box must fill the full slot wrapper:
    ```js
    style="border: 1.5px dashed var(--border); border-radius: 8px; cursor: pointer; background: var(--muted); flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%;"
    ```

- **Filled state** (image uploaded): image preview container:
    ```js
    style="border-radius: 8px; background: var(--muted); flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 300px; position: relative; overflow: hidden;"
    ```
  - The `<img>` inside keeps its existing styles:
    ```js
    style="width:100%; height:100%; object-fit:contain; object-position:center;"
    ```
  - The "Remove" button stays in place (already positioned absolute top-right)

- Hidden `<input type="file">` stays inside the slot wrapper (unchanged, `display: none`)

---

### 3. Update the two-column grid

The outer grid currently holds: **[Project Basics] [Upload & auto-fill]**

Change it to: **[Project Basics] [Product image]**

Grid wrapper style stays unchanged:
```js
style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: stretch;"
```

---

### 4. Move "Upload & auto-fill" below the grid as full-width

Take the **Upload & auto-fill** card out of the grid and place it as a **sibling element directly after the grid**, inside the same `p-6 lg:p-8` page wrapper div.

Update its style to:
```js
style="background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; margin-top: 16px;"
```

Keep all inner content of the Upload & auto-fill card **completely unchanged**.

---

## What NOT to Change

- All field logic, state, validation, onChange handlers — untouched
- The "Continue →" button row stays below everything, unchanged
- Steps 2, 3, 4 are unaffected
- Upload & auto-fill card inner content and logic — untouched
- The hidden `<input type="file">` for the product image — untouched
