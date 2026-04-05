'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FolderKanban, ClipboardCheck, Factory, TrendingUp, TrendingDown, Minus, Check, Plus, Shield } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

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
  inspectionTrend: number
  lastMonthInspections: number
  doneCount: number
  hasFactory: boolean
  hasProject: boolean
  hasTemplate: boolean
  hasInspection: boolean
  hasTeamMember: boolean
  recentActivity: { title: string; detail: string; category: string; link: string | null; createdAt: string }[]
  factoryAuditScores?: { id: string; name: string; score: number; result: string }[]
  inspectionTrendChart: { date: string; pass: number; fail: number }[]
  defectsByCategory: { category: string; count: number }[]
}

/* ─── CONSTANTS ─── */

const ACTIVITY_COLORS: Record<string, string> = {
  brand: '#378ADD', factory: '#BA7517', inspection_pass: '#1D9E75',
  inspection_fail: '#E24B4A', system: '#534AB7',
}

const SLICER_STEPS = [
  { title: 'Create account', sub: 'Organisation set up \u00B7 Role selected', link: '/settings', iconPath: 'user' },
  { title: 'Add your first factory', sub: 'Connect your manufacturing partner', link: '/factories/new', iconPath: 'factory' },
  { title: 'Create first project', sub: 'Season, styles and deadlines', link: '/projects/new', iconPath: 'project' },
  { title: 'Inspection template', sub: 'Garments \u00B7 Footwear \u00B7 Gloves \u00B7 Headwear', link: '/settings/templates', iconPath: 'template' },
  { title: 'Run first inspection', sub: 'AQL \u00B7 Defect logging \u00B7 PDF report', link: '/inspections/new', iconPath: 'check' },
  { title: 'Invite your team', sub: 'Brand Manager \u00B7 Inspector \u00B7 Factory Manager', link: '/settings/users', iconPath: 'team' },
]

/* ─── STEP ICON HELPER ─── */

const STEP_ICONS: Record<string, string> = {
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  factory: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  project: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>',
  template: '<path d="M14 2H6a2 2 0 0 0-2 2v16h16V8z"/><polyline points="14 2 14 8 20 8"/>',
  check: '<path d="M9 11l3 3L22 4"/>',
  team: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
}

function getStepIcon(iconPath: string, color: string) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round"
      dangerouslySetInnerHTML={{ __html: STEP_ICONS[iconPath] || '' }} />
  )
}

/* ─── SLICER CARD STYLE ─── */

function getCardStyle(index: number, doneCount: number): React.CSSProperties {
  const base: React.CSSProperties = {
    borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--card)',
    padding: '16px', cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    position: 'relative', overflow: 'hidden',
    display: 'flex', flexDirection: 'column', flexShrink: 0,
  }
  if (index < doneCount) return {
    ...base, width: '130px', minHeight: '180px',
    opacity: 0.42, background: '#E1F5EE', border: '1px solid #9FE1CB',
    transform: 'scale(0.95)', filter: 'saturate(0.5)',
  }
  if (index === doneCount) return {
    ...base, width: '200px', minHeight: '230px',
    opacity: 1, border: '2px solid #BA7517', background: 'var(--card)',
    transform: 'scale(1.05) translateY(-14px)', filter: 'none',
    boxShadow: '0 12px 32px rgba(186, 117, 23, 0.18)', zIndex: 10,
  }
  const dist = index - doneCount
  const upcomingMap = [
    null,
    { width: '150px', minHeight: '200px', opacity: 0.70, transform: 'scale(0.97) translateY(-2px)', filter: 'saturate(0.8)' },
    { width: '140px', minHeight: '190px', opacity: 0.50, transform: 'scale(0.95) translateY(0)', filter: 'saturate(0.55)' },
    { width: '130px', minHeight: '180px', opacity: 0.35, transform: 'scale(0.93) translateY(2px)', filter: 'saturate(0.35)' },
    { width: '120px', minHeight: '170px', opacity: 0.22, transform: 'scale(0.91) translateY(4px)', filter: 'saturate(0.2)' },
    { width: '110px', minHeight: '160px', opacity: 0.14, transform: 'scale(0.89) translateY(6px)', filter: 'saturate(0.1)' },
  ]
  const d = Math.min(dist, 5)
  return { ...base, ...(upcomingMap[d] as any) }
}

/* ─── TREND ARROW ─── */

function TrendArrow({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Minus className="w-3 h-3" /> No change</span>
  const pct = previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0
  if (pct > 0) return <span className="text-[10px] text-emerald-600 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> +{pct}%</span>
  if (pct < 0) return <span className="text-[10px] text-red-500 flex items-center gap-0.5"><TrendingDown className="w-3 h-3" /> {pct}%</span>
  return <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Minus className="w-3 h-3" /> No change</span>
}

/* ─── COMPONENT ─── */

export function DashboardClient({ data }: { data: DashboardData }) {
  const router = useRouter()

  const isAdmin = data.role === 'super_admin' || data.role === 'brand_manager'
  const isFactoryManager = data.role === 'factory_manager'
  const isInspector = data.role === 'inspector'
  const isViewer = data.role === 'viewer'

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

  const passRateColor = data.passRate === null ? 'var(--muted-foreground)' : data.passRate >= 90 ? '#16a34a' : data.passRate >= 70 ? '#d97706' : '#dc2626'

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-5">
        <h1 className="text-[22px] font-medium mb-0.5">{greeting}, {data.firstName}</h1>
        <p className="text-[13px] text-muted-foreground">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} &middot; SankalpHub &middot; {roleLabel}
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Inspections (this month)', value: data.inspectionTrend, sub: <TrendArrow current={data.inspectionTrend} previous={data.lastMonthInspections} />, icon: <ClipboardCheck className="w-4 h-4" />, iconColor: '#1D9E75', iconBg: '#E1F5EE', link: '/inspections', valueColor: undefined },
          { label: 'Pass rate', value: data.passRate !== null ? `${data.passRate}%` : '\u2014', sub: <span className="text-[10px] text-muted-foreground">{data.totalInspections > 0 ? `${data.passed}/${data.totalInspections} passed` : 'No data yet'}</span>, icon: <TrendingUp className="w-4 h-4" />, iconColor: '#534AB7', iconBg: '#EEEDFE', link: '/analytics', valueColor: passRateColor },
          { label: 'Active projects', value: data.projectCount, sub: <span className="text-[10px] text-muted-foreground">{data.projectCount ? `${data.projectCount} running` : 'No projects yet'}</span>, icon: <FolderKanban className="w-4 h-4" />, iconColor: '#BA7517', iconBg: '#FAEEDA', link: '/projects', valueColor: undefined },
          { label: 'Factory compliance', value: data.factoryAuditScores && data.factoryAuditScores.length > 0 ? `${Math.round(data.factoryAuditScores.reduce((s, f) => s + f.score, 0) / data.factoryAuditScores.length)}%` : '\u2014', sub: <span className="text-[10px] text-muted-foreground">{data.factoryCount} {data.factoryCount === 1 ? 'factory' : 'factories'}</span>, icon: <Shield className="w-4 h-4" />, iconColor: '#378ADD', iconBg: '#E6F1FB', link: '/factories', valueColor: undefined },
        ].map((kpi, i) => (
          <div key={i} onClick={() => router.push(kpi.link)}
            className="bg-card rounded-[14px] border border-border p-5 cursor-pointer text-center transition-all hover:-translate-y-0.5 hover:border-primary/40">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mx-auto mb-3" style={{ background: kpi.iconBg, color: kpi.iconColor }}>{kpi.icon}</div>
            <div className="text-[32px] font-medium leading-none mb-1.5" style={{ color: kpi.valueColor || 'var(--foreground)' }}>{kpi.value}</div>
            <div className="text-xs text-muted-foreground font-medium mb-1">{kpi.label}</div>
            <div>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Slicer Cards (hide for viewers) ── */}
      {!isViewer && data.doneCount < 6 && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">Get started &mdash; complete each step to unlock the next</span>
            <span className="text-[11px] text-muted-foreground">{data.doneCount} of 6 complete</span>
          </div>
          <div className="bg-muted rounded-[20px] border border-border p-5 pt-7 pb-4 overflow-visible">
            <div className="flex gap-2.5 items-end justify-center overflow-visible pb-1">
              {SLICER_STEPS.map((step, i) => {
                const isDone = i < data.doneCount
                const isActive = i === data.doneCount
                const isPending = i > data.doneCount
                const iconColor = isDone ? '#1D9E75' : isActive ? '#BA7517' : 'var(--muted-foreground)'
                const iconBg = isDone ? '#E1F5EE' : isActive ? '#FAEEDA' : 'var(--background)'
                return (
                  <div key={i} style={getCardStyle(i, data.doneCount)} onClick={() => !isPending && router.push(step.link)}>
                    <div className="flex items-start justify-between mb-3.5">
                      <div className="rounded-[10px] flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ width: isActive ? '42px' : '34px', height: isActive ? '42px' : '34px', background: iconBg }}>
                        {isDone ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5"><path d="M9 11l3 3L22 4"/></svg> : getStepIcon(step.iconPath, iconColor)}
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-[10px] font-medium"
                        style={{ background: isDone ? '#E1F5EE' : isActive ? '#BA7517' : 'var(--background)', color: isDone ? '#085041' : isActive ? '#fff' : 'var(--muted-foreground)' }}>
                        {isDone ? 'Done' : isActive ? 'Next up' : `Step ${i + 1}`}
                      </span>
                    </div>
                    <div className="font-medium leading-tight mb-1" style={{ fontSize: isActive ? '14px' : '12px', color: isDone ? '#085041' : isActive ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{step.title}</div>
                    <div className="text-muted-foreground leading-relaxed flex-1" style={{ fontSize: isActive ? '11px' : '10px' }}>{step.sub}</div>
                    <div className="flex items-center gap-1 font-medium mt-3.5" style={{ fontSize: isActive ? '12px' : '10px', color: isDone ? '#1D9E75' : isActive ? '#BA7517' : 'var(--muted-foreground)' }}>
                      {isDone ? <><Check className="w-2.5 h-2.5" /> Completed</> : isActive ? <>Get started <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg></> : 'Locked'}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-[3px]">
                      <div className="h-full transition-all duration-500" style={{ width: isDone ? '100%' : '0%', background: isDone ? '#1D9E75' : '#BA7517' }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-1.5 justify-center mt-3.5">
              {SLICER_STEPS.map((_, i) => (
                <div key={i} className="rounded-full transition-all duration-300"
                  style={{ height: '5px', width: i === data.doneCount ? '20px' : '5px', borderRadius: i === data.doneCount ? '3px' : '50%', background: i < data.doneCount ? '#1D9E75' : i === data.doneCount ? '#BA7517' : 'var(--border)' }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Actions (hide for viewers) ── */}
      {!isViewer && (
        <div className="grid grid-cols-3 gap-2.5 my-5">
          {[
            ...(isAdmin || isInspector ? [{ label: 'New inspection', sub: 'Start a quality check', iconBg: '#FAEEDA', iconColor: '#BA7517', link: '/inspections/new', icon: <ClipboardCheck className="w-4 h-4" /> }] : []),
            ...(isAdmin ? [{ label: 'New project', sub: 'Create production order', iconBg: '#E6F1FB', iconColor: '#185FA5', link: '/projects/new', icon: <FolderKanban className="w-4 h-4" /> }] : []),
            ...(!isInspector ? [{ label: 'Add factory', sub: 'Connect manufacturer', iconBg: '#E1F5EE', iconColor: '#1D9E75', link: '/factories/new', icon: <Factory className="w-4 h-4" /> }] : []),
          ].map((qa, i) => (
            <div key={i} onClick={() => router.push(qa.link)}
              className="bg-card rounded-xl border border-border p-3.5 cursor-pointer flex items-center gap-3 transition-all hover:border-primary/40 hover:bg-primary/5">
              <div className="w-9 h-9 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: qa.iconBg, color: qa.iconColor }}>{qa.icon}</div>
              <div>
                <div className="text-xs font-medium">{qa.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{qa.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Charts (admin + factory manager) ── */}
      {(isAdmin || isFactoryManager) && (
        <div className="grid md:grid-cols-2 gap-3 mb-3">
          {/* Inspection Trend */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium">Inspection trend (30 days)</span>
              <span className="text-[9px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">Pass vs Fail</span>
            </div>
            {data.inspectionTrendChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data.inspectionTrendChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)' }} />
                  <Line type="monotone" dataKey="pass" stroke="#16a34a" strokeWidth={2} dot={false} name="Pass" />
                  <Line type="monotone" dataKey="fail" stroke="#dc2626" strokeWidth={2} dot={false} name="Fail" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-xs text-muted-foreground">No inspection data yet</div>
            )}
          </div>

          {/* Defect Distribution */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium">Defect distribution</span>
              <span className="text-[9px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">By category</span>
            </div>
            {data.defectsByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.defectsByCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                  <YAxis dataKey="category" type="category" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" width={80} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)' }} />
                  <Bar dataKey="count" fill="#BA7517" radius={[0, 4, 4, 0]} name="Defects" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-xs text-muted-foreground">No defect data yet</div>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom Two-Column ── */}
      <div className="grid md:grid-cols-2 gap-3">
        {/* Recent activity */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-xs font-medium">Recent activity</span>
            <span className="text-[9px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">Today</span>
          </div>
          {data.recentActivity.length === 0 ? (
            <div className="text-center py-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1" strokeLinecap="round" className="mx-auto mb-2 opacity-30">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <div className="text-xs text-muted-foreground">No activity yet</div>
              <div className="text-[11px] text-muted-foreground mt-1">Actions will appear here</div>
            </div>
          ) : (
            data.recentActivity.map((item, i) => (
              <div key={i}
                className={`flex items-center gap-2.5 py-2 ${item.link ? 'cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded-md' : ''} ${i < data.recentActivity.length - 1 ? 'border-b border-border' : ''}`}
                onClick={() => item.link && router.push(item.link)}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ACTIVITY_COLORS[item.category] || '#534AB7' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate">{item.title}</div>
                  {item.detail && <div className="text-[10px] text-muted-foreground truncate">{item.detail}</div>}
                </div>
                <div className="text-[10px] text-muted-foreground flex-shrink-0">
                  {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Factory Audit Scores (horizontal bar) */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-xs font-medium">Factory audit scores</span>
            {data.factoryAuditScores && data.factoryAuditScores.length > 0 && (
              <Link href="/factories" className="text-[10px] text-primary hover:underline">View all &rarr;</Link>
            )}
          </div>
          {data.factoryAuditScores && data.factoryAuditScores.length > 0 ? (
            <div className="space-y-2">
              {data.factoryAuditScores.map(f => (
                <div key={f.id} className="flex items-center gap-2 text-xs">
                  <span className="flex-1 truncate">{f.name}</span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${f.score}%`,
                      background: f.score >= 85 ? '#16a34a' : f.score >= 70 ? '#d97706' : '#dc2626',
                    }} />
                  </div>
                  <span className="font-medium w-10 text-right" style={{ color: f.score >= 85 ? '#16a34a' : f.score >= 70 ? '#d97706' : '#dc2626' }}>{f.score}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="text-xs text-muted-foreground">No audit data yet</div>
              <div className="text-[11px] text-muted-foreground mt-1">Factory audits will appear here</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
