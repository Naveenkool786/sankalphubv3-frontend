import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createAdminClient()

    const factoryData: any = {
      org_id: body.org_id,
      name: body.name,
      code: body.code || null,
      country: body.country || null,
      city: body.city || null,
      contact_name: body.contact_name || null,
      contact_email: body.contact_email || null,
      contact_phone: body.contact_phone || null,
      website: body.website || null,
      notes: body.notes || null,
      status: body.status || 'active',
      photo_url: body.photo_url || null,
      total_lines: body.total_lines || null,
      max_capacity: body.max_capacity || null,
      categories: body.categories || null,
      certifications: body.certifications || null,
      aql_default: body.aql_default || null,
      inspection_preference: body.inspection_preference || null,
      created_by: body.created_by,
    }

    let data: any = null
    let error: any = null

    if (body.id) {
      // Update existing factory (draft or final)
      const res = await (supabase.from('factories') as any)
        .update(factoryData)
        .eq('id', body.id)
        .select()
        .single()
      data = res.data
      error = res.error
    } else {
      // Insert new factory
      const res = await (supabase.from('factories') as any)
        .insert(factoryData)
        .select()
        .single()
      data = res.data
      error = res.error
    }

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('Factory save error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
