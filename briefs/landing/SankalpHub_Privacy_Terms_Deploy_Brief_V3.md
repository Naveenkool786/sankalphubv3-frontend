# SankalpHub — Privacy Policy & Terms of Service Pages (V3 Frontend)
**For: Claude Code + Sub-Agents**
**Date:** March 29, 2026
**Scope:** Deploy real Privacy Policy and Terms of Service pages, replacing current placeholders
**Mode:** Replace placeholder content only. Do NOT touch any other page or module.

> ⚠️ **WORKING DIRECTORY: V3 Frontend ONLY**
> All work is exclusively in `/var/www/Master_Sankalphub/V3.0_Frontend/`
> Do NOT touch `/var/www/Master_Sankalphub/Backend/`

---

## PLATFORM CONTEXT

| Item | Detail |
|------|--------|
| **Frontend Framework** | Next.js 15.2.1, React 19.2.4, TypeScript, Tailwind CSS |
| **UI Library** | shadcn/ui (Radix primitives) |
| **Frontend Path** | `/var/www/Master_Sankalphub/V3.0_Frontend/` |
| **Repo** | GitHub: `Naveenkool786/sankalphubv3-frontend` → Vercel auto-deploy on push |
| **Live URL** | https://sankalphub.in |
| **Contact Email** | info@sankalphub.in |

---

## CURRENT STATE

Both `/privacy` and `/terms` currently exist as placeholder pages showing only:
> *"This page is being updated. Please contact us at info@sankalphub.in for any queries."*

These need to be replaced with the full, real legal documents provided below.

---

## TASK ASSIGNMENT

| Task | Description | Agent |
|------|-------------|-------|
| Task 1 | Deploy full Privacy Policy at `/privacy` | Sub-Agent 1 |
| Task 2 | Deploy full Terms of Service at `/terms` | Sub-Agent 1 (after Task 1) |
| Task 3 | Update footer links + verify both pages accessible | Sub-Agent 1 (after Task 2) |

All three tasks go to Sub-Agent 1 sequentially — they touch the same files.

---

## DESIGN REQUIREMENTS

Both pages must:
- Use the existing site layout (same navbar and footer as all other public pages)
- Be clean, readable, professional — matching the SankalpHub design language
- Be fully publicly accessible — no auth required
- Use Tailwind CSS classes consistent with the rest of the codebase
- Be mobile-responsive
- Have a sticky or visible "Back to home" link

**Page layout structure:**
```
Navbar (existing)
  ↓
Max-width container (max-w-3xl, centered, px-6, py-16)
  ↓
  Page title (text-3xl font-bold)
  Effective date + Last updated (text-sm text-gray-500)
  Horizontal divider
  ↓
  Sections with:
    - Section heading (text-xl font-semibold, mt-10 mb-3)
    - Body text (text-gray-600, leading-relaxed)
    - Tables where specified (clean, bordered)
    - Subsection headings (text-base font-semibold, mt-6 mb-2)
  ↓
Footer (existing)
```

---

## TASK 1 — Privacy Policy Page

**File:** `app/(public)/privacy/page.tsx` or `app/privacy/page.tsx`
(check existing file location first with `find`)

### Step 1 — Locate existing file
```bash
find /var/www/Master_Sankalphub/V3.0_Frontend -type f -name "*.tsx" | grep -i privacy | grep -v node_modules | grep -v .next
```

### Step 2 — Replace with full content

Replace the entire page content with the following. Use the existing layout wrapper pattern from other public pages (check how `/demo` or `/pricing` wraps content).

**Metadata:**
```typescript
export const metadata = {
  title: 'Privacy Policy — SankalpHub',
  description: 'Privacy Policy for SankalpHub — Production Intelligence Platform',
}
```

**Page content to render:**

```
Title: Privacy Policy
Subtitle: Effective Date: 1 April 2026 · Last Updated: 1 April 2026

---

1. Who We Are
SankalpHub ("we", "us", "our") is a B2B SaaS platform for quality inspection and
manufacturing workflow management, operated by SankalpHub (Hāpur, Uttar Pradesh, India).
Accessible at sankalphub.in.
Contact: info@sankalphub.in

---

2. Who This Policy Applies To
This policy applies to all users including:
- Brand managers and buyers
- Factory managers and manufacturers
- Third-party inspection agencies and inspectors
- Viewers and team members within an organisation

---

3. What Data We Collect

3.1 Account & Identity Data
- Full name
- Work email address
- Password (hashed — never stored as plain text)
- Phone number (optional)
- Profile photo (optional)

3.2 Organisation Data
- Organisation name and type (Brand / Factory / Agency)
- Country and city
- Product categories
- Team members and assigned roles

3.3 Platform Usage Data
- Projects, factories, inspections, reports, templates
- Defect logs and inspection photos
- Activity logs within your organisation

3.4 Technical Data
- IP address, browser type, device type, OS
- Pages visited, time spent, error logs

3.5 Communication Data
- Demo request submissions
- Support emails to info@sankalphub.in

---

4. How We Use Your Data

Table:
| Purpose | Legal Basis |
| Creating and managing your account | Contract performance |
| Delivering platform features | Contract performance |
| Sending transactional emails | Contract performance |
| Improving platform and fixing bugs | Legitimate interest |
| Responding to support requests | Legitimate interest |
| Complying with legal obligations | Legal obligation |
| Sending product updates (opt-out available) | Legitimate interest |

We do NOT use your data for advertising.
We do NOT sell your data to third parties.

---

5. Data Storage & Security
- All data stored on Supabase (SOC 2 Type II certified)
- Row-level security ensures each organisation sees only its own data
- All data in transit encrypted using TLS 1.2 or higher
- Passwords hashed — never stored in plain text
- Access to production data restricted to authorised personnel only

---

6. Multi-Tenant Data Separation
Each organisation's data is:
- Logically separated at database level using row-level security
- Never visible to other organisations
- Accessible only to authenticated users within your organisation

---

7. Who We Share Data With

Table:
| Provider | Purpose |
| Supabase | Database and authentication |
| Vercel | Frontend hosting |
| Resend | Transactional email delivery |
| Razorpay | Payment processing |

No other sharing without explicit consent, except where required by law.

---

8. Data Retention

Table:
| Data Type | Retention Period |
| Active account data | While account is active |
| Inspection records and reports | Duration of subscription |
| Deleted account data | Permanently deleted within 30 days |
| Billing records | 7 years (legal requirement) |
| Server logs | 90 days |

---

9. Your Rights
- Access — Request a copy of your data
- Correction — Request correction of inaccurate data
- Deletion — Request deletion of your account and data
- Portability — Request data export in machine-readable format
- Objection — Object to certain types of processing
- Withdrawal — Withdraw consent for optional data uses

Email info@sankalphub.in to exercise any right. We respond within 30 days.

---

10. Cookies
SankalpHub uses only essential cookies for authentication and session management.
No advertising or third-party tracking cookies.

---

11. International Data Transfers
Your data may be processed in countries outside your own.
Appropriate safeguards including contractual protections are in place.

---

12. Children's Privacy
SankalpHub is for business use by professionals.
We do not knowingly collect data from individuals under 18.
Contact info@sankalphub.in if you believe a minor has provided data.

---

13. Changes to This Policy
We update the "Last Updated" date when changes are made.
For significant changes, account administrators will be notified by email.
Continued use after changes = acceptance of updated policy.

---

14. Contact Us
Email: info@sankalphub.in
Address: SankalpHub, Hāpur, Uttar Pradesh, India
```

### Acceptance Criteria — Task 1
- [ ] `/privacy` loads without redirect or error
- [ ] Page title reads "Privacy Policy — SankalpHub"
- [ ] All 14 sections render correctly
- [ ] Tables render cleanly with proper borders
- [ ] Page uses existing navbar and footer
- [ ] Page is accessible without logging in
- [ ] Mobile responsive

---

## TASK 2 — Terms of Service Page

**File:** `app/(public)/terms/page.tsx` or `app/terms/page.tsx`

### Step 1 — Locate existing file
```bash
find /var/www/Master_Sankalphub/V3.0_Frontend -type f -name "*.tsx" | grep -i terms | grep -v node_modules | grep -v .next
```

### Step 2 — Replace with full content

**Metadata:**
```typescript
export const metadata = {
  title: 'Terms of Service — SankalpHub',
  description: 'Terms of Service for SankalpHub — Production Intelligence Platform',
}
```

**Page content to render:**

```
Title: Terms of Service
Subtitle: Effective Date: 1 April 2026 · Last Updated: 1 April 2026

---

1. About SankalpHub
SankalpHub ("we", "us", "our", "the platform") is a B2B SaaS platform for quality
inspection and manufacturing workflow management, operated by SankalpHub
(Hāpur, Uttar Pradesh, India), accessible at sankalphub.in.

By creating an account or using the platform, you agree to these Terms of Service.
If using on behalf of an organisation, you confirm authority to bind that organisation.

---

2. Definitions

Table:
| Term | Meaning |
| Platform | SankalpHub web app and all services at sankalphub.in |
| Organisation | A Brand, Factory, or Inspection Agency account |
| User | An individual with a seat inside an Organisation |
| Subscription | A paid or free plan granting platform access |
| Content | Data, reports, templates, and files created by users |
| Founding Member | An early-access organisation on a founding plan |

---

3. Eligibility
To use SankalpHub you must:
- Be at least 18 years of age
- Have legal capacity to enter a binding agreement
- Use the platform for legitimate business purposes
- Not be in a country subject to applicable trade sanctions

---

4. Account Registration
- Provide accurate and complete information
- Maintain security of your login credentials
- Notify info@sankalphub.in immediately if unauthorised access is suspected
- One account per person — no credential sharing
- We may suspend accounts that violate these terms

---

5. Subscriptions and Plans

5.1 Available Plans
Table:
| Plan | Description |
| Free | 5 users · 10 inspections/month · 5 projects · 3 AI generations/month |
| Pro | $29/month · unlimited inspections · unlimited projects · unlimited AI |
| Enterprise | Custom · unlimited users · white-label · SSO · API access |
| Founding Member | Special early-access lifetime pricing for founding partners |

5.2 Billing
- Billed monthly or annually depending on plan
- Payments processed via Razorpay
- Prices in USD unless stated otherwise
- Taxes may apply depending on location

5.3 Cancellation
- Cancel anytime from billing settings
- Takes effect at end of current billing period
- No refunds for partial periods except where required by law

5.4 Plan Changes
- Upgrade anytime — new rate applies immediately
- Downgrade takes effect at start of next billing period
- Excess data restricted but not deleted on downgrade

5.5 Free Trial
- 21-day full-access trial for new accounts
- No credit card required
- Reverts to Free plan after trial unless paid plan selected

---

6. Acceptable Use
You must not:
- Store, transmit, or process unlawful content
- Attempt unauthorised access to another organisation's data
- Reverse engineer or extract source code
- Use bots or scrapers to extract data
- Impersonate another user, organisation, or company
- Upload content infringing third-party IP rights
- Attempt to circumvent security or access controls
- Resell or sublicense platform access without written permission

Violation may result in immediate account suspension without refund.

---

7. Your Content
- You retain full ownership of all content you create
- You grant SankalpHub a limited licence to store and process your content
  solely for delivering the platform's services
- We do not claim ownership of your content
- We will not use it for any purpose beyond operating the platform

---

8. Data and Privacy
Governed by our Privacy Policy at sankalphub.in/privacy.

---

9. Intellectual Property
- SankalpHub platform, design, code, and branding are owned by SankalpHub
- "SankalpHub" and "Production Intelligence Platform" are our property
- Nothing in these terms transfers IP rights to you
- Do not use our name or logo without prior written consent

---

10. Availability and Uptime
- We aim for 24/7 availability but do not guarantee uninterrupted access
- Scheduled maintenance communicated in advance where possible
- Enterprise SLA: 99.9% uptime as specified in agreement
- Not liable for downtime caused by Supabase, Vercel, or force majeure

---

11. Limitation of Liability
- Platform provided "as is" without warranties
- Not liable for indirect, incidental, or consequential damages
- Total liability capped at amounts paid in the 3 months preceding the claim

---

12. Indemnification
You agree to indemnify SankalpHub from claims arising from:
- Your violation of these Terms of Service
- Your use of the platform outside permitted scope
- Content you submit that infringes third-party rights
- Your violation of applicable law

---

13. Termination

13.1 By You
Close account anytime via info@sankalphub.in or account settings.

13.2 By Us
We may suspend or terminate if:
- You violate these Terms
- Payment fails and is unresolved within 14 days
- Required by law
- We discontinue the platform (30 days' notice)

13.3 Effect of Termination
- Access ceases immediately
- Content retained 30 days then permanently deleted
- Request data export before deletion via info@sankalphub.in

---

14. Changes to These Terms
Account administrators notified by email at least 14 days before material changes.
Continued use after effective date = acceptance of updated terms.

---

15. Governing Law and Disputes
- Governed by the laws of India
- Exclusive jurisdiction: courts of Uttar Pradesh, India
- Contact info@sankalphub.in before formal dispute — most issues resolved quickly

---

16. Entire Agreement
These Terms of Service together with our Privacy Policy constitute the entire
agreement between you and SankalpHub regarding use of the platform.

---

17. Contact
Email: info@sankalphub.in
Address: SankalpHub, Hāpur, Uttar Pradesh, India
```

### Acceptance Criteria — Task 2
- [ ] `/terms` loads without redirect or error
- [ ] Page title reads "Terms of Service — SankalpHub"
- [ ] All 17 sections render correctly
- [ ] Tables render cleanly
- [ ] Page uses existing navbar and footer
- [ ] Accessible without logging in
- [ ] Mobile responsive

---

## TASK 3 — Verify Footer Links

### Step 1 — Locate footer component
```bash
find /var/www/Master_Sankalphub/V3.0_Frontend -type f -name "*.tsx" | xargs grep -l "Privacy\|Terms\|footer\|Footer" | grep -v node_modules | grep -v .next
```

### Step 2 — Verify footer links point to correct routes
The footer should already have these links from the previous brief. Confirm they exist and point correctly:

```tsx
<Link href="/privacy">Privacy Policy</Link>
<Link href="/terms">Terms of Service</Link>
<a href="mailto:info@sankalphub.in">Contact</a>
```

If they are missing or point to wrong paths — fix them now.

### Step 3 — Also verify middleware
```bash
grep -r "privacy\|terms" /var/www/Master_Sankalphub/V3.0_Frontend/middleware.ts
```
Confirm `/privacy` and `/terms` are NOT in any protected routes list.

### Acceptance Criteria — Task 3
- [ ] Footer shows Privacy Policy · Terms of Service · Contact links
- [ ] Privacy Policy link → `/privacy`
- [ ] Terms of Service link → `/terms`
- [ ] Contact link → `mailto:info@sankalphub.in`
- [ ] Both routes publicly accessible (no auth redirect)

---

## BUILD & DEPLOY

```bash
# 1. Build check
cd /var/www/Master_Sankalphub/V3.0_Frontend
npm run build

# 2. Commit and push
git add -A
git commit -m "feat: full privacy policy and terms of service pages"
git push origin main

# 3. Vercel auto-deploys on push
```

---

## FINAL VERIFICATION CHECKLIST

- [ ] `https://sankalphub.in/privacy` — full Privacy Policy visible, all 14 sections
- [ ] `https://sankalphub.in/terms` — full Terms of Service visible, all 17 sections
- [ ] Both pages load without login
- [ ] Footer links work correctly from the landing page
- [ ] Contact email shows as `info@sankalphub.in` throughout both pages
- [ ] `npm run build` — zero errors

---

*SankalpHub V3 Frontend — Privacy Policy & Terms of Service*
*Contact email: info@sankalphub.in (live and forwarding to naveenkool786@gmail.com via ImprovMX)*
*March 29, 2026*
