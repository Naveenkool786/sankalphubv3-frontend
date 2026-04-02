'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, FolderKanban } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ProjectCard, type ProjectRow } from './ProjectCard'
import { ProjectDetailDialog } from './ProjectDetailDialog'
import { exportProjectPDF } from '@/lib/export/projectPdf'
import { exportProjectExcel } from '@/lib/export/projectExcel'
import { deleteProject } from '../actions'
import type { ProjectStatus } from '@/types/database'

type Factory = { id: string; name: string }

const FILTERS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'In Production', value: 'in_production' },
  { label: 'In Inspection', value: 'in_inspection' },
  { label: 'Completed', value: 'completed' },
  { label: 'Delayed', value: 'delayed' },
]

interface Props {
  projects: ProjectRow[]
  factories: Factory[]
  canManage: boolean
  orgId?: string
}

export function ProjectsClient({ projects, factories, canManage, orgId }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all')
  const [detailProject, setDetailProject] = useState<ProjectRow | null>(null)
  const [editProject, setEditProject] = useState<ProjectRow | null>(null)

  const filtered = useMemo(() => {
    let list = projects
    if (filter !== 'all') list = list.filter(p => p.status === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.product_category ?? '').toLowerCase().includes(q) ||
        (p.factories?.name ?? '').toLowerCase().includes(q) ||
        (p.buyer_brand ?? '').toLowerCase().includes(q) ||
        (p.po_number ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [projects, filter, search])

  // Stats
  const drafts = projects.filter(p => p.status === 'draft').length
  const inProduction = projects.filter(p => p.status === 'in_production' || p.status === 'active').length

  // Image upload handler
  const handleImageUpload = (projectId: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
      try {
        const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const path = `${orgId || 'uploads'}/${projectId}/${Date.now()}-cover.jpg`
        const { data } = await supabase.storage.from('project-images').upload(path, file, { upsert: true })
        if (data) {
          const url = supabase.storage.from('project-images').getPublicUrl(data.path).data.publicUrl
          await (supabase.from('projects') as any).update({ product_image_url: url }).eq('id', projectId)
          router.refresh()
          toast.success('Image uploaded')
        }
      } catch { toast.error('Failed to upload image') }
    }
    input.click()
  }

  const handleExportPdf = (project: ProjectRow) => {
    exportProjectPDF({
      name: project.name,
      product_category: project.product_category,
      factory_name: project.factories?.name,
      po_number: project.po_number,
      quantity: project.quantity,
      unit: project.unit,
      country: project.country,
      buyer_brand: project.buyer_brand,
      status: project.status,
      priority: (project as any).priority,
      expected_delivery: (project as any).expected_delivery || project.deadline,
      sizes: (project as any).sizes,
      notes: project.notes,
    })
  }

  const handleExportExcel = (project: ProjectRow) => {
    exportProjectExcel({
      name: project.name,
      product_category: project.product_category,
      factory_name: project.factories?.name,
      po_number: project.po_number,
      quantity: project.quantity,
      unit: project.unit,
      country: project.country,
      buyer_brand: project.buyer_brand,
      status: project.status,
      priority: (project as any).priority,
      expected_delivery: (project as any).expected_delivery || project.deadline,
      sizes: (project as any).sizes,
      notes: project.notes,
    })
  }

  const handleDelete = async (project: ProjectRow) => {
    if (!confirm(`Delete "${project.name}"?`)) return
    try {
      await deleteProject(project.id)
      toast.success('Project deleted')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete')
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
            {inProduction > 0 && <> &middot; {inProduction} in production</>}
            {drafts > 0 && <> &middot; {drafts} draft{drafts !== 1 ? 's' : ''}</>}
          </p>
        </div>
        {canManage && (
          <Button size="sm" className="gap-2" onClick={() => router.push('/projects/new')}>
            <Plus className="w-4 h-4" /> New Project
          </Button>
        )}
      </div>

      {/* Search + Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map(f => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              size="sm"
              className={cn('text-xs', filter !== f.value && 'text-muted-foreground')}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderKanban className="w-10 h-10 text-muted-foreground/40 mb-3" />
          {projects.length === 0 ? (
            <>
              <p className="text-sm font-medium text-foreground">No projects yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create your first project to get started.</p>
              {canManage && (
                <Button size="sm" className="mt-4 gap-2" onClick={() => router.push('/projects/new')}>
                  <Plus className="w-4 h-4" /> Create Project
                </Button>
              )}
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground">No matching projects</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filter criteria.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              canManage={canManage}
              onView={setDetailProject}
              onEdit={setEditProject}
              onDelete={handleDelete}
              onImageUpload={handleImageUpload}
              onExportPdf={handleExportPdf}
              onExportExcel={handleExportExcel}
            />
          ))}
        </div>
      )}

      {/* Detail dialog (kept for viewing/editing) */}
      <ProjectDetailDialog
        project={detailProject ?? editProject}
        open={!!(detailProject || editProject)}
        onClose={() => { setDetailProject(null); setEditProject(null) }}
        canManage={canManage}
        factories={factories}
      />
    </>
  )
}
