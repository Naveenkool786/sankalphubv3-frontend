import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { ProjectsClient } from './_components/ProjectsClient'
import type { ProjectStatus } from '@/types/database'

type ProjectRow = {
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

type FactoryRow = { id: string; name: string }

export default async function ProjectsPage() {
  const ctx = await getUserContext()

  // Use service role client to bypass RLS
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const admin = serviceKey
    ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
    : null
  const supabase = admin ?? await createClient()

  const [projectsRes, factoriesRes] = await Promise.all([
    (supabase.from('projects') as any)
      .select(`
        id, name, po_number, buyer_brand, product_category, product_description,
        quantity, unit, deadline, status, country, notes, created_by, created_at,
        factory_id, assigned_inspector_id,
        factories(name),
        inspector:profiles!assigned_inspector_id(full_name)
      `)
      .eq('org_id', ctx.orgId)
      .order('created_at', { ascending: false }),
    (supabase.from('factories') as any)
      .select('id, name')
      .eq('org_id', ctx.orgId)
      .eq('is_active', true)
      .order('name'),
  ])

  const projects = (projectsRes.data ?? []) as ProjectRow[]
  const factories = (factoriesRes.data ?? []) as FactoryRow[]

  return (
    <div className="p-6 lg:p-8">
      <ProjectsClient
        projects={projects}
        factories={factories}
        canManage={canManage(ctx.role)}
      />
    </div>
  )
}
