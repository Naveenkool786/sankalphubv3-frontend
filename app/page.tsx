'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, Menu, X, CheckCircle2, Check,
  Globe, AlertTriangle, FileSearch, Zap,
  ClipboardCheck, BarChart3, FileText, Users, Building2, Factory, UserCheck,
  ChevronRight, Star,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/ui/Logo'
import { NavThemeToggle } from '@/components/ui/NavThemeToggle'
import { cn } from '@/lib/utils'

/* ─── DATA ─── */
const painPoints = [
  {
    icon: Globe,
    title: 'Trade & Tariff Agility',
    desc: 'Global trade maps shift overnight. Real-time supply chain visibility lets you pivot production and mitigate tariff risk before margins are lost.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: FileSearch,
    title: 'Mandatory Traceability',
    desc: 'Sustainability is now a legal requirement, not a marketing plus. Automate compliance data from raw material to the final shipping container.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: AlertTriangle,
    title: 'End of Execution Lag',
    desc: 'Stop losing weeks to fragmented emails and WhatsApp chains. Unify design, sourcing, and the factory floor into one live digital feed.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
]

const howItWorks = [
  {
    step: '01',
    title: 'Register Your Organisation',
    desc: 'Brand, Factory, or Agency — sign up and select your role. Set up your profile, product categories, and team members in minutes.',
  },
  {
    step: '02',
    title: 'Connect Your Supply Chain',
    desc: 'Link factories, assign inspectors, and configure your inspection templates with AQL scoring and compliance checkpoints.',
  },
  {
    step: '03',
    title: 'Track. Inspect. Report.',
    desc: 'Run quality inspections on mobile, get auto-generated PDF reports with defect breakdowns, and monitor KPIs on your live dashboard.',
  },
]

const roles = [
  {
    icon: Building2,
    role: 'Brand / Buyer',
    color: 'bg-blue-600',
    sub: null,
    points: [
      'Create & manage production projects',
      'Assign factories and inspectors',
      'Monitor real-time KPIs & pass rates',
      'Digital approval workflows',
    ],
  },
  {
    icon: Factory,
    role: 'Factory / Manufacturer',
    color: 'bg-[#C9A96E]',
    sub: 'Garments · Gloves · Footwear · Headwear · Accessories',
    points: [
      'Showcase capacity & certifications',
      'Track inspection results & defects',
      'Respond to quality reports instantly',
      'Access live production dashboard',
    ],
  },
  {
    icon: UserCheck,
    role: 'Inspector / Agency',
    color: 'bg-emerald-600',
    sub: null,
    points: [
      'Conduct mobile-first inspections',
      'Log defects with photos & notes',
      'Auto-calculated AQL scores',
      'Submit reports in one tap',
    ],
  },
]

const features = [
  {
    icon: ClipboardCheck,
    title: 'AQL Template Builder',
    desc: 'Build inspection templates for garments, footwear, or hardware. Custom sections, field types, and scoring formulas — no code required.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    desc: 'KPI dashboards, pass/fail rates, factory benchmarking, and defect trend reports across your entire supply chain.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Zap,
    title: 'Automated Workflows',
    desc: 'Trigger re-inspections, approval requests, and compliance alerts automatically based on AQL scores and defect thresholds.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: FileText,
    title: 'Auto-generated Reports',
    desc: 'PDF inspection reports generated instantly with defect breakdowns, photos, AQL scores, and complete audit trails.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Users,
    title: 'Role-based Access',
    desc: 'Purpose-built views for Brands, Factories, Inspectors, and Agencies — with row-level data isolation between organisations.',
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
  },
  {
    icon: Globe,
    title: 'Multi-tenant Architecture',
    desc: 'Each organisation gets isolated data. Brands manage factories. Agencies run inspections. All in one platform — zero data leakage.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
]

const pricingPlans = [
  {
    name: 'Free',
    badge: null,
    price: '$0',
    period: 'forever',
    desc: 'Get started with a 21-day full-access trial. After that, core features remain free with usage limits.',
    cta: 'Start Free Trial',
    href: '/demo',
    highlighted: false,
    features: [
      'Up to 5 users',
      '10 inspections / month',
      '5 active projects',
      '3 AI generations / month',
      'AQL scoring engine',
      'Defect capture + photos',
    ],
    missingFeatures: [
      'PDF reports',
      'Excel export',
    ],
  },
  {
    name: 'Pro',
    badge: 'Most Popular',
    price: '$29',
    period: '/month',
    desc: 'For teams running inspections at scale. Unlimited inspections, reports, and AI — everything you need.',
    cta: 'Get Started',
    href: '/demo',
    highlighted: true,
    features: [
      'Up to 5 users per org',
      'Unlimited inspections',
      'Unlimited projects & templates',
      'Unlimited AI generations',
      'PDF reports & Excel export',
      'Multi-factory support',
      'Priority support',
    ],
    missingFeatures: [],
  },
  {
    name: 'Enterprise',
    badge: null,
    price: 'Custom',
    period: '',
    desc: 'For large organisations with multi-factory operations, compliance, and white-label needs.',
    cta: 'Contact Sales',
    href: '/demo?role=brand',
    highlighted: false,
    features: [
      'Unlimited users',
      'Unlimited everything',
      'White-label branding',
      'SSO / SAML',
      'API access',
      'Dedicated account manager',
      'SLA 99.9%',
    ],
    missingFeatures: [],
  },
]

const founderBenefits = [
  { title: 'Lifetime Strategic Pricing', desc: 'Lock in early-adopter rates that will never increase, even as we scale globally.' },
  { title: 'Genesis Verified Badge', desc: 'A permanent mark on your profile as a pioneer of digital-first manufacturing.' },
  { title: 'Roadmap Voting Rights', desc: 'Tell us what to build next. We prioritise features based on your actual business needs.' },
  { title: 'White-Glove Onboarding', desc: 'Our team personally handles your data migration and team training at zero cost.' },
]

const roleCTAs = [
  {
    icon: Factory,
    label: 'For Factories',
    headline: 'Showcase My Factory Globally',
    sub: 'Be seen by brands looking for agile, tech-forward manufacturing partners.',
    href: '/demo?role=factory',
  },
  {
    icon: Building2,
    label: 'For Brands',
    headline: 'Start My Digital Supply Chain',
    sub: 'Cut sampling cycles, gain real-time visibility, and de-risk your sourcing.',
    href: '/demo?role=brand',
  },
  {
    icon: UserCheck,
    label: 'For Agencies',
    headline: 'Superpower My Agency',
    sub: 'Replace manual follow-ups with automated quality control and reporting.',
    href: '/demo?role=agency',
  },
]

const stats = [
  { value: '50', label: 'Founding Slots' },
  { value: '100%', label: 'Digital. No Paper' },
  { value: '< 24 hr', label: 'Onboarding' },
  { value: '5 Roles', label: 'Supported' },
]

/* ─── PAGE ─── */
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={32} variant="full" />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#why-now" className="hover:text-foreground transition-colors">Why Now</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <NavThemeToggle />
            <Link href="/login">
              <Button size="sm" variant="ghost">Login</Button>
            </Link>
            <Link href="/demo">
              <Button size="sm" className="gap-1.5">
                Request Demo <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-6 py-4 space-y-3">
            <a href="#why-now" className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>Why Now</a>
            <a href="#how-it-works" className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="flex-1">
                <Button size="sm" variant="secondary" className="w-full">Login</Button>
              </Link>
              <Link href="/demo" className="flex-1">
                <Button size="sm" className="w-full">Request Demo</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="pt-28 pb-20 px-6 relative overflow-hidden min-h-[85vh] flex items-center">
        {/* 3D Background Image */}
        <Image
          src="/hero/LandingPageUpfront3D.webp"
          alt=""
          fill
          priority
          className="object-cover object-center pointer-events-none"
          style={{ opacity: 0.12 }}
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60 pointer-events-none" />
        {/* Gold glow accent */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(201,169,110,0.08) 0%, transparent 70%)' }} />

        <div className="max-w-4xl mx-auto text-center relative">
          <Badge className="mb-6 px-3 py-1 bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold tracking-widest uppercase">
            Production Intelligence Platform
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.08] text-balance">
            Build Better Products,{' '}
            <span className="text-primary">Faster.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Tech packs, sampling, supplier collaboration, and product passports — all in one platform. Finally, ditch the spreadsheets.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/demo">
              <Button size="lg" className="gap-2 text-base px-6">
                Become a Founding Member <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="secondary" size="lg" className="text-base px-6">
                See How It Works
              </Button>
            </a>
          </div>

          {/* Stats strip */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 border border-border rounded-2xl p-6 bg-card/50">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY NOW — 2026 INDUSTRY REALITY ── */}
      <section id="why-now" className="py-20 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">The 2026 Industry Reality</p>
            <h2 className="text-3xl font-bold text-foreground">The world has changed.<br />Your supply chain management should too.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {painPoints.map((p) => {
              const Icon = p.icon
              return (
                <div key={p.title} className="bg-card border border-border rounded-2xl p-6">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', p.bg)}>
                    <Icon className={cn('w-5 h-5', p.color)} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Simple. Fast. Powerful.</p>
            <h2 className="text-3xl font-bold text-foreground">Up and running in three steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* connector line (desktop only) */}
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-border" />
            {howItWorks.map((s, i) => (
              <div key={s.step} className="relative flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 relative z-10 bg-background">
                  <span className="text-xl font-bold text-primary">{s.step}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                {i < howItWorks.length - 1 && (
                  <ChevronRight className="md:hidden w-5 h-5 text-muted-foreground mt-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STAKEHOLDERS ── */}
      <section id="roles" className="py-20 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Built for Every Stakeholder</p>
            <h2 className="text-3xl font-bold text-foreground">Each role gets a purpose-built experience</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {roles.map((r) => {
              const Icon = r.icon
              return (
                <div key={r.role} className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', r.color)}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{r.role}</h3>
                  {r.sub && (
                    <p className="text-[11px] text-muted-foreground font-medium tracking-wide mb-3">{r.sub}</p>
                  )}
                  <ul className="space-y-2 mt-3">
                    {r.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Platform Capabilities</p>
            <h2 className="text-3xl font-bold text-foreground">Everything you need to manage quality at scale</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              From AQL template creation to automated compliance reporting — built for multi-org manufacturing workflows.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', f.bg)}>
                    <Icon className={cn('w-5 h-5', f.color)} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1.5">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 px-6 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Simple, Transparent Pricing</p>
            <h2 className="text-3xl font-bold text-foreground">Start free. Scale when you're ready.</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm">
              Every account starts with a 21-day full-access trial. No credit card required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  'relative rounded-2xl p-7 flex flex-col transition-all duration-300',
                  plan.highlighted
                    ? 'border-2 shadow-2xl'
                    : 'border border-border bg-card hover:shadow-lg hover:-translate-y-1'
                )}
                style={plan.highlighted
                  ? { borderColor: '#C9A96E', background: 'linear-gradient(160deg, hsl(var(--card)) 0%, rgba(201,169,110,0.04) 100%)' }
                  : {}}
              >
                {plan.badge && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap"
                    style={{ backgroundColor: '#A87C30', color: '#fff' }}
                  >
                    {plan.badge}
                  </div>
                )}

                <h3 className="text-lg font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground leading-snug mb-4">{plan.desc}</p>

                <div className="mb-5">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>}
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#C9A96E' }} />
                      {f}
                    </li>
                  ))}
                  {plan.missingFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground/50">
                      <X size={14} className="mt-0.5 flex-shrink-0 text-red-400/60" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={cn(
                    'block w-full py-2.5 rounded-lg text-sm font-semibold text-center transition-all',
                    plan.highlighted ? 'text-white hover:opacity-90' : 'border border-border text-foreground hover:bg-accent'
                  )}
                  style={plan.highlighted ? { backgroundColor: '#A87C30' } : {}}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            <Link href="/pricing" className="underline hover:text-foreground transition-colors">
              See full feature comparison →
            </Link>
          </p>
        </div>
      </section>

      {/* ── FOUNDING MEMBER ── */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-3xl p-8 md:p-12 relative overflow-hidden">
            {/* gold glow */}
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(201,169,110,0.08) 0%, transparent 70%)' }} />

            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4" style={{ color: '#C9A96E' }} />
                <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#C9A96E' }}>
                  Limited to 50 Partners
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Be an Architect of the Ecosystem —<br className="hidden md:block" /> Not Just a User
              </h2>
              <p className="text-muted-foreground mb-8 max-w-2xl">
                We are offering 50 Founding Member slots with lifetime pricing, direct roadmap influence, and white-glove onboarding. A fresh start for an industry tired of old tech. A few spots remain.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {founderBenefits.map((b) => (
                  <div key={b.title} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{b.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/demo">
                <Button size="lg" className="gap-2">
                  Claim Your Founding Spot <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROLE CTA STRIP ── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground">Ready to get started?</h2>
            <p className="text-muted-foreground mt-2">Choose how you want to join SankalpHub.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {roleCTAs.map((c) => {
              const Icon = c.icon
              return (
                <Link key={c.label} href={c.href}>
                  <div className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-md transition-all h-full cursor-pointer">
                    <span className="text-xs font-semibold tracking-widest uppercase text-primary mb-3 block">{c.label}</span>
                    <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{c.headline}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{c.sub}</p>
                    <div className="flex items-center gap-1 text-sm font-medium text-primary">
                      Request Demo <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <Logo size={24} />
            <div>
              <span className="font-semibold text-foreground">Sankalp<span className="text-primary">Hub</span></span>
              <span className="ml-1 hidden sm:inline tracking-widest uppercase text-[9px]">— Production Intelligence Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#roles" className="hover:text-foreground transition-colors">Who It's For</a>
            <Link href="/demo" className="hover:text-foreground transition-colors">Request Demo</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Login</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <a href="mailto:info@sankalphub.in" className="hover:text-foreground transition-colors">Contact</a>
            <span>© {new Date().getFullYear()} SankalpHub</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
