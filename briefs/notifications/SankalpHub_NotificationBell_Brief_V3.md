# SankalpHub — Notification Bell + Sound System Brief (V3 Frontend)
**For: Claude Code + Sub-Agents**
**Date:** April 1, 2026
**Scope:** Build a global notification bell in the top navbar with real-time Supabase events, categorized sounds per user type, and a notification panel
**Mode:** New feature. Add to existing navbar layout. Do NOT touch any other module.

> ⚠️ **WORKING DIRECTORY: V3 Frontend ONLY**
> All work is exclusively in `/var/www/Master_Sankalphub/V3.0_Frontend/`
> Do NOT touch `/var/www/Master_Sankalphub/Backend/`

---

## PLATFORM CONTEXT

| Item | Detail |
|------|--------|
| **Framework** | Next.js 15.2.1, React 19.2.4, TypeScript, Tailwind CSS |
| **Auth + DB** | Supabase — `jirhyxpcbfeelgiyxqdi.supabase.co` |
| **Realtime** | Supabase Realtime (postgres_changes) |
| **Sound** | Web Audio API — no external library needed |
| **Navbar file** | Find with: `grep -r "navbar\|Navbar\|topbar\|TopBar" app/(dashboard) --include="*.tsx" -l` |

---

## APPROVED SOUND SELECTIONS

These 4 sounds have been selected and approved by the founder. Build exactly these — no substitutions.

### Sound 1 — Brand notifications
**Name:** Warm ascending triad
**Trigger:** New orders, approvals, reports, sample updates
**Notes:** C5(523Hz) → E5(659Hz) → G5(784Hz)
**Wave:** sine · volume 0.28 · duration 0.8s each · spacing 0.16s

```typescript
function playBrandChime(ctx: AudioContext) {
  [[523, 0], [659, 0.16], [784, 0.32]].forEach(([freq, t]) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'; o.frequency.value = freq
    g.gain.setValueAtTime(0.28, ctx.currentTime + t)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.8)
    o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.8)
  })
}
```

---

### Sound 2 — Factory notifications
**Name:** Deep wooden knock
**Trigger:** Production targets, order assigned, capacity alerts, order delayed
**Notes:** G3(196Hz) → G4(392Hz) → G3(196Hz) — knock pattern
**Wave:** triangle · volume 0.32 · duration 0.5s · spacing 0.2s

```typescript
function playFactoryChime(ctx: AudioContext) {
  [[294, 0], [392, 0.2], [294, 0.4]].forEach(([freq, t]) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'triangle'; o.frequency.value = freq
    g.gain.setValueAtTime(0.32, ctx.currentTime + t)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.5)
    o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.5)
  })
}
```

---

### Sound 3 — Inspection / Agency notifications (two variants)

**3a — Pass chime (inspection passed)**
**Name:** Clean pass chime
**Notes:** E5(659Hz) → G5(784Hz) → B5(988Hz) — ascending bright
**Wave:** sine · volume 0.25 · duration 0.6s · spacing 0.14s

```typescript
function playInspectionPassChime(ctx: AudioContext) {
  [[659, 0], [784, 0.14], [988, 0.28]].forEach(([freq, t]) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'; o.frequency.value = freq
    g.gain.setValueAtTime(0.25, ctx.currentTime + t)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.6)
    o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.6)
  })
}
```

**3b — Fail alert (inspection failed / critical defect)**
**Name:** Fail alert — descending
**Notes:** A5(880Hz) → F5(698Hz) → C5(523Hz) — descending urgent
**Wave:** sine · volume 0.30 · duration 0.5s · spacing 0.16s

```typescript
function playInspectionFailChime(ctx: AudioContext) {
  [[880, 0], [698, 0.16], [523, 0.32]].forEach(([freq, t]) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'; o.frequency.value = freq
    g.gain.setValueAtTime(0.30, ctx.currentTime + t)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.5)
    o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.5)
  })
}
```

---

### Sound 4 — System / Platform notifications
**Name:** Soft iOS pop
**Trigger:** New signups, demo requests, billing events
**Notes:** Single tone 660Hz → 880Hz sweep · very short
**Wave:** sine · volume 0.28 · duration 0.18s

```typescript
function playSystemChime(ctx: AudioContext) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.connect(g); g.connect(ctx.destination)
  o.type = 'sine'
  o.frequency.setValueAtTime(660, ctx.currentTime)
  o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.04)
  g.gain.setValueAtTime(0.28, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
  o.start(); o.stop(ctx.currentTime + 0.18)
}
```

---

## TASK ASSIGNMENT

| Task | Agent | Description |
|---|---|---|
| Task 1 | Sub-Agent 1 | Create `notifications` table in Supabase |
| Task 2 | Sub-Agent 2 | Build `NotificationBell` component |
| Task 3 | Sub-Agent 2 | Build notification panel UI |
| Task 4 | Sub-Agent 1 | Wire Supabase Realtime + sound triggers |
| Task 5 | Sub-Agent 2 | Add bell to navbar |
| Task 6 | Sub-Agent 1 | Write notification events into DB from existing actions |

---

## TASK 1 — NOTIFICATIONS TABLE

**Agent:** Sub-Agent 1

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  -- null user_id = notification for all users in the org
  event_type        TEXT NOT NULL,
  -- Values:
  -- 'critical_defect' | 'inspection_failed' | 'inspection_passed'
  -- 'order_delayed' | 'factory_at_capacity' | 'report_submitted'
  -- 'report_approved' | 'report_rejected' | 'new_demo_request'
  -- 'new_user_signup' | 'plan_upgraded' | 'order_assigned'
  -- 'production_target_met' | 'inspection_scheduled'
  sound_category    TEXT NOT NULL,
  -- Values: 'brand' | 'factory' | 'inspection_pass' | 'inspection_fail' | 'system'
  title             TEXT NOT NULL,      -- e.g. "Critical defect logged"
  detail            TEXT,               -- e.g. "INS-047 · Tiger Exports · Seam breakage"
  link              TEXT,               -- e.g. "/inspections/INS-047"
  is_read           BOOLEAN DEFAULT false,
  is_critical       BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notif_org     ON notifications (organization_id, created_at DESC);
CREATE INDEX idx_notif_user    ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notif_unread  ON notifications (organization_id, is_read, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users see their own org notifications
CREATE POLICY "org_notifications"
ON notifications FOR SELECT
USING (organization_id = (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
));

-- Users can mark their own notifications as read
CREATE POLICY "mark_read_notifications"
ON notifications FOR UPDATE
USING (organization_id = (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
));

-- Super admin sees all
CREATE POLICY "super_admin_notifications"
ON notifications FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
));
```

---

## TASK 2 — NOTIFICATION BELL COMPONENT

**Agent:** Sub-Agent 2

**File:** `components/notifications/NotificationBell.tsx`

```typescript
'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell } from 'lucide-react'

interface Notification {
  id: string
  event_type: string
  sound_category: 'brand' | 'factory' | 'inspection_pass' | 'inspection_fail' | 'system'
  title: string
  detail?: string
  link?: string
  is_read: boolean
  is_critical: boolean
  created_at: string
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [criticalOnly, setCriticalOnly] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'info'>('all')
  const panelRef = useRef<HTMLDivElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const unreadCount = notifications.filter(n => !n.is_read).length

  // ── SOUND ENGINE ──────────────────────────────────────────
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }, [])

  const playSound = useCallback((category: string, isCritical: boolean) => {
    if (!soundEnabled) return
    if (criticalOnly && !isCritical) return

    try {
      const ctx = getAudioContext()

      const playNotes = (notes: [number, number][], type: OscillatorType, vol: number, dur: number) => {
        notes.forEach(([freq, t]) => {
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.connect(g); g.connect(ctx.destination)
          o.type = type; o.frequency.value = freq
          g.gain.setValueAtTime(vol, ctx.currentTime + t)
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur)
          o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + dur)
        })
      }

      switch (category) {
        case 'brand':
          // Warm ascending triad: C5 → E5 → G5
          playNotes([[523, 0], [659, 0.16], [784, 0.32]], 'sine', 0.28, 0.8)
          break
        case 'factory':
          // Deep wooden knock: G3 → G4 → G3
          playNotes([[294, 0], [392, 0.2], [294, 0.4]], 'triangle', 0.32, 0.5)
          break
        case 'inspection_pass':
          // Clean pass chime: E5 → G5 → B5
          playNotes([[659, 0], [784, 0.14], [988, 0.28]], 'sine', 0.25, 0.6)
          break
        case 'inspection_fail':
          // Fail alert descending: A5 → F5 → C5
          playNotes([[880, 0], [698, 0.16], [523, 0.32]], 'sine', 0.30, 0.5)
          break
        case 'system':
          // Soft iOS pop: 660Hz → 880Hz sweep
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.connect(g); g.connect(ctx.destination)
          o.type = 'sine'
          o.frequency.setValueAtTime(660, ctx.currentTime)
          o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.04)
          g.gain.setValueAtTime(0.28, ctx.currentTime)
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
          o.start(); o.stop(ctx.currentTime + 0.18)
          break
      }
    } catch (err) {
      // Never crash if audio fails
      console.warn('[NotificationBell] Audio playback failed:', err)
    }
  }, [soundEnabled, criticalOnly, getAudioContext])

  // ── DATA FETCHING ─────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()

    async function fetchNotifications() {
      try {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
        if (data) setNotifications(data)
      } catch (err) {
        console.error('[NotificationBell] Fetch failed:', err)
      }
    }

    fetchNotifications()

    // ── REALTIME SUBSCRIPTION ─────────────────────────────
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, (payload) => {
        const newNotif = payload.new as Notification
        setNotifications(prev => [newNotif, ...prev])
        // Play sound for new notification
        playSound(newNotif.sound_category, newNotif.is_critical)
        // Bell ring animation
        const bell = document.getElementById('bell-icon-svg')
        if (bell) {
          bell.classList.add('bell-ring')
          setTimeout(() => bell.classList.remove('bell-ring'), 500)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [playSound])

  // ── CLOSE ON OUTSIDE CLICK ────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── MARK READ ─────────────────────────────────────────────
  async function markRead(id: string) {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    const supabase = createClient()
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  // ── FILTERED NOTIFICATIONS ────────────────────────────────
  const filtered = notifications.filter(n => {
    if (activeTab === 'critical') return n.is_critical
    if (activeTab === 'info') return !n.is_critical
    return true
  })

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        id="bell-btn"
        onClick={() => setOpen(!open)}
        style={{
          width: '34px', height: '34px', borderRadius: '8px',
          border: '0.5px solid var(--color-border-secondary)',
          background: open ? '#FAEEDA' : 'var(--color-background-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative', transition: 'all .15s',
        }}
      >
        <Bell
          id="bell-icon-svg"
          size={16}
          color={open ? '#BA7517' : 'var(--color-text-secondary)'}
          style={{ transition: 'color .15s' }}
        />
        {unreadCount > 0 && (
          <>
            {/* Pulse ring */}
            <span style={{
              position: 'absolute', top: '-4px', right: '-4px',
              width: '16px', height: '16px', borderRadius: '50%',
              background: '#E24B4A', opacity: 0,
              animation: 'notif-pulse 2s infinite',
            }} />
            {/* Badge */}
            <span style={{
              position: 'absolute', top: '-4px', right: '-4px',
              width: '16px', height: '16px', borderRadius: '50%',
              background: '#E24B4A', color: '#fff',
              fontSize: '9px', fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--color-background-primary)',
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </>
        )}
      </button>

      {/* Notification panel */}
      {open && (
        <NotificationPanel
          notifications={filtered}
          unreadCount={unreadCount}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          criticalOnly={criticalOnly}
          setCriticalOnly={setCriticalOnly}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
          onPlaySound={playSound}
        />
      )}

      <style>{`
        @keyframes notif-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes bell-ring {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-15deg); }
          60% { transform: rotate(10deg); }
          80% { transform: rotate(-10deg); }
        }
        .bell-ring { animation: bell-ring 0.5s ease !important; }
      `}</style>
    </div>
  )
}
```

---

## TASK 3 — NOTIFICATION PANEL COMPONENT

**Agent:** Sub-Agent 2

**File:** `components/notifications/NotificationPanel.tsx`

```typescript
// Panel renders as absolute positioned dropdown below bell button
// Width: 340px
// Max height: 480px with scroll on notification list
// Border-radius: 12px
// Border: 0.5px solid var(--color-border-secondary)
// Background: var(--color-background-primary)
```

**Panel sections (top to bottom):**

### Header row:
```
[Notifications]  [X unread badge]          [Mark all read]
```

### Tab row:
```
[All] [Critical] [Info]
Active tab: border-bottom 2px solid #BA7517, color #BA7517
```

### Notification list (scrollable, max-height 320px):

Each notification item:
```
[Category icon 32px] [Title + Detail + Time]   [Unread dot]
```

**Icon colors per category:**
| sound_category | Icon bg | Icon stroke |
|---|---|---|
| brand | `#E6F1FB` | `#185FA5` |
| factory | `#FAEEDA` | `#854F0B` |
| inspection_pass | `#E1F5EE` | `#1D9E75` |
| inspection_fail | `#FCEBEB` | `#A32D2D` |
| system | `#EEEDFE` | `#534AB7` |

**Icons per event_type:**
| event_type | Icon |
|---|---|
| critical_defect | Warning triangle |
| inspection_failed | X circle |
| inspection_passed | Check circle |
| order_delayed | Clock |
| factory_at_capacity | Building |
| report_submitted | Document |
| report_approved | Check square |
| new_demo_request | Document + |
| new_user_signup | Person + |
| plan_upgraded | Star |

**Unread item:** slightly highlighted bg `#FAFAF8`, red unread dot
**Read item:** normal bg, dot hidden

**Time format:**
```typescript
const formatTime = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}
```

### Settings row (below list):
```
Sound notifications    [toggle ON/OFF]
Critical events only   [toggle ON/OFF]
```

Toggle: 36×20px, `#1D9E75` when on, border color when off.

### Footer:
```
View all notifications →   (links to /notifications)
```

---

## TASK 4 — SUPABASE REALTIME WIRING

**Agent:** Sub-Agent 1

The Realtime subscription is already set up inside `NotificationBell.tsx` above. Sub-Agent 1 must ensure:

1. **Enable Realtime on the notifications table** in Supabase dashboard:
   - Go to Database → Replication → enable for `notifications` table

2. **Verify Supabase client supports Realtime:**
```bash
grep -r "createClient\|supabaseClient" \
  /var/www/Master_Sankalphub/V3.0_Frontend/lib/supabase \
  --include="*.ts" | head -5
```

3. **Test the subscription works** by inserting a test notification and confirming it appears without page refresh.

---

## TASK 5 — ADD BELL TO NAVBAR

**Agent:** Sub-Agent 2

### Step 1 — Find the navbar:
```bash
find /var/www/Master_Sankalphub/V3.0_Frontend/app/(dashboard) \
  -name "*.tsx" | xargs grep -l "navbar\|Navbar\|topbar\|TopBar\|header" \
  | grep -v node_modules | grep -v .next
```

### Step 2 — Import and add bell:
```tsx
import { NotificationBell } from '@/components/notifications/NotificationBell'

// Add inside the navbar right section, before the user avatar:
<NotificationBell />
```

### Step 3 — Add to console navbar too (for super_admin):
Find the console layout navbar and add the same `<NotificationBell />` component.

---

## TASK 6 — WRITE NOTIFICATIONS FROM EXISTING ACTIONS

**Agent:** Sub-Agent 1

When these events happen, write a row to the `notifications` table. Find each existing server action and add the notification insert.

### Helper function — create `lib/notifications.ts`:

```typescript
import { createAdminClient } from '@/lib/supabase/admin'

interface CreateNotificationParams {
  organizationId: string
  userId?: string           // null = notify all org members
  eventType: string
  soundCategory: 'brand' | 'factory' | 'inspection_pass' | 'inspection_fail' | 'system'
  title: string
  detail?: string
  link?: string
  isCritical?: boolean
}

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from('notifications').insert({
      organization_id: params.organizationId,
      user_id: params.userId ?? null,
      event_type: params.eventType,
      sound_category: params.soundCategory,
      title: params.title,
      detail: params.detail ?? null,
      link: params.link ?? null,
      is_critical: params.isCritical ?? false,
      is_read: false,
    })
  } catch (err) {
    // Never throw — notification failure must never break the main action
    console.error('[Notifications] Failed to create notification:', err)
  }
}
```

### Wire to existing events:

**Critical defect logged** (in defect logging server action):
```typescript
await createNotification({
  organizationId,
  eventType: 'critical_defect',
  soundCategory: 'inspection_fail',
  title: 'Critical defect logged',
  detail: `${inspectionId} · ${factoryName} · ${defectName}`,
  link: `/inspections/${inspectionId}`,
  isCritical: true,
})
```

**Inspection failed** (in inspection submit server action):
```typescript
if (result === 'fail') {
  await createNotification({
    organizationId,
    eventType: 'inspection_failed',
    soundCategory: 'inspection_fail',
    title: 'Inspection failed',
    detail: `${inspectionId} · ${factoryName} · AQL ${aqlLevel} · Score: ${score}%`,
    link: `/inspections/${inspectionId}`,
    isCritical: true,
  })
}
```

**Inspection passed** (in inspection submit server action):
```typescript
if (result === 'pass') {
  await createNotification({
    organizationId,
    eventType: 'inspection_passed',
    soundCategory: 'inspection_pass',
    title: 'Inspection passed',
    detail: `${inspectionId} · ${factoryName} · Score: ${score}%`,
    link: `/inspections/${inspectionId}`,
    isCritical: false,
  })
}
```

**Order delayed** (in daily cron or order update action):
```typescript
await createNotification({
  organizationId,
  eventType: 'order_delayed',
  soundCategory: 'factory',
  title: 'Order delayed',
  detail: `${orderNumber} · ${factoryName} · ${daysOverdue} days overdue`,
  link: `/orders/${orderId}`,
  isCritical: true,
})
```

**Factory at 100% capacity** (in order assignment action):
```typescript
if (utilisationPct >= 100) {
  await createNotification({
    organizationId,
    eventType: 'factory_at_capacity',
    soundCategory: 'factory',
    title: 'Factory at 100% capacity',
    detail: `${factoryName} · No room for new orders`,
    link: `/factories/${factoryId}`,
    isCritical: true,
  })
}
```

**New demo request** (in demo form submission):
```typescript
await createNotification({
  organizationId: SANKALPHUB_SUPER_ORG_ID, // founder org only
  eventType: 'new_demo_request',
  soundCategory: 'system',
  title: 'New demo request',
  detail: `${name} · ${company} · ${email}`,
  link: `/console/demo-requests`,
  isCritical: false,
})
```

**New user signup** (in sign-up flow):
```typescript
await createNotification({
  organizationId: SANKALPHUB_SUPER_ORG_ID,
  eventType: 'new_user_signup',
  soundCategory: 'system',
  title: 'New user signup',
  detail: `${orgName} · ${role} · ${plan} plan`,
  link: `/console/users`,
  isCritical: false,
})
```

**Report approved / rejected** (in report approval action):
```typescript
await createNotification({
  organizationId,
  eventType: result === 'approved' ? 'report_approved' : 'report_rejected',
  soundCategory: result === 'approved' ? 'inspection_pass' : 'inspection_fail',
  title: result === 'approved' ? 'Report approved' : 'Report rejected',
  detail: `${inspectionId} · ${factoryName} · by ${approverName}`,
  link: `/inspections/${inspectionId}`,
  isCritical: result === 'rejected',
})
```

---

## SOUND CATEGORY MAPPING (reference)

| Event | Sound category | Sound played |
|---|---|---|
| critical_defect | inspection_fail | Fail alert — descending (A5→F5→C5) |
| inspection_failed | inspection_fail | Fail alert — descending (A5→F5→C5) |
| inspection_passed | inspection_pass | Clean pass chime (E5→G5→B5) |
| report_approved | inspection_pass | Clean pass chime (E5→G5→B5) |
| report_rejected | inspection_fail | Fail alert — descending (A5→F5→C5) |
| order_delayed | factory | Deep wooden knock (G3→G4→G3) |
| factory_at_capacity | factory | Deep wooden knock (G3→G4→G3) |
| order_assigned | factory | Deep wooden knock (G3→G4→G3) |
| new_demo_request | system | Soft iOS pop (660→880Hz) |
| new_user_signup | system | Soft iOS pop (660→880Hz) |
| plan_upgraded | system | Soft iOS pop (660→880Hz) |
| report_submitted | brand | Warm ascending triad (C5→E5→G5) |
| order_created | brand | Warm ascending triad (C5→E5→G5) |

---

## BUILD & DEPLOY

```bash
cd /var/www/Master_Sankalphub/V3.0_Frontend
npm run build
git add -A
git commit -m "feat: notification bell — real-time alerts with categorized sounds per user type"
git push origin main
```

---

## FINAL VERIFICATION CHECKLIST

**Bell component:**
- [ ] Bell icon visible in navbar on all dashboard pages
- [ ] Red badge shows unread count
- [ ] Pulse animation on badge when new notification arrives
- [ ] Bell rings (CSS animation) on new notification
- [ ] Click bell → opens panel
- [ ] Click outside → closes panel

**Sound system:**
- [ ] Brand notification → Warm ascending triad (C→E→G)
- [ ] Factory notification → Deep wooden knock (G→G→G triangle)
- [ ] Inspection pass → Clean pass chime (E→G→B)
- [ ] Inspection fail / critical → Fail alert descending (A→F→C)
- [ ] System notification → Soft iOS pop
- [ ] Sound toggle works — off = silent
- [ ] Critical only toggle works
- [ ] Audio never crashes the app (try/catch everywhere)

**Panel:**
- [ ] All 3 tabs filter correctly (All / Critical / Info)
- [ ] Unread items highlighted
- [ ] Click notification → marks as read + plays sound
- [ ] Mark all read → clears badge
- [ ] Time format: "2 min ago / 1 hr ago / Yesterday"
- [ ] "View all →" link works

**Realtime:**
- [ ] New notification appears without page refresh
- [ ] Sound plays automatically on new realtime event
- [ ] Bell rings on new realtime event

**Events wired:**
- [ ] Critical defect → notification created
- [ ] Inspection fail → notification created
- [ ] Inspection pass → notification created
- [ ] Order delayed → notification created
- [ ] Factory at capacity → notification created
- [ ] New demo request → notification created (super admin org)
- [ ] New user signup → notification created (super admin org)
- [ ] Report approved/rejected → notification created

**General:**
- [ ] Notification failures never break main actions (silent fail)
- [ ] super_admin receives all notification types
- [ ] `npm run build` — zero errors

---

*SankalpHub V3 Frontend — Notification Bell + Sound System*
*4 approved sounds — Brand (warm triad) · Factory (wooden knock) · Inspection (pass/fail) · System (iOS pop)*
*April 1, 2026*
