# SankalpHub — Founder Console: Exclusive Notification Sound Brief (V3 Frontend)
**For: Claude Code**
**Date:** April 1, 2026
**Scope:** Add the "Still pond ripple" sound exclusively to the Founder Console notification bell
**Mode:** Small targeted addition. Touch only the Founder Console navbar and notification components.

> ⚠️ **WORKING DIRECTORY: V3 Frontend ONLY**
> All work is exclusively in `/var/www/Master_Sankalphub/V3.0_Frontend/`
> Do NOT touch the user-facing dashboard navbar or user notification components.

---

## CONTEXT

The main platform already has (or will have) categorized notification sounds for regular users:
- Brand → Warm ascending triad
- Factory → Deep wooden knock
- Inspection pass → Clean pass chime
- Inspection fail → Fail alert descending
- System → Soft iOS pop

The **Founder Console** (`/console`) needs its own **exclusive, unique sound** that plays only for the super_admin (Naveen). This sound must never play for any regular user.

**Selected sound:** Still pond ripple — three expanding sine waves like a drop on still water. Peaceful, meditative, premium.

---

## THE SOUND — EXACT SPECIFICATION

**Name:** Still pond ripple
**Character:** Three soft sine waves that expand outward like ripples — calm, meditative, completely unique
**Notes:** G4(392Hz) → C5(523Hz) → E5(659Hz)
**Wave type:** sine
**Pattern:** Each wave fades in gently then decays slowly — volume increases then exponentially decays
**Timing:** 0s, 0.3s, 0.6s (each ripple follows the previous)
**Duration:** 1.2s, 1.0s, 0.8s (each ripple slightly shorter)

```typescript
function playFounderRipple(ctx: AudioContext): void {
  const ripples: [number, number, number][] = [
    [392, 0,   1.2],   // G4 — first ripple, longest
    [523, 0.3, 1.0],   // C5 — second ripple
    [659, 0.6, 0.8],   // E5 — third ripple, shortest
  ]

  ripples.forEach(([freq, startTime, duration]) => {
    const oscillator = ctx.createOscillator()
    const gainNode   = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type          = 'sine'
    oscillator.frequency.value = freq

    // Gentle fade in then slow decay — like a ripple expanding
    gainNode.gain.setValueAtTime(0.0,  ctx.currentTime + startTime)
    gainNode.gain.linearRampToValueAtTime(0.22, ctx.currentTime + startTime + 0.08)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration)

    oscillator.start(ctx.currentTime + startTime)
    oscillator.stop(ctx.currentTime  + startTime + duration)
  })
}
```

---

## WHERE TO ADD IT

### Step 1 — Find the Founder Console navbar

```bash
find /var/www/Master_Sankalphub/V3.0_Frontend/app/console \
  -name "*.tsx" | xargs grep -l "bell\|Bell\|notification\|Notification" \
  | grep -v node_modules | grep -v .next
```

If the console already has a `NotificationBell` component from the previous brief — find it:

```bash
find /var/www/Master_Sankalphub/V3.0_Frontend/components \
  -name "NotificationBell*" -o -name "notification*" \
  | grep -v node_modules
```

---

### Step 2 — Create the founder sound utility

**File:** `lib/sounds/founderSound.ts`

```typescript
// ─────────────────────────────────────────────────────────
// SankalpHub — Founder Console Exclusive Sound
// "Still pond ripple" — peaceful, meditative, unique to super_admin
// Never play this for regular users
// ─────────────────────────────────────────────────────────

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

export function playFounderRipple(): void {
  try {
    const ctx = getAudioContext()

    // Three ripples — G4, C5, E5
    // Each fades in gently then decays like a water ripple
    const ripples: [number, number, number][] = [
      [392, 0,   1.2],
      [523, 0.3, 1.0],
      [659, 0.6, 0.8],
    ]

    ripples.forEach(([freq, startTime, duration]) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type            = 'sine'
      osc.frequency.value = freq

      gain.gain.setValueAtTime(0.0,  ctx.currentTime + startTime)
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + startTime + 0.08)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration)

      osc.start(ctx.currentTime + startTime)
      osc.stop(ctx.currentTime  + startTime + duration)
    })

  } catch (err) {
    // Never crash — sound failure must never break the console
    console.warn('[FounderSound] Ripple playback failed:', err)
  }
}
```

---

### Step 3 — Wire to Founder Console notification bell

**Option A — If `NotificationBell` component already exists from previous brief:**

Open `components/notifications/NotificationBell.tsx` and find the `playSound` function. Add a special case for the founder console:

```typescript
// At the top of the file
import { playFounderRipple } from '@/lib/sounds/founderSound'

// Inside the component, check if we are in the console
const isConsole = typeof window !== 'undefined' &&
  window.location.pathname.startsWith('/console')

// Modify the playSound function:
const playSound = useCallback((category: string, isCritical: boolean) => {
  if (!soundEnabled) return
  if (criticalOnly && !isCritical) return

  // ── FOUNDER CONSOLE exclusive sound ──────────────────
  if (isConsole) {
    playFounderRipple()
    return  // Never play user sounds in the console
  }

  // ── Regular user sounds ───────────────────────────────
  // ... existing switch(category) code stays below
}, [soundEnabled, criticalOnly, isConsole])
```

**Option B — If `NotificationBell` does NOT exist yet (console has its own bell):**

Find the console bell component and add the sound directly:

```bash
# Find where the bell click is handled in the console
grep -r "bell\|Bell\|onClick\|notification" \
  /var/www/Master_Sankalphub/V3.0_Frontend/app/console \
  --include="*.tsx" -n | grep -v node_modules | grep -v ".next"
```

Add the import and call `playFounderRipple()` wherever a new notification arrives or the bell is triggered.

---

### Step 4 — Trigger the sound on new console notifications

The sound should play when:
1. A new notification arrives via Supabase Realtime in the console
2. The bell icon is clicked and there are unread notifications

```typescript
// On new Realtime notification in console:
.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' },
  (payload) => {
    setNotifications(prev => [payload.new, ...prev])
    playFounderRipple()  // ← Founder exclusive sound
    // Bell ring animation
    document.getElementById('console-bell')?.classList.add('bell-ring')
    setTimeout(() => document.getElementById('console-bell')?.classList.remove('bell-ring'), 500)
  }
)

// On bell click when unread count > 0:
const handleBellClick = () => {
  setOpen(!open)
  if (unreadCount > 0 && !open) {
    playFounderRipple()  // ← plays as panel opens
  }
}
```

---

## VERIFICATION

### Manual test:
1. Log in as `naveenkool786@gmail.com`
2. Navigate to `/console`
3. Trigger a test notification by inserting directly into Supabase:

```sql
INSERT INTO notifications (
  organization_id,
  event_type,
  sound_category,
  title,
  detail,
  is_critical,
  is_read
) VALUES (
  (SELECT id FROM organizations LIMIT 1),
  'new_demo_request',
  'system',
  'Test — Founder sound',
  'Testing the Still pond ripple sound',
  false,
  false
);
```

4. Confirm the "Still pond ripple" sound plays — three gentle expanding tones G→C→E
5. Log in as any non-super_admin user — confirm they do NOT hear the ripple sound
6. Confirm the regular user sounds (warm triad, wooden knock etc.) are unaffected

---

## ACCEPTANCE CRITERIA

- [ ] `lib/sounds/founderSound.ts` created with exact ripple implementation
- [ ] Sound plays in `/console` when a new notification arrives via Realtime
- [ ] Sound plays when bell is clicked and unread count > 0
- [ ] Three distinct ripples audible: G4 → C5 → E5 with gentle fade-in and slow decay
- [ ] Sound NEVER plays for non-super_admin users
- [ ] Sound NEVER plays on user-facing dashboard pages
- [ ] Audio failure is silent — never crashes the console
- [ ] Existing user notification sounds are completely unaffected
- [ ] `npm run build` — zero errors

---

## BUILD & DEPLOY

```bash
cd /var/www/Master_Sankalphub/V3.0_Frontend
npm run build
git add -A
git commit -m "feat: founder console — still pond ripple exclusive notification sound"
git push origin main
```

---

*SankalpHub V3 Frontend — Founder Console Exclusive Sound*
*Sound: Still pond ripple — G4(392Hz) → C5(523Hz) → E5(659Hz) · sine · gentle fade-in · slow ripple decay*
*Exclusive to super_admin · Never plays for regular users*
*April 1, 2026*
