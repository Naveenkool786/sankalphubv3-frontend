'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { revalidatePath } from 'next/cache'
import { trackEvent } from '@/lib/activity-tracker'

export type FieldType = 'text' | 'number' | 'dropdown' | 'yes_no' | 'image' | 'textarea' | 'scale'

export type FieldData = {
  id: string
  label: string
  type: FieldType
  required: boolean
  options: string[]
  scorable: boolean
  weight: number
  placeholder: string
}

export type SectionData = {
  id: string
  title: string
  fields: FieldData[]
}

export async function createTemplate(data: {
  name: string
  template_type: string
  industry: string
}) {
  const ctx = await getUserContext()
  if (!canManage(ctx.role)) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  const { error } = await supabase.from('inspection_templates').insert({
    org_id: ctx.orgId,
    name: data.name,
    template_type: data.template_type,
    industry: data.industry || null,
    sections: [],
    score_formula: null,
    is_archived: false,
    created_by: ctx.userId,
  } as any)

  if (error) throw new Error(error.message)
  trackEvent({ userId: ctx.userId, organizationId: ctx.orgId, actionType: 'template_create', category: 'templates', actionLabel: 'Created template', detail: `${data.name} · ${data.template_type} · ${data.industry || 'General'}` })
  revalidatePath('/templates')
}

export async function updateTemplate(
  templateId: string,
  data: {
    name: string
    score_formula: string
    sections: SectionData[]
  }
) {
  const ctx = await getUserContext()
  if (!canManage(ctx.role)) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  const { error } = await (supabase.from('inspection_templates') as any)
    .update({
      name: data.name,
      score_formula: data.score_formula || null,
      sections: data.sections,
    })
    .eq('id', templateId)
    .eq('org_id', ctx.orgId)

  if (error) throw new Error(error.message)
  revalidatePath('/templates')
}

export async function duplicateTemplate(templateId: string) {
  const ctx = await getUserContext()
  if (!canManage(ctx.role)) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  const { data: source, error: fetchErr } = await supabase
    .from('inspection_templates')
    .select('name, template_type, industry, sections, score_formula')
    .eq('id', templateId)
    .eq('org_id', ctx.orgId)
    .single()

  if (fetchErr || !source) throw new Error('Template not found')

  const { error } = await supabase.from('inspection_templates').insert({
    org_id: ctx.orgId,
    name: `Copy of ${(source as any).name}`,
    template_type: (source as any).template_type,
    industry: (source as any).industry,
    sections: (source as any).sections,
    score_formula: (source as any).score_formula,
    is_archived: false,
    created_by: ctx.userId,
  } as any)

  if (error) throw new Error(error.message)
  revalidatePath('/templates')
}

export async function archiveTemplate(templateId: string) {
  const ctx = await getUserContext()
  if (!canManage(ctx.role)) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  const { error } = await (supabase.from('inspection_templates') as any)
    .update({ is_archived: true })
    .eq('id', templateId)
    .eq('org_id', ctx.orgId)

  if (error) throw new Error(error.message)
  trackEvent({ userId: ctx.userId, organizationId: ctx.orgId, actionType: 'delete', category: 'templates', actionLabel: 'Archived template', detail: templateId })
  revalidatePath('/templates')
}
