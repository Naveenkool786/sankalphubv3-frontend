# SankalpHub — Founder Console: Impersonation + User Activity Brief (V3 Frontend)
**For: Claude Code + Sub-Agents**
**Date:** March 29, 2026
**Scope:** Add two new pages to Founder Console — User Impersonation + User Activity Log
**Mode:** New feature build inside existing console. Do NOT touch any other module.

> ⚠️ **WORKING DIRECTORY: V3 Frontend ONLY**
> All work is exclusively in `/var/www/Master_Sankalphub/V3.0_Frontend/`
> Do NOT touch `/var/www/Master_Sankalphub/Backend/`

---

## PLATFORM CONTEXT

| Item | Detail |
|------|--------|
| **Frontend Framework** | Next.js 15.2.1, React 19.2.4, TypeScript, Tailwind CSS |
| **UI Library** | shadcn/ui (Radix primitives) |
| **Auth** | Supabase Auth |
| **Database** | Supabase — `jirhyxpcbfeelgiyxqdi.supabase.co` |
| **Console path** | `app/console/` |
| **Console layout** | `app/console/layout.tsx` — wraps all pages in `<ConsoleShell>` |
| **Admin queries** | `lib/console/queries.ts` — uses `createAdminClient()` (service role) |
| **Founder account** | `naveenkool786@gmail.com` — `super_admin` only |

---

## EXISTING CONSOLE PAGES (do not modify)

```
/console                  — Overview KPIs
/console/analytics        — Analytics + sparklines
/console/organizations    — Org management
/console/users            — User management
/console/demo-requests    — Demo request tracking
/console/automations      — Automation rules
```

**New pages to add:**
```
/console/impersonate      — User impersonation + per-user activity timeline
/console/activity         — Global activity feed across all users
```

---

## SECURITY — NON-NEGOTIABLE RULES

These rules apply to every line of code in this brief:

1. Both new pages are **super_admin only** — same guard as existing console pages
2. Impersonation can only be **initiated by super_admin** — never by any other role
3. Impersonation sessions are **logged to Supabase** — every session recorded
4. The impersonated user **cannot see** they are being viewed
5. All activity tracking writes are done via the **service role client** — never the user's client
6. No other role can access `/console/*` routes — middleware already enforces this

---

## TASK ASSIGNMENT

| Task | Description | Agent |
|------|-------------|-------|
| Task 1 | Create `activity_log` Supabase table + seed tracking | Sub-Agent 1 |
| Task 2 | Create `impersonation_sessions` Supabase table | Sub-Agent 1 |
| Task 3 | Build `/console/impersonate` page | Sub-Agent 2 |
| Task 4 | Build `/console/activity` page | Sub-Agent 3 |
| Task 5 | Add activity tracking middleware | Sub-Agent 1 |
| Task 6 | Add nav links to console layout | Sub-Agent 2 |

**Execution order:**
- Sub-Agent 1 runs Tasks 1, 2, 5 sequentially — schema must exist before UI
- Sub-Agents 2 and 3 run Tasks 3, 4, 6 after Sub-Agent 1 completes Tasks 1 and 2

---

## TASK 1 — Create `activity_log` Table

**Agent:** Sub-Agent 1

Run in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS activity_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id   UUID REFERENCES organizations(id) ON DELETE CASCADE,
  action_type       TEXT NOT NULL,
  -- action_type values:
  -- 'login' | 'logout' | 'navigation' | 'create' | 'edit' | 'delete'
  -- 'inspection_start' | 'inspection_defect' | 'inspection_submit' | 'inspection_approve'
  -- 'template_create' | 'template_edit' | 'invite_member' | 'plan_upgrade' | 'plan_downgrade'
  category          TEXT NOT NULL,
  -- category values: 'auth' | 'navigation' | 'projects' | 'inspections'
  -- 'factories' | 'templates' | 'team' | 'billing' | 'settings'
  action_label      TEXT NOT NULL,   -- e.g. "Submitted inspection report"
  detail            TEXT,            -- single line detail, no newlines
  -- e.g. "INS-047 · Summer 2026 · AQL 2.5 · PASS"
  -- e.g. "INS-047 · Critical: 0 · Major: 2 (Seam puckering, Thread tension) · Minor: 1 (Loose thread)"
  metadata          JSONB,           -- structured data for future use
  ip_address        TEXT,
  user_agent        TEXT,
  page_path         TEXT,            -- current route e.g. '/inspections'
  from_path         TEXT,            -- previous route (for navigation events)
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_activity_user      ON activity_log (user_id, created_at DESC);
CREATE INDEX idx_activity_org       ON activity_log (organization_id, created_at DESC);
CREATE INDEX idx_activity_type      ON activity_log (action_type, created_at DESC);
CREATE INDEX idx_activity_category  ON activity_log (category, created_at DESC);
CREATE INDEX idx_activity_created   ON activity_log (created_at DESC);

-- RLS — only super_admin can read (via service role client in console)
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_read_activity"
ON activity_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
);

-- Service role bypasses RLS for writes
-- (createAdminClient uses service role — no INSERT policy needed)
```

### Acceptance Criteria — Task 1
- [ ] `activity_log` table exists with all columns
- [ ] All 5 indexes created
- [ ] RLS enabled — only super_admin can read
- [ ] Table is empty (will be populated by tracking middleware)

---

## TASK 2 — Create `impersonation_sessions` Table

**Agent:** Sub-Agent 1 (after Task 1)

```sql
CREATE TABLE IF NOT EXISTS impersonation_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  impersonator_id   UUID REFERENCES auth.users(id),  -- always super_admin
  target_user_id    UUID REFERENCES auth.users(id),  -- user being viewed
  target_user_email TEXT NOT NULL,
  target_user_name  TEXT,
  target_org_name   TEXT,
  started_at        TIMESTAMPTZ DEFAULT now(),
  ended_at          TIMESTAMPTZ,
  duration_seconds  INT,   -- calculated on session end
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_imp_impersonator ON impersonation_sessions (impersonator_id);
CREATE INDEX idx_imp_target       ON impersonation_sessions (target_user_id);
CREATE INDEX idx_imp_started      ON impersonation_sessions (started_at DESC);

ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_read_impersonation"
ON impersonation_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
);
```

### Acceptance Criteria — Task 2
- [ ] `impersonation_sessions` table exists
- [ ] Indexes created
- [ ] RLS enabled

---

## TASK 3 — Build `/console/impersonate` Page

**Agent:** Sub-Agent 2

### Files to create:
```
app/console/impersonate/page.tsx
app/console/impersonate/_components/ImpersonateClient.tsx
app/console/impersonate/_components/UserActivityTimeline.tsx
app/console/impersonate/actions.ts
```

---

### Page: `/console/impersonate`

**Default view — User list:**

Page header:
- Title: "User Impersonation"
- Subtitle: "View the platform as any user. Sessions are logged."

Warning box (amber):
- "You are Super Admin. Impersonation sessions are recorded. The user is not notified."

Stats row (3 cards):
- Total organisations (from organizations table)
- Total users (from profiles table)
- Active sessions today (from impersonation_sessions where started_at > today)

Filter bar:
- Search input — searches name and email (11px placeholder)
- Select: All orgs (dynamic from organizations table)
- Select: All roles (Brand Manager / Factory Manager / Inspector / Viewer)

**User table columns:**
| Column | Detail |
|---|---|
| User | Avatar (initials) + name + email in one cell |
| Organisation | Org name |
| Role | Colored badge |
| Last login | Relative time (from auth.admin.listUsers last_sign_in_at) |
| Status | Green dot = active, gray = inactive |
| Action | "View as user →" amber button |

On clicking "View as user →":
1. Create a row in `impersonation_sessions` via server action
2. Store `{ targetUserId, targetUserName, targetOrgName, sessionId }` in session/cookie
3. Switch view to the **User Detail view** (same page, different state)

---

### User Detail view (after clicking a user)

When a user is selected, the page switches to show their profile + activity timeline.

**Header:**
```
← All users   [Avatar] Rahul Kumar  [Brand Manager badge]
               Acme Brands · rahul@acmebrands.com · Last active 2 min ago
                                                    [View as user → button]
```

**Stats row (4 cards):**
- Total actions (count from activity_log where user_id = target)
- Sessions (count of login events)
- Inspections (count where category = 'inspections')
- Deletions (count where action_type = 'delete') — shown in red if > 0

**Filter pills (single select):**
All · Login · Navigation · Create · Edit · Delete · Inspection · Template · Invite · Billing

**Day label:** "TODAY — [DATE]" above timeline

**Timeline — SINGLE LINE per event (critical requirement):**

Each activity node is ONE ROW, never wrapping to two lines:

```
[colored dot node + vertical line]
[Category badge] [Action label] · [Detail — truncated with ellipsis] [Time]
```

Layout as a single flex row:
```tsx
<div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '5px 9px',
  overflow: 'hidden',
  whiteSpace: 'nowrap'
}}>
  <span className="cat-badge">{category}</span>
  <span className="action">{actionLabel}</span>
  <span className="sep">·</span>
  <span style={{
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '10px',
    color: 'var(--color-text-secondary)'
  }}>{detail}</span>
  <span className="time">{relativeTime}</span>
</div>
```

**Typography — all small:**
- Category badge: 9px
- Action label: 11px, font-weight 500
- Detail text: 10px, truncated with ellipsis
- Time: 9px, tertiary color
- Node dot: 14×14px
- Vertical connector line: 1px

**Category color coding:**
| Category | Badge bg | Badge text | Node bg |
|---|---|---|---|
| Inspection | `#E1F5EE` | `#085041` | `#E1F5EE` |
| Create | `#E6F1FB` | `#0C447C` | `#E6F1FB` |
| Edit | `#E6F1FB` | `#0C447C` | `#E6F1FB` |
| Delete | `#FCEBEB` | `#791F1F` | `#FCEBEB` |
| Navigation | secondary bg | tertiary | secondary bg |
| Login / Logout | `#EEEDFE` | `#3C3489` | `#EEEDFE` |
| Invite | `#E1F5EE` | `#085041` | `#E1F5EE` |
| Billing | `#FAEEDA` | `#633806` | `#FAEEDA` |
| Template | `#FAEEDA` | `#633806` | `#FAEEDA` |

**"View as user →" button:**
- Amber: `#FAEEDA` bg, `#633806` text, `#FAC775` border
- On click: open the user's dashboard in a new tab with impersonation banner
- Store impersonation state in sessionStorage:
```typescript
sessionStorage.setItem('impersonating', JSON.stringify({
  sessionId,
  targetUserId,
  targetUserName,
  targetOrgName,
  targetRole,
  startedAt: new Date().toISOString()
}))
```
- Redirect to `/dashboard` — the impersonation banner reads this state

---

### Impersonation Banner (shown across entire platform when impersonating)

Add to `app/(dashboard)/layout.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'

interface ImpersonationState {
  sessionId: string
  targetUserId: string
  targetUserName: string
  targetOrgName: string
  targetRole: string
  startedAt: string
}

export function ImpersonationBanner() {
  const [imp, setImp] = useState<ImpersonationState | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('impersonating')
    if (stored) setImp(JSON.parse(stored))
  }, [])

  if (!imp) return null

  const handleExit = async () => {
    // Log session end
    await fetch('/api/console/impersonate/end', {
      method: 'POST',
      body: JSON.stringify({ sessionId: imp.sessionId }),
    })
    sessionStorage.removeItem('impersonating')
    window.location.href = '/console/impersonate'
  }

  return (
    <>
      {/* Top banner */}
      <div style={{
        background: '#1a1a2e',
        color: '#fff',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '12px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: '#EF9F27', animation: 'pulse 1.5s infinite', flexShrink: 0
        }}/>
        <span style={{ flex: 1 }}>
          Viewing as <strong style={{ color: '#EDD898' }}>{imp.targetUserName}</strong>
          {' '}({imp.targetRole} · {imp.targetOrgName}) — You are in impersonation mode.
        </span>
        <button
          onClick={handleExit}
          style={{
            fontSize: '11px', padding: '3px 12px', borderRadius: '6px',
            background: '#E24B4A', color: '#fff', border: 'none', cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Exit impersonation
        </button>
      </div>

      {/* Floating exit button — bottom right */}
      <button
        onClick={handleExit}
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 200,
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '11px', padding: '7px 14px', borderRadius: '20px',
          background: '#E24B4A', color: '#fff', border: 'none',
          cursor: 'pointer', fontWeight: 500,
          boxShadow: '0 2px 8px rgba(226,75,74,0.4)'
        }}
      >
        ← Exit · {imp.targetUserName}
      </button>
    </>
  )
}
```

Add `<ImpersonationBanner />` at the top of the dashboard layout, above the main nav.

---

### Server Action — Log Impersonation

Create `app/console/impersonate/actions.ts`:

```typescript
'use server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function startImpersonationSession(
  targetUserId: string,
  targetUserEmail: string,
  targetUserName: string,
  targetOrgName: string
): Promise<string> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('impersonation_sessions')
    .insert({
      impersonator_id: (await supabase.auth.getUser()).data.user?.id,
      target_user_id: targetUserId,
      target_user_email: targetUserEmail,
      target_user_name: targetUserName,
      target_org_name: targetOrgName,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

export async function endImpersonationSession(sessionId: string): Promise<void> {
  const supabase = createAdminClient()
  const now = new Date()

  const { data: session } = await supabase
    .from('impersonation_sessions')
    .select('started_at')
    .eq('id', sessionId)
    .single()

  const duration = session
    ? Math.floor((now.getTime() - new Date(session.started_at).getTime()) / 1000)
    : null

  await supabase
    .from('impersonation_sessions')
    .update({ ended_at: now.toISOString(), duration_seconds: duration })
    .eq('id', sessionId)
}
```

Also create `app/api/console/impersonate/end/route.ts` to handle the fetch call from the banner:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { endImpersonationSession } from '@/app/console/impersonate/actions'

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json()
  await endImpersonationSession(sessionId)
  return NextResponse.json({ ok: true })
}
```

### Acceptance Criteria — Task 3
- [ ] `/console/impersonate` loads with user list
- [ ] Search, org filter, role filter all work
- [ ] Click user → switches to detail view with activity timeline
- [ ] Each timeline row is ONE LINE — never wraps
- [ ] Long detail text truncates with ellipsis
- [ ] "View as user →" opens impersonation mode
- [ ] Impersonation banner shows at top of platform
- [ ] Floating exit button shows bottom-right
- [ ] Both exit buttons end session and redirect to `/console/impersonate`
- [ ] Session logged to `impersonation_sessions` table on start and end

---

## TASK 4 — Build `/console/activity` Page

**Agent:** Sub-Agent 3

### Files to create:
```
app/console/activity/page.tsx
app/console/activity/_components/ActivityClient.tsx
```

---

**Page header:**
- Title: "User Activity"
- Subtitle: "Every action taken across all users and organisations"

**Stats bar (4 cards):**
- Events today (count from activity_log where created_at > today)
- Active users today (distinct user_ids today)
- Deletions today (action_type = 'delete' today) — red if > 0
- Inspections run today (category = 'inspections' today)

**Filter bar:**
- Search input (searches action_label and detail)
- Select: All users (dynamic list from profiles)
- Select: All orgs (dynamic list from organizations)
- Select: All actions (Login/Logout, Create, Edit, Delete, Inspection, Navigation, Billing, Template, Invite)
- Select: Today / Last 7 days / Last 30 days / All time

**Activity table columns:**
| Column | Detail |
|---|---|
| User | Avatar (initials, colored) + name |
| Action | action_label text |
| Category | Colored badge (same colors as timeline) |
| Detail | detail text — truncated with ellipsis |
| Time | Relative time (2 min ago / 1 hr ago / Yesterday) |

**Table typography:**
- All text: 12px max
- Category badge: 10px
- Detail: 11px, secondary color, truncated
- Time: 11px, tertiary

**Pagination:** Show 50 rows per page, load more button at bottom.

**Data query:**
```typescript
const { data } = await supabaseAdmin
  .from('activity_log')
  .select(`
    *,
    profiles (
      full_name,
      email,
      role
    ),
    organizations (
      name
    )
  `)
  .order('created_at', { ascending: false })
  .limit(50)
```

### Acceptance Criteria — Task 4
- [ ] `/console/activity` loads with activity feed
- [ ] All 4 stats cards show correct counts
- [ ] Search works across action_label and detail
- [ ] All filters work correctly
- [ ] Table shows 50 rows, load more works
- [ ] Category badges use correct colors
- [ ] Detail column truncates with ellipsis

---

## TASK 5 — Activity Tracking Middleware

**Agent:** Sub-Agent 1 (after Tasks 1 and 2)

### What to track and where

Create a tracking utility at `lib/activity-tracker.ts`:

```typescript
import { createAdminClient } from '@/lib/supabase/admin'

interface TrackEventParams {
  userId: string
  organizationId: string
  actionType: string
  category: string
  actionLabel: string
  detail?: string
  metadata?: Record<string, unknown>
  pagePath?: string
  fromPath?: string
}

export async function trackEvent(params: TrackEventParams): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from('activity_log').insert({
      user_id: params.userId,
      organization_id: params.organizationId,
      action_type: params.actionType,
      category: params.category,
      action_label: params.actionLabel,
      detail: params.detail ?? null,
      metadata: params.metadata ?? null,
      page_path: params.pagePath ?? null,
      from_path: params.fromPath ?? null,
    })
  } catch (err) {
    // Never throw — tracking must never break the user's action
    console.error('[ActivityTracker] Failed to log event:', err)
  }
}
```

### Where to call `trackEvent`:

Add tracking calls to these existing server actions and API routes:

**Auth events** — in Supabase auth hooks or login/logout handlers:
```typescript
await trackEvent({
  userId, organizationId,
  actionType: 'login', category: 'auth',
  actionLabel: 'Logged in',
  detail: `${email} · ${browser} · ${os}`,
})
```

**Project created** — in project creation server action:
```typescript
await trackEvent({
  userId, organizationId,
  actionType: 'create', category: 'projects',
  actionLabel: 'Created project',
  detail: `${projectName} · ${productType} · ${factory} · ${quantity}`,
})
```

**Project deleted:**
```typescript
await trackEvent({
  userId, organizationId,
  actionType: 'delete', category: 'projects',
  actionLabel: 'Deleted project',
  detail: projectName,
})
```

**Inspection started:**
```typescript
await trackEvent({
  userId, organizationId,
  actionType: 'inspection_start', category: 'inspections',
  actionLabel: 'Started inspection',
  detail: `${inspectionId} · ${projectName} · ${type} · AQL ${aqlLevel} · Lot: ${lotSize} · Sample: ${sampleSize}`,
})
```

**Defect logged:**
```typescript
await trackEvent({
  userId, organizationId,
  actionType: 'inspection_defect', category: 'inspections',
  actionLabel: `Logged ${totalDefects} defect${totalDefects > 1 ? 's' : ''}`,
  detail: `${inspectionId} · Critical: ${critical} · Major: ${major} (${majorNames}) · Minor: ${minor} (${minorNames})`,
})
```

**Inspection submitted:**
```typescript
await trackEvent({
  userId, organizationId,
  actionType: 'inspection_submit', category: 'inspections',
  actionLabel: 'Submitted inspection report',
  detail: `${inspectionId} · ${projectName} · AQL ${aqlLevel} · ${result}`,
})
```

**Factory added:**
```typescript
await trackEvent({
  userId, organizationId,
  actionType: 'create', category: 'factories',
  actionLabel: 'Added factory',
  detail: `${factoryName} · ${country} · ${type}`,
})
```

**Factory deleted:**
```typescript
await trackEvent({
  userId, organizationId,
  actionType: 'delete', category: 'factories',
  actionLabel: 'Deleted factory',
  detail: `${factoryName} · Permanently deleted`,
})
```

**Template created:**
```typescript
await trackEvent({
  userId, organizationId,
  actionType: 'template_create', category: 'templates',
  actionLabel: 'Created template',
  detail: `${templateName} · ${type} · ${industry}`,
})
```

**Template deleted:**
```typescript
await trackEvent({
  userId, organizationId,
  actionType: 'delete', category: 'templates',
  actionLabel: 'Deleted template',
  detail: `${templateName} · Permanently deleted`,
})
```

**Member invited:**
```typescript
await trackEvent({
  userId, organizationId,
  actionType: 'invite_member', category: 'team',
  actionLabel: 'Invited team member',
  detail: `${inviteeEmail} · Role: ${role}`,
})
```

**Navigation** — add to Next.js middleware or route change handler:
```typescript
await trackEvent({
  userId, organizationId,
  actionType: 'navigation', category: 'navigation',
  actionLabel: 'Navigated',
  detail: `${toPath} · from ${fromPath}`,
  pagePath: toPath,
  fromPath: fromPath,
})
```

> **Important:** Navigation tracking should be **debounced** — only log if user stays on a route for > 3 seconds. Do not log every rapid tab switch.

### Acceptance Criteria — Task 5
- [ ] `lib/activity-tracker.ts` exists and exports `trackEvent`
- [ ] `trackEvent` never throws — always fails silently
- [ ] Login events tracked
- [ ] Project create/delete tracked
- [ ] Inspection start/defect/submit tracked
- [ ] Factory add/delete tracked
- [ ] Template create/delete tracked
- [ ] Member invite tracked
- [ ] Navigation tracked (debounced, > 3s threshold)
- [ ] All detail strings are single line (no newlines)

---

## TASK 6 — Add Nav Links to Console Layout

**Agent:** Sub-Agent 2

Open `app/console/layout.tsx`. Find the navigation links array and add:

```typescript
{ label: 'Impersonate', href: '/console/impersonate' },
{ label: 'Activity',    href: '/console/activity' },
```

Place them between Users and Demo Requests:
```
Overview → Analytics → Orgs → Users → Impersonate → Activity → Demo Requests → Automations
```

### Acceptance Criteria — Task 6
- [ ] "Impersonate" link appears in console nav
- [ ] "Activity" link appears in console nav
- [ ] Active state highlights correctly on both pages
- [ ] All existing nav links still work

---

## BUILD & DEPLOY

```bash
cd /var/www/Master_Sankalphub/V3.0_Frontend
npm run build
git add -A
git commit -m "feat: founder console — user impersonation + activity log"
git push origin main
```

---

## FINAL VERIFICATION CHECKLIST

**Database:**
- [ ] `activity_log` table exists with all columns and indexes
- [ ] `impersonation_sessions` table exists
- [ ] Both have RLS enabled

**Impersonation page:**
- [ ] `/console/impersonate` loads with user list
- [ ] User detail view shows single-line activity timeline
- [ ] Each row: Category badge · Action · Detail (truncated) · Time — ONE LINE
- [ ] "View as user →" button starts impersonation session
- [ ] Impersonation banner appears at top of dashboard
- [ ] Floating exit button appears bottom-right
- [ ] Both exit buttons end session, log to DB, redirect to console

**Activity page:**
- [ ] `/console/activity` loads with global feed
- [ ] All filters work
- [ ] Stats cards show correct counts
- [ ] Table rows are compact and readable

**Tracking:**
- [ ] Login events appear in activity_log after login
- [ ] Inspection actions appear in activity_log
- [ ] Delete actions appear in activity_log (in red on activity page)
- [ ] No user action ever fails because of a tracking error

**Security:**
- [ ] `/console/impersonate` is inaccessible to non-super_admin users
- [ ] `/console/activity` is inaccessible to non-super_admin users
- [ ] Impersonation can only be started by super_admin

---

*SankalpHub V3 Frontend — Founder Console: Impersonation + User Activity*
*Design approved via interactive mockup — March 29, 2026*
*The founder sees everything. Always.*
