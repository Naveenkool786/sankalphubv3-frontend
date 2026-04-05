'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { Building2, Factory, UserCheck, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Logo } from '@/components/ui/Logo'
import { NavThemeToggle } from '@/components/ui/NavThemeToggle'
import { cn } from '@/lib/utils'

type Role = 'factory' | 'brand' | 'agency'

const ROLES = [
  {
    id: 'factory' as Role,
    icon: Factory,
    title: 'Factory / Manufacturer',
    sub: 'Garments · Gloves · Footwear · Headwear · Accessories',
    color: 'bg-[#C9A96E]',
    border: 'border-[#C9A96E]/40',
    ring: 'ring-[#C9A96E]/30',
  },
  {
    id: 'brand' as Role,
    icon: Building2,
    title: 'Brand / Buyer',
    sub: 'Fashion brands, retailers, importers',
    color: 'bg-blue-600',
    border: 'border-blue-500/40',
    ring: 'ring-blue-500/30',
  },
  {
    id: 'agency' as Role,
    icon: UserCheck,
    title: 'Inspector / Agency',
    sub: 'Third-party QC agencies and freelance inspectors',
    color: 'bg-emerald-600',
    border: 'border-emerald-500/40',
    ring: 'ring-emerald-500/30',
  },
]

const FACTORY_CATEGORIES = ['Garments', 'Gloves', 'Footwear', 'Headwear', 'Accessories']

function DemoForm() {
  const searchParams = useSearchParams()
  const preRole = searchParams.get('role') as Role | null

  const [step, setStep] = useState<1 | 2>(preRole ? 2 : 1)
  const [selectedRole, setSelectedRole] = useState<Role | null>(preRole)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // form fields
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('')
  const [productFocus, setProductFocus] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [clientCount, setClientCount] = useState('')
  const [message, setMessage] = useState('')
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    if (preRole) {
      setSelectedRole(preRole)
      setStep(2)
    }
  }, [preRole])

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRole) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          full_name: fullName,
          company_name: companyName,
          email,
          phone: phone || null,
          message: message || null,
          metadata: {
            country: country || null,
            product_focus: productFocus || null,
            team_size: teamSize || null,
            client_count: clientCount || null,
            categories: categories.length > 0 ? categories : null,
          },
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Something went wrong. Please try again.')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const roleConfig = ROLES.find((r) => r.id === selectedRole)

  /* ── SUCCESS ── */
  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Request received!</h2>
        <p className="text-muted-foreground mb-1">
          Thanks, <span className="font-medium text-foreground">{fullName}</span>. We'll be in touch within 24 hours.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Confirmation sent to <span className="font-medium text-foreground">{email}</span>.
        </p>
        <Link href="/">
          <Button variant="secondary">Back to Home</Button>
        </Link>
      </div>
    )
  }

  /* ── STEP 1: Role Selection ── */
  if (step === 1) {
    return (
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">What best describes you?</h2>
        <p className="text-sm text-muted-foreground mb-6">We'll tailor the demo to your specific workflow.</p>
        <div className="space-y-3">
          {ROLES.map((r) => {
            const Icon = r.icon
            const isSelected = selectedRole === r.id
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all',
                  isSelected
                    ? `${r.border} ${r.ring} ring-2 bg-card`
                    : 'border-border hover:border-muted-foreground/40 bg-card'
                )}
              >
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', r.color)}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.sub}</p>
                </div>
              </button>
            )
          })}
        </div>
        <Button
          className="w-full mt-6 gap-2"
          disabled={!selectedRole}
          onClick={() => setStep(2)}
        >
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  /* ── STEP 2: Role-specific form ── */
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Role badge */}
      {roleConfig && (
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => { setStep(1); setError(null) }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground">
            {roleConfig.title}
          </span>
        </div>
      )}

      <h2 className="text-xl font-bold text-foreground mb-4">Tell us about yourself</h2>

      {/* Common fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Smith" required aria-required="true" autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="companyName">
            {selectedRole === 'factory' ? 'Factory Name' : selectedRole === 'agency' ? 'Agency Name' : 'Brand / Company Name'} *
          </Label>
          <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
            placeholder={selectedRole === 'factory' ? 'ABC Garments Ltd.' : selectedRole === 'agency' ? 'QC Global Agency' : 'Fashion Brand Co.'}
            required aria-required="true" autoComplete="organization" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">Work Email *</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com" required aria-required="true" autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210" autoComplete="tel" />
        </div>
      </div>

      {/* Factory-specific */}
      {selectedRole === 'factory' && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="country">Country / Region</Label>
            <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)}
              placeholder="India, Bangladesh, Vietnam..." />
          </div>
          <div className="space-y-2">
            <Label>Product Categories</Label>
            <div className="flex flex-wrap gap-2">
              {FACTORY_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    categories.includes(cat)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-muted-foreground/60'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Brand-specific */}
      {selectedRole === 'brand' && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="productFocus">Product Focus</Label>
            <Input id="productFocus" value={productFocus} onChange={(e) => setProductFocus(e.target.value)}
              placeholder="e.g. Sportswear, Luxury handbags, Footwear..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="teamSize">Team Size (optional)</Label>
            <Input id="teamSize" value={teamSize} onChange={(e) => setTeamSize(e.target.value)}
              placeholder="e.g. 1–10, 10–50, 50+" />
          </div>
        </>
      )}

      {/* Agency-specific */}
      {selectedRole === 'agency' && (
        <div className="space-y-1.5">
          <Label htmlFor="clientCount">Number of Active Clients (optional)</Label>
          <Input id="clientCount" value={clientCount} onChange={(e) => setClientCount(e.target.value)}
            placeholder="e.g. 5, 10–20, 50+" />
        </div>
      )}

      {/* Message — all roles */}
      <div className="space-y-1.5">
        <Label htmlFor="message">Message (optional)</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your business and what you need"
          className="min-h-[80px]"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" className="w-full gap-2" disabled={loading}>
        {loading ? 'Submitting...' : 'Request My Demo'}
        {!loading && <ArrowRight className="w-4 h-4" />}
      </Button>

      <p className="text-[11px] text-muted-foreground text-center">
        We'll reach out within 24 hours. No spam, ever.
      </p>
    </form>
  )
}

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left — branding panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'radial-gradient(ellipse at 30% 40%, #0D1420 0%, #060810 100%)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 70% 60%, rgba(201,169,110,0.08) 0%, transparent 60%)' }} />

        {/* Logo */}
        <Link href="/" className="relative z-10">
          <Logo size={36} variant="full" className="[&>span]:text-[#EDE0C8]" />
        </Link>

        {/* Content */}
        <div className="relative z-10">
          <p className="text-[10px] tracking-widest uppercase mb-4" style={{ color: '#C9A96E' }}>
            Founding Member Program
          </p>
          <h2 className="text-3xl font-bold leading-tight mb-4" style={{ color: '#EDE0C8' }}>
            Join the first 50 partners building the future of manufacturing.
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: '#4A4030' }}>
            Lifetime pricing · Genesis badge · Direct roadmap influence · White-glove onboarding
          </p>

          <div className="space-y-3">
            {['Garments & Apparel', 'Footwear & Technical Molds', 'Gloves, Headwear & Accessories'].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#C9A96E' }} />
                <span className="text-sm" style={{ color: '#888068' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] relative z-10" style={{ color: '#2A2218' }}>
          © {new Date().getFullYear()} SankalpHub. Production Intelligence Platform.
        </p>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute top-4 right-4 z-10">
          <NavThemeToggle />
        </div>
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <Logo size={28} variant="full" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Request a Demo</h1>
            <p className="text-sm text-muted-foreground mt-1">We'll be in touch within 24 hours.</p>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-2xl font-bold text-foreground">Request a Demo</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tell us about your business and we'll tailor a walkthrough for you.
            </p>
          </div>

          <Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
            <DemoForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
