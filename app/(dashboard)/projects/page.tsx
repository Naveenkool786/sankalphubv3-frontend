import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { ProjectsClient } from './_components/ProjectsClient'

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
        product_image_url, quantity, unit, deadline, status, priority, season,
        expected_delivery, country, notes, created_by, created_at,
        factory_id, assigned_inspector_id, sizes,
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

  const projects = (projectsRes.data ?? []) as any[]
  const factories = (factoriesRes.data ?? []) as { id: string; name: string }[]

  return (
    <div className="p-6 lg:p-8">
      <ProjectsClient
        projects={projects}
        factories={factories}
        canManage={canManage(ctx.role)}
        orgId={ctx.orgId}
      />
    </div>
  )
}
