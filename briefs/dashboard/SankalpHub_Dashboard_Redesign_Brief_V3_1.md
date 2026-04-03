# SankalpHub — Dashboard Redesign: Slicer Cards Brief (V3 Frontend)
**For: Claude Code + Sub-Agents**
**Date:** April 3, 2026
**Scope:** Redesign the main dashboard — KPI cards, slicer step cards with spotlight effect, quick actions, activity feed
**Mode:** Replace existing dashboard page only. Do NOT touch any other page.

> ⚠️ **WORKING DIRECTORY: V3 Frontend ONLY**
> All work is in `/var/www/Master_Sankalphub/V3.0_Frontend/`
> File: `app/(dashboard)/dashboard/page.tsx`

---

## TASK ASSIGNMENT

| Task | Agent | Description |
|---|---|---|
| Task 1 | Sub-Agent 1 | Page layout, header, KPI cards |
| Task 2 | Sub-Agent 2 | Slicer cards with spotlight effect + dot indicators |
| Task 3 | Sub-Agent 1 | Quick action buttons + bottom two-column section |

---

## TASK 1 — PAGE LAYOUT + HEADER + KPI CARDS

**Agent:** Sub-Agent 1

**File:** `app/(dashboard)/dashboard/page.tsx`

The page uses full width — no max-width constraint.

---

### Page header

```tsx
<div style={{
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  marginBottom: '20px',
}}>
  <div>
    <h1 style={{ fontSize: '22px', fontWeight: 500, marginBottom: '3px' }}>
      Good morning, {profile?.full_name?.split(' ')[0] || 'Naveen'}
    </h1>
    <p style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
      {new Date().toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long'
      })} · SankalpHub · {profile?.role === 'super_admin' ? 'Super Admin' : profile?.role}
    </p>
  </div>
  <div style={{ display: 'flex', gap: '8px' }}>
    <button
      onClick={() => router.push('/analytics')}
      style={{
        padding: '7px 14px', borderRadius: '20px',
        border: '0.5px solid var(--border)',
        background: 'var(--background)',
        color: 'var(--muted-foreground)',
        fontSize: '12px', cursor: 'pointer',
      }}>
      View reports
    </button>
    <button
      onClick={() => router.push('/inspections/new')}
      style={{
        padding: '7px 16px', borderRadius: '20px',
        background: '#BA7517', color: '#fff',
        border: 'none', fontSize: '12px',
        fontWeight: 500, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '5px',
      }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
        stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      New inspection
    </button>
  </div>
</div>
```

---

### KPI cards row

Fetch live counts from Supabase:

```typescript
// Fetch counts
const [{ count: projectCount }, { count: inspectionCount },
  { count: factoryCount }, { data: inspectionStats }] = await Promise.all([
  supabase.from('projects').select('*', { count: 'exact', head: true })
    .eq('org_id', orgId).neq('status', 'draft'),
  supabase.from('inspections').select('*', { count: 'exact', head: true })
    .eq('org_id', orgId).eq('status', 'submitted'),
  supabase.from('factories').select('*', { count: 'exact', head: true })
    .eq('org_id', orgId).eq('status', 'active'),
  supabase.from('inspections').select('aql_result')
    .eq('org_id', orgId).eq('status', 'submitted'),
])

const passed = inspectionStats?.filter(i => i.aql_result === 'pass').length || 0
const total  = inspectionStats?.length || 0
const passRate = total > 0 ? Math.round((passed / total) * 100) : null
```

```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '12px',
  marginBottom: '24px',
}}>
  {[
    {
      label: 'Active projects',
      value: projectCount || 0,
      sub: projectCount ? `${projectCount} running` : 'No projects yet',
      icon: <BuildingIcon />,
      iconColor: '#BA7517',
      iconBg: '#FAEEDA',
      link: '/projects',
    },
    {
      label: 'Inspections run',
      value: inspectionCount || 0,
      sub: inspectionCount ? `${inspectionCount} completed` : 'Start your first',
      icon: <CheckIcon />,
      iconColor: '#1D9E75',
      iconBg: '#E1F5EE',
      link: '/inspections',
    },
    {
      label: 'Factories',
      value: factoryCount || 0,
      sub: factoryCount ? `${factoryCount} connected` : 'Add a factory',
      icon: <FactoryIcon />,
      iconColor: '#378ADD',
      iconBg: '#E6F1FB',
      link: '/factories',
    },
    {
      label: 'Pass rate',
      value: passRate !== null ? `${passRate}%` : '—',
      sub: total > 0 ? `${passed}/${total} inspections passed` : 'No data yet',
      icon: <TrendIcon />,
      iconColor: '#534AB7',
      iconBg: '#EEEDFE',
      link: '/analytics',
    },
  ].map((kpi, i) => (
    <div key={i}
      onClick={() => router.push(kpi.link)}
      style={{
        background: 'var(--card)',
        borderRadius: '12px',
        border: '0.5px solid var(--border)',
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'border-color .15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#C9A96E'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px',
        marginBottom: '8px', fontSize: '11px',
        color: 'var(--muted-foreground)' }}>
        <div style={{ width: '18px', height: '18px', borderRadius: '5px',
          background: kpi.iconBg, display: 'flex', alignItems: 'center',
          justifyContent: 'center' }}>
          {kpi.icon}
        </div>
        {kpi.label}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 500, lineHeight: 1,
        marginBottom: '4px', color: 'var(--foreground)' }}>
        {kpi.value}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
        {kpi.sub}
      </div>
    </div>
  ))}
</div>
```

---

## TASK 2 — SLICER CARDS WITH SPOTLIGHT EFFECT

**Agent:** Sub-Agent 2

This is the hero feature of the dashboard.
**Approved design — match this exactly. No deviations.**

---

### Determine current step from live data

```typescript
const getCurrentStep = (
  hasFactory: boolean,
  hasProject: boolean,
  hasTemplate: boolean,
  hasInspection: boolean,
  hasTeamMember: boolean
): number => {
  if (!hasFactory)    return 1
  if (!hasProject)    return 2
  if (!hasTemplate)   return 3
  if (!hasInspection) return 4
  if (!hasTeamMember) return 5
  return 6
}
```

```typescript
const [factories, projects, templates, inspections, members] = await Promise.all([
  supabase.from('factories').select('id').eq('org_id', orgId).limit(1),
  supabase.from('projects').select('id').eq('org_id', orgId).limit(1),
  supabase.from('inspection_templates').select('id').eq('org_id', orgId).limit(1),
  supabase.from('inspections').select('id').eq('org_id', orgId).eq('status','submitted').limit(1),
  supabase.from('profiles').select('id').eq('org_id', orgId).limit(2),
])

const doneCount = getCurrentStep(
  (factories.data?.length||0) > 0,
  (projects.data?.length||0) > 0,
  (templates.data?.length||0) > 0,
  (inspections.data?.length||0) > 0,
  (members.data?.length||0) > 1,
)
```

---

### Slicer step data

```typescript
const slicerSteps = [
  {
    title: 'Create account',
    sub: 'Organisation set up · Role selected',
    link: '/settings',
    iconPath: 'user',
  },
  {
    title: 'Add your first factory',
    sub: 'Connect your manufacturing partner',
    link: '/factories/new',
    iconPath: 'factory',
  },
  {
    title: 'Create first project',
    sub: 'Season, styles and deadlines',
    link: '/projects/new',
    iconPath: 'project',
  },
  {
    title: 'Inspection template',
    sub: 'Garments · Footwear · Gloves · Headwear',
    link: '/settings/templates',
    iconPath: 'template',
  },
  {
    title: 'Run first inspection',
    sub: 'AQL · Defect logging · PDF report',
    link: '/inspections/new',
    iconPath: 'check',
  },
  {
    title: 'Invite your team',
    sub: 'Brand Manager · Inspector · Factory',
    link: '/settings/users',
    iconPath: 'team',
  },
]
```

---

### CARD STYLE FUNCTION — exact approved values

```typescript
const getCardStyle = (index: number, doneCount: number): React.CSSProperties => {
  const base: React.CSSProperties = {
    borderRadius: '16px',
    border: '1px solid var(--border)',
    background: 'var(--card)',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  }

  // DONE — fades back, green tint
  if (index < doneCount) return {
    ...base,
    width: '130px',
    minHeight: '180px',
    opacity: 0.42,
    background: '#E1F5EE',
    border: '1px solid #9FE1CB',
    transform: 'scale(0.95)',
    filter: 'saturate(0.5)',
  }

  // ACTIVE — pops forward, shines, amber glow
  if (index === doneCount) return {
    ...base,
    width: '200px',
    minHeight: '230px',
    opacity: 1,
    background: 'var(--card)',
    border: '2px solid #BA7517',
    transform: 'scale(1.05) translateY(-14px)',
    filter: 'none',
    boxShadow: '0 12px 32px rgba(186, 117, 23, 0.18)',
    zIndex: 10,
  }

  // UPCOMING — progressively shrink and fade
  const dist = index - doneCount
  const upcomingMap = [
    null, // dist 0 = active (handled above)
    { width: '150px', minHeight: '200px', opacity: 0.70, transform: 'scale(0.97) translateY(-2px)', filter: 'saturate(0.8)' },
    { width: '140px', minHeight: '190px', opacity: 0.50, transform: 'scale(0.95) translateY(0)',    filter: 'saturate(0.55)' },
    { width: '130px', minHeight: '180px', opacity: 0.35, transform: 'scale(0.93) translateY(2px)',  filter: 'saturate(0.35)' },
    { width: '120px', minHeight: '170px', opacity: 0.22, transform: 'scale(0.91) translateY(4px)',  filter: 'saturate(0.2)' },
    { width: '110px', minHeight: '160px', opacity: 0.14, transform: 'scale(0.89) translateY(6px)',  filter: 'saturate(0.1)' },
  ]

  const d = Math.min(dist, 5)
  return { ...base, ...upcomingMap[d] }
}
```

---

### ICON HELPER — inline SVG per step

```typescript
const getStepIcon = (iconPath: string, color: string) => {
  const icons: Record<string, string> = {
    user:     '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    factory:  '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    project:  '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>',
    template: '<path d="M14 2H6a2 2 0 0 0-2 2v16h16V8z"/><polyline points="14 2 14 8 20 8"/>',
    check:    '<path d="M9 11l3 3L22 4"/>',
    team:     '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round"
      dangerouslySetInnerHTML={{ __html: icons[iconPath] }} />
  )
}
```

---

### FULL SLICER SECTION RENDER

```tsx
{/* Section header */}
<div style={{
  display: 'flex', alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '12px',
}}>
  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted-foreground)' }}>
    Get started — complete each step to unlock the next
  </span>
  <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
    {doneCount} of 6 complete
  </span>
</div>

{/* ── CRITICAL: outer wrapper — overflow visible so active card lift isn't clipped ── */}
<div style={{
  background: 'var(--muted)',       // container background like Dribbble reference
  borderRadius: '20px',
  border: '0.5px solid var(--border)',
  padding: '20px',                  // equal padding left and right
  paddingTop: '28px',               // extra top padding so lifted card isn't cut
  paddingBottom: '16px',
  overflow: 'visible',              // MUST be visible — never hidden
}}>
  {/* Cards row — all 6 cards, bottom-aligned */}
  <div style={{
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-end',         // bottom-aligned so lift goes upward
    justifyContent: 'center',       // centered in container — equal space left and right
    overflow: 'visible',
    paddingBottom: '4px',
  }}>
    {slicerSteps.map((step, i) => {
      const isDone   = i < doneCount
      const isActive = i === doneCount
      const isPending = i > doneCount

      const iconColor = isDone ? '#1D9E75' : isActive ? '#BA7517' : 'var(--muted-foreground)'
      const iconBg    = isDone ? '#E1F5EE' : isActive ? '#FAEEDA' : 'var(--background)'

      return (
        <div
          key={i}
          style={getCardStyle(i, doneCount)}
          onClick={() => !isPending && router.push(step.link)}>

          {/* Top: icon + badge */}
          <div style={{
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', marginBottom: '14px',
          }}>
            <div style={{
              width: isActive ? '42px' : '34px',
              height: isActive ? '42px' : '34px',
              borderRadius: '10px',
              background: iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.4s',
            }}>
              {getStepIcon(step.iconPath, iconColor)}
            </div>
            <span style={{
              fontSize: '9px', padding: '3px 8px', borderRadius: '10px', fontWeight: 500,
              background: isDone   ? '#E1F5EE'
                        : isActive ? '#BA7517'
                        : 'var(--background)',
              color:      isDone   ? '#085041'
                        : isActive ? '#fff'
                        : 'var(--muted-foreground)',
            }}>
              {isDone ? 'Done' : isActive ? 'Next up' : `Step ${i + 1}`}
            </span>
          </div>

          {/* Title */}
          <div style={{
            fontWeight: 500,
            lineHeight: 1.3,
            marginBottom: '5px',
            fontSize: isActive ? '14px' : '12px',
            color: isDone   ? '#085041'
                 : isActive ? 'var(--foreground)'
                 : 'var(--muted-foreground)',
          }}>
            {step.title}
          </div>

          {/* Subtitle — flex:1 pushes action to bottom */}
          <div style={{
            fontSize: isActive ? '11px' : '10px',
            color: 'var(--muted-foreground)',
            lineHeight: 1.5,
            flex: 1,
          }}>
            {step.sub}
          </div>

          {/* Action — pinned to bottom */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: isActive ? '12px' : '10px',
            fontWeight: 500,
            marginTop: '14px',
            color: isDone   ? '#1D9E75'
                 : isActive ? '#BA7517'
                 : 'var(--muted-foreground)',
          }}>
            {isDone ? (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 11l3 3L22 4"/>
                </svg>
                Completed
              </>
            ) : isActive ? (
              <>
                Get started
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </>
            ) : 'Locked'}
          </div>

          {/* Bottom progress bar */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
          }}>
            <div style={{
              height: '100%',
              width: isDone ? '100%' : '0%',
              background: isDone ? '#1D9E75' : '#BA7517',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      )
    })}
  </div>

  {/* Dot indicators */}
  <div style={{
    display: 'flex', gap: '5px',
    justifyContent: 'center',
    marginTop: '14px',
  }}>
    {slicerSteps.map((_, i) => (
      <div key={i} style={{
        height: '5px',
        width: i === doneCount ? '20px' : '5px',
        borderRadius: i === doneCount ? '3px' : '50%',
        background: i < doneCount  ? '#1D9E75'
                  : i === doneCount ? '#BA7517'
                  : 'var(--border)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      }} />
    ))}
  </div>
</div>
```

---

### ALSO REMOVE THESE TWO BUTTONS FROM HEADER (confirmed)

```tsx
// DELETE both of these from the page header — do not render them at all:
// ❌ <button>View reports</button>
// ❌ <button>+ New inspection</button>
// Header should show ONLY the greeting and date — nothing else on the right
```

---

### Slicer card data

```typescript
const slicerSteps = [
  {
    title: 'Create account',
    sub: 'Organisation set up · Role selected',
    link: '/settings',
    iconPath: 'user',
  },
  {
    title: 'Add your first factory',
    sub: 'Connect your manufacturing partner',
    link: '/factories/new',
    iconPath: 'factory',
  },
  {
    title: 'Create first project',
    sub: 'Season, styles and deadlines',
    link: '/projects/new',
    iconPath: 'project',
    iconBg: 'var(--muted)',
    title: 'Create first project',
    sub: 'Season, styles and deadlines',
    action: 'Get started',
    link: '/projects/new',
  },
  {
    icon: <TemplateIcon color="var(--muted-foreground)" />,
    iconBg: 'var(--muted)',
    title: 'Inspection template',
    sub: 'Garments · Footwear · Gloves · Headwear',
    action: 'Get started',
    link: '/settings/templates',
  },
  {
    icon: <CheckIcon color="var(--muted-foreground)" />,
    iconBg: 'var(--muted)',
    title: 'Run first inspection',
    sub: 'AQL · Defect logging · PDF report',
    action: 'Get started',
    link: '/inspections/new',
  },
  {
    icon: <TeamIcon color="var(--muted-foreground)" />,
    iconBg: 'var(--muted)',
    title: 'Invite your team',
    sub: 'Brand Manager · Inspector · Factory Manager',
    action: 'Get started',
    link: '/settings/users',
  },
]
```

---

### Slicer card styles — EXACT SPECIFICATION

```typescript
// Returns the correct style object for each card based on its position
const getCardStyle = (index: number, doneCount: number): React.CSSProperties => {
  const base: React.CSSProperties = {
    flexShrink: 0,
    width: '176px',
    borderRadius: '14px',
    padding: '14px',
    cursor: 'pointer',
    transition: 'all 0.35s ease',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: '0.5px solid var(--border)',
    background: 'var(--card)',
  }

  if (index < doneCount) {
    // DONE — fade back with green tint
    return {
      ...base,
      opacity: 0.45,
      borderColor: '#9FE1CB',
      background: '#E1F5EE',
      transform: 'scale(0.97)',
      filter: 'saturate(0.6)',
    }
  }

  if (index === doneCount) {
    // ACTIVE — shines bright, lifts up
    return {
      ...base,
      opacity: 1,
      border: '2px solid #BA7517',
      background: 'var(--card)',
      transform: 'scale(1.04) translateY(-4px)',
      filter: 'none',
    }
  }

  // UPCOMING — progressively more faded
  const dist = index - doneCount
  const opacityMap = [1, 0.72, 0.55, 0.40, 0.28, 0.18]
  const scaleMap   = [1, 0.99, 0.98, 0.97, 0.96, 0.95]
  const satMap     = [1, 0.85, 0.6, 0.4, 0.3, 0.2]
  const d = Math.min(dist, 5)
  return {
    ...base,
    opacity: opacityMap[d],
    transform: `scale(${scaleMap[d]})`,
    filter: `saturate(${satMap[d]})`,
  }
}
```

---

### Full slicer cards render

```tsx
<div style={{ marginBottom: '8px' }}>
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  }}>
    <span style={{ fontSize: '11px', fontWeight: 500,
      color: 'var(--muted-foreground)' }}>
      Get started — complete each step to unlock the next
    </span>
    <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>
      {doneCount} of 6 complete
    </span>
  </div>

  {/* Scrollable slicer row */}
  <div style={{
    display: 'flex',
    gap: '10px',
    overflowX: 'auto',
    paddingBottom: '6px',
    scrollbarWidth: 'none',
    alignItems: 'stretch',
  }}
    className="hide-scrollbar">

    {slicerSteps.map((step, i) => {
      const isDone   = i < doneCount
      const isActive = i === doneCount
      const isPending = i > doneCount

      return (
        <div
          key={i}
          style={getCardStyle(i, doneCount)}
          onClick={() => !isPending && router.push(step.link)}>

          {/* Top row: icon + badge */}
          <div style={{ display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: isDone ? '#E1F5EE'
                        : isActive ? '#FAEEDA'
                        : 'var(--muted)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
            }}>
              {/* Icon — use correct SVG per step */}
            </div>
            <span style={{
              fontSize: '9px', padding: '2px 7px',
              borderRadius: '10px', fontWeight: 500,
              background: isDone ? '#E1F5EE'
                        : isActive ? '#BA7517'
                        : 'var(--muted)',
              color: isDone ? '#085041'
                   : isActive ? '#fff'
                   : 'var(--muted-foreground)',
            }}>
              {isDone ? 'Done' : isActive ? 'Next up' : `Step ${i + 1}`}
            </span>
          </div>

          {/* Title + subtitle */}
          <div style={{ fontSize: '13px', fontWeight: 500,
            marginBottom: '4px', lineHeight: 1.3,
            color: isDone ? '#085041'
                 : isActive ? 'var(--foreground)'
                 : 'var(--muted-foreground)',
          }}>
            {step.title}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--muted-foreground)',
            lineHeight: 1.5, flex: 1 }}>
            {step.sub}
          </div>

          {/* Action link */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '11px', fontWeight: 500, marginTop: '12px',
            color: isDone ? '#1D9E75'
                 : isActive ? '#BA7517'
                 : 'var(--muted-foreground)',
          }}>
            {isDone ? (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 11l3 3L22 4"/>
                </svg>
                Completed
              </>
            ) : isActive ? (
              <>
                Get started
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </>
            ) : 'Locked'}
          </div>

          {/* Bottom progress bar */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
            background: 'var(--border)',
          }}>
            <div style={{
              height: '100%',
              width: isDone ? '100%' : '0%',
              background: isDone ? '#1D9E75' : '#BA7517',
              borderRadius: '0 3px 3px 0',
              transition: 'width 0.4s',
            }} />
          </div>
        </div>
      )
    })}
  </div>

  {/* Dot indicators */}
  <div style={{
    display: 'flex', gap: '5px',
    justifyContent: 'center', marginTop: '10px',
  }}>
    {slicerSteps.map((_, i) => (
      <div key={i} style={{
        height: '6px',
        width: i === doneCount ? '18px' : '6px',
        borderRadius: i === doneCount ? '3px' : '50%',
        background: i < doneCount ? '#1D9E75'
                  : i === doneCount ? '#BA7517'
                  : 'var(--border)',
        transition: 'all 0.3s',
        cursor: 'pointer',
      }} />
    ))}
  </div>
</div>
```

Add to globals.css:
```css
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { scrollbar-width: none; }
```

---

## TASK 3 — QUICK ACTIONS + BOTTOM SECTION

**Agent:** Sub-Agent 1

### Quick action buttons (3 columns)

```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '10px',
  marginBottom: '20px',
  marginTop: '20px',
}}>
  {[
    {
      label: 'New inspection',
      sub: 'Start a quality check',
      iconBg: '#FAEEDA',
      iconColor: '#BA7517',
      link: '/inspections/new',
      icon: 'check',
    },
    {
      label: 'New project',
      sub: 'Create production order',
      iconBg: '#E6F1FB',
      iconColor: '#185FA5',
      link: '/projects/new',
      icon: 'project',
    },
    {
      label: 'Add factory',
      sub: 'Connect manufacturer',
      iconBg: '#E1F5EE',
      iconColor: '#1D9E75',
      link: '/factories/new',
      icon: 'factory',
    },
  ].map((qa, i) => (
    <div key={i}
      onClick={() => router.push(qa.link)}
      style={{
        background: 'var(--card)',
        borderRadius: '12px',
        border: '0.5px solid var(--border)',
        padding: '14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'all .15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#C9A96E'
        e.currentTarget.style.background = '#FAEEDA'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.background = 'var(--card)'
      }}>
      <div style={{
        width: '36px', height: '36px',
        borderRadius: '9px', background: qa.iconBg,
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
      }}>
        {/* Icon SVG */}
      </div>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 500 }}>{qa.label}</div>
        <div style={{ fontSize: '10px', color: 'var(--muted-foreground)',
          marginTop: '2px' }}>{qa.sub}</div>
      </div>
    </div>
  ))}
</div>
```

---

### Bottom two-column section

```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
}}>

  {/* Recent activity */}
  <div style={{
    background: 'var(--card)', borderRadius: '12px',
    border: '0.5px solid var(--border)', padding: '16px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: '14px' }}>
      <span style={{ fontSize: '12px', fontWeight: 500 }}>Recent activity</span>
      <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '6px',
        background: 'var(--muted)', color: 'var(--muted-foreground)',
        fontWeight: 500 }}>Today</span>
    </div>

    {recentActivity.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="var(--muted-foreground)" strokeWidth="1"
          strokeLinecap="round" style={{ margin: '0 auto 8px',
          display: 'block', opacity: 0.3 }}>
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
          No activity yet
        </div>
        <div style={{ fontSize: '11px', color: 'var(--muted-foreground)',
          marginTop: '3px' }}>
          Actions will appear here
        </div>
      </div>
    ) : (
      recentActivity.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center',
          gap: '10px', padding: '8px 0',
          borderBottom: i < recentActivity.length - 1
            ? '0.5px solid var(--border)' : 'none' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%',
            background: item.color, flexShrink: 0 }} />
          <div style={{ fontSize: '12px', flex: 1 }}>{item.text}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>
            {item.time}
          </div>
        </div>
      ))
    )}
  </div>

  {/* Platform progress */}
  <div style={{
    background: 'var(--card)', borderRadius: '12px',
    border: '0.5px solid var(--border)', padding: '16px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: '12px' }}>
      <span style={{ fontSize: '12px', fontWeight: 500 }}>Setup progress</span>
      <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '6px',
        background: '#FAEEDA', color: '#633806', fontWeight: 500 }}>
        {doneCount} of 6
      </span>
    </div>

    {/* Progress bar */}
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        fontSize: '11px', color: 'var(--muted-foreground)',
        marginBottom: '5px' }}>
        <span>Overall progress</span>
        <span style={{ color: '#BA7517', fontWeight: 500 }}>
          {Math.round((doneCount / 6) * 100)}%
        </span>
      </div>
      <div style={{ height: '6px', background: 'var(--muted)',
        borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          width: `${Math.round((doneCount / 6) * 100)}%`,
          height: '100%', background: '#BA7517',
          borderRadius: '3px', transition: 'width 0.6s',
        }} />
      </div>
    </div>

    {/* Step list */}
    {slicerSteps.map((step, i) => {
      const isDone   = i < doneCount
      const isActive = i === doneCount
      return (
        <div key={i} style={{ display: 'flex', alignItems: 'center',
          gap: '8px', marginBottom: '8px', fontSize: '11px' }}>
          <div style={{
            width: '18px', height: '18px', borderRadius: '50%',
            background: isDone ? '#1D9E75'
                      : isActive ? '#BA7517'
                      : 'var(--muted)',
            border: (!isDone && !isActive)
              ? '1.5px solid var(--border)' : 'none',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
            {isDone && (
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="3">
                <path d="M9 11l3 3L22 4"/>
              </svg>
            )}
            {isActive && (
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </div>
          <span style={{
            color: isDone ? '#085041'
                 : isActive ? '#633806'
                 : 'var(--muted-foreground)',
            fontWeight: isActive ? 500 : 400,
          }}>
            {step.title}
          </span>
        </div>
      )
    })}
  </div>

</div>
```

---

## RECENT ACTIVITY FETCH

Fetch last 5 activities from the notifications table:

```typescript
const { data: recentActivity } = await supabase
  .from('notifications')
  .select('title, detail, sound_category, created_at')
  .eq('org_id', orgId)
  .order('created_at', { ascending: false })
  .limit(5)

const activityColors = {
  brand: '#378ADD',
  factory: '#BA7517',
  inspection_pass: '#1D9E75',
  inspection_fail: '#E24B4A',
  system: '#534AB7',
}
```

---

## BUILD & DEPLOY

```bash
cd /var/www/Master_Sankalphub/V3.0_Frontend

npm run build 2>&1 | tail -20

if [ $? -eq 0 ]; then
  git add -A
  git commit -m "feat: dashboard redesign — slicer cards with spotlight effect, KPI cards, quick actions"
  git push origin main
  echo "DEPLOYED"
else
  echo "BUILD FAILED"
  npm run build 2>&1 | grep -E "Error|error|×" | head -20
fi
```

---

## VERIFICATION CHECKLIST

**Header:**
- [ ] Personalised greeting shows user's first name
- [ ] Date shows correctly
- [ ] Role badge shows correct role
- [ ] "New inspection" button navigates to /inspections/new

**KPI cards:**
- [ ] All 4 cards show live counts from Supabase
- [ ] Pass rate calculates correctly (0 inspections = "—")
- [ ] Cards are clickable and navigate to correct pages
- [ ] All 4 cards equal width in one row

**Slicer cards:**
- [ ] Header buttons "View reports" and "+ New inspection" are REMOVED
- [ ] All 6 cards sit inside a background container with equal left/right padding
- [ ] Container has `overflow: visible` — active card lift never clipped
- [ ] Cards are `alignItems: flex-end` — bottom aligned so lift goes upward
- [ ] Cards are `justifyContent: center` — centered in container, not left-aligned
- [ ] Done card: 130px wide, 180px tall, opacity 0.42, green tint, scale 0.95
- [ ] Active card: 200px wide, 230px tall, opacity 1, amber border, scale 1.05, translateY(-14px), amber glow
- [ ] Upcoming cards shrink progressively: 150px/70% → 140px/50% → 130px/35% → 120px/22% → 110px/14%
- [ ] NO horizontal scrollbar — all 6 fit in container at different sizes
- [ ] Dot indicators below — active dot is wider pill shape (#BA7517), done dots green, pending gray
- [ ] Cards update automatically based on live Supabase data
- [ ] Active card navigates to correct link on click
- [ ] Pending/locked cards are not clickable

**Quick actions:**
- [ ] 3 equal buttons in a row
- [ ] Each navigates to correct page
- [ ] Hover effect: gold border + amber background

**Bottom section:**
- [ ] Two equal columns
- [ ] Recent activity shows last 5 notifications or empty state
- [ ] Progress card shows correct step count and percentage bar
- [ ] Step list matches slicer cards state

---

*SankalpHub V3 — Dashboard Redesign*
*Slicer cards with spotlight effect · KPI cards · Quick actions*
*April 3, 2026*
