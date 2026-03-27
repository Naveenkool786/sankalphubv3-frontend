'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, Menu, MessageCircle, ChevronDown, Users, User, Building2, BarChart3, LayoutDashboard, FileCode2, Zap, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/* ─── LOGO ─── */
function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 140 140" width={size} height={size} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="lm-dG2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EDD898" />
          <stop offset="100%" stopColor="#A87C30" />
        </linearGradient>
        <linearGradient id="lm-nG2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C9A96E" />
          <stop offset="100%" stopColor="#8B6520" />
        </linearGradient>
        <filter id="lm-glow2">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <ellipse cx="70" cy="70" rx="56" ry="20" fill="none" stroke="#C9A96E" strokeWidth="1" opacity="0.3" transform="rotate(-40 70 70)" />
      <ellipse cx="70" cy="70" rx="56" ry="20" fill="none" stroke="#C9A96E" strokeWidth="1" opacity="0.45" transform="rotate(20 70 70)" />
      <polygon points="70,14 116,70 70,122 24,70" fill="none" stroke="url(#lm-dG2)" strokeWidth="1.2" opacity="0.5" />
      <polygon points="70,28 102,70 70,108 38,70" fill="none" stroke="url(#lm-dG2)" strokeWidth="1.1" opacity="0.85" />
      <polygon points="70,44 96,70 70,94 44,70" fill="none" stroke="url(#lm-dG2)" strokeWidth="1.8" />
      <circle cx="70" cy="10" r="4" fill="url(#lm-nG2)" filter="url(#lm-glow2)" />
      <circle cx="120" cy="88" r="3" fill="url(#lm-nG2)" opacity="0.6" />
      <circle cx="20" cy="88" r="3" fill="url(#lm-nG2)" opacity="0.6" />
      <line x1="70" y1="10" x2="70" y2="44" stroke="#C9A96E" strokeWidth="0.6" opacity="0.3" />
      <circle cx="70" cy="70" r="12" fill="none" stroke="#C9A96E" strokeWidth="0.8" opacity="0.4" />
      <circle cx="70" cy="70" r="6.5" fill="url(#lm-dG2)" filter="url(#lm-glow2)" />
      <circle cx="70" cy="70" r="2.8" fill="#0D0D0F" />
    </svg>
  )
}

/* ─── DATA ─── */
const PREMIUM_PLANS = [
  {
    icon: User,
    name: 'Single User',
    badge: null,
    price: '$9',
    period: '/month',
    desc: 'Full PremiumHub access for an individual. Perfect for solo inspectors, freelance agents, or independent brand managers.',
    seats: '1 user per account',
    seatNote: null,
    features: [
      'Full Analytics dashboard',
      'Live KPI Dashboard',
      'Templates Builder (unlimited)',
      'Automated PDF reports',
      'All inspection modules',
      'Email support',
    ],
    cta: 'Get PremiumHub',
    href: '/demo',
    highlighted: false,
  },
  {
    icon: Users,
    name: 'Group',
    badge: 'Most Popular',
    price: '$49',
    period: '/month',
    desc: 'For small teams and growing organisations. Up to 5 users under one domain — built-in access control.',
    seats: 'Up to 5 users / org',
    seatNote: 'Same-domain only. 6th user is blocked — no permission to join.',
    features: [
      'Everything in Single User',
      'Up to 5 users per organisation',
      'Domain-restricted access control',
      'Shared team dashboards',
      'Factory & brand collaboration',
      'Priority email support',
    ],
    cta: 'Get PremiumHub',
    href: '/demo',
    highlighted: true,
  },
  {
    icon: Building2,
    name: 'Enterprise',
    badge: null,
    price: '$199',
    period: '/month',
    desc: 'For large organisations running multi-factory operations with enterprise-level compliance needs.',
    seats: 'Up to 11 users / org',
    seatNote: 'Each additional user beyond 11 is +$19/month per licence.',
    features: [
      'Everything in Group',
      'Up to 11 users per organisation',
      'Additional users at +$19/user/month',
      'Dedicated account manager',
      'Custom integrations & API access',
      'On-site onboarding & training',
      'SLA guarantee',
      'White-label option',
    ],
    cta: 'Contact Us',
    href: '/demo?role=brand',
    highlighted: false,
  },
]

const FEATURE_COMPARE = [
  { feature: 'Analytics Dashboard', icon: BarChart3, limited: false, premium: true },
  { feature: 'Live KPI Dashboard', icon: LayoutDashboard, limited: false, premium: true },
  { feature: 'Templates Builder', icon: FileCode2, limited: false, premium: true },
  { feature: 'Automated PDF Reports', icon: Zap, limited: false, premium: true },
  { feature: 'Inspection Modules', icon: Check, limited: 'Read-only', premium: true },
  { feature: 'Factory Connections', icon: Building2, limited: 'View only', premium: true },
  { feature: 'Data Access', icon: Lock, limited: 'Limited view', premium: 'Full access' },
  { feature: 'Team Collaboration', icon: Users, limited: false, premium: true },
]

const FAQS = [
  {
    q: 'What happens after my 21-day free trial?',
    a: 'After the trial your account switches to Limited access — you can still log in and view your data, but Analytics, Live Dashboard, and the Templates Builder are locked. Upgrade to any PremiumHub plan to restore full access instantly.',
  },
  {
    q: 'What does "domain-restricted" mean for the Group plan?',
    a: 'On the Group plan, users must share the same email domain as the organisation (e.g. @yourfactory.com). Once 5 seats are filled, a 6th user attempting to join with the same domain will be blocked with a "No permission to add" message. Upgrade to Enterprise to expand seats.',
  },
  {
    q: 'How does Enterprise seat billing work?',
    a: 'The Enterprise plan includes 11 seats at $199/month. Each additional user beyond 11 is charged at $19/month per licence. These are added to your monthly bill automatically when a new user is invited and accepted.',
  },
  {
    q: 'Can I mix PremiumHub plans across my organisation?',
    a: 'No — one PremiumHub plan applies per organisation. Choose the plan that fits your current team size and upgrade as you grow.',
  },
  {
    q: 'Is the Founding Member offer related to PremiumHub?',
    a: 'Yes. Founding Members get lifetime pricing locked in — equivalent to the Group plan (5 users) at $29/month forever, regardless of future price changes. This offer is limited to 50 organisations.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. No long-term contracts or cancellation fees. Cancel anytime from your account settings. You keep access until the end of your billing period.',
  },
  {
    q: 'Do you support Indian payment methods?',
    a: 'Yes — UPI, Razorpay, net banking, and all major credit/debit cards are supported.',
  },
]

const NAV_LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
]

/* ─── PAGE ─── */
export default function PricingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-background">

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark size={32} />
            <span className="font-bold text-base tracking-tight text-foreground">
              Sankalp<span style={{ color: '#C9A96E' }}>Hub</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  'text-sm transition-colors',
                  link.href === '/pricing' ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link href="/login">Login</Link></Button>
            <Button size="sm" asChild style={{ backgroundColor: '#A87C30' }} className="hover:opacity-90">
              <Link href="/demo">Request Demo</Link>
            </Button>
          </div>
          <button className="md:hidden p-2 text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-6 py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className="block text-sm text-muted-foreground hover:text-foreground py-1" onClick={() => setMobileMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Button variant="outline" size="sm" asChild className="w-full"><Link href="/login">Login</Link></Button>
              <Button size="sm" asChild className="w-full" style={{ backgroundColor: '#A87C30' }}><Link href="/demo">Request Demo</Link></Button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-12 px-6 text-center">
        <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#C9A96E' }}>
          Pricing
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
          Start Free. Unlock with{' '}
          <span style={{ color: '#C9A96E' }}>PremiumHub</span>.
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Every account gets a full 21-day free trial. After that, choose a PremiumHub plan to keep
          Analytics, Live Dashboard, and Templates Builder — or stay on limited access for free.
        </p>
      </section>

      {/* ── TRIAL FLOW BANNER ── */}
      <section className="pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-col sm:flex-row items-center gap-0 sm:gap-0">
              {[
                { step: '1', label: 'Sign Up', sub: 'No credit card needed' },
                { step: '2', label: '21-Day Free Trial', sub: 'Full access to everything' },
                { step: '3', label: 'Choose PremiumHub', sub: 'Or stay on limited access' },
              ].map((item, i) => (
                <div key={i} className="flex sm:flex-1 items-center w-full sm:w-auto">
                  <div className="flex flex-col items-center text-center flex-1 py-3 sm:py-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white mb-2"
                      style={{ backgroundColor: '#A87C30' }}
                    >
                      {item.step}
                    </div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                  </div>
                  {i < 2 && (
                    <div className="hidden sm:block w-8 text-muted-foreground text-center text-lg">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PREMIUMHUB PLANS ── */}
      <section className="pb-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span
              className="inline-block text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4"
              style={{ backgroundColor: 'rgba(201,169,110,0.12)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.3)' }}
            >
              PremiumHub Plans
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Full Platform Power. Choose Your Team Size.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">
              All PremiumHub plans unlock Analytics, Live Dashboard, Templates Builder, and automated reporting.
              Plans differ only by number of seats per organisation.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {PREMIUM_PLANS.map((plan) => {
              const Icon = plan.icon
              return (
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

                  {/* Icon + Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(201,169,110,0.12)' }}
                    >
                      <Icon size={20} style={{ color: '#C9A96E' }} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground leading-tight">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground">{plan.seats}</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-snug mb-5">{plan.desc}</p>

                  {/* Price */}
                  <div className="mb-5">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>

                  {/* Seat note */}
                  {plan.seatNote && (
                    <div className="mb-5 text-xs rounded-lg px-3 py-2.5 leading-snug" style={{ backgroundColor: 'rgba(201,169,110,0.08)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.2)' }}>
                      {plan.seatNote}
                    </div>
                  )}

                  {/* Features */}
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#C9A96E' }} />
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
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURE COMPARISON TABLE ── */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-2">
            PremiumHub vs Limited Access
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-8">
            What you get after the 21-day trial ends, with and without a PremiumHub plan.
          </p>
          <div className="rounded-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 bg-card border-b border-border">
              <div className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Feature</div>
              <div className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center border-l border-border">
                Limited (Free)
              </div>
              <div className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-center border-l border-border" style={{ color: '#C9A96E' }}>
                PremiumHub
              </div>
            </div>
            {FEATURE_COMPARE.map((row, i) => {
              const Icon = row.icon
              return (
                <div
                  key={i}
                  className={cn(
                    'grid grid-cols-3 border-b border-border last:border-0',
                    i % 2 === 0 ? 'bg-background' : 'bg-card/40'
                  )}
                >
                  <div className="px-5 py-3.5 flex items-center gap-2.5 text-sm text-foreground">
                    <Icon size={14} className="text-muted-foreground flex-shrink-0" />
                    {row.feature}
                  </div>
                  <div className="px-5 py-3.5 flex items-center justify-center border-l border-border">
                    {row.limited === false ? (
                      <X size={16} className="text-red-400" />
                    ) : (
                      <span className="text-xs text-muted-foreground">{row.limited}</span>
                    )}
                  </div>
                  <div className="px-5 py-3.5 flex items-center justify-center border-l border-border">
                    {row.premium === true ? (
                      <Check size={16} style={{ color: '#C9A96E' }} />
                    ) : (
                      <span className="text-xs font-medium" style={{ color: '#C9A96E' }}>{row.premium}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FOUNDING MEMBER CALLOUT ── */}
      <section className="py-14 px-6 border-y border-border" style={{ background: 'linear-gradient(160deg, rgba(201,169,110,0.05) 0%, transparent 100%)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <span
            className="inline-block text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4"
            style={{ backgroundColor: 'rgba(201,169,110,0.12)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.3)' }}
          >
            Limited — 50 Slots Only
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Founding Member — $29/month Forever
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto text-sm">
            Founding Members get the Group plan (5 users, full PremiumHub) locked at $29/month for life —
            regardless of future price changes. Plus a Genesis Verified Badge and roadmap voting rights.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-left mb-8 max-w-lg mx-auto">
            {[
              'Group PremiumHub (5 users) — $29/month lifetime',
              'Genesis Verified Badge on your organisation',
              'Roadmap voting rights — shape the product',
              'White-glove onboarding from our team',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#C9A96E' }} />
                {item}
              </div>
            ))}
          </div>
          <Button asChild style={{ backgroundColor: '#A87C30' }} className="hover:opacity-90">
            <Link href="/demo">Claim Your Founding Spot →</Link>
          </Button>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
                >
                  {faq.q}
                  <ChevronDown
                    size={16}
                    className={cn('flex-shrink-0 text-muted-foreground transition-transform duration-200', openFaq === i && 'rotate-180')}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="py-20 px-6 text-center" style={{ background: 'linear-gradient(135deg, #0D0D0F 0%, #1A1208 100%)' }}>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to unlock your full platform?
        </h2>
        <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto">
          Start your 21-day free trial today. No credit card. No commitment.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="hover:opacity-90" style={{ backgroundColor: '#A87C30' }}>
            <Link href="/demo">Start Free Trial →</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Link href="/demo">Talk to Sales</Link>
          </Button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <LogoMark size={20} />
            <span>© 2026 SankalpHub. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/demo" className="hover:text-foreground transition-colors">Request Demo</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Login</Link>
          </div>
        </div>
      </footer>

      {/* ── WHATSAPP FLOAT ── */}
      <a
        href="https://wa.me/919410261360?text=Hi%2C%20I%27m%20interested%20in%20SankalpHub."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
        style={{ backgroundColor: '#25D366' }}
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={28} className="text-white" />
      </a>
    </div>
  )
}
