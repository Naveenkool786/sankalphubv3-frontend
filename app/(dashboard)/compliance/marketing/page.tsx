'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Target, Loader2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { MILESTONE_STAGE_CONFIG, type MarketingMilestone, type MilestoneStage } from '@/lib/types/compliance'
import { createMarketingMilestones, updateMarketingMilestone } from '@/lib/actions/compliance'

export default function MarketingMilestonesPage() {
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [milestones, setMilestones] = useState<MarketingMilestone[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedStage, setExpandedStage] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const ctx = await (await fetch('/api/user/context')).json()
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data } = await (supabase.from('projects') as any).select('id, name').eq('org_id', ctx.orgId).order('name')
      if (data) setProjects(data)
    })()
  }, [])

  useEffect(() => {
    if (!selectedProject) { setMilestones([]); return }
    (async () => {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data } = await (supabase.from('marketing_milestones') as any).select('*').eq('project_id', selectedProject).order('milestone_order')
      setMilestones(data ?? [])
    })()
  }, [selectedProject, loading])

  const handleInit = async () => {
    if (!selectedProject) return
    setLoading(true)
    const result = await createMarketingMilestones(selectedProject)
    setLoading(false)
    if (result.success) toast.success('Milestones created')
    else toast.error('Failed', { description: result.error })
  }

  const handleUpdate = async (m: MarketingMilestone, status: string) => {
    setLoading(true)
    const result = await updateMarketingMilestone(m.id, { status })
    setLoading(false)
    if (result.success) toast.success('Updated')
    else toast.error('Failed', { description: result.error })
  }

  const handleSaveDates = async (m: MarketingMilestone, planned: string, actual: string, assigned: string, notes: string) => {
    setLoading(true)
    const result = await updateMarketingMilestone(m.id, {
      planned_date: planned || undefined,
      actual_date: actual || undefined,
      assigned_to: assigned || undefined,
      notes: notes || undefined,
    })
    setLoading(false)
    if (result.success) toast.success('Saved')
    else toast.error('Failed', { description: result.error })
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Target className="w-5 h-5" style={{ color: '#D4A843' }} /> Marketing Milestones
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Track product go-to-market stages</p>
      </div>

      <div className="flex gap-3 mb-6">
        <select className="h-9 px-3 rounded-lg border border-border bg-background text-sm flex-1 max-w-xs" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
          <option value="">Select project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {selectedProject && milestones.length === 0 && (
          <Button size="sm" className="gap-1.5" onClick={handleInit} disabled={loading} style={{ backgroundColor: '#D4A843' }}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Target className="w-3.5 h-3.5" />} Initialize Milestones
          </Button>
        )}
      </div>

      {milestones.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">{selectedProject ? 'No milestones yet. Click Initialize to create them.' : 'Select a project to view milestones.'}</p>
        </div>
      ) : (
        <>
          {/* Horizontal tracker */}
          <div className="bg-card rounded-xl border border-border p-4 mb-6 overflow-x-auto">
            <div className="flex items-center gap-1 min-w-[700px]">
              {milestones.map((m, i) => {
                const isCompleted = m.status === 'completed'
                const isActive = m.status === 'in_progress'
                const isDelayed = m.status === 'delayed'
                return (
                  <div key={m.id} className="flex items-center flex-1">
                    <button
                      onClick={() => setExpandedStage(expandedStage === m.id ? null : m.id)}
                      className={cn(
                        'flex-1 text-center px-1 py-2 rounded text-[10px] font-medium transition-colors cursor-pointer',
                        isCompleted ? 'bg-green-100 text-green-700' : isActive ? 'bg-[#D4A843]/20 text-[#D4A843] ring-2 ring-[#D4A843]' : isDelayed ? 'bg-red-100 text-red-700' : 'bg-muted/50 text-muted-foreground'
                      )}
                    >
                      {isCompleted && <CheckCircle2 className="w-3 h-3 inline mr-0.5" />}
                      {isActive && <Clock className="w-3 h-3 inline mr-0.5" />}
                      {isDelayed && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}
                      {MILESTONE_STAGE_CONFIG[m.milestone_stage as MilestoneStage]?.label || m.milestone_stage}
                    </button>
                    {i < milestones.length - 1 && <div className={cn('w-3 h-0.5 flex-shrink-0', isCompleted ? 'bg-green-400' : 'bg-border')} />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Expanded stage details */}
          {milestones.map(m => {
            if (expandedStage !== m.id) return null
            const stageCfg = MILESTONE_STAGE_CONFIG[m.milestone_stage as MilestoneStage]
            return (
              <div key={m.id} className="bg-card rounded-xl border border-border p-5 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">{stageCfg?.label || m.milestone_stage}</h3>
                  <div className="flex gap-1">
                    {m.status !== 'completed' && (
                      <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => handleUpdate(m, 'in_progress')}>Start</Button>
                    )}
                    {m.status !== 'completed' && (
                      <Button size="sm" className="text-[10px] h-6 px-2 bg-green-600 hover:bg-green-700" onClick={() => handleUpdate(m, 'completed')}>Complete</Button>
                    )}
                    {m.status !== 'delayed' && m.status !== 'completed' && (
                      <Button size="sm" variant="outline" className="text-[10px] h-6 px-2 text-red-600" onClick={() => handleUpdate(m, 'delayed')}>Delay</Button>
                    )}
                  </div>
                </div>
                {m.deliverables && <p className="text-xs text-muted-foreground mb-3 bg-muted/30 rounded p-2">{m.deliverables}</p>}
                <MilestoneEditForm milestone={m} onSave={handleSaveDates} />
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

function MilestoneEditForm({ milestone, onSave }: { milestone: MarketingMilestone; onSave: (m: MarketingMilestone, planned: string, actual: string, assigned: string, notes: string) => void }) {
  const [planned, setPlanned] = useState(milestone.planned_date || '')
  const [actual, setActual] = useState(milestone.actual_date || '')
  const [assigned, setAssigned] = useState(milestone.assigned_to || '')
  const [notes, setNotes] = useState(milestone.notes || '')

  return (
    <div className="grid grid-cols-4 gap-3">
      <div><label className="text-[10px] text-muted-foreground">Planned Date</label><Input type="date" className="h-8 text-xs" value={planned} onChange={e => setPlanned(e.target.value)} /></div>
      <div><label className="text-[10px] text-muted-foreground">Actual Date</label><Input type="date" className="h-8 text-xs" value={actual} onChange={e => setActual(e.target.value)} /></div>
      <div><label className="text-[10px] text-muted-foreground">Assigned To</label><Input className="h-8 text-xs" value={assigned} onChange={e => setAssigned(e.target.value)} /></div>
      <div className="flex items-end">
        <Button size="sm" variant="outline" className="text-xs h-8 w-full" onClick={() => onSave(milestone, planned, actual, assigned, notes)}>Save</Button>
      </div>
    </div>
  )
}
