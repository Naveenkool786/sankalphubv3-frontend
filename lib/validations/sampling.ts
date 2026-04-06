import { z } from 'zod'

export const sampleRequestSchema = z.object({
  project_id: z.string().min(1, 'Project is required'),
  production_order_id: z.string().optional(),
  style_number: z.string().optional(),
  style_name: z.string().optional(),
  category: z.string().optional(),
  sample_type: z.enum(['proto', 'fit', 'size_set', 'pp', 'top_of_production', 'shipment']),
  factory_id: z.string().optional(),
  buyer_brand: z.string().optional(),
  required_date: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  size_range: z.string().optional(),
  color: z.string().optional(),
  fabric_details: z.string().optional(),
  special_instructions: z.string().optional(),
})

export type SampleRequestFormData = z.infer<typeof sampleRequestSchema>
