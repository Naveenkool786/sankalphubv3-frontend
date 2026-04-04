# Fix #2 — Factories Page Crash: `certifications.map is not a function`

## Page
`/factories`

---

## Problem

The Factories page fails to load entirely with a browser-level "This page couldn't load" error.

### Console Error
```
TypeError: e.certifications.map is not a function
```

The page component calls `.map()` directly on `e.certifications`, but the value coming from the API is not always an array — it may be `null`, `undefined`, or a plain string (e.g. `"ISO, GOTS"`). Since `.map()` is an Array-only method, React crashes mid-render and the entire page fails to mount.

---

## Fix

Add a defensive array guard before calling `.map()`.

```js
// ❌ Before — crashes if certifications is null, undefined, or a string
e.certifications.map((cert) => ...)

// ✅ After — safe, always works
(Array.isArray(e.certifications) ? e.certifications : []).map((cert) => ...)
```

Or extract it for clarity:
```js
const certs = Array.isArray(e.certifications) ? e.certifications : [];
certs.map((cert) => ...)
```

---

## Likely Data Scenarios

| Value from API | Type | Result without fix |
|---|---|---|
| `null` | null | ❌ Crashes |
| `undefined` | undefined | ❌ Crashes |
| `"ISO, GOTS"` | string | ❌ Crashes |
| `["ISO", "GOTS"]` | array | ✅ Works |

---

## Root Cause Summary
No defensive type check before `.map()` on `certifications`. The API can return a non-array value for factories where certifications are absent or stored as a string, causing an unhandled runtime exception that crashes the entire page render.
