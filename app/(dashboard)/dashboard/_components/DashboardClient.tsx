'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FolderKanban, ClipboardCheck, Factory, TrendingUp, Users, FileText, Check } from 'lucide-react'

/* ─── TYPES ─── */

export interface DashboardData {
  firstName: string
  role: string
  projectCount: number
  inspectionCount: number
  factoryCount: number
  passRate: number | null
  passed: number
  totalInspections: number
  doneCount: number
  hasFactory: boolean
  hasProject: boolean
  hasTemplate: boolean
  hasInspection: boolean
  hasTeamMember: boolean
  recentActivity: { title: string; detail: string; category: string; createdAt: string }[]
  factoryAuditScores?: { id: string; name: string; score: number; result: string }[]
}

/* ─── CONSTANTS ─── */

const ACTIVITY_COLORS: Record<string, string> = {
  brand: '#378ADD', factory: '#BA7517', inspection_pass: '#1D9E75',
  inspection_fail: '#E24B4A', system: '#534AB7',
}

const SLICER_STEPS = [
  { title: 'Create account', sub: 'Organisation set up \u00B7 Role selected', link: '/settings', doneAction: 'View settings' },
  { title: 'Add your first factory', sub: 'Connect your manufacturing partner', link: '/factories/new' },
  { title: 'Create first project', sub: 'Season, styles and deadlines', link: '/projects/new' },
  { title: 'Inspection template', sub: 'Garments \u00B7 Footwear \u00B7 Gloves \u00B7 Headwear', link: '/settings/templates' },
  { title: 'Run first inspection', sub: 'AQL \u00B7 Defect logging \u00B7 PDF report', link: '/inspections/new' },
  { title: 'Invite your team', sub: 'Brand Manager \u00B7 Inspector \u00B7 Factory Manager', link: '/settings/users' },
]

/* ─── SLICER CARD STYLE ─── */

function getCardStyle(index: number, doneCount: number): React.CSSProperties {
  const base: React.CSSProperties = {
    flexShrink: 0, width: '176px', borderRadius: '14px', padding: '14px',
    cursor: 'pointer', transition: 'all 0.35s ease', position: 'relative',
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
    border: '0.5px solid var(--border)', background: 'var(--card)',
  }
  if (index < doneCount) {
    return { ...base, opacity: 0.45, borderColor: '#9FE1CB', background: '#E1F5EE', transform: 'scale(0.97)', filter: 'saturate(0.6)' }
  }
  if (index === doneCount) {
    return { ...base, opacity: 1, border: '2px solid #BA7517', background: 'var(--card)', transform: 'scale(1.04) translateY(-4px)', filter: 'none' }
  }
  const dist = Math.min(index - doneCount, 5)
  const opMap = [1, 0.72, 0.55, 0.40, 0.28, 0.18]
  const scMap = [1, 0.99, 0.98, 0.97, 0.96, 0.95]
  const saMap = [1, 0.85, 0.6, 0.4, 0.3, 0.2]
  return { ...base, opacity: opMap[dist], transform: `scale(${scMap[dist]})`, filter: `saturate(${saMap[dist]})` }
}

/* ─── COMPONENT ─── */

export function DashboardClient({ data }: { data: DashboardData }) {
  const router = useRouter()

  const roleLabel = data.role === 'super_admin' ? 'Super Admin'
    : data.role === 'brand_manager' ? 'Brand Manager'
    : data.role === 'factory_manager' ? 'Factory Manager'
    : data.role?.charAt(0).toUpperCase() + data.role?.slice(1) || 'User'

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 500, marginBottom: '3px' }}>
            {greeting}, {data.firstName}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} &middot; SankalpHub &middot; {roleLabel}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => router.push('/analytics')}
            style={{ padding: '7px 14px', borderRadius: '20px', border: '0.5px solid var(--border)', background: 'var(--background)', color: 'var(--muted-foreground)', fontSize: '12px', cursor: 'pointer' }}>
            View reports
          </button>
          <button onClick={() => router.push('/inspections/new')}
            style={{ padding: '7px 16px', borderRadius: '20px', background: '#BA7517', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New inspection
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Active projects', value: data.projectCount, sub: data.projectCount ? `${data.projectCount} running` : 'No projects yet', icon: <FolderKanban className="w-3 h-3" />, iconColor: '#BA7517', iconBg: '#FAEEDA', link: '/projects' },
          { label: 'Inspections run', value: data.inspectionCount, sub: data.inspectionCount ? `${data.inspectionCount} completed` : 'Start your first', icon: <ClipboardCheck className="w-3 h-3" />, iconColor: '#1D9E75', iconBg: '#E1F5EE', link: '/inspections' },
          { label: 'Factories', value: data.factoryCount, sub: data.factoryCount ? `${data.factoryCount} connected` : 'Add a factory', icon: <Factory className="w-3 h-3" />, iconColor: '#378ADD', iconBg: '#E6F1FB', link: '/factories' },
          { label: 'Pass rate', value: data.passRate !== null ? `${data.passRate}%` : '\u2014', sub: data.totalInspections > 0 ? `${data.passed}/${data.totalInspections} passed` : 'No data yet', icon: <TrendingUp className="w-3 h-3" />, iconColor: '#534AB7', iconBg: '#EEEDFE', link: '/analytics' },
        ].map((kpi, i) => (
          <div key={i} onClick={() => router.push(kpi.link)}
            style={{ background: 'var(--card)', borderRadius: '12px', border: '0.5px solid var(--border)', padding: '14px 16px', cursor: 'pointer', transition: 'border-color .15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#C9A96E')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '11px', color: 'var(--muted-foreground)' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '5px', background: kpi.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.iconColor }}>{kpi.icon}</div>
              {kpi.label}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 500, lineHeight: 1, marginBottom: '4px', color: 'var(--foreground)' }}>{kpi.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Slicer Cards ── */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--muted-foreground)' }}>Get started \u2014 complete each step to unlock the next</span>
          <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>{data.doneCount} of 6 complete</span>
        </div>

        <div className="hide-scrollbar" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px', alignItems: 'stretch' }}>
          {SLICER_STEPS.map((step, i) => {
            const isDone = i < data.doneCount
            const isActive = i === data.doneCount
            const isPending = i > data.doneCount
            return (
              <div key={i} style={getCardStyle(i, data.doneCount)} onClick={() => !isPending && router.push(step.link)}>
                {/* Top: icon + badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: isDone ? '#E1F5EE' : isActive ? '#FAEEDA' : 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isDone ? <Check className="w-4 h-4" style={{ color: '#1D9E75' }} /> :
                     i === 0 ? <Users className="w-4 h-4" style={{ color: isActive ? '#BA7517' : 'var(--muted-foreground)' }} /> :
                     i === 1 ? <Factory className="w-4 h-4" style={{ color: isActive ? '#BA7517' : 'var(--muted-foreground)' }} /> :
                     i === 2 ? <FolderKanban className="w-4 h-4" style={{ color: isActive ? '#BA7517' : 'var(--muted-foreground)' }} /> :
                     i === 3 ? <FileText className="w-4 h-4" style={{ color: isActive ? '#BA7517' : 'var(--muted-foreground)' }} /> :
                     i === 4 ? <ClipboardCheck className="w-4 h-4" style={{ color: isActive ? '#BA7517' : 'var(--muted-foreground)' }} /> :
                     <Users className="w-4 h-4" style={{ color: isActive ? '#BA7517' : 'var(--muted-foreground)' }} />}
                  </div>
                  <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '10px', fontWeight: 500, background: isDone ? '#E1F5EE' : isActive ? '#BA7517' : 'var(--muted)', color: isDone ? '#085041' : isActive ? '#fff' : 'var(--muted-foreground)' }}>
                    {isDone ? 'Done' : isActive ? 'Next up' : `Step ${i + 1}`}
                  </span>
                </div>

                {/* Title + sub */}
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', lineHeight: 1.3, color: isDone ? '#085041' : isActive ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{step.title}</div>
                <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', lineHeight: 1.5, flex: 1 }}>{step.sub}</div>

                {/* Action */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 500, marginTop: '12px', color: isDone ? '#1D9E75' : isActive ? '#BA7517' : 'var(--muted-foreground)' }}>
                  {isDone ? <><Check className="w-2.5 h-2.5" /> Completed</> : isActive ? <>Get started <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg></> : 'Locked'}
                </div>

                {/* Bottom bar */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'var(--border)' }}>
                  <div style={{ height: '100%', width: isDone ? '100%' : '0%', background: isDone ? '#1D9E75' : '#BA7517', borderRadius: '0 3px 3px 0', transition: 'width 0.4s' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Dot indicators */}
        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '10px' }}>
          {SLICER_STEPS.map((_, i) => (
            <div key={i} style={{ height: '6px', width: i === data.doneCount ? '18px' : '6px', borderRadius: i === data.doneCount ? '3px' : '50%', background: i < data.doneCount ? '#1D9E75' : i === data.doneCount ? '#BA7517' : 'var(--border)', transition: 'all 0.3s' }} />
          ))}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '20px 0' }}>
        {[
          { label: 'New inspection', sub: 'Start a quality check', iconBg: '#FAEEDA', iconColor: '#BA7517', link: '/inspections/new', icon: <ClipboardCheck className="w-4 h-4" /> },
          { label: 'New project', sub: 'Create production order', iconBg: '#E6F1FB', iconColor: '#185FA5', link: '/projects/new', icon: <FolderKanban className="w-4 h-4" /> },
          { label: 'Add factory', sub: 'Connect manufacturer', iconBg: '#E1F5EE', iconColor: '#1D9E75', link: '/factories/new', icon: <Factory className="w-4 h-4" /> },
        ].map((qa, i) => (
          <div key={i} onClick={() => router.push(qa.link)}
            style={{ background: 'var(--card)', borderRadius: '12px', border: '0.5px solid var(--border)', padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.background = '#FAEEDA' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: qa.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: qa.iconColor, flexShrink: 0 }}>{qa.icon}</div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 500 }}>{qa.label}</div>
              <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginTop: '2px' }}>{qa.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom Two-Column ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Recent activity */}
        <div style={{ background: 'var(--card)', borderRadius: '12px', border: '0.5px solid var(--border)', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500 }}>Recent activity</span>
            <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '6px', background: 'var(--muted)', color: 'var(--muted-foreground)', fontWeight: 500 }}>Today</span>
          </div>
          {data.recentActivity.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1" strokeLinecap="round" style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }}>
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>No activity yet</div>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '3px' }}>Actions will appear here</div>
            </div>
          ) : (
            data.recentActivity.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < data.recentActivity.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ACTIVITY_COLORS[item.category] || '#534AB7', flexShrink: 0 }} />
                <div style={{ fontSize: '12px', flex: 1 }}>{item.title}</div>
                <div style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>
                  {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Setup progress */}
        <div style={{ background: 'var(--card)', borderRadius: '12px', border: '0.5px solid var(--border)', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500 }}>Setup progress</span>
            <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '6px', background: '#FAEEDA', color: '#633806', fontWeight: 500 }}>{data.doneCount} of 6</span>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '5px' }}>
              <span>Overall progress</span>
              <span style={{ color: '#BA7517', fontWeight: 500 }}>{Math.round((data.doneCount / 6) * 100)}%</span>
            </div>
            <div style={{ height: '6px', background: 'var(--muted)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.round((data.doneCount / 6) * 100)}%`, height: '100%', background: '#BA7517', borderRadius: '3px', transition: 'width 0.6s' }} />
            </div>
          </div>

          {/* Step list */}
          {SLICER_STEPS.map((step, i) => {
            const isDone = i < data.doneCount
            const isActive = i === data.doneCount
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '11px' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: isDone ? '#1D9E75' : isActive ? '#BA7517' : 'var(--muted)', border: !isDone && !isActive ? '1.5px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isDone && <Check className="w-2 h-2 text-white" />}
                  {isActive && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                </div>
                <span style={{ color: isDone ? '#085041' : isActive ? '#633806' : 'var(--muted-foreground)', fontWeight: isActive ? 500 : 400 }}>{step.title}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Factory Audit Scores ── */}
      {data.factoryAuditScores && data.factoryAuditScores.length > 0 && (
        <div style={{ background: 'var(--card)', borderRadius: '12px', border: '0.5px solid var(--border)', padding: '16px', marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500 }}>Factory audit scores</span>
            <Link href="/audits/factory" style={{ fontSize: '10px', color: '#BA7517' }}>View all &rarr;</Link>
          </div>
          {data.factoryAuditScores.map(f => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '12px' }}>
              <span style={{ flex: 1 }}>{f.name}</span>
              <span style={{ fontWeight: 500, color: f.result === 'approved' ? '#085041' : f.result === 'conditional' ? '#BA7517' : '#E24B4A' }}>{f.score}%</span>
              <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, background: f.result === 'approved' ? '#E1F5EE' : f.result === 'conditional' ? '#FAEEDA' : '#FCEBEB', color: f.result === 'approved' ? '#085041' : f.result === 'conditional' ? '#633806' : '#791F1F' }}>
                {f.result === 'approved' ? 'Approved' : f.result === 'conditional' ? 'Conditional' : 'Failed'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
