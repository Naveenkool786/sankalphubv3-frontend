'use client'

import { useState, useMemo } from 'react'
import {
  getAllDefects,
  CATEGORY_LABELS,
  CATEGORY_IDS,
  SEVERITY_CONFIG,
  type Defect,
  type CategoryId,
  type Severity,
} from '@/lib/qc-data'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, AlertCircle, Info, Search, Download, ChevronDown, ChevronUp } from 'lucide-react'

const SEVERITIES: Severity[] = ['CRITICAL', 'MAJOR', 'MINOR', 'COSMETIC']

const severityIcon: Record<Severity, React.ReactNode> = {
  CRITICAL: <AlertTriangle className="w-4 h-4 text-red-600" />,
  MAJOR: <AlertCircle className="w-4 h-4 text-orange-500" />,
  MINOR: <AlertCircle className="w-4 h-4 text-amber-500" />,
  COSMETIC: <Info className="w-4 h-4 text-gray-400" />,
}

function DefectCard({ defect }: { defect: Defect }) {
  const [expanded, setExpanded] = useState(false)
  const config = SEVERITY_CONFIG[defect.severity]

  return (
    <div className={`rounded-lg border p-4 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-0.5 shrink-0">{severityIcon[defect.severity]}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className={`text-xs border ${config.bgColor} ${config.color} ${config.borderColor}`}>
                {config.label}
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">{defect.code}</span>
              {defect.type && <span className="text-xs text-muted-foreground">· {defect.type}</span>}
            </div>
            <p className={`font-semibold text-sm ${config.color}`}>{defect.name}</p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {defect.applies_to?.map(cat => (
                <span key={cat} className="text-xs bg-background/60 border border-border rounded px-1.5 py-0.5 text-muted-foreground">
                  {CATEGORY_LABELS[cat]}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              <span className="font-medium">Action:</span> {defect.corrective_action || config.action}
            </p>
            {expanded && (
              <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
                {defect.description && <p className="text-xs text-muted-foreground">{defect.description}</p>}
                {defect.stage_checks && (
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1">Active at stages:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(defect.stage_checks)
                        .filter(([, check]) => check.active)
                        .map(([stage]) => (
                          <span key={stage} className="text-xs bg-background/70 border border-border rounded px-1.5 py-0.5 text-foreground font-mono">
                            {stage.replace(/_/g, ' ')}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground shrink-0 mt-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

export default function DefectsLibraryPage() {
  const allDefects = useMemo(() => getAllDefects(), [])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    return allDefects.filter(d => {
      const matchesSearch = !search ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.code.toLowerCase().includes(search.toLowerCase()) ||
        d.type?.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || d.applies_to?.includes(categoryFilter as CategoryId)
      const matchesSeverity = severityFilter === 'all' || d.severity === severityFilter
      return matchesSearch && matchesCategory && matchesSeverity
    })
  }, [allDefects, search, categoryFilter, severityFilter])

  const stats = useMemo(() => ({
    total: filtered.length,
    critical: filtered.filter(d => d.severity === 'CRITICAL').length,
    major: filtered.filter(d => d.severity === 'MAJOR').length,
    minor: filtered.filter(d => d.severity === 'MINOR').length,
  }), [filtered])

  const grouped = useMemo(() => {
    const result: Record<Severity, Defect[]> = { CRITICAL: [], MAJOR: [], MINOR: [], COSMETIC: [] }
    filtered.forEach(d => result[d.severity]?.push(d))
    return result
  }, [filtered])

  const handleExport = () => {
    const rows = [
      ['Code', 'Name', 'Severity', 'Type', 'Applies To', 'Action'],
      ...filtered.map(d => [
        d.code, d.name, d.severity, d.type || '',
        d.applies_to?.map(c => CATEGORY_LABELS[c]).join(' | ') || '',
        d.corrective_action || SEVERITY_CONFIG[d.severity].action,
      ])
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sankalphub-defects-library.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" /> Defects Library
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Master defect database — {allDefects.length} defects across 6 categories and 4 severity levels
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 shrink-0">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, code, or type..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORY_IDS.map(id => <SelectItem key={id} value={id}>{CATEGORY_LABELS[id]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="All Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            {SEVERITIES.map(s => <SelectItem key={s} value={s}>{SEVERITY_CONFIG[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground', bg: 'bg-muted/40' },
          { label: 'Critical', value: stats.critical, color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/20' },
          { label: 'Major', value: stats.major, color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/20' },
          { label: 'Minor', value: stats.minor, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-lg p-3 ${stat.bg} border border-border`}>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No defects match your search</p>
        </div>
      ) : (
        <div className="space-y-6">
          {SEVERITIES.map(severity => {
            const group = grouped[severity]
            if (!group?.length) return null
            const config = SEVERITY_CONFIG[severity]
            return (
              <div key={severity}>
                <div className="flex items-center gap-2 mb-3">
                  {severityIcon[severity]}
                  <h3 className={`text-sm font-semibold ${config.color}`}>{config.label} ({group.length})</h3>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-2">
                  {group.map(defect => <DefectCard key={defect.id} defect={defect} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
