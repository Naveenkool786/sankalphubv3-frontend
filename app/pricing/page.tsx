'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, Menu, MessageCircle, ChevronDown, Zap, Shield, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/Logo'
import { NavThemeToggle } from '@/components/ui/NavThemeToggle'
import { cn } from '@/lib/utils'

/* ─── DATA ─── */
const PLANS = [
  {
    icon: Zap,
    name: 'Free',
    badge: null,
    price: '$0',
    period: 'forever',
    desc: 'Get started with a 21-day full-access trial. After that, core features stay free with usage limits.',
    highlight: '21-day full trial included',
    features: [
      'Up to 5 users',
      '10 inspections / month',
      '5 active projects',
      '3 templates',
      '3 AI generations / month',
      'AQL scoring engine',
      'Defect capture + photos',
      '500 MB storage',
    ],
    missingFeatures: [
      'PDF reports',
      'Excel export',
      'Multi-factory support',
      'Audit logs',
    ],
    cta: 'Start Free',
    href: '/signup',
    highlighted: false,
  },
  {
    icon: Shield,
    name: 'Pro',
    badge: 'Most Popular',
    price: '$29',
    period: '/month',
    desc: 'For teams running quality inspections at scale. Unlimited inspections, reports, and AI generation.',
    highlight: '$278/year (save 20%)',
    features: [
      'Up to 5 users per org',
      'Unlimited inspections',
      'Unlimited projects',
      'Unlimited templates',
      'Unlimited AI generations',
      'PDF reports & Excel export',
      'Multi-factory support',
      'Audit logs (90 days)',
      '15 GB storage',
      'Email delivery',
      'Priority support',
    ],
    missingFeatures: [
      'White-label branding',
      'SSO / SAML',
      'API access',
    ],
    cta: 'Start 14-Day Trial',
    href: '/demo',
    highlighted: true,
  },
  {
    icon: Building2,
    name: 'Enterprise',
    badge: null,
    price: 'Custom',
    period: '',
    desc: 'For large organisations with multi-factory operations, compliance requirements, and white-label needs.',
    highlight: '30-day POC available',
    features: [
      'Unlimited users',
      'Unlimited everything',
      'White-label branding',
      'SSO / SAML',
      'API access',
      'Audit logs (unlimited)',
      '100 GB+ storage',
      'Dedicated account manager',
      'On-site onboarding & training',
      'SLA 99.9%',
      'Custom integrations',
    ],
    missingFeatures: [],
    cta: 'Contact Sales',
    href: '/demo?role=brand',
    highlighted: false,
  },
]

const FEATURE_COMPARE = [
  { feature: 'Users', free: '5', pro: '5 per org', enterprise: 'Unlimited' },
  { feature: 'Inspections / month', free: '10', pro: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Projects', free: '5 active', pro: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Templates', free: '3', pro: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'AI Template Generation', free: '3 / month', pro: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'AQL Scoring Engine', free: true, pro: true, enterprise: true },
  { feature: 'Defect Capture + Photos', free: true, pro: true, enterprise: true },
  { feature: 'PDF Reports', free: false, pro: true, enterprise: true },
  { feature: 'Excel Export', free: false, pro: true, enterprise: true },
  { feature: 'Email Delivery', free: false, pro: true, enterprise: true },
  { feature: 'Multi-Factory Support', free: false, pro: true, enterprise: true },
  { feature: 'Template Versioning', free: false, pro: true, enterprise: true },
  { feature: 'Audit Logs', free: false, pro: '90 days', enterprise: 'Unlimited' },
  { feature: 'Role Dashboards', free: 'Basic', pro: 'Full', enterprise: 'Custom' },
  { feature: 'Storage', free: '500 MB', pro: '15 GB', enterprise: '100 GB+' },
  { feature: 'White-label Branding', free: false, pro: false, enterprise: true },
  { feature: 'SSO / SAML', free: false, pro: false, enterprise: true },
  { feature: 'API Access', free: false, pro: false, enterprise: true },
  { feature: 'SLA 99.9%', free: false, pro: false, enterprise: true },
  { feature: 'Dedicated Account Manager', free: false, pro: false, enterprise: true },
]

const FAQS = [
  {
    q: 'What happens during the 21-day free trial?',
    a: 'You get full access to all Pro features for 21 days — no credit card required. After the trial, your account moves to the Free plan with usage limits. Upgrade anytime to restore full access.',
  },
  {
    q: 'What are the limits on the Free plan?',
    a: 'Free accounts are limited to 5 users, 10 inspections per month, 5 active projects, 3 templates, 3 AI generations per month, and 500 MB of storage. PDF reports and Excel exports are not available on Free.',
  },
  {
    q: 'Can I upgrade or downgrade at any time?',
    a: 'Yes. Upgrade to Pro instantly from your dashboard. Downgrade to Free anytime — you keep access until the end of your billing period. No cancellation fees.',
  },
  {
    q: 'How does annual billing work?',
    a: 'The Pro plan is $29/month billed monthly, or $278/year billed annually (save 20%). Enterprise pricing is custom and negotiated annually.',
  },
  {
    q: 'What payment methods do you support?',
    a: 'We support UPI, Razorpay, net banking, and all major credit/debit cards. Enterprise clients can pay via invoice and bank transfer.',
  },
  {
    q: 'Is the Founding Member offer still available?',
    a: 'Yes — Founding Members get lifetime pricing locked at $29/month for the Pro plan (5 users), plus a Genesis Verified Badge and roadmap voting rights. Limited to 50 organisations.',
  },
  {
    q: 'What is Enterprise pricing?',
    a: 'Enterprise pricing is custom-based on your team size, feature requirements, and compliance needs. Contact our sales team for a tailored quote and 30-day proof-of-concept.',
  },
]

const NAV_LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
]

/* ─── HELPERS ─── */
function CellValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check size={16} style={{ color: '#C9A96E' }} />
  if (value === false) return <X size={16} className="text-red-400" />
  return <span className="text-xs text-muted-foreground">{value}</span>
}

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
            <Logo size={32} variant="full" />
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
            <NavThemeToggle />
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
          Simple, transparent pricing.
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Start with a 21-day full-access trial. No credit card required.
          Choose the plan that fits your team when you're ready.
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
                { step: '3', label: 'Choose Your Plan', sub: 'Free, Pro, or Enterprise' },
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

      {/* ── PLAN CARDS ── */}
      <section className="pb-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
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

                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(201,169,110,0.12)' }}
                    >
                      <Icon size={20} style={{ color: '#C9A96E' }} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  </div>

                  <p className="text-sm text-muted-foreground leading-snug mb-5">{plan.desc}</p>

                  <div className="mb-2">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>}
                  </div>

                  {plan.highlight && (
                    <p className="text-xs mb-5" style={{ color: '#C9A96E' }}>{plan.highlight}</p>
                  )}

                  <ul className="space-y-2.5 mb-8 flex-1">
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
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURE COMPARISON TABLE ── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-2">
            Full Feature Comparison
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-8">
            See exactly what's included in each plan.
          </p>
          <div className="rounded-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-4 bg-card border-b border-border">
              <div className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Feature</div>
              <div className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center border-l border-border">Free</div>
              <div className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-center border-l border-border" style={{ color: '#C9A96E' }}>Pro</div>
              <div className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center border-l border-border">Enterprise</div>
            </div>
            {FEATURE_COMPARE.map((row, i) => (
              <div
                key={i}
                className={cn(
                  'grid grid-cols-4 border-b border-border last:border-0',
                  i % 2 === 0 ? 'bg-background' : 'bg-card/40'
                )}
              >
                <div className="px-5 py-3.5 text-sm text-foreground">{row.feature}</div>
                <div className="px-5 py-3.5 flex items-center justify-center border-l border-border">
                  <CellValue value={row.free} />
                </div>
                <div className="px-5 py-3.5 flex items-center justify-center border-l border-border">
                  <CellValue value={row.pro} />
                </div>
                <div className="px-5 py-3.5 flex items-center justify-center border-l border-border">
                  <CellValue value={row.enterprise} />
                </div>
              </div>
            ))}
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
            Founding Members get the Pro plan (5 users, full access) locked at $29/month for life —
            regardless of future price changes. Plus a Genesis Verified Badge and roadmap voting rights.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-left mb-8 max-w-lg mx-auto">
            {[
              'Pro plan (5 users) — $29/month lifetime',
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
          Ready to streamline your quality inspections?
        </h2>
        <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto">
          Start your 21-day free trial today. No credit card. No commitment.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="hover:opacity-90" style={{ backgroundColor: '#A87C30' }}>
            <Link href="/signup">Start Free Trial →</Link>
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
            <Logo size={20} />
            <span>© 2026 SankalpHub. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-5 flex-wrap justify-center">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/demo" className="hover:text-foreground transition-colors">Request Demo</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Login</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <a href="mailto:info@sankalphub.in" className="hover:text-foreground transition-colors">Contact</a>
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
