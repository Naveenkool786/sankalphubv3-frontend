# SankalphHub Codebase Audit Report
Generated: 2026-04-08

---

## A. Project Structure

### App Directory Tree
```
app/
├── favicon.ico
├── globals.css
├── layout.tsx (root layout)
├── page.tsx (landing page)
├── (auth)/
│   └── login/
│       ├── actions.ts
│       └── page.tsx
├── (dashboard)/
│   ├── layout.tsx (auth guard + AppShell)
│   ├── analytics/
│   │   ├── page.tsx
│   │   └── _components/AnalyticsClient.tsx
│   ├── audits/
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   │   ├── page.tsx
│   │   │   ├── report/page.tsx + _components/AuditReportClient.tsx
│   │   │   └── _components/AuditFormClient.tsx
│   │   ├── factory/page.tsx + new/page.tsx
│   │   ├── new/page.tsx
│   │   ├── templates/page.tsx
│   │   └── _components/AuditListClient.tsx
│   ├── compliance/
│   │   ├── page.tsx
│   │   ├── audits/ (page, [id], new)
│   │   ├── certifications/page.tsx + _components/
│   │   ├── marketing/page.tsx
│   │   ├── regulations/page.tsx
│   │   ├── sustainability/page.tsx
│   │   └── _components/ComplianceDashboardClient.tsx
│   ├── costing/
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx + _components/
│   │   ├── new/page.tsx
│   │   └── _components/CostingListClient.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── _components/ (DashboardClient, DashboardEmptyState, KpiCard)
│   ├── factories/
│   │   ├── page.tsx
│   │   ├── actions.ts
│   │   ├── [id]/page.tsx + audits/ (page, new)
│   │   ├── new/page.tsx
│   │   └── _components/FactoriesClient.tsx
│   ├── inspections/
│   │   ├── page.tsx
│   │   ├── actions.ts
│   │   ├── new/page.tsx (7-step wizard)
│   │   └── _components/ (InspectionsClient, InspectionDetailDialog, InspectionRow, StartInspectionDialog)
│   ├── logistics/
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx + _components/
│   │   ├── carriers/page.tsx
│   │   ├── new/page.tsx
│   │   └── _components/ShipmentListClient.tsx
│   ├── merchandising/
│   │   ├── page.tsx
│   │   ├── orders/ (page, new)
│   │   ├── seasons/ (page, [id], new)
│   │   └── styles/ (page, [id], new + _components/)
│   ├── planning/
│   │   ├── page.tsx
│   │   ├── actions.ts
│   │   ├── dpr/ + production/ + timeline/ + wip/
│   │   └── _components/ (DprView, PlanningView, TimelineView, WipView)
│   ├── production/
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx + daily-log/ + delays/ + milestones/ + _components/
│   │   ├── new/page.tsx
│   │   └── _components/ProductionListClient.tsx
│   ├── projects/
│   │   ├── page.tsx
│   │   ├── new/page.tsx (4-step wizard)
│   │   └── _components/ProjectsClient.tsx
│   ├── purchasing/
│   │   ├── invoices/ (page, [id])
│   │   ├── orders/ (page, [id], new)
│   │   └── quotations/ (page, [id], new)
│   ├── sampling/
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx + _components/
│   │   ├── new/page.tsx
│   │   └── _components/SamplingListClient.tsx
│   ├── settings/
│   │   ├── page.tsx (redirects to /settings/general)
│   │   ├── actions.ts
│   │   ├── general/page.tsx
│   │   ├── aql/page.tsx
│   │   ├── billing/page.tsx
│   │   ├── defects/page.tsx
│   │   ├── notifications/page.tsx
│   │   ├── permissions/page.tsx
│   │   ├── templates/page.tsx
│   │   ├── users/page.tsx
│   │   └── _components/SettingsNav.tsx
│   ├── templates/_components/TemplatesDialog.tsx
│   ├── testing/
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx + _components/
│   │   ├── labs/page.tsx
│   │   ├── new/page.tsx
│   │   ├── templates/page.tsx
│   │   └── _components/TestingListClient.tsx
│   └── users/_components/UsersClient.tsx
├── api/
│   ├── billing/ (create-checkout, create-portal)
│   ├── console/impersonate/end/
│   ├── cron/trial-expiry/
│   ├── debug-auth/
│   ├── demo/
│   ├── factories/ (extract-from-file, list, save)
│   ├── inspections/analyse-photo/
│   ├── onboarding/
│   ├── projects/ (extract-from-file, list)
│   ├── signup/
│   ├── user/context/
│   └── webhooks/stripe/
├── auth/ (callback, confirm, forgot-password, reset-password)
├── console/ (activity, analytics, automations, demo-requests, impersonate, organizations, users)
├── demo/page.tsx
├── onboarding/page.tsx
├── pricing/page.tsx
├── privacy/page.tsx
├── signup/page.tsx
└── terms/page.tsx
```

### Components Directory
```
components/
├── ImpersonationBanner.tsx
├── PremiumGate.tsx
├── ThemeProvider.tsx
├── console/ (ConsoleKpiCard, ConsoleShell, ConsoleSidebar, MetricChartCard)
├── layout/ (AppShell, Sidebar)
├── notifications/NotificationBell.tsx
├── settings/SessionTimeoutProvider.tsx
└── ui/ (avatar, badge, BackButton, button, card, command, dialog, dropdown-menu, form, input, label, Logo, NavThemeToggle, popover, select, separator, sheet, skeleton, switch, table, tabs, textarea, ThemeToggle, tooltip)
```

### Lib Directory
```
lib/
├── activity-tracker.ts
├── audit-checkpoints.ts
├── feature-flags.ts
├── getUserContext.ts
├── notifications.ts
├── permissions.ts
├── planGuard.ts
├── plans.ts
├── roles.ts
├── session-timeout.ts
├── stripe.ts
├── utils.ts
├── actions/ (audits, compliance, costing, logistics, merchandising, production, purchasing, sampling, testing)
├── billing/check-quota.ts
├── console/ (getConsoleContext, queries)
├── export/ (inspectionPdf, projectExcel, projectPdf)
├── inspection/ (aql-engine, checklists)
├── planning/ (calculations, stages)
├── qc-data/ (accessories.json, all-stages.json, footwear.json, gloves.json, headwear.json, index.ts, master-defects.json, mens-outerwear.json, womens-outerwear.json)
├── sounds/founderSound.ts
├── supabase/ (admin.ts, client.ts, server.ts)
├── types/ (audits, compliance, costing, logistics, merchandising, production, purchasing, sampling, testing)
├── utils/audit-scoring.ts
└── validations/ (auth, production, sampling)
```

### Dependencies
```json
{
  "@anthropic-ai/sdk": "^0.82.0",
  "@hookform/resolvers": "^5.2.2",
  "@next/third-parties": "^16.2.1",
  "@radix-ui/react-avatar": "^1.1.11",
  "@radix-ui/react-dialog": "^1.1.15",
  "@radix-ui/react-dropdown-menu": "^2.1.16",
  "@radix-ui/react-label": "^2.1.8",
  "@radix-ui/react-popover": "^1.1.15",
  "@radix-ui/react-select": "^2.2.6",
  "@radix-ui/react-separator": "^1.1.8",
  "@radix-ui/react-slot": "^1.2.4",
  "@radix-ui/react-switch": "^1.2.6",
  "@radix-ui/react-tabs": "^1.1.13",
  "@radix-ui/react-tooltip": "^1.2.8",
  "@stripe/stripe-js": "^9.0.1",
  "@supabase/ssr": "^0.9.0",
  "@supabase/supabase-js": "^2.100.1",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "cmdk": "^1.1.1",
  "date-fns": "^4.1.0",
  "jspdf": "^4.2.1",
  "jspdf-autotable": "^5.0.7",
  "lucide-react": "^1.7.0",
  "next": "16.2.1",
  "next-themes": "^0.4.6",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "react-hook-form": "^7.72.0",
  "recharts": "^3.8.1",
  "sonner": "^2.0.7",
  "stripe": "^22.0.0",
  "tailwind-merge": "^3.5.0",
  "xlsx": "^0.18.5",
  "zod": "^4.3.6"
}
```

### Environment Variables
**Public:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_TESTING_LAB_ENABLED`
- `NEXT_PUBLIC_LOGISTICS_ENABLED`
- `NEXT_PUBLIC_COMPLIANCE_ENABLED`

**Private:**
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER_MONTHLY` / `STRIPE_PRICE_STARTER_ANNUAL`
- `STRIPE_PRICE_PROFESSIONAL_MONTHLY` / `STRIPE_PRICE_PROFESSIONAL_ANNUAL`
- `CRON_SECRET`
- `FOUNDER_ORG_ID`

---

## B. Database Schema

### Supabase Client Setup
- `lib/supabase/server.ts` — Server-side client (SSR, cookie-based sessions, RLS enforced)
- `lib/supabase/client.ts` — Browser client (Supabase SSR)
- `lib/supabase/admin.ts` — Admin/service role client (bypasses RLS)

### Type Enumerations
```typescript
OrgType = 'brand' | 'factory' | 'agency'
OrgPlan = 'free' | 'trial' | 'premium_single' | 'premium_group' | 'premium_enterprise' | 'founding_member' | 'starter' | 'professional' | 'enterprise'
UserRole = 'super_admin' | 'brand_manager' | 'factory_manager' | 'inspector' | 'viewer'
FactoryStatus = 'active' | 'at_capacity' | 'under_review' | 'inactive'
AuditResult = 'approved' | 'conditional' | 'failed'
ProjectStatus = 'draft' | 'active' | 'confirmed' | 'in_production' | 'inspection' | 'in_inspection' | 'completed' | 'delayed' | 'cancelled'
InspectionStatus = 'draft' | 'scheduled' | 'confirmed' | 'in_progress' | 'report_pending' | 'submitted' | 'approved' | 'cancelled'
InspectionResult = 'pending' | 'pass' | 'fail' | 'conditional_pass'
InspectionType = 'pre_production' | 'inline' | 'final' | 'lab_test' | 'fri' | 'dupro' | 'pre_final'
DefectSeverity = 'critical' | 'major' | 'minor'
OrderStatus = 'confirmed' | 'in_production' | 'in_inspection' | 'completed' | 'delayed' | 'cancelled'
OrderPriority = 'high' | 'medium' | 'low'
TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'
TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
```

### All Tables

| Table | Primary Key | Foreign Keys | Description |
|-------|------------|--------------|-------------|
| organizations | id | — | Org accounts (root entity) |
| profiles | id | org_id → organizations, invited_by → profiles, id → auth.users | User profiles |
| factories | id | org_id → organizations, created_by → profiles | Manufacturing partners |
| factory_audits | id | org_id → organizations, factory_id → factories, audited_by → profiles | Audit records |
| projects | id | org_id → organizations, factory_id → factories, assigned_inspector_id → profiles, created_by → profiles | Production projects |
| inspections | id | org_id → organizations, project_id → projects, factory_id → factories, template_id → inspection_templates, approved_by → profiles, created_by → profiles | QC inspections |
| inspection_checklist_items | id | inspection_id → inspections | Checklist data per inspection |
| inspection_templates | id | org_id → organizations, created_by → profiles | Reusable templates |
| defect_records | id | org_id → organizations, inspection_id → inspections | Defect logs |
| tasks | id | org_id → organizations, assigned_to → profiles, related_inspection_id → inspections, related_project_id → projects, created_by → profiles | Task management |
| documents | id | org_id → organizations, related_inspection_id → inspections, related_project_id → projects, uploaded_by → profiles | File uploads |
| orders | id | org_id → organizations, factory_id → factories | Purchase orders |
| daily_production | id | org_id → organizations, factory_id → factories, order_id → orders | Daily output tracking |
| notifications | id | org_id, user_id | In-app notifications |
| activity_log | id | user_id, organization_id | Audit trail |
| impersonation_sessions | id | impersonator_id, target_user_id | Admin impersonation |
| demo_requests | id | — | Marketing demos |
| console_automations | id | — | System automations |

### Column Details (Core Tables)

**organizations:** id, name, slug, org_type, plan, max_users, logo_url, is_active, trial_start, trial_end, is_trial_locked, settings, created_at, updated_at

**profiles:** id, org_id, full_name, role, avatar_url, department, phone, notification_preferences, is_active, invited_by, invite_token, invite_accepted_at, last_login_at, created_at, updated_at

**factories:** id, org_id, name, code, country, city, address, contact_name, contact_email, contact_phone, certifications, audit_compliance, max_capacity, is_active, photo_url, latest_audit_score, latest_audit_date, latest_audit_result, status, utilisation_pct, total_lines, active_lines, pass_rate, website, notes, categories, aql_default, inspection_preference, created_by, created_at, updated_at

**factory_audits:** id, org_id, factory_id, audited_by, auditor_name, auditor_type, audit_type, audit_date, score_legal, score_safety, score_conditions, score_capacity, score_quality, score_environment, total_score, result, report_url, key_findings, corrective_actions, next_audit_due, status, created_at, updated_at

**projects:** id, org_id, name, po_number, buyer_brand, factory_id, product_category, product_description, product_image_url, quantity, unit, deadline, status, priority, season, product_type, description, aql_level, inspection_type, sample_size, lot_size, start_date, expected_delivery, inspection_date, shipment_date, sizes, tags, assigned_inspector_id, country, notes, created_by, created_at, updated_at

**inspections:** id, org_id, project_id, factory_id, inspection_no, inspection_type, template_id, template_code, template_name, aql_level, status, result, inspection_date, auditor_name, auditor_type, quantity_inspected, sample_size, defects_found, critical_defects, major_defects, minor_defects, score, form_data, remarks, submitted_at, approved_at, approved_by, email_recipients, report_file, created_by, category, product_type, style_ref, colour, lot_size, inspection_level, photo_buyer_sample, photo_front, photo_back, photo_lining, critical_allowed, major_allowed, minor_allowed, aql_result, inspector_decision, inspector_comments, inspector_signature, created_at, updated_at

**inspection_checklist_items:** id, inspection_id, section, item_number, question, result, photo_url, notes, created_at

**defect_records:** id, org_id, inspection_id, severity, description, defect_code, location, image_url, source, quantity, notes, created_at

---

## C. Authentication & Authorization

### Auth Method
- **Supabase Auth** with email/password, magic link (OTP), and password recovery
- Sessions managed via cookies (`@supabase/ssr`)
- OAuth callback: `app/auth/callback/route.ts`

### Role System (5 roles)
| Role | Description | Badge Color |
|------|-------------|-------------|
| super_admin | Full platform access, bypasses all checks | Purple |
| brand_manager | Projects, factories, reports, approvals | Blue |
| factory_manager | Factory profile, inspections, assigned projects | Orange |
| inspector | Conduct inspections, log defects, submit reports | Green |
| viewer | Read-only access | Gray |

### Permission Matrix (18 permissions)
| Permission | super_admin | brand_manager | factory_manager | inspector | viewer |
|---|:---:|:---:|:---:|:---:|:---:|
| Create Projects | Y | Y | - | - | - |
| Edit Projects | Y | Y | - | - | - |
| View Projects | Y | Y | Y | Y | Y |
| Start Inspection | Y | Y | Y | Y | - |
| Submit Report | Y | Y | - | Y | - |
| Approve Report | Y | Y | - | - | - |
| View Inspections | Y | Y | Y | Y | Y |
| Add Factory | Y | Y | - | - | - |
| Edit Factory | Y | Y | Y | - | - |
| View Factories | Y | Y | Y | Y | Y |
| View Analytics | Y | Y | Y | - | - |
| Export Data | Y | Y | - | - | - |
| Create Templates | Y | Y | - | - | - |
| Use Templates | Y | Y | Y | Y | - |
| Invite Members | Y | Y | - | - | - |
| Manage Roles | Y | - | - | - | - |
| Manage Billing | Y | - | - | - | - |
| Edit Org Settings | Y | - | - | - | - |

### Page Protection
- `app/(dashboard)/layout.tsx` checks `supabase.auth.getUser()` → redirect to `/login` if no user
- Route guard: checks pathname against `ROLE_CONFIGS[role].navItems`
- Always allows `/dashboard` and `/settings`
- Redirects unauthorized to `/dashboard?denied=1`

### Session Timeout by Role
| Role | Timeout |
|------|---------|
| inspector | 30 min |
| factory_manager | 30 min |
| brand_manager | 60 min |
| super_admin | 60 min |
| viewer | 45 min |

### Key Files
- `lib/getUserContext.ts` — Returns `{ userId, orgId, role, fullName, email, avatarUrl }`
- `lib/permissions.ts` — `isSuperAdmin()`, `canManage()`, `canInspect()`, permission matrix
- `lib/roles.ts` — `ROLE_CONFIGS` with nav items per role
- `lib/session-timeout.ts` — Role-based timeout with warning modals
- `components/settings/SessionTimeoutProvider.tsx` — Activity tracking hook

---

## D. Module Details (Steps 1-11)

### Step 1: Platform Setup & Configuration

**Files:**
- `app/(dashboard)/settings/page.tsx` — Redirects to `/settings/general`
- `app/(dashboard)/settings/actions.ts` — `updateProfile()`, `updateOrganization()`
- `app/(dashboard)/settings/general/page.tsx` — Profile + org settings form

**Database Tables:** `organizations` (name, org_type, plan), `profiles` (full_name, department, phone)

**Server Actions:**
- `updateProfile({ full_name, department?, phone? })` — Updates user profile
- `updateOrganization({ name })` — Updates org name (requires canManage)

**UI Components:** Input fields, Labels, Badge displays, Save/Logout buttons

**Patterns:** Server component fetches data → passes to client form → server action mutation

---

### Step 2: User Authentication & Role Management

**Files:**
- `app/(auth)/login/page.tsx` — Login UI (tabbed: password, magic link, recovery)
- `app/(auth)/login/actions.ts` — `loginWithPassword()`
- `app/auth/callback/route.ts` — OAuth/email confirmation handler
- `app/auth/confirm/route.ts` — Email confirmation
- `app/auth/reset-password/page.tsx` — Password reset form
- `app/api/signup/route.ts` — Full signup flow
- `app/(dashboard)/users/_components/UsersClient.tsx` — Team management
- `lib/validations/auth.ts` — Zod schemas
- `lib/getUserContext.ts` — User context extraction
- `lib/permissions.ts` — Role & permission definitions
- `lib/planGuard.ts` — Seat & invite validation

**Database Tables:** `auth.users` (Supabase), `profiles`, `organizations`

**Zod Schemas:**
```typescript
loginSchema = z.object({ email: z.string().min(1).email(), password: z.string().min(1) })
magicLinkSchema = z.object({ email: z.string().min(1).email() })
recoverySchema = z.object({ email: z.string().min(1).email() })
```

**Server Actions:**
- `loginWithPassword(email, password)`
- `inviteUser(email, role)` — Invite via admin client
- `removeUser(userId)` — Remove from org
- `updateUserRole(userId, role)` — Change role
- `revokeInvite(userId)` — Cancel pending invite

**Auth Flows:** Email/password sign-in, magic link OTP, password recovery, team invitations

---

### Step 3: Dashboard / Home

**Files:**
- `app/(dashboard)/dashboard/page.tsx` — Server component (data fetching)
- `app/(dashboard)/dashboard/_components/DashboardClient.tsx` — Client rendering
- `app/(dashboard)/dashboard/_components/KpiCard.tsx` — KPI card
- `app/(dashboard)/dashboard/_components/DashboardEmptyState.tsx` — Onboarding state

**Database Tables Queried:** `projects`, `inspections`, `factories`, `profiles`, `notifications`, `defect_records`

**Dashboard Data:**
- KPI Cards: Projects count, Inspections count, Factories count, Pass Rate %
- Onboarding Progress: 6-step checklist (Account, Factory, Project, Template, Inspection, Team)
- Recent Activity Feed: Latest 5 notifications
- Inspection Pass Rate Chart: Last 30 days (pass/fail trend)
- Top Audited Factories: 4 factories with highest scores
- Defect Distribution: Category breakdown

**Charts:** Recharts (LineChart for trends, BarChart for comparisons)

---

### Step 4: Project Creation & Management

**Files:**
- `app/(dashboard)/projects/page.tsx` — Project list
- `app/(dashboard)/projects/new/page.tsx` — 4-step creation wizard
- `app/(dashboard)/projects/actions.ts` — CRUD actions
- `app/(dashboard)/projects/_components/ProjectsClient.tsx` — List client

**Database Table:** `projects` (29 columns — see Schema section)

**Server Actions:**
- `createProject(data)` — Create with name, category, factory_id, quantity, unit, deadline, country, po_number, notes
- `updateProject(projectId, data)` — Update fields
- `updateProjectStatus(projectId, status)` — Change status
- `createFullProject(data)` — Flexible insert with retry (4-step wizard)
- `deleteProject(projectId)` — Delete

**Wizard Steps:**
1. **Basics:** Name, season, category, product type, description, image upload, AI file extraction
2. **Factory & Supply:** Factory dropdown, PO number, quantity/unit, country, buyer, size matrix
3. **Timeline & QC:** Dates (start, delivery, inspection, shipment), AQL level, inspection type, sample/lot size, priority
4. **Review & Save:** Summary, PDF/Excel export, save as draft or confirm

**Product Categories:** Garments, Footwear, Gloves, Headwear, Accessories, Electronics, Furniture, Packaging, Other

**Statuses:** draft → active → confirmed → in_production → inspection/in_inspection → completed | delayed | cancelled

---

### Step 5: Factory Management

**Files:**
- `app/(dashboard)/factories/page.tsx` — Factories list
- `app/(dashboard)/factories/new/page.tsx` — Create factory form
- `app/(dashboard)/factories/[id]/page.tsx` — Factory detail page
- `app/(dashboard)/factories/actions.ts` — CRUD + status actions
- `app/(dashboard)/factories/_components/FactoriesClient.tsx` — List with filters

**Database Table:** `factories` (30 columns — see Schema section)

**Server Actions:**
- `createFactory(data)` — Create with name, country, city, contacts, certifications, capacity, categories
- `updateFactory(factoryId, data)` — Update fields
- `deleteFactory(factoryId)` — Delete
- `assignFactoryToProject(factoryId, projectId)` — Link factory
- `removeFactoryFromProject(projectId)` — Unlink
- `updateFactoryStatus(factoryId, status)` — Change status + is_active
- `notifyAuditCompleted(data)` — Create notification on audit completion

**Factory List Filters:** All, Active, At capacity, Under review, Audited, Inactive

**Status Colors:** active=#1D9E75, at_capacity=#E24B4A, under_review=#534AB7, inactive=gray

**Related Tables:** `factory_audits` (audit scores), `inspections` (via factory_id), `projects` (via factory_id)

---

### Step 6: Inspection Management

**Files:**
- `app/(dashboard)/inspections/page.tsx` — Inspections list
- `app/(dashboard)/inspections/new/page.tsx` — 7-step wizard
- `app/(dashboard)/inspections/actions.ts` — CRUD actions
- `app/(dashboard)/inspections/_components/InspectionsClient.tsx` — List client
- `app/(dashboard)/inspections/_components/StartInspectionDialog.tsx` — Quick start
- `app/(dashboard)/inspections/_components/InspectionDetailDialog.tsx` — Detail modal
- `lib/inspection/aql-engine.ts` — AQL calculations (ANSI Z1.4)
- `lib/inspection/checklists.ts` — Category-specific checklists

**Database Tables:** `inspections` (50+ columns), `inspection_checklist_items`, `defect_records`, `inspection_templates`

**Server Actions:**
- `createInspection(data)` — Auto-generates INS-{timestamp}, sets status=draft
- `updateInspectionStatus(inspectionId, status)` — Status change
- `deleteInspection(inspectionId)` — Delete
- `notifyInspectionResult(data)` — Notification for results

**7-Step Wizard:**
1. **Setup:** Project, factory, auditor, date, type
2. **Category:** Product category, type, style ref, colour, section checkboxes
3. **Photos:** 4 photo uploads (buyer sample, front, back, lining) + AI analysis
4. **Checklist:** Dynamic by category (Garments=33 items, Footwear=13, Gloves=11, Headwear=9, Accessories=8)
5. **Defects:** Manual entry + AI-detected, severity classification
6. **AQL Calculation:** Lot size, inspection level, sample size, accept/reject limits, inspector decision + signature
7. **Report:** Summary, PDF/Excel export, submit

**AQL Engine:**
- ANSI Z1.4 standard with 3 inspection levels (I/II/III) and 3 AQL levels (1.0/2.5/4.0)
- Auto-calculates sample size from lot size
- Accept/reject thresholds per severity
- Critical defect = zero tolerance (any = automatic FAIL)

**Inspection Types:** pre_production, inline, final, lab_test, fri, dupro, pre_final

---

### Step 7: Defect Tracking

**Files:**
- `app/(dashboard)/settings/defects/page.tsx` — Defects library UI
- `lib/qc-data/index.ts` — Defect data types and exports
- `lib/qc-data/master-defects.json` — Master defect database (6,814 lines)
- Category-specific: `mens-outerwear.json`, `womens-outerwear.json`, `footwear.json`, `gloves.json`, `headwear.json`, `accessories.json`

**Database Tables:** `defect_records` (id, org_id, inspection_id, severity, description, defect_code, location, image_url, source, quantity, notes)

**Defect Categories (6):** Men's Outerwear, Women's Outerwear, Footwear, Gloves, Headwear, Accessories

**Severity Levels:**
| Severity | AQL | Action |
|----------|-----|--------|
| CRITICAL | 0.0 (Zero Tolerance) | HALT — Do not ship |
| MAJOR | AQL 2.5 | Rework or reject lot |
| MINOR | AQL 4.0 | Conditional accept |
| COSMETIC | AQL 4.0 | Note on report |

**Defect Structure:** id, code (e.g., "AC-CR-01"), name, type (Safety/Quality/Construction), stage-mapped checks across 10 manufacturing stages

**Manufacturing Stages:** development_samples, size_set, pp_samples, material, cutting, sewing_stitching, assembly, inline_inspection, final_inspection, packing

**Photo Upload:** Defect photos stored in Supabase storage (`inspection-photos` bucket), linked via `image_url` field

**UI:** Search/filter by name/code/type, category filter, severity filter, CSV export

---

### Step 8: Reports & Analytics

**Files:**
- `app/(dashboard)/analytics/page.tsx` — Analytics page (server component)
- `app/(dashboard)/analytics/_components/AnalyticsClient.tsx` — Client charts
- `lib/export/inspectionPdf.ts` — PDF export (jsPDF)
- `lib/export/projectPdf.ts` — Project PDF export
- `lib/export/projectExcel.ts` — Excel export (xlsx)

**Database Tables Queried:** `inspections`, `projects`, `factories`

**Core KPIs (4):**
1. **Pass/Fail Rate** — % of inspections passed (Green ≥80%, Red <80%)
2. **Defect Counts** — Critical, Major, Minor breakdown
3. **OQR%** (Outgoing Quality Rate) — % of zero-defect submissions
4. **FP AQL%** (First-Pass AQL Rate) — % pass first attempt

**Charts (Recharts):**
1. **LineChart** — Monthly trend (avg score, pass rate, last 6 months)
2. **Stacked BarChart** — Factory performance (pass/fail split, top 6 factories)
3. **PieChart** — Defect distribution (Critical=red, Major=orange, Minor=blue)
4. **PieChart** — Project status distribution

**Leaderboards:**
- Factory Performance: totalInspections, passRate%, avgScore, defectRate
- Inspector Performance: totalInspections, avgScore, passRate%

**Export:**
- PDF: Individual inspection reports with defect details, photos, scoring (jsPDF + autotable)
- Excel/CSV: Project, Factory, Auditor, Status, Result, Score, Defects, Date, Remarks

**Permissions:** View=admin+manager, Export=admin+brand_manager, Premium gated via `PremiumGate`

---

### Step 9: Notifications & Alerts

**Files:**
- `lib/notifications.ts` — `createNotification()` service
- `components/notifications/NotificationBell.tsx` — Bell icon + dropdown
- `app/(dashboard)/settings/notifications/page.tsx` — Notification preferences
- `lib/sounds/founderSound.ts` — Audio engine (Web Audio API)

**Database Table:** `notifications` (id, org_id, user_id, event_type, sound_category, title, detail, link, is_read, is_critical, created_at)

**Notification System:**
- **In-App:** Bell icon with unread badge, dropdown panel (All/Critical/Info tabs)
- **Toast:** Sonner toasts for immediate action feedback
- **Sound:** Web Audio API procedural sounds per category
- **Email:** Feature placeholder (not fully implemented)

**Sound Categories (5):**
| Category | Color | Example Events |
|----------|-------|---------------|
| brand | Blue #185FA5 | order_assigned, audit_completed |
| factory | Orange #854F0B | order_delayed, factory_at_capacity |
| inspection_pass | Green #1D9E75 | inspection_passed |
| inspection_fail | Red #A32D2D | inspection_failed, critical_defect |
| system | Purple #534AB7 | new_demo_request, trial_expiring |

**Event Types (14):** inspection_passed, inspection_failed, critical_defect, order_assigned, order_delayed, factory_at_capacity, audit_completed, audit_failed, new_demo_request, new_user_signup, plan_upgraded, trial_expiring, production_behind, report_submitted, report_approved

**Lockable Events (cannot disable):** inspection_failed, critical_defect, order_delayed, factory_at_capacity, audit_failed, trial_expiring

**Preferences UI:** Master sound toggle, quiet hours (22:00-07:00), per-event in-app/sound toggles

---

### Step 10: Settings & Configuration

**Files:**
- `app/(dashboard)/settings/` — 8 sub-pages + layout + actions
- `app/(dashboard)/settings/_components/SettingsNav.tsx` — Left sidebar nav

**Settings Sections (7):**

#### 10a. General (`/settings/general`)
- Profile: full_name, email (read-only), department, phone, role (read-only)
- Organization: name (admin-only), org_type (display)
- Logout button

#### 10b. Templates (`/settings/templates`)
- Inspection template list (name, type, industry, sections)
- Clone/Edit/Archive actions
- **Premium gated** (Pro/Enterprise only)

#### 10c. Users & Roles (`/settings/users`)
- Members list: name, email, role, avatar, join date
- Pending invites with actions
- Invite form: email + role selector
- Seat status bar: current/max users
- Seat limits: Free=1, Single=1, Group=5, Enterprise=11+overage

#### 10d. Permissions (`/settings/permissions`)
- Read-only permission matrix (5 roles × 17 permissions)
- Role descriptions with badge colors
- Non-customizable (hardcoded)

#### 10e. Defects Library (`/settings/defects`)
- Master defect database (read-only reference)
- Search, filter, expand, CSV export
- (Detailed in Step 7)

#### 10f. AQL Table (`/settings/aql`)
- AQL Calculator: lot size → code letter → sample size → accept/reject limits
- ANSI Z1.4 reference tables
- Inspection levels I/II/III, AQL levels 1.0/2.5/4.0
- Common scenarios table

#### 10g. Billing (`/settings/billing`)
- Current plan badge, max users, trial end date
- Plan upgrade CTA
- Management via external Stripe portal

#### 10h. Notifications (`/settings/notifications`)
- (Detailed in Step 9)

---

### Step 11: PremiumHub / Billing

**Files:**
- `app/pricing/page.tsx` — Public pricing page (490 lines)
- `components/PremiumGate.tsx` — Feature gating component
- `lib/plans.ts` — Plan definitions
- `lib/planGuard.ts` — Seat/invite validation
- `lib/billing/check-quota.ts` — Usage quota checks
- `app/api/billing/create-checkout/route.ts` — Stripe checkout
- `app/api/billing/create-portal/route.ts` — Stripe customer portal
- `app/api/webhooks/stripe/route.ts` — Stripe webhook handler
- `app/api/cron/trial-expiry/route.ts` — Trial expiration cron

**Pricing Tiers (3 public):**

| Feature | Free | Pro ($29/mo) | Enterprise (Custom) |
|---------|------|-------------|-------------------|
| Users | 5 | 5 | Unlimited |
| Inspections/mo | 10 | Unlimited | Unlimited |
| Projects | 5 | Unlimited | Unlimited |
| Templates | 3 | Unlimited | Unlimited |
| AI Generations/mo | 3 | Unlimited | Unlimited |
| Storage | 500 MB | 15 GB | 100 GB+ |
| PDF/Excel Reports | - | Y | Y |
| Multi-Factory | - | Y | Y |
| Audit Logs | - | 90 days | Unlimited |
| White-label | - | - | Y |
| SSO/SAML | - | - | Y |
| API Access | - | - | Y |

**Internal Plan Slugs:**
| Slug | Max Users | Premium | Domain Lock | Overage |
|------|-----------|---------|-------------|---------|
| free | 1 | No | No | Hard cap |
| trial | 20 | Yes | No | Hard cap |
| premium_single | 1 | Yes | No | Hard cap |
| premium_group | 5 | Yes | Yes | Hard cap |
| premium_enterprise | 11 | Yes | No | $19/seat |
| founding_member | 5 | Yes | No | Hard cap |

**Feature Gating:** `PremiumGate` component checks `isSuperAdmin() || isPremiumPlan()`, shows upgrade wall otherwise

**Quota System:**
- `checkQuota(orgId, plan, quotaType)` → `{ allowed, current, limit }`
- Quota types: inspections, projects, templates, factories, aiGenerations

**Founding Member Program:** Lifetime $29/mo, 50 slots, Genesis Badge, roadmap voting

---

## E. Shared Patterns

### 1. Form Pattern
```typescript
// Schema: lib/validations/*.ts
const schema = z.object({ field: z.string().min(1, 'Required') })
type FormData = z.infer<typeof schema>

// Component
const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: {...} })
const handleSubmit = async (data: FormData) => {
  try { await serverAction(data); toast.success('Done') }
  catch { toast.error('Failed') }
}
<form onSubmit={form.handleSubmit(handleSubmit)}>
  <Input {...form.register('field')} />
  {form.formState.errors.field && <p role="alert">{...message}</p>}
  <Button disabled={form.formState.isSubmitting}>
    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Submit'}
  </Button>
</form>
```

### 2. Server Action Pattern
```typescript
'use server'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function actionName(data: {...}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }
    const supabase = createAdminClient()
    const { error } = await supabase.from('table').insert({...})
    if (error) return { success: false, error: error.message }
    trackEvent({...})
    createNotification({...})
    revalidatePath('/path')
    return { success: true, id: '...' }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}
```

### 3. Data Fetching Pattern
```typescript
// Server component
export default async function Page() {
  const ctx = await getUserContext()
  const supabase = createAdminClient()
  const { data } = await supabase.from('table').select('*').order('created_at', { ascending: false })
  return <ClientComponent data={data ?? []} role={ctx.role} />
}
```

### 4. Error Handling
- Server actions: try/catch → return `{ success: false, error: message }`
- Client: check `result.success` → `toast.success()` or `toast.error(message)`
- Form validation: inline errors with `text-destructive`, `role="alert"`

### 5. Loading States
- `useState(false)` for async ops, set true before, false in finally
- Button: `disabled={loading}` + Loader2 spinner
- Text change: `{loading ? 'Saving...' : 'Save'}`

### 6. Toast Pattern (Sonner)
```typescript
// Setup: <Toaster richColors position="top-right" /> in root layout
toast.success('Created')                    // Short title
toast.error('Failed', { description: err }) // Title + detail
toast.info('Coming soon')                   // Informational
```

### 7. Table/List Pattern
- No external table library — semantic HTML `<table>`
- Container: `overflow-x-auto` for responsiveness
- Header: `bg-muted/30 text-muted-foreground`
- Rows: `hover:bg-muted/20`, `divide-y divide-border`
- Status via `<Badge>` with config-driven colors
- Empty state: centered card message

### 8. Modal/Dialog Pattern
```typescript
// Parent: const [open, setOpen] = useState(false)
// Child: <Dialog open={open} onOpenChange={v => !v && onClose()}>
//   <DialogContent className="max-w-md">
//     <DialogHeader><DialogTitle>Title</DialogTitle></DialogHeader>
//     <form onSubmit={handleSubmit}>...fields...</form>
//   </DialogContent>
// </Dialog>
```

### 9. File Upload Pattern
- Files uploaded to Supabase Storage buckets (`inspection-photos`, `factory-photos`)
- URLs stored in DB columns (e.g., `photo_url`, `image_url`, `report_file`)
- AI-powered extraction via `/api/factories/extract-from-file` and `/api/projects/extract-from-file` (Anthropic SDK)
- Photo analysis via `/api/inspections/analyse-photo` (Anthropic vision)

### 10. Navigation Pattern
- Centralized config: `lib/roles.ts` → `ROLE_CONFIGS[role].navItems`
- Active detection: `pathname.startsWith(item.path + '/')`
- Active style: `bg-primary text-primary-foreground font-medium shadow-sm`
- Inactive: `text-muted-foreground hover:bg-accent hover:text-accent-foreground`
- Coming soon items: `toast.info('Coming soon')` on click
- Icons: Lucide React

---

## F. Design System

### Theme Configuration
- **CSS Framework:** Tailwind CSS v4 with PostCSS `@theme` inline (no tailwind.config file)
- **Component Library:** shadcn/ui (default style, RSC enabled, Lucide icons)
- **Dark Mode:** `next-themes` with `attribute="class"`, default="dark"

### Fonts
| Usage | Font | Variable |
|-------|------|----------|
| Body | DM Sans | `--font-dm-sans` |
| Headings | Sora | `--font-sora` |
| Code/Mono | JetBrains Mono | `--font-mono` |

### Color System

**Light Mode:**
| Token | Value | Usage |
|-------|-------|-------|
| --background | #FAF9F7 | Warm cream page bg |
| --foreground | #111113 | Near-black text |
| --primary | #8A6520 | Bronze gold (CTA, active nav) |
| --ring | #A87C30 | Gold focus ring |
| --muted | #F4F0EA | Warm muted bg |
| --sidebar | #F4F0EA | Sidebar bg |
| --destructive | #EF4444 | Red errors/delete |

**Dark Mode:**
| Token | Value | Usage |
|-------|-------|-------|
| --background | #0D1420 | Deep navy page bg |
| --foreground | #F0F0F2 | Light gray text |
| --primary | #C9A96E | Brighter gold |
| --ring | #C9A96E | Gold focus ring |
| --sidebar | #0A0F1A | Darkest sidebar |

**Brand Gold:** `#D4A843` / `#A87C30` (light) / `#C9A96E` (dark) — used for CTAs, active states, icons

### Form Elements
- Standardized height: 40px for all inputs/selects
- Border radius: 8px
- Focus: gold ring (`#C9A96E`, 2px box-shadow)
- Placeholder: 9px font, 0.6 opacity

### ShadcN/UI Components Installed (24)
avatar, badge, BackButton, button, card, command, dialog, dropdown-menu, form, input, label, Logo, NavThemeToggle, popover, select, separator, sheet, skeleton, switch, table, tabs, textarea, ThemeToggle, tooltip

### Status Color Conventions
- **Active/Pass/Success:** Green (#1D9E75)
- **Error/Fail/Critical:** Red (#E24B4A / #EF4444)
- **Warning/Under Review:** Purple (#534AB7)
- **Pending/Draft:** Gray
- **Brand Accent:** Gold (#D4A843)

---

## G. API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/billing/create-checkout` | POST | Create Stripe checkout session |
| `/api/billing/create-portal` | POST | Create Stripe customer portal |
| `/api/console/impersonate/end` | POST | End impersonation session |
| `/api/cron/trial-expiry` | POST | Cron: expire trial orgs |
| `/api/debug-auth` | GET | Debug authentication state |
| `/api/demo` | POST | Create demo org + user |
| `/api/factories/extract-from-file` | POST | AI-extract factory data from file |
| `/api/factories/list` | GET | List factories for user |
| `/api/factories/save` | POST | Save factory data |
| `/api/inspections/analyse-photo` | POST | AI-analyse inspection photo |
| `/api/onboarding` | POST | Handle user onboarding |
| `/api/projects/extract-from-file` | POST | AI-extract project data from file |
| `/api/projects/list` | GET | List projects for user |
| `/api/signup` | POST | User signup + org creation |
| `/api/user/context` | GET | Get user context + role |
| `/api/webhooks/stripe` | POST | Stripe webhook handler |

### External Integrations
- **Anthropic AI SDK** — Photo analysis, file data extraction
- **Stripe** — Checkout, portal, webhooks for subscription management
- **Supabase** — Database, auth, storage
- **Google Analytics** — `@next/third-parties` (GA_ID: G-YLHER20GW0)

---

## H. Environment

### Deployment
- **Platform:** Vercel (Next.js 16.2.1, auto-deploy from main)
- **Build:** Default Next.js build (Turbopack)
- **Node.js:** Default (no custom config in next.config.ts)
- **No middleware.ts** (no proxy.ts either)

### All Environment Variables
| Variable | Scope | Purpose |
|----------|-------|---------|
| NEXT_PUBLIC_SUPABASE_URL | Public | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public | Supabase anon key |
| NEXT_PUBLIC_APP_URL | Public | Application base URL |
| NEXT_PUBLIC_TESTING_LAB_ENABLED | Public | Feature flag: testing lab |
| NEXT_PUBLIC_LOGISTICS_ENABLED | Public | Feature flag: logistics |
| NEXT_PUBLIC_COMPLIANCE_ENABLED | Public | Feature flag: compliance |
| SUPABASE_SERVICE_ROLE_KEY | Server | Admin DB access (bypasses RLS) |
| ANTHROPIC_API_KEY | Server | Claude AI API |
| STRIPE_SECRET_KEY | Server | Stripe backend |
| STRIPE_WEBHOOK_SECRET | Server | Stripe webhook signing |
| STRIPE_PRICE_STARTER_MONTHLY | Server | Stripe price ID |
| STRIPE_PRICE_STARTER_ANNUAL | Server | Stripe price ID |
| STRIPE_PRICE_PROFESSIONAL_MONTHLY | Server | Stripe price ID |
| STRIPE_PRICE_PROFESSIONAL_ANNUAL | Server | Stripe price ID |
| CRON_SECRET | Server | Cron job auth header |
| FOUNDER_ORG_ID | Server | Founder org for notifications |
