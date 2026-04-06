'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, CheckCircle2, AlertTriangle, BarChart3, FileText, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { format, differenceInDays, addDays } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { cn } from '@/lib/utils'
import { STATUS_CONFIG, PRIORITY_CONFIG, type ProductionOrder, type ProductionMilestone, type ProductionDailyLog, type ProductionDelay } from '@/lib/types/production'
import { updateMilestoneStatus, addDailyLog, reportDelay, updateProductionOrderStatus } from '@/lib/actions/production'

interface Props {
  order: ProductionOrder
  milestones: ProductionMilestone[]
  logs: ProductionDailyLog[]
  delays: ProductionDelay[]
  canManage: boolean
}

export function ProductionDetailClient({ order, milestones, logs, delays, canManage }: Props) {
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.planning
  const priorityCfg = PRIORITY_CONFIG[order.priority] || PRIORITY_CONFIG.normal
  const isDelayed = order.ex_factory_date && new Date(order.ex_factory_date) < new Date() && order.status !== 'shipped' && order.status !== 'cancelled'
  const delayDays = isDelayed ? differenceInDays(new Date(), new Date(order.ex_factory_date!)) : 0
  const completedMilestones = milestones.filter(m => m.status === 'completed').length
  const totalProduced = logs.reduce((s, l) => s + l.actual_qty, 0)
  const totalPlanned = logs.reduce((s, l) => s + l.planned_qty, 0)
  const overallEfficiency = totalPlanned > 0 ? Math.round((totalProduced / totalPlanned) * 100) : 0

  // Daily log form state
  const [logForm, setLogForm] = useState({ log_date: format(new Date(), 'yyyy-MM-dd'), milestone_name: '', planned_qty: '', actual_qty: '', defect_qty: '0', remarks: '' })
  const [savingLog, setSavingLog] = useState(false)

  // Delay form state
  const [delayForm, setDelayForm] = useState({ milestone_name: '', delay_type: 'other', severity: 'medium', delay_days: '', description: '' })
  const [savingDelay, setSavingDelay] = useState(false)

  const handleAddLog = async () => {
    if (!logForm.actual_qty) { toast.error('Enter actual quantity'); return }
    setSavingLog(true)
    const result = await addDailyLog(order.id, {
      log_date: logForm.log_date,
      milestone_name: logForm.milestone_name || undefined,
      planned_qty: parseInt(logForm.planned_qty) || 0,
      actual_qty: parseInt(logForm.actual_qty) || 0,
      defect_qty: parseInt(logForm.defect_qty) || 0,
      remarks: logForm.remarks || undefined,
    })
    setSavingLog(false)
    if (result.success) {
      toast.success('Daily log saved')
      setLogForm(f => ({ ...f, planned_qty: '', actual_qty: '', defect_qty: '0', remarks: '' }))
    } else {
      toast.error('Failed to save log', { description: result.error })
    }
  }

  const handleReportDelay = async () => {
    if (!delayForm.description || !delayForm.delay_days) { toast.error('Fill in delay details'); return }
    setSavingDelay(true)
    const result = await reportDelay(order.id, {
      milestone_name: delayForm.milestone_name || undefined,
      delay_type: delayForm.delay_type,
      severity: delayForm.severity,
      delay_days: parseInt(delayForm.delay_days),
      description: delayForm.description,
    })
    setSavingDelay(false)
    if (result.success) {
      toast.success('Delay reported')
      setDelayForm({ milestone_name: '', delay_type: 'other', severity: 'medium', delay_days: '', description: '' })
    } else {
      toast.error('Failed to report delay', { description: result.error })
    }
  }

  const handleMilestoneComplete = async (m: ProductionMilestone) => {
    const result = await updateMilestoneStatus(m.id, {
      status: 'completed',
      actual_end: format(new Date(), 'yyyy-MM-dd'),
      completion_percentage: 100,
    })
    if (result.success) toast.success(`Milestone "${m.milestone_name}" completed`)
    else toast.error('Failed to update milestone', { description: result.error })
  }

  const handleMilestoneStart = async (m: ProductionMilestone) => {
    const result = await updateMilestoneStatus(m.id, {
      status: 'in_progress',
      actual_start: format(new Date(), 'yyyy-MM-dd'),
    })
    if (result.success) toast.success(`Started "${m.milestone_name}"`)
    else toast.error('Failed to update', { description: result.error })
  }

  // Chart data
  const chartData = logs.map(l => ({
    date: format(new Date(l.log_date), 'dd MMM'),
    planned: l.planned_qty,
    actual: l.actual_qty,
    cumulative: l.cumulative_qty,
  }))

  const selCls = 'w-full h-9 px-3 rounded-lg border border-border bg-background text-sm'
  const inpCls = 'h-9 text-sm'

  return (
    <div>
      {/* Back + Header */}
      <Link href="/production" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Production
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">{order.order_number}</h1>
            <Badge style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</Badge>
            {order.priority !== 'normal' && <Badge style={{ backgroundColor: priorityCfg.bg, color: priorityCfg.color }}>{priorityCfg.label}</Badge>}
            {isDelayed && <Badge className="bg-red-500/10 text-red-600">{delayDays}d behind</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {[order.style_name, order.factories?.name, order.category, order.season].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">{order.total_quantity.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{order.unit}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{completedMilestones}/{milestones.length}</p>
          <p className="text-[10px] text-muted-foreground">Milestones</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{totalProduced.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Produced</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: overallEfficiency >= 90 ? '#2E7D32' : overallEfficiency >= 70 ? '#D4A843' : '#CC0000' }}>{overallEfficiency}%</p>
          <p className="text-[10px] text-muted-foreground">Efficiency</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: delays.length > 0 ? '#CC0000' : '#2E7D32' }}>{delays.filter(d => !d.resolved_at).length}</p>
          <p className="text-[10px] text-muted-foreground">Open Delays</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timeline">
        <TabsList className="bg-muted/50 mb-4">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="daily-log">Daily Log</TabsTrigger>
          <TabsTrigger value="delays">Delays</TabsTrigger>
        </TabsList>

        {/* Timeline Tab — Gantt */}
        <TabsContent value="timeline">
          <div className="bg-card rounded-xl border border-border p-5 overflow-x-auto">
            <h3 className="text-sm font-semibold mb-4">Production Timeline</h3>
            {milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No milestones yet</p>
            ) : (
              <div className="space-y-2 min-w-[600px]">
                {milestones.map(m => {
                  const orderStart = order.planned_start_date ? new Date(order.planned_start_date) : new Date()
                  const orderEnd = order.planned_end_date ? new Date(order.planned_end_date) : addDays(orderStart, 90)
                  const totalDays = Math.max(1, differenceInDays(orderEnd, orderStart))
                  const mStart = m.planned_start ? new Date(m.planned_start) : orderStart
                  const mEnd = m.planned_end ? new Date(m.planned_end) : mStart
                  const leftPct = Math.max(0, (differenceInDays(mStart, orderStart) / totalDays) * 100)
                  const widthPct = Math.max(2, (differenceInDays(mEnd, mStart) / totalDays) * 100)
                  const isComplete = m.status === 'completed'
                  const isActive = m.status === 'in_progress'
                  const isMDelayed = m.delay_days > 0

                  return (
                    <div key={m.id} className="flex items-center gap-3">
                      <span className="text-[11px] text-muted-foreground w-[140px] flex-shrink-0 truncate">{m.milestone_name}</span>
                      <div className="flex-1 h-6 bg-muted/30 rounded relative">
                        <div
                          className="absolute top-0 h-full rounded transition-all"
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            backgroundColor: isComplete ? '#2E7D32' : isMDelayed ? '#CC0000' : isActive ? '#D4A843' : 'rgba(212,168,67,0.3)',
                          }}
                        />
                        {/* Today marker */}
                        {(() => {
                          const todayPct = (differenceInDays(new Date(), orderStart) / totalDays) * 100
                          if (todayPct >= 0 && todayPct <= 100) {
                            return <div className="absolute top-0 h-full w-px bg-red-500" style={{ left: `${todayPct}%` }} />
                          }
                          return null
                        })()}
                      </div>
                      <span className="text-[10px] w-[50px] flex-shrink-0 text-right" style={{
                        color: isComplete ? '#2E7D32' : isMDelayed ? '#CC0000' : '#666'
                      }}>
                        {m.completion_percentage}%
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold mb-4">Milestone Tracker</h3>
            <div className="space-y-3">
              {milestones.map((m, i) => {
                const isComplete = m.status === 'completed'
                const isActive = m.status === 'in_progress'
                const isMDelayed = m.status === 'delayed' || m.delay_days > 0

                return (
                  <div key={m.id} className={cn('flex items-start gap-3 p-3 rounded-lg border', isComplete ? 'border-green-200 bg-green-50/50 dark:border-green-900/40 dark:bg-green-950/10' : isActive ? 'border-[#D4A843]/30 bg-amber-50/50 dark:bg-amber-950/10' : 'border-border')}>
                    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
                      isComplete ? 'bg-green-600 text-white' : isActive ? 'bg-[#D4A843] text-white' : isMDelayed ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'
                    )}>
                      {isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : m.milestone_order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{m.milestone_name}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        {m.planned_start && <span>Plan: {format(new Date(m.planned_start), 'dd MMM')} → {m.planned_end ? format(new Date(m.planned_end), 'dd MMM') : '—'}</span>}
                        {m.actual_start && <span>Actual: {format(new Date(m.actual_start), 'dd MMM')}{m.actual_end ? ` → ${format(new Date(m.actual_end), 'dd MMM')}` : ''}</span>}
                        {m.delay_days > 0 && <span className="text-red-500">{m.delay_days}d delayed</span>}
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 bg-muted rounded-full mt-2 w-full max-w-[200px]">
                        <div className="h-full rounded-full transition-all" style={{ width: `${m.completion_percentage}%`, backgroundColor: isComplete ? '#2E7D32' : '#D4A843' }} />
                      </div>
                    </div>
                    {canManage && !isComplete && (
                      <div className="flex-shrink-0">
                        {!isActive ? (
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleMilestoneStart(m)}>Start</Button>
                        ) : (
                          <Button size="sm" className="text-xs h-7" style={{ backgroundColor: '#2E7D32' }} onClick={() => handleMilestoneComplete(m)}>Complete</Button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>

        {/* Daily Log Tab */}
        <TabsContent value="daily-log">
          <div className="space-y-4">
            {/* Chart */}
            {chartData.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold mb-3">Production Progress</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)' }} />
                    <Line type="monotone" dataKey="planned" stroke="#999" strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Planned" />
                    <Line type="monotone" dataKey="actual" stroke="#D4A843" strokeWidth={2} dot={false} name="Actual" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Log entries */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold mb-3">Daily Logs</h3>
              {logs.length > 0 ? (
                <div className="divide-y divide-border">
                  {logs.map(l => (
                    <div key={l.id} className="flex items-center justify-between py-2.5 text-xs">
                      <div>
                        <span className="font-medium text-foreground">{format(new Date(l.log_date), 'dd MMM yyyy')}</span>
                        {l.milestone_name && <span className="text-muted-foreground ml-2">· {l.milestone_name}</span>}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">Plan: {l.planned_qty}</span>
                        <span className="font-medium">Actual: {l.actual_qty}</span>
                        <span style={{ color: (l.efficiency_percentage ?? 0) >= 90 ? '#2E7D32' : (l.efficiency_percentage ?? 0) >= 70 ? '#D4A843' : '#CC0000' }}>
                          {l.efficiency_percentage}%
                        </span>
                        {l.defect_qty > 0 && <span className="text-red-500">{l.defect_qty} defects</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No logs yet</p>
              )}
            </div>

            {/* Add log form */}
            {canManage && (
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold mb-3">Add Today&apos;s Log</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><label className="text-[10px] text-muted-foreground">Date</label><input type="date" className={selCls} value={logForm.log_date} onChange={e => setLogForm(f => ({ ...f, log_date: e.target.value }))} /></div>
                  <div><label className="text-[10px] text-muted-foreground">Planned Qty</label><input type="number" className={selCls} value={logForm.planned_qty} onChange={e => setLogForm(f => ({ ...f, planned_qty: e.target.value }))} placeholder="0" /></div>
                  <div><label className="text-[10px] text-muted-foreground">Actual Qty</label><input type="number" className={selCls} value={logForm.actual_qty} onChange={e => setLogForm(f => ({ ...f, actual_qty: e.target.value }))} placeholder="0" /></div>
                  <div><label className="text-[10px] text-muted-foreground">Defects</label><input type="number" className={selCls} value={logForm.defect_qty} onChange={e => setLogForm(f => ({ ...f, defect_qty: e.target.value }))} placeholder="0" /></div>
                </div>
                <Button className="mt-3 gap-1.5" size="sm" onClick={handleAddLog} disabled={savingLog}>
                  {savingLog ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Save Log
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Delays Tab */}
        <TabsContent value="delays">
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold mb-3">Reported Delays</h3>
              {delays.length > 0 ? (
                <div className="space-y-2">
                  {delays.map(d => (
                    <div key={d.id} className={cn('p-3 rounded-lg border', d.resolved_at ? 'border-green-200 bg-green-50/50 dark:border-green-900/40' : 'border-red-200 bg-red-50/50 dark:border-red-900/40')}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5" style={{ color: d.severity === 'critical' ? '#CC0000' : d.severity === 'high' ? '#E65100' : '#D4A843' }} />
                          <span className="text-sm font-medium text-foreground">{d.delay_type.replace(/_/g, ' ')}</span>
                          <Badge className="text-[9px]" variant="secondary">{d.severity}</Badge>
                          <Badge className="text-[9px] bg-red-500/10 text-red-600">{d.delay_days}d</Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(d.created_at), 'dd MMM yyyy')}</span>
                      </div>
                      {d.description && <p className="text-xs text-muted-foreground mt-1.5">{d.description}</p>}
                      {d.resolution && <p className="text-xs text-green-600 mt-1">Resolution: {d.resolution}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No delays reported</p>
              )}
            </div>

            {/* Report delay form */}
            {canManage && (
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold mb-3">Report Delay</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Delay Type</label>
                    <select className={selCls} value={delayForm.delay_type} onChange={e => setDelayForm(f => ({ ...f, delay_type: e.target.value }))}>
                      {['fabric_delay', 'trim_delay', 'machine_breakdown', 'labor_shortage', 'quality_issue', 'approval_pending', 'power_outage', 'other'].map(t => (
                        <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Severity</label>
                    <select className={selCls} value={delayForm.severity} onChange={e => setDelayForm(f => ({ ...f, severity: e.target.value }))}>
                      {['low', 'medium', 'high', 'critical'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Delay Days</label>
                    <input type="number" className={selCls} value={delayForm.delay_days} onChange={e => setDelayForm(f => ({ ...f, delay_days: e.target.value }))} placeholder="0" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Milestone</label>
                    <select className={selCls} value={delayForm.milestone_name} onChange={e => setDelayForm(f => ({ ...f, milestone_name: e.target.value }))}>
                      <option value="">General</option>
                      {milestones.map(m => <option key={m.id} value={m.milestone_name}>{m.milestone_name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-[10px] text-muted-foreground">Description</label>
                  <textarea className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm min-h-[60px] resize-vertical" value={delayForm.description} onChange={e => setDelayForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the delay..." />
                </div>
                <Button className="mt-3 gap-1.5" size="sm" variant="destructive" onClick={handleReportDelay} disabled={savingDelay}>
                  {savingDelay ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  Report Delay
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
