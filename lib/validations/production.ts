import { z } from 'zod'

export const productionOrderSchema = z.object({
  order_number: z.string().min(1, 'Order number is required'),
  style_number: z.string().optional(),
  style_name: z.string().optional(),
  category: z.enum(['woven', 'knits', 'denim', 'outerwear', 'accessories']),
  project_id: z.string().min(1, 'Project is required'),
  factory_id: z.string().optional(),
  buyer_brand: z.string().optional(),
  season: z.string().optional(),
  total_quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit: z.string().default('pcs'),
  planned_start_date: z.string().min(1, 'Start date is required'),
  planned_end_date: z.string().min(1, 'End date is required'),
  ex_factory_date: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  notes: z.string().optional(),
})

export type ProductionOrderFormData = z.infer<typeof productionOrderSchema>

export const dailyLogSchema = z.object({
  log_date: z.string().min(1, 'Date is required'),
  milestone_name: z.string().optional(),
  planned_qty: z.number().min(0),
  actual_qty: z.number().min(0),
  defect_qty: z.number().min(0).default(0),
  rework_qty: z.number().min(0).default(0),
  operator_count: z.number().min(0).optional(),
  machine_count: z.number().min(0).optional(),
  remarks: z.string().optional(),
})

export type DailyLogFormData = z.infer<typeof dailyLogSchema>

export const delaySchema = z.object({
  milestone_name: z.string().optional(),
  delay_type: z.enum(['fabric_delay', 'trim_delay', 'machine_breakdown', 'labor_shortage', 'quality_issue', 'approval_pending', 'power_outage', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  delay_days: z.number().min(1, 'Delay must be at least 1 day'),
  description: z.string().min(1, 'Description is required'),
})

export type DelayFormData = z.infer<typeof delaySchema>
