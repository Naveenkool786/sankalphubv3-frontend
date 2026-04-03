# SankalpHub — Landing Page Copy Fix Brief (V3 Frontend)
**For: Claude Code**
**Date:** March 29, 2026
**Scope:** Two copy changes on the landing page only
**Mode:** Text changes only. Do NOT touch layout, styling, or any other page.

> ⚠️ **WORKING DIRECTORY: V3 Frontend ONLY**
> `/var/www/Master_Sankalphub/V3.0_Frontend/`

---

## CHANGES REQUIRED

### Change 1 — Hero headline + subtext

**File:** Main landing page component — `app/page.tsx` or `app/(public)/page.tsx`

**Find and replace:**

```
BEFORE:
"A Unified Operating Platform Designed to Enhance Manufacturing Performance"

AFTER (headline):
"Build Better Products, Faster."

AFTER (subtext — replace the existing long subtext paragraph with):
"Tech packs, sampling, supplier collaboration, and product passports — all in one platform. Finally, ditch the spreadsheets."
```

---

### Change 2 — Pricing plan CTA buttons

**File:** Same landing page component — find the pricing section

There are three pricing cards. Update each button as follows:

```
FREE PLAN BUTTON:
BEFORE: "Start Free"
AFTER:  "Start Free Trial"

PRO PLAN BUTTON:
BEFORE: "Start 14-Day Trial"
AFTER:  "Get Started"

ENTERPRISE PLAN BUTTON:
Keep as: "Contact Sales" (no change needed)
```

---

## VERIFICATION

```bash
# Confirm changes
grep -n "A Unified Operating\|14-Day\|14-day" /var/www/Master_Sankalphub/V3.0_Frontend/app/page.tsx
# Should return zero results after the fix
```

---

## BUILD & DEPLOY

```bash
cd /var/www/Master_Sankalphub/V3.0_Frontend
npm run build
git add -A
git commit -m "fix: hero headline copy + pro plan CTA button"
git push origin main
```

---

## FINAL CHECKLIST

- [ ] Hero reads: "Build Better Products, Faster."
- [ ] Hero subtext: "Tech packs, sampling, supplier collaboration, and product passports — all in one platform. Finally, ditch the spreadsheets."
- [ ] Free plan button reads: "Start Free Trial"
- [ ] Pro plan button reads: "Get Started"
- [ ] Enterprise plan button reads: "Contact Sales" (unchanged)
- [ ] No other text on the page was changed
- [ ] `npm run build` — zero errors

---

*SankalpHub V3 Frontend — Landing Page Copy Fix*
*March 29, 2026*
