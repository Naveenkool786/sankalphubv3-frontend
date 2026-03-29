import { createClient } from '@/lib/supabase/server'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { TemplatesClient, type TemplateRow } from './_components/TemplatesClient'
import type { SectionData } from './actions'
import { PremiumGate } from '@/components/PremiumGate'

export default async function TemplatesPage() {
  return (
    <PremiumGate feature="Templates Builder">
      <TemplatesPageContent />
    </PremiumGate>
  )
}

async function TemplatesPageContent() {
  const ctx = await getUserContext()
  const supabase = await createClient()

  const { data } = await supabase
    .from('inspection_templates')
    .select('id, name, template_type, industry, sections, score_formula, is_archived, created_at')
    .eq('org_id', ctx.orgId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  const templates = ((data ?? []) as any[]).map((t) => ({
    id: t.id as string,
    name: t.name as string,
    template_type: t.template_type as string,
    industry: t.industry as string | null,
    sections: (t.sections ?? []) as SectionData[],
    score_formula: t.score_formula as string | null,
    is_archived: t.is_archived as boolean,
    created_at: t.created_at as string,
  })) as TemplateRow[]

  return (
    <div className="p-6 lg:p-8">
      <TemplatesClient templates={templates} canManage={canManage(ctx.role)} />
    </div>
  )
}
