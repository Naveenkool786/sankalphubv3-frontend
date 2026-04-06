'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'
import { calculateMatch } from '@/lib/types/purchasing'

function generateNumber(prefix: string): string {
  const date = format(new Date(), 'yyyyMMdd')
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${prefix}-${date}-${random}`
}

// ─── Quotations ───

export async function createQuotation(data: {
  project_id?: string
  supplier_name: string
  supplier_contact?: string
  supplier_email?: string
  factory_id?: string
  currency?: string
  valid_until?: string
  payment_terms?: string
  delivery_terms?: string
  notes?: string
  items?: { description: string; style_number?: string; quantity: number; unit?: string; unit_price: number; notes?: string }[]
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const quotationNumber = generateNumber('QT')

    const totalAmount = (data.items ?? []).reduce((s, i) => s + (i.quantity * i.unit_price), 0)

    const { data: quot, error } = await (supabase.from('quotations') as any).insert({
      project_id: data.project_id || null,
      quotation_number: quotationNumber,
      supplier_name: data.supplier_name,
      supplier_contact: data.supplier_contact || null,
      supplier_email: data.supplier_email || null,
      factory_id: data.factory_id || null,
      status: 'draft',
      currency: data.currency || 'USD',
      total_amount: totalAmount,
      valid_until: data.valid_until || null,
      payment_terms: data.payment_terms || null,
      delivery_terms: data.delivery_terms || null,
      notes: data.notes || null,
      created_by: ctx.userId,
    }).select().single()

    if (error) return { success: false, error: error.message }

    if (data.items && data.items.length > 0) {
      const items = data.items.map(i => ({
        quotation_id: quot.id,
        description: i.description,
        style_number: i.style_number || null,
        quantity: i.quantity,
        unit: i.unit || 'pcs',
        unit_price: i.unit_price,
        notes: i.notes || null,
      }))
      await (supabase.from('quotation_items') as any).insert(items)
    }

    revalidatePath('/purchasing/quotations')
    return { success: true, id: quot.id }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function updateQuotationStatus(id: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const { error } = await (supabase.from('quotations') as any)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/purchasing/quotations')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

// ─── Purchase Orders ───

export async function createPurchaseOrder(data: {
  project_id?: string
  production_order_id?: string
  quotation_id?: string
  supplier_name: string
  factory_id?: string
  currency?: string
  payment_terms?: string
  delivery_terms?: string
  ship_by_date?: string
  delivery_address?: string
  notes?: string
  items?: { description: string; style_number?: string; color?: string; size?: string; quantity: number; unit?: string; unit_price: number; notes?: string }[]
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const poNumber = generateNumber('PO')

    const subtotal = (data.items ?? []).reduce((s, i) => s + (i.quantity * i.unit_price), 0)

    const { data: po, error } = await (supabase.from('purchase_orders') as any).insert({
      project_id: data.project_id || null,
      production_order_id: data.production_order_id || null,
      quotation_id: data.quotation_id || null,
      po_number: poNumber,
      supplier_name: data.supplier_name,
      factory_id: data.factory_id || null,
      status: 'draft',
      currency: data.currency || 'USD',
      subtotal,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: subtotal,
      payment_terms: data.payment_terms || null,
      delivery_terms: data.delivery_terms || null,
      ship_by_date: data.ship_by_date || null,
      delivery_address: data.delivery_address || null,
      notes: data.notes || null,
      created_by: ctx.userId,
    }).select().single()

    if (error) return { success: false, error: error.message }

    if (data.items && data.items.length > 0) {
      const items = data.items.map(i => ({
        purchase_order_id: po.id,
        description: i.description,
        style_number: i.style_number || null,
        color: i.color || null,
        size: i.size || null,
        quantity: i.quantity,
        unit: i.unit || 'pcs',
        unit_price: i.unit_price,
        received_qty: 0,
        notes: i.notes || null,
      }))
      await (supabase.from('po_items') as any).insert(items)
    }

    revalidatePath('/purchasing/orders')
    return { success: true, id: po.id }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function updatePOStatus(id: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const updateData: Record<string, any> = { status, updated_at: new Date().toISOString() }

    if (status === 'approved') {
      updateData.approved_by = ctx.userId
      updateData.approved_at = new Date().toISOString()
    }

    const { error } = await (supabase.from('purchase_orders') as any).update(updateData).eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/purchasing/orders')
    revalidatePath(`/purchasing/orders/${id}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

// ─── Invoices ───

export async function createInvoice(data: {
  purchase_order_id?: string
  invoice_number: string
  supplier_name: string
  currency?: string
  invoice_amount: number
  invoice_date?: string
  due_date?: string
  notes?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()

    // Get PO amount if linked
    let poAmount: number | null = null
    if (data.purchase_order_id) {
      const { data: po } = await (supabase.from('purchase_orders') as any)
        .select('total_amount')
        .eq('id', data.purchase_order_id)
        .single()
      poAmount = po?.total_amount || null
    }

    const { data: invoice, error } = await (supabase.from('invoices') as any).insert({
      purchase_order_id: data.purchase_order_id || null,
      invoice_number: data.invoice_number,
      supplier_name: data.supplier_name,
      status: 'pending',
      currency: data.currency || 'USD',
      invoice_amount: data.invoice_amount,
      invoice_date: data.invoice_date || null,
      due_date: data.due_date || null,
      match_status: 'unmatched',
      po_amount: poAmount,
      notes: data.notes || null,
      created_by: ctx.userId,
    }).select().single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/purchasing/invoices')
    return { success: true, id: invoice.id }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function updateInvoiceMatch(invoiceId: string, data: {
  receipt_amount: number
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()

    const { data: invoice } = await (supabase.from('invoices') as any)
      .select('invoice_amount, po_amount')
      .eq('id', invoiceId)
      .single()

    if (!invoice) return { success: false, error: 'Invoice not found' }

    const poAmt = invoice.po_amount || 0
    const matchStatus = calculateMatch(poAmt, data.receipt_amount, invoice.invoice_amount)
    const variance = invoice.invoice_amount - poAmt

    const { error } = await (supabase.from('invoices') as any).update({
      receipt_amount: data.receipt_amount,
      match_status: matchStatus,
      variance_amount: variance,
      status: matchStatus === 'matched' ? 'matched' : 'pending',
      updated_at: new Date().toISOString(),
    }).eq('id', invoiceId)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/purchasing/invoices/${invoiceId}`)
    revalidatePath('/purchasing/invoices')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function updateInvoiceStatus(invoiceId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const { error } = await (supabase.from('invoices') as any)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', invoiceId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/purchasing/invoices')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}
