# Fix #3 — Factory Card: Continue Button & Photo Upload

## Page
`/factories` → Factory Card component

---

## Finding 1 — Wrong Condition Triggers Continue Button

### Problem
The card footer uses `status === "inactive"` as a proxy for "setup incomplete":

```js
// ❌ Wrong — any deactivated factory shows Continue forever
"inactive" !== e.status || e.latest_audit_score
  ? <NormalCardFooter />
  : <ReviewAndConfirmFooter />  // Shows "Review and confirm" + Continue button
```

`Inactive` is a valid operational status (a real factory that has been deactivated), not a signal that setup is unfinished. This means every inactive factory will permanently show the Continue button even if fully set up.

### Fix
Use a dedicated `is_draft` field instead:

```js
// ✅ Correct — only true drafts show Continue
e.is_draft === true
  ? <ReviewAndConfirmFooter />
  : <NormalCardFooter />
```

---

## Finding 2 — Continue Button Routes to Wrong URL

### Problem
The Continue button navigates to the factory **creation wizard** with a `draftId`:

```js
// ❌ Wrong — sends fully created factory back to creation wizard
router.push(`/factories/new?draftId=${e.id}`)
```

A fully created (but inactive) factory should go to its **edit/detail page**, not the new factory wizard.

### Fix
```js
// ✅ For actual drafts → creation wizard
e.is_draft === true
  ? router.push(`/factories/new?draftId=${e.id}`)
  : router.push(`/factories/${e.id}/edit`)
```

---

## Finding 3 — Factory Photo Not Saved (Silent Upload Failure)

### Problem
Two issues caused the factory photo to never appear on the card:

**A — Infra: `factory-photos` Supabase bucket did not exist ✅ FIXED**
The code calls `supabase.storage.from("factory-photos").upload(...)` but the bucket was never created. Every upload silently returned a 404.

**B — Code: Upload error not captured**
The upload response only destructures `{ data }` — `error` is completely ignored:

```js
// ❌ Before — error silently swallowed, photo_url saved as null
const { data: a } = await supabase.storage
  .from("factory-photos")
  .upload(path, L.photoFile, { upsert: true });

a && (i = supabase.storage.from("factory-photos").getPublicUrl(a.path).data.publicUrl);
// i stays "" if upload fails → photo_url: null saved to DB
```

### Fix
```js
// ✅ After — error surfaced to user
const { data: a, error: uploadError } = await supabase.storage
  .from("factory-photos")
  .upload(path, L.photoFile, { upsert: true });

if (uploadError) {
  toast.error("Photo upload failed: " + uploadError.message);
} else if (a) {
  i = supabase.storage.from("factory-photos").getPublicUrl(a.path).data.publicUrl;
}
```

### Bucket Config (already done ✅)
- Bucket name: `factory-photos`
- Visibility: **Public**
- Policies: 2 set up
- Max file size: 50MB
- MIME types: all accepted

---

## Summary Table

| # | Issue | Type | Status |
|---|---|---|---|
| 1 | `status === "inactive"` wrongly triggers Continue button | Code | ❌ Needs fix |
| 2 | Continue button routes to `/factories/new` instead of `/factories/[id]/edit` | Code | ❌ Needs fix |
| 3a | `factory-photos` bucket missing in Supabase | Infra | ✅ Fixed |
| 3b | Upload `error` not captured — silent failure | Code | ❌ Needs fix |

---

## Root Cause Summary
The factory card conflates `inactive` status with "draft/incomplete", causing the wrong UI and wrong navigation. Separately, the photo upload never worked because the storage bucket didn't exist and errors were silently swallowed with no feedback to the user.
