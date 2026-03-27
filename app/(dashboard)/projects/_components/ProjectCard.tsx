'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MapPin, Package, Calendar, MoreHorizontal, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProjectStatus } from '@/types/database'

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; cls: string }> = {
  draft:      { label: 'Draft',         cls: 'bg-gray-100 text-gray-600' },
  active:     { label: 'Active',        cls: 'bg-blue-100 text-blue-700' },
  inspection: { label: 'In Inspection', cls: 'bg-amber-100 text-amber-700' },
  completed:  { label: 'Completed',     cls: 'bg-green-100 text-green-700' },
  cancelled:  { label: 'Cancelled',     cls: 'bg-red-100 text-red-600' },
}

export type ProjectRow = {
  id: string
  name: string
  po_number: string | null
  buyer_brand: string | null
  product_category: string | null
  product_description: string | null
  quantity: number | null
  unit: string | null
  deadline: string | null
  status: ProjectStatus
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
}

export function ProjectCard({ project, canManage, onView, onEdit }: Props) {
  const sc = PROJECT_STATUS_CONFIG[project.status]

  return (
    <div
      className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onView(project)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {project.name}
          </p>
          {project.buyer_brand && (
            <p className="text-xs text-muted-foreground truncate">{project.buyer_brand}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Badge className={cn('text-[10px] px-1.5 py-0 border-0', sc.cls)}>
            {sc.label}
          </Badge>
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(project) }}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(project) }}>
                  Edit Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="space-y-1 mt-3">
        {project.factories?.name && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{project.factories.name}</span>
          </div>
        )}
        {project.product_category && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Package className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{project.product_category}</span>
          </div>
        )}
        {project.quantity !== null && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Package className="w-3 h-3 flex-shrink-0" />
            <span>{project.quantity.toLocaleString()} {project.unit ?? 'units'}</span>
          </div>
        )}
        {project.deadline && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span>{new Date(project.deadline).toLocaleDateString()}</span>
          </div>
        )}
        {project.inspector?.full_name && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
            <User className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{project.inspector.full_name}</span>
          </div>
        )}
      </div>
    </div>
  )
}
