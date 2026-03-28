'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Factory, UserCheck, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/Logo'
import { NavThemeToggle } from '@/components/ui/NavThemeToggle'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type OrgType = 'factory' | 'brand' | 'agency'

const ROLES = [
  {
    id: 'factory' as OrgType,
    icon: Factory,
    title: 'Factory / Manufacturer',
    sub: 'Garments · Gloves · Footwear · Headwear · Accessories',
    color: 'bg-[#C9A96E]',
    border: 'border-[#C9A96E]/40',
    ring: 'ring-[#C9A96E]/30',
  },
  {
    id: 'brand' as OrgType,
    icon: Building2,
    title: 'Brand / Buyer',
    sub: 'Fashion brands, retailers, importers',
    color: 'bg-blue-600',
    border: 'border-blue-500/40',
    ring: 'ring-blue-500/30',
  },
  {
    id: 'agency' as OrgType,
    icon: UserCheck,
    title: 'Inspector / Agency',
    sub: 'Third-party QC agencies and freelance inspectors',
    color: 'bg-emerald-600',
    border: 'border-emerald-500/40',
    ring: 'ring-emerald-500/30',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<OrgType | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleContinue() {
    if (!selected) return
    setLoading(true)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_type: selected }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Something went wrong.')
      }

      router.push('/dashboard')
    } catch (err) {
      toast.error('Setup failed', {
        description: err instanceof Error ? err.message : 'Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left — branding panel (hidden on mobile) */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'radial-gradient(ellipse at 30% 40%, #0D1420 0%, #060810 100%)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 70% 60%, rgba(201,169,110,0.08) 0%, transparent 60%)' }}
        />

        <Link href="/" className="relative z-10">
          <Logo size={36} variant="full" className="[&>span]:text-[#EDE0C8]" />
        </Link>

        <div className="relative z-10">
          <p className="text-[10px] tracking-widest uppercase mb-4" style={{ color: '#C9A96E' }}>
            Welcome Aboard
          </p>
          <h2 className="text-3xl font-bold leading-tight mb-4" style={{ color: '#EDE0C8' }}>
            Let&apos;s set up your workspace in under a minute.
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: '#4A4030' }}>
            Tell us your role so we can tailor the experience for you.
          </p>

          <div className="space-y-3">
            {['AQL template builder with AI generation', 'Real-time factory inspection tracking', 'Automated PDF reports & compliance'].map((item) => (
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

      {/* Right — role selection */}
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
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1">What best describes you?</h1>
          <p className="text-sm text-muted-foreground mb-6">
            We&apos;ll tailor your dashboard and tools to your workflow.
          </p>

          <div className="space-y-3">
            {ROLES.map((r) => {
              const Icon = r.icon
              const isSelected = selected === r.id
              return (
                <button
                  key={r.id}
                  onClick={() => setSelected(r.id)}
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
            disabled={!selected || loading}
            onClick={handleContinue}
          >
            {loading ? 'Setting up...' : 'Continue to Dashboard'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
