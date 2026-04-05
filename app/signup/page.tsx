'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Check, Building2, Factory, UserCheck, Plus, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/ui/Logo'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/* ─── TYPES ─── */

interface FormData {
  companyName: string
  country: string
  city: string
  email: string
  password: string
  confirmPassword: string
  orgType: 'brand' | 'factory' | 'agency' | null
  jobTitle: string
  invites: Array<{ email: string; role: string }>
}

type FieldErrors = Record<string, string>

const INITIAL_FORM: FormData = {
  companyName: '',
  country: '',
  city: '',
  email: '',
  password: '',
  confirmPassword: '',
  orgType: null,
  jobTitle: '',
  invites: [
    { email: '', role: 'viewer' },
    { email: '', role: 'viewer' },
    { email: '', role: 'viewer' },
  ],
}

const STEP_LABELS = ['Company', 'Your role', 'Invite team', 'Done']

const ROLES = [
  { value: 'brand', label: 'Brand', desc: 'Buyer or product team', icon: Building2, color: '#185FA5', bg: '#E6F1FB' },
  { value: 'factory', label: 'Factory', desc: 'Manufacturer or supplier', icon: Factory, color: '#854F0B', bg: '#FAEEDA' },
  { value: 'agency', label: 'Agency', desc: '3rd party inspector', icon: UserCheck, color: '#0F6E56', bg: '#E1F5EE' },
] as const

const INVITE_ROLES = [
  { value: 'brand_manager', label: 'Brand Manager' },
  { value: 'factory_manager', label: 'Factory Manager' },
  { value: 'inspector', label: 'Inspector' },
  { value: 'viewer', label: 'Viewer' },
]

/* ─── STEPPER ─── */

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1
        const isDone = step < current
        const isActive = step === current
        return (
          <div key={label} className="flex items-center">
            {i > 0 && (
              <div
                className="w-8 sm:w-12 h-[2px] transition-colors"
                style={{ backgroundColor: isDone ? '#1D9E75' : 'hsl(var(--border))' }}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                style={
                  isDone
                    ? { backgroundColor: '#1D9E75', color: '#fff' }
                    : isActive
                      ? { backgroundColor: '#BA7517', color: '#fff' }
                      : { backgroundColor: 'transparent', border: '2px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }
                }
              >
                {isDone ? <Check size={14} /> : step}
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── STEP 1: COMPANY ─── */

function StepCompany({
  data,
  errors,
  onChange,
  onContinue,
}: {
  data: FormData
  errors: FieldErrors
  onChange: (patch: Partial<FormData>) => void
  onContinue: () => void
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-foreground">Set up your company</h2>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Tell us about your organisation to get started.</p>

      <div className="space-y-4">
        <Field label="Company name" error={errors.companyName} required htmlFor="companyName">
          <Input id="companyName" placeholder="e.g. Acme Brands Ltd." value={data.companyName} onChange={e => onChange({ companyName: e.target.value })} required aria-required="true" autoComplete="organization" aria-invalid={!!errors.companyName} aria-describedby={errors.companyName ? 'companyName-error' : undefined} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Country" error={errors.country} required htmlFor="country">
            <Input id="country" placeholder="India" value={data.country} onChange={e => onChange({ country: e.target.value })} required aria-required="true" autoComplete="country-name" aria-invalid={!!errors.country} aria-describedby={errors.country ? 'country-error' : undefined} />
          </Field>
          <Field label="City" error={errors.city} required htmlFor="city">
            <Input id="city" placeholder="Mumbai" value={data.city} onChange={e => onChange({ city: e.target.value })} required aria-required="true" aria-invalid={!!errors.city} aria-describedby={errors.city ? 'city-error' : undefined} />
          </Field>
        </div>

        <Field label="Work email" error={errors.email} required htmlFor="signup-email">
          <Input id="signup-email" type="email" placeholder="you@company.com" value={data.email} onChange={e => onChange({ email: e.target.value })} required aria-required="true" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'signup-email-error' : undefined} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Password" error={errors.password} required htmlFor="signup-password">
            <Input id="signup-password" type="password" placeholder="Min. 8 characters" value={data.password} onChange={e => onChange({ password: e.target.value })} required aria-required="true" autoComplete="new-password" aria-invalid={!!errors.password} aria-describedby={errors.password ? 'signup-password-error' : undefined} />
          </Field>
          <Field label="Confirm password" error={errors.confirmPassword} required htmlFor="confirmPassword">
            <Input id="confirmPassword" type="password" placeholder="Repeat password" value={data.confirmPassword} onChange={e => onChange({ confirmPassword: e.target.value })} required aria-required="true" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined} />
          </Field>
        </div>
      </div>

      <Button className="w-full mt-6 gap-2" style={{ backgroundColor: '#BA7517' }} onClick={onContinue}>
        Continue <ArrowRight size={16} />
      </Button>

      <p className="text-center text-xs text-muted-foreground mt-4">
        Already have an account?{' '}
        <Link href="/login" className="font-medium underline" style={{ color: '#C9A96E' }}>Sign in</Link>
      </p>
    </div>
  )
}

/* ─── STEP 2: ROLE ─── */

function StepRole({
  data,
  errors,
  onChange,
  onContinue,
  onBack,
}: {
  data: FormData
  errors: FieldErrors
  onChange: (patch: Partial<FormData>) => void
  onContinue: () => void
  onBack: () => void
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-foreground">What best describes you?</h2>
      <p className="text-sm text-muted-foreground mt-1 mb-6">We&apos;ll personalise your experience based on your role.</p>

      <div className="grid grid-cols-3 gap-3">
        {ROLES.map(r => {
          const Icon = r.icon
          const selected = data.orgType === r.value
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => onChange({ orgType: r.value })}
              className="rounded-xl p-3 text-center transition-all cursor-pointer"
              style={{
                border: selected ? '1.5px solid #C9A96E' : '1.5px solid hsl(var(--border))',
                backgroundColor: selected ? '#FAEEDA' : 'transparent',
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2"
                style={{ backgroundColor: r.bg }}
              >
                <Icon size={18} style={{ color: r.color }} />
              </div>
              <p className="text-xs font-medium text-foreground">{r.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{r.desc}</p>
            </button>
          )
        })}
      </div>

      {errors.orgType && <p className="text-xs text-destructive mt-2">{errors.orgType}</p>}

      <div className="border-t border-border mt-6 pt-4">
        <Field label="Your job title" error={errors.jobTitle} htmlFor="jobTitle">
          <Input id="jobTitle" placeholder="e.g. Quality Manager" value={data.jobTitle} onChange={e => onChange({ jobTitle: e.target.value })} autoComplete="organization-title" />
        </Field>
      </div>

      <div className="flex gap-3 mt-6">
        <Button variant="outline" className="gap-2" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </Button>
        <Button className="flex-1 gap-2" style={{ backgroundColor: '#BA7517' }} onClick={onContinue}>
          Continue <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}

/* ─── STEP 3: INVITE ─── */

function StepInvite({
  data,
  onChange,
  onSubmit,
  onSkip,
  onBack,
  submitting,
}: {
  data: FormData
  onChange: (patch: Partial<FormData>) => void
  onSubmit: () => void
  onSkip: () => void
  onBack: () => void
  submitting: boolean
}) {
  const updateInvite = (idx: number, patch: Partial<{ email: string; role: string }>) => {
    const next = [...data.invites]
    next[idx] = { ...next[idx], ...patch }
    onChange({ invites: next })
  }

  const addRow = () => {
    onChange({ invites: [...data.invites, { email: '', role: 'viewer' }] })
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground">Invite your team</h2>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Add colleagues to collaborate. You can always do this later.</p>

      <div className="space-y-3">
        {data.invites.map((inv, i) => (
          <div key={i} className="flex gap-2">
            <Input
              className="flex-1 text-[11px]"
              placeholder="colleague@company.com"
              type="email"
              value={inv.email}
              onChange={e => updateInvite(i, { email: e.target.value })}
            />
            <Select value={inv.role} onValueChange={val => updateInvite(i, { role: val })}>
              <SelectTrigger className="w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVITE_ROLES.map(r => (
                  <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {i === data.invites.length - 1 && (
              <Button variant="outline" size="icon" className="shrink-0 w-9 h-9" onClick={addRow} type="button">
                <Plus size={16} />
              </Button>
            )}
            {i !== data.invites.length - 1 && <div className="w-9 shrink-0" />}
          </div>
        ))}
      </div>

      <div className="border-t border-border mt-6 pt-4">
        <p className="text-[11px] text-muted-foreground mb-2">Roles in your plan:</p>
        <div className="flex flex-wrap gap-1.5">
          {INVITE_ROLES.map(r => (
            <span key={r.value} className="text-[10px] font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#FAEEDA', color: '#633806' }}>
              {r.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Button variant="outline" className="gap-2" onClick={onBack} disabled={submitting}>
          <ArrowLeft size={16} /> Back
        </Button>
        <Button className="flex-1 gap-2" style={{ backgroundColor: '#BA7517' }} onClick={onSubmit} disabled={submitting}>
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          {submitting ? 'Creating account…' : 'Send invites & continue'}
        </Button>
      </div>

      <button
        type="button"
        onClick={onSkip}
        disabled={submitting}
        className="w-full mt-3 text-center text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        Skip — <span className="underline" style={{ color: '#C9A96E' }}>set up later</span>
      </button>
    </div>
  )
}

/* ─── STEP 4: SUCCESS ─── */

function StepSuccess() {
  const router = useRouter()

  const NEXT_STEPS = [
    { label: 'Next step', action: 'Add your first factory' },
    { label: 'Then', action: 'Create a project' },
    { label: 'Then', action: 'Start an inspection' },
    { label: 'Always', action: 'View your dashboard' },
  ]

  return (
    <div className="text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#E1F5EE' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-foreground">You&apos;re all set!</h2>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Your 21-day free trial has started. No credit card required.</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {NEXT_STEPS.map(ns => (
          <div key={ns.action} className="rounded-lg bg-muted/50 p-3 text-left">
            <p className="text-[11px] text-muted-foreground">{ns.label}</p>
            <p className="text-xs font-medium text-foreground mt-0.5">{ns.action}</p>
          </div>
        ))}
      </div>

      <Button
        className="w-full gap-2"
        style={{ backgroundColor: '#BA7517' }}
        onClick={() => router.push('/dashboard')}
      >
        Go to dashboard <ArrowRight size={16} />
      </Button>

      <p className="text-[11px] text-muted-foreground mt-4">
        Trial ends in 21 days &middot; No credit card needed
      </p>
    </div>
  )
}

/* ─── FIELD HELPER ─── */

function Field({ label, error, children, required, htmlFor }: { label: string; error?: string; children: React.ReactNode; required?: boolean; htmlFor?: string }) {
  return (
    <div>
      <Label className="text-xs font-medium mb-1.5 block" htmlFor={htmlFor}>
        {label}{required && <> <span aria-hidden="true">*</span><span className="sr-only">required</span></>}
      </Label>
      {children}
      {error && <p id={htmlFor ? `${htmlFor}-error` : undefined} className="text-[11px] text-destructive mt-1" role="alert">{error}</p>}
    </div>
  )
}

/* ─── PAGE ─── */

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const update = (patch: Partial<FormData>) => {
    setData(prev => ({ ...prev, ...patch }))
    // Clear errors for changed fields
    const cleared = { ...errors }
    for (const key of Object.keys(patch)) delete cleared[key]
    setErrors(cleared)
  }

  /* ── STEP 1 VALIDATION ── */
  const validateStep1 = (): boolean => {
    const errs: FieldErrors = {}
    if (!data.companyName.trim()) errs.companyName = 'Company name is required'
    if (!data.country.trim()) errs.country = 'Country is required'
    if (!data.city.trim()) errs.city = 'City is required'
    if (!data.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = 'Enter a valid email address'
    if (!data.password) errs.password = 'Password is required'
    else if (data.password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (!data.confirmPassword) errs.confirmPassword = 'Confirm your password'
    else if (data.password !== data.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  /* ── STEP 2 VALIDATION ── */
  const validateStep2 = (): boolean => {
    if (!data.orgType) {
      setErrors({ orgType: 'Please select your role' })
      return false
    }
    setErrors({})
    return true
  }

  /* ── SUBMIT (Step 3 → 4) ── */
  const handleSubmit = async (skipInvites: boolean) => {
    setSubmitting(true)
    try {
      const invites = skipInvites
        ? []
        : data.invites
            .filter(i => i.email.trim())
            .map(i => ({ email: i.email.trim(), role: i.role }))

      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          companyName: data.companyName,
          country: data.country,
          city: data.city,
          orgType: data.orgType,
          jobTitle: data.jobTitle || undefined,
          invites: invites.length > 0 ? invites : undefined,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setStep(1)
          setErrors({ email: result.error })
          return
        }
        if (res.status === 202) {
          toast.info('Check your email', { description: result.error })
          return
        }
        toast.error('Signup failed', { description: result.error || 'Please try again.' })
        return
      }

      if (result.inviteErrors?.length) {
        toast.warning('Some invites could not be sent', {
          description: `${result.inviteErrors.length} invite(s) failed. You can resend them from settings.`,
        })
      }

      setStep(4)
    } catch {
      toast.error('Something went wrong', { description: 'Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-[480px]">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-1.5">
            <Logo size={36} variant="icon" />
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-foreground">
                Sankalp<span className="text-primary">Hub</span>
              </span>
              <span className="text-[7px] tracking-[3px] uppercase mt-0.5" style={{ color: '#C9A96E' }}>
                Production Intelligence
              </span>
            </div>
          </div>

          {/* Stepper */}
          <Stepper current={step} />

          {/* Step content */}
          {step === 1 && (
            <StepCompany
              data={data}
              errors={errors}
              onChange={update}
              onContinue={() => validateStep1() && setStep(2)}
            />
          )}

          {step === 2 && (
            <StepRole
              data={data}
              errors={errors}
              onChange={update}
              onContinue={() => validateStep2() && setStep(3)}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && (
            <StepInvite
              data={data}
              onChange={update}
              onSubmit={() => handleSubmit(false)}
              onSkip={() => handleSubmit(true)}
              onBack={() => setStep(2)}
              submitting={submitting}
            />
          )}

          {step === 4 && <StepSuccess />}
        </div>
      </div>
    </div>
  )
}
