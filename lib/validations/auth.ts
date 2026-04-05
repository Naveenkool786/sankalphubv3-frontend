import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const magicLinkSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})

export type MagicLinkFormData = z.infer<typeof magicLinkSchema>

export const recoverySchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})

export type RecoveryFormData = z.infer<typeof recoverySchema>
