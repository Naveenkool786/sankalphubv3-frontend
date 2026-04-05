import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { InspectionsClient } from './_components/InspectionsClient'
import type { InspectionStatus, InspectionResult, InspectionType } from '@/types/database'

type InspectionRow = {
  id: string
  inspection_no: string
  inspection_type: InspectionType
  status: InspectionStatus
  result: InspectionResult
  inspection_date: string
  auditor_name: string | null
  quantity_inspected: number
  sample_size: number
  score: number | null
  critical_defects: number
  major_defects: number
  minor_defects: number
  aql_level: string
  remarks: string | null
  template_name: string | null
  project_id: string | null
  factory_id: string | null
  created_at: string
  projects: { name: string } | null
  factories: { name: string } | null
}

type ProjectOption = {
  id: string
  name: string
  factory_id: string | null
  factories: { name: string } | null
}

type TemplateOption = {
  id: string
  name: string
  industry: string | null
}

export default async function InspectionsPage() {
  const ctx = await getUserContext()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabase = serviceKey
    ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
    : await createClient()

  const [inspRes, projectsRes, templatesRes] = await Promise.all([
    supabase
      .from('inspections')
      .select(`
        id, inspection_no, inspection_type, status, result,
        inspection_date, auditor_name, aql_level, quantity_inspected, sample_size,
        score, critical_defects, major_defects, minor_defects,
        remarks, template_name, project_id, factory_id, created_at,
        projects(name),
        factories(name)
      `)
      .eq('org_id', ctx.orgId)
      .order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select('id, name, factory_id, factories(name)')
      .eq('org_id', ctx.orgId)
      .order('name'),
    supabase
      .from('inspection_templates')
      .select('id, name, industry')
      .eq('org_id', ctx.orgId)
      .eq('is_archived', false)
      .order('name'),
  ])

  const inspections = (inspRes.data ?? []) as unknown as InspectionRow[]
  const projects = (projectsRes.data ?? []) as unknown as ProjectOption[]
  const templates = (templatesRes.data ?? []) as unknown as TemplateOption[]

  return (
    <div className="p-6 lg:p-8">
      <InspectionsClient
        inspections={inspections}
        projects={projects}
        templates={templates}
        canManage={canManage(ctx.role)}
      />
    </div>
  )
}
