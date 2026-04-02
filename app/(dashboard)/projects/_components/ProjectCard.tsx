'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Calendar, MoreHorizontal, Camera, Download, FileSpreadsheet, Trash2 } from 'lucide-react'
import type { ProjectStatus } from '@/types/database'

export const STATUS_CONFIG: Record<string, { label: string; color: string; borderColor: string; progressColor: string; progressPct: number }> = {
  draft:          { label: 'Draft',          color: 'bg-gray-100 text-gray-600',   borderColor: '#888780', progressColor: '#888780', progressPct: 0 },
  active:         { label: 'Active',         color: 'bg-blue-100 text-blue-700',   borderColor: '#378ADD', progressColor: '#378ADD', progressPct: 30 },
  confirmed:      { label: 'Confirmed',      color: 'bg-green-100 text-green-700', borderColor: '#1D9E75', progressColor: '#1D9E75', progressPct: 10 },
  in_production:  { label: 'In Production',  color: 'bg-blue-100 text-blue-700',   borderColor: '#378ADD', progressColor: '#378ADD', progressPct: 50 },
  inspection:     { label: 'In Inspection',  color: 'bg-amber-100 text-amber-700', borderColor: '#C9A96E', progressColor: '#C9A96E', progressPct: 80 },
  in_inspection:  { label: 'In Inspection',  color: 'bg-amber-100 text-amber-700', borderColor: '#C9A96E', progressColor: '#C9A96E', progressPct: 80 },
  completed:      { label: 'Completed',      color: 'bg-green-100 text-green-700', borderColor: '#1D9E75', progressColor: '#1D9E75', progressPct: 100 },
  delayed:        { label: 'Delayed',        color: 'bg-red-100 text-red-600',     borderColor: '#E24B4A', progressColor: '#E24B4A', progressPct: 60 },
  cancelled:      { label: 'Cancelled',      color: 'bg-gray-100 text-gray-500',   borderColor: '#888780', progressColor: '#888780', progressPct: 0 },
}

export type ProjectRow = {
  id: string
  name: string
  po_number: string | null
  buyer_brand: string | null
  product_category: string | null
  product_description: string | null
  product_image_url?: string | null
  quantity: number | null
  unit: string | null
  deadline: string | null
  expected_delivery?: string | null
  status: ProjectStatus
  priority?: string | null
  country: string | null
  notes: string | null
  created_by: string
  created_at: string
  factory_id: string | null
  assigned_inspector_id: string | null
  factories: { name: string } | null
  inspector: { full_name: string } | null
}

interface Props {
  project: ProjectRow
  canManage: boolean
  onView: (project: ProjectRow) => void
  onEdit: (project: ProjectRow) => void
  onDelete?: (project: ProjectRow) => void
  onImageUpload?: (projectId: string) => void
  onExportPdf?: (project: ProjectRow) => void
  onExportExcel?: (project: ProjectRow) => void
}

export function ProjectCard({ project, canManage, onView, onEdit, onDelete, onImageUpload, onExportPdf, onExportExcel }: Props) {
  const sc = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft
  const dueDate = project.expected_delivery || project.deadline
  const isOverdue = dueDate && new Date(dueDate) < new Date() && project.status !== 'completed' && project.status !== 'cancelled'

  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
      style={{ borderLeft: `3px solid ${sc.borderColor}` }}
      onClick={() => onView(project)}
    >
      {/* ── Image Area (130px) ── */}
      <div style={{ position: 'relative', height: '130px', overflow: 'hidden' }}>
        {project.product_image_url ? (
          <>
            <img src={project.product_image_url} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <button
                onClick={e => { e.stopPropagation(); onImageUpload?.(project.id) }}
                style={{ fontSize: '10px', padding: '4px 12px', borderRadius: '6px', background: '#fff', color: '#111', border: 'none', cursor: 'pointer' }}
              >
                Change image
              </button>
            </div>
          </>
        ) : (
          <div
            style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--muted)' }}
            onClick={e => { e.stopPropagation(); onImageUpload?.(project.id) }}
          >
            <Camera className="w-6 h-6" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
            <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>Click to upload image</span>
          </div>
        )}
        {/* Status badge on image */}
        <Badge className={`absolute top-2 left-2 text-[9px] px-1.5 py-0 border-0 ${sc.color}`}>
          {sc.label}
        </Badge>
        {/* Menu */}
        {canManage && (
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black/80 rounded-full" onClick={e => e.stopPropagation()}>
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onView(project) }}>View project</DropdownMenuItem>
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit(project) }}>Edit project</DropdownMenuItem>
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onImageUpload?.(project.id) }}>
                  {project.product_image_url ? 'Change image' : 'Upload image'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onExportPdf?.(project) }}>
                  <Download className="w-3 h-3 mr-2" /> Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onExportExcel?.(project) }}>
                  <FileSpreadsheet className="w-3 h-3 mr-2" /> Export Excel
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); onDelete?.(project) }}>
                  <Trash2 className="w-3 h-3 mr-2" /> Delete project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* ── Card Body ── */}
      <div className="p-3.5">
        <p className="text-[13px] font-medium text-foreground truncate mb-1.5">{project.name}</p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1 mb-2">
          {project.priority && (
            <span style={{
              fontSize: '9px', padding: '1px 6px', borderRadius: '4px', fontWeight: 600,
              background: project.priority === 'high' ? '#FCEBEB' : project.priority === 'medium' ? '#FAEEDA' : 'var(--muted)',
              color: project.priority === 'high' ? '#791F1F' : project.priority === 'medium' ? '#633806' : 'var(--muted-foreground)',
            }}>
              {project.priority}
            </span>
          )}
          {project.product_category && (
            <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
              {project.product_category}
            </span>
          )}
          {project.po_number && (
            <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
              {project.po_number}
            </span>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
          <span>Progress</span>
          <span>{sc.progressPct}%</span>
        </div>
        <div style={{ height: '3px', borderRadius: '2px', background: 'var(--muted)', marginBottom: '10px' }}>
          <div style={{ height: '100%', width: `${sc.progressPct}%`, borderRadius: '2px', background: sc.progressColor, transition: 'width 0.3s' }} />
        </div>

        {/* Factory + Quantity */}
        <div className="text-[11px] text-muted-foreground truncate">
          {project.factories?.name && <span>{project.factories.name}</span>}
          {project.factories?.name && project.quantity && <span> &middot; </span>}
          {project.quantity && <span>{project.quantity.toLocaleString()} {project.unit || 'pcs'}</span>}
        </div>

        {/* Due date */}
        {dueDate && (
          <div className="flex items-center gap-1 mt-1.5 text-[11px]" style={{ color: isOverdue ? '#E24B4A' : 'var(--muted-foreground)', fontWeight: isOverdue ? 500 : 400 }}>
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {isOverdue && ' \u2014 Late'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
