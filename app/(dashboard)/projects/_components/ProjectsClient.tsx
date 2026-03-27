'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, FolderKanban } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProjectCard, type ProjectRow } from './ProjectCard'
import { CreateProjectDialog } from './CreateProjectDialog'
import { ProjectDetailDialog } from './ProjectDetailDialog'
import type { ProjectStatus } from '@/types/database'

type Factory = { id: string; name: string }

const FILTERS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'In Inspection', value: 'inspection' },
  { label: 'Completed', value: 'completed' },
]

interface Props {
  projects: ProjectRow[]
  factories: Factory[]
  canManage: boolean
}

export function ProjectsClient({ projects, factories, canManage }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [detailProject, setDetailProject] = useState<ProjectRow | null>(null)
  const [editProject, setEditProject] = useState<ProjectRow | null>(null)

  const filtered = useMemo(() => {
    let list = projects
    if (filter !== 'all') list = list.filter((p) => p.status === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.product_category ?? '').toLowerCase().includes(q) ||
          (p.factories?.name ?? '').toLowerCase().includes(q) ||
          (p.buyer_brand ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [projects, filter, search])

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} project{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>
        {canManage && (
          <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> New Project
          </Button>
        )}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
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
              <p className="text-xs text-muted-foreground mt-1">
                Create your first project to get started with quality inspections.
              </p>
              {canManage && (
                <Button size="sm" className="mt-4 gap-2" onClick={() => setCreateOpen(true)}>
                  <Plus className="w-4 h-4" /> Create Project
                </Button>
              )}
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground">No matching projects</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try adjusting your search or filter criteria.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              canManage={canManage}
              onView={setDetailProject}
              onEdit={setEditProject}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateProjectDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        factories={factories}
      />
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
