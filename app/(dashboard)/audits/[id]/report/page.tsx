import { createAdminClient } from '@/lib/supabase/admin'
import { AuditReportClient } from './_components/AuditReportClient'

export default async function AuditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: audit }, { data: ratings }, { data: sections }] = await Promise.all([
    (supabase.from('factory_audits_v2') as any).select('*, factories(name, city, country), audit_templates(template_name, standard)').eq('id', id).single(),
    (supabase.from('audit_ratings') as any).select('*, audit_template_checkpoints(checkpoint_text)').eq('audit_id', id).order('item_number'),
    (supabase.from('audit_template_sections') as any).select('*').order('section_order'),
  ])

  if (!audit) return <div className="p-6 lg:p-8 text-center text-muted-foreground">Audit not found.</div>

  const templateSections = (sections ?? []).filter((s: any) => s.template_id === audit.template_id)

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <AuditReportClient audit={audit} ratings={(ratings ?? []) as any[]} sections={templateSections as any[]} />
    </div>
  )
}
