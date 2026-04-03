# SankalpHub — Sign-Up UX Redesign Brief (V3 Frontend)
**For: Claude Code + Sub-Agents**
**Date:** March 29, 2026
**Scope:** Replace existing sign-up/onboarding with a 4-step multi-screen flow
**Mode:** New build. Do NOT touch login, password recovery, or any other page.

> ⚠️ **WORKING DIRECTORY: V3 Frontend ONLY**
> All work is exclusively in `/var/www/Master_Sankalphub/V3.0_Frontend/`
> Do NOT touch `/var/www/Master_Sankalphub/Backend/`

---

## PLATFORM CONTEXT

| Item | Detail |
|------|--------|
| **Frontend Framework** | Next.js 15.2.1, React 19.2.4, TypeScript, Tailwind CSS |
| **UI Library** | shadcn/ui (Radix primitives) |
| **Auth** | Supabase Auth (email/password) |
| **Database** | Supabase — `jirhyxpcbfeelgiyxqdi.supabase.co` |
| **Tables** | organizations, profiles |
| **Frontend Path** | `/var/www/Master_Sankalphub/V3.0_Frontend/` |
| **Repo** | GitHub: `Naveenkool786/sankalphubv3-frontend` → Vercel auto-deploy |

---

## DESIGN REFERENCE — APPROVED MOCKUP

This brief is based on a visual mockup that has been reviewed and approved. Build exactly what is described below — no creative interpretation needed.

**Overall layout:**
- Centered single card, max-width 480px, on a light secondary background
- Card: white background, 12px border-radius, 0.5px border, 1.5rem padding
- Step progress indicator at the top (4 steps with connecting lines)
- SankalpHub Sacred Orbit logo + wordmark at the top of every card

**Brand colors to use:**
- Primary button: `#BA7517`
- Active step / focus ring: `#C9A96E`
- Gold accent text: `#C9A96E`
- Success green: `#1D9E75`
- Placeholder text: 11px, tertiary color

---

## THE SACRED ORBIT LOGO (use exactly this SVG on every step)

```tsx
// Logo component — reuse across all 4 steps
function SankalpLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
      <svg viewBox="0 0 140 140" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="dG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EDD898"/>
            <stop offset="100%" stopColor="#A87C30"/>
          </linearGradient>
          <linearGradient id="dI" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5E6B0"/>
            <stop offset="100%" stopColor="#C9A96E"/>
          </linearGradient>
          <linearGradient id="nG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C9A96E"/>
            <stop offset="100%" stopColor="#8B6520"/>
          </linearGradient>
        </defs>
        <ellipse cx="70" cy="70" rx="62" ry="22" fill="none" stroke="#C9A96E" strokeWidth="0.8" opacity="0.25" transform="rotate(-40 70 70)"/>
        <ellipse cx="70" cy="70" rx="62" ry="22" fill="none" stroke="#C9A96E" strokeWidth="0.8" opacity="0.4" transform="rotate(20 70 70)"/>
        <ellipse cx="70" cy="70" rx="62" ry="22" fill="none" stroke="#C9A96E" strokeWidth="0.8" opacity="0.2" transform="rotate(80 70 70)"/>
        <circle cx="70" cy="70" r="60" fill="none" stroke="#C9A96E" strokeWidth="0.4" opacity="0.15"/>
        <polygon points="70,14 116,70 70,122 24,70" fill="none" stroke="url(#dG)" strokeWidth="1.2" opacity="0.6"/>
        <polygon points="70,30 104,70 70,106 36,70" fill="none" stroke="url(#dG)" strokeWidth="1" opacity="0.9"/>
        <polygon points="70,44 96,70 70,94 44,70" fill="url(#dI)" opacity="0.12"/>
        <polygon points="70,44 96,70 70,94 44,70" fill="none" stroke="url(#dG)" strokeWidth="1.5"/>
        <circle cx="70"  cy="8"  r="4" fill="url(#nG)"/>
        <circle cx="124" cy="88" r="3" fill="url(#nG)" opacity="0.7"/>
        <circle cx="16"  cy="88" r="3" fill="url(#nG)" opacity="0.7"/>
        <line x1="70" y1="8"  x2="70"  y2="44" stroke="#C9A96E" strokeWidth="0.5" opacity="0.3"/>
        <line x1="124" y1="88" x2="96" y2="70" stroke="#C9A96E" strokeWidth="0.5" opacity="0.2"/>
        <line x1="16"  y1="88" x2="44" y2="70" stroke="#C9A96E" strokeWidth="0.5" opacity="0.2"/>
        <circle cx="70" cy="70" r="11" fill="none" stroke="#C9A96E" strokeWidth="0.8" opacity="0.5"/>
        <circle cx="70" cy="70" r="6"  fill="url(#dG)"/>
        <circle cx="70" cy="70" r="2.5" fill="#EDD898"/>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '18px', fontWeight: 600, lineHeight: 1 }}>
          <span>Sankalp</span><span style={{ color: '#C9A96E' }}>Hub</span>
        </span>
        <span style={{ fontSize: '7px', letterSpacing: '3px', color: '#C9A96E', textTransform: 'uppercase', marginTop: '2px' }}>
          Production Intelligence
        </span>
      </div>
    </div>
  )
}
```

> ⚠️ Each step needs its own uniquely named gradient IDs to avoid SVG conflicts (dG-s1, dG-s2, dG-s3, dG-s4 etc.)

---

## STEP PROGRESS INDICATOR

```tsx
// Stepper component — shown at top of page on all steps
// 4 circles connected by lines
// States: default (gray border) | active (amber #BA7517 fill) | done (green #1D9E75 fill with checkmark)

const steps = ['Company', 'Your role', 'Invite team', 'Done']

// Active step circle: bg #BA7517, white text
// Completed step circle: bg #1D9E75, white checkmark
// Upcoming step circle: white bg, gray border, gray text
// Connecting line: gray by default, green #1D9E75 when step to the left is done
```

---

## TASK ASSIGNMENT

| Task | Description | Agent |
|------|-------------|-------|
| Task 1 | Build the 4-step sign-up page at `/signup` | Sub-Agent 1 |
| Task 2 | Wire Supabase auth + org creation | Sub-Agent 1 |
| Task 3 | Update all "Start Free Trial" CTAs to link to `/signup` | Sub-Agent 2 |

---

## TASK 1 — Build the 4-Step Sign-Up Page

**File:** `app/(public)/signup/page.tsx` (new file)

Use `'use client'` — this is a fully client-side interactive flow.

Use `useState` to track `currentStep` (1–4) and form data across steps.

---

### Step 1 — Set up your company

**Title:** Set up your company
**Subtitle:** Tell us about your organisation to get started.

**Fields:**

| Field | Type | Required | Placeholder |
|---|---|---|---|
| Company name | Text | Yes | e.g. Acme Brands Ltd. |
| Country | Text | Yes | India |
| City | Text | Yes | Mumbai |
| Work email | Email | Yes | you@company.com |
| Password | Password | Yes | Min. 8 characters |
| Confirm password | Password | Yes | Repeat password |

Country and City are in a 2-column grid side by side.
Password and Confirm Password are in a 2-column grid side by side.

**Bottom link:** "Already have an account? Sign in" → `/login`

**CTA:** "Continue →" — validates all fields before proceeding to Step 2

**Validation:**
- All fields required
- Email must be valid format
- Password minimum 8 characters
- Confirm password must match password
- Show inline error messages below each field on invalid submit

---

### Step 2 — What best describes you?

**Title:** What best describes you?
**Subtitle:** We'll personalise your experience based on your role.

**Role selection — 3 cards in a row:**

| Role | Icon color | Description |
|---|---|---|
| Brand | Blue `#185FA5` on `#E6F1FB` bg | Buyer or product team |
| Factory | Amber `#854F0B` on `#FAEEDA` bg | Manufacturer or supplier |
| Agency | Green `#0F6E56` on `#E1F5EE` bg | 3rd party inspector |

Each role card:
- Border: 1.5px, gray default
- Selected: border `#C9A96E`, background `#FAEEDA`
- Hover: border `#C9A96E`
- Icon: 36×36px rounded square with colored background
- Role name: 12px, font-weight 500
- Description: 10px, tertiary color

Only one role can be selected at a time.

**Below roles — divider then:**

| Field | Type | Required | Placeholder |
|---|---|---|---|
| Your job title | Text | No | e.g. Quality Manager |

**CTA:** "Continue →" — role must be selected before proceeding
**Back:** "← Back" button (outlined, secondary style)

---

### Step 3 — Invite your team

**Title:** Invite your team
**Subtitle:** Add colleagues to collaborate. You can always do this later.

**3 invite rows** — each row contains:
- Email input (flex: 1) — placeholder: `colleague@company.com` (11px)
- Role select dropdown (width: 130px) — options: Brand Manager, Factory Manager, Inspector, Viewer
- `+` add button (32×36px, outlined)

**Below invite rows — divider then:**
- Small label: "Roles in your plan:"
- Role tags: Brand Manager · Factory Manager · Inspector · Viewer (amber pill style: `#FAEEDA` bg, `#633806` text)

**CTAs:**
- Primary: "Send invites & continue →"
- Skip link: "Skip — set up later" (small, tertiary color, `#C9A96E` underline on "set up later")
- Back: "← Back"

**Note:** Invite rows are optional. If emails are empty, skip the invite and proceed to Step 4.

---

### Step 4 — You're all set!

**Layout:** Centered, no form fields.

**Success icon:** 56×56px circle, `#E1F5EE` background, green checkmark SVG inside.

**Title:** You're all set!
**Subtitle:** Your 21-day free trial has started. No credit card required.

**2×2 grid of next-step cards** (gray secondary background, 8px radius):

| Label | Action |
|---|---|
| Next step | Add your first factory |
| Then | Create a project |
| Then | Start an inspection |
| Always | View your dashboard |

Each card: label in 11px tertiary, action in 12px font-weight 500.

**CTA:** "Go to dashboard →" → redirects to `/dashboard`

**Footer note:** "Trial ends in 21 days · No credit card needed" (11px, tertiary)

---

## TASK 2 — Wire Supabase Auth + Org Creation

**Agent:** Sub-Agent 1 (run after UI is built)

On "Go to dashboard →" button click in Step 4, trigger the following sequence:

```typescript
// 1. Create Supabase auth user
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
})
if (authError) throw authError

// 2. Create organisation
const { data: org, error: orgError } = await supabase
  .from('organizations')
  .insert({
    name: formData.companyName,
    country: formData.country,
    city: formData.city,
    type: formData.role,           // 'brand' | 'factory' | 'agency'
    plan: 'free',
    trial_ends_at: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  })
  .select()
  .single()
if (orgError) throw orgError

// 3. Create profile for the user
const { error: profileError } = await supabase
  .from('profiles')
  .insert({
    id: authData.user.id,
    organization_id: org.id,
    full_name: formData.companyName,  // update later in settings
    email: formData.email,
    role: 'super_admin',              // founder of org = super_admin
    job_title: formData.jobTitle || null,
    created_at: new Date().toISOString(),
  })
if (profileError) throw profileError

// 4. Send invites (if any email rows are filled)
for (const invite of formData.invites.filter(i => i.email)) {
  await supabase.from('invitations').insert({
    organization_id: org.id,
    email: invite.email,
    role: invite.role,
    invited_by: authData.user.id,
    created_at: new Date().toISOString(),
  })
}

// 5. Redirect to dashboard
router.push('/dashboard')
```

**Error handling:**
- If auth fails: show error on Step 1 ("This email is already registered. Sign in instead.")
- If org creation fails: show generic error toast, stay on Step 4
- Always show loading state on the CTA button during submission

**Check column names** against the actual Supabase table schemas before writing the insert. Use `select()` to inspect if needed.

---

## TASK 3 — Update CTAs to Link to /signup

**Agent:** Sub-Agent 2 (runs in parallel with Task 1+2)

Find all "Start Free Trial" and "Start Free" buttons on the landing page and pricing page that currently link to `/demo`. Update them to link to `/signup` instead.

```bash
grep -r "Start Free\|Start Free Trial" /var/www/Master_Sankalphub/V3.0_Frontend/app --include="*.tsx" -l | grep -v node_modules | grep -v .next
```

Update each found link:
```tsx
// BEFORE
href="/demo"

// AFTER (for Free plan CTAs only)
href="/signup"
```

> Only update Free plan CTAs. "Contact Sales" and "Get Started" (Pro) should remain pointing to `/demo`.

---

## PAGE ROUTE & MIDDLEWARE

Ensure `/signup` is publicly accessible — add it to the public routes list in `middleware.ts`:

```typescript
const publicRoutes = ['/', '/pricing', '/demo', '/login', '/signup', '/privacy', '/terms', '/onboarding']
```

---

## BUILD & DEPLOY

```bash
cd /var/www/Master_Sankalphub/V3.0_Frontend
npm run build
git add -A
git commit -m "feat: 4-step sign-up flow with org creation and team invite"
git push origin main
```

---

## FINAL VERIFICATION CHECKLIST

- [ ] `/signup` loads correctly without auth redirect
- [ ] Step 1 — all fields validate, "Continue" proceeds to Step 2
- [ ] Step 2 — role cards select/deselect correctly, amber highlight on selected
- [ ] Step 3 — invite rows work, skip link proceeds to Step 4
- [ ] Step 4 — creates Supabase auth user + organization + profile on submit
- [ ] Step 4 — "Go to dashboard" redirects to `/dashboard`
- [ ] Stepper shows correct active/done states as user progresses
- [ ] Sacred Orbit logo visible on all 4 steps
- [ ] Free plan CTAs on landing + pricing now link to `/signup`
- [ ] Back buttons work correctly between steps
- [ ] `npm run build` — zero errors

---

*SankalpHub V3 Frontend — Sign-Up UX Redesign*
*Design approved via interactive mockup — March 29, 2026*
