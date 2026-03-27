'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Menu, X, MessageCircle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/* ─── LOGO (same as landing page) ─── */
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
      <circle cx="70" cy="70" r="2.8" fill="currentColor" className="text-background" />
    </svg>
  )
}

/* ─── DATA ─── */
const PLANS = [
  {
    name: 'Free Trial',
    badge: null,
    price: '$0',
    period: ' / 21 days',
    desc: 'Full platform access for 21 days. No credit card required.',
    features: [
      '21-day full access',
      'No credit card needed',
      '1 factory connection',
      'Up to 20 inspections',
      'Basic analytics dashboard',
      'Data preserved after trial',
    ],
    cta: 'Start Free Trial',
    href: '/demo',
    highlighted: false,
  },
  {
    name: 'Founding Member',
    badge: 'Limited — 50 Slots',
    price: '$29',
    period: ' / month',
    desc: 'Lock in lifetime pricing. Shape the product. Leave your mark as a founding voice.',
    features: [
      'Everything in Free Trial',
      'Lifetime pricing lock — never increases',
      'Genesis Verified Badge on profile',
      'Roadmap voting rights',
      'White-glove onboarding',
      'Up to 5 factory connections',
      'Unlimited inspections',
      'Priority support',
    ],
    cta: 'Claim Founding Spot',
    href: '/demo',
    highlighted: true,
  },
  {
    name: 'Professional',
    badge: null,
    price: '$79',
    period: ' / month',
    desc: 'For growing brands and agencies managing quality across multiple suppliers.',
    features: [
      'Up to 10 factory connections',
      'Unlimited inspections',
      'Advanced analytics & KPI dashboards',
      'Defect trend reports',
      'PDF report generation',
      'Custom inspection templates',
      'Priority support',
      'API access',
    ],
    cta: 'Get Started',
    href: '/demo',
    highlighted: false,
  },
  {
    name: 'Enterprise',
    badge: null,
    price: 'Custom',
    period: ' Pricing',
    desc: 'For large organisations needing full-scale supply chain intelligence and compliance.',
    features: [
      'Unlimited factory connections',
      'Custom integrations & API',
      'Dedicated account manager',
      'On-site training & onboarding',
      'SLA guarantee',
      'White-label option',
      'Custom reporting & exports',
      'SAML SSO (enterprise login)',
    ],
    cta: 'Contact Us',
    href: '/demo?role=brand',
    highlighted: false,
  },
]

const FAQS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. No long-term contracts or cancellation fees. Cancel from your account settings at any time.',
  },
  {
    q: 'What happens when the 50 Founding Member slots are filled?',
    a: 'The Founding Member plan closes and pricing moves to the standard Professional tier. There is no way to re-open founding slots once they are gone.',
  },
  {
    q: 'What happens after my free trial ends?',
    a: 'Your account is paused until you subscribe. All your data, templates, and factory connections are preserved — upgrade anytime to restore full access.',
  },
  {
    q: 'Is the Founding Member price really locked forever?',
    a: 'Yes. Founding Members pay $29/month for life, regardless of future price increases. This is our commitment to early adopters.',
  },
  {
    q: 'Do you support Indian payment methods?',
    a: 'Yes. We support UPI, Razorpay, net banking, and all major credit/debit cards.',
  },
  {
    q: 'Can I upgrade or downgrade my plan?',
    a: 'Yes — switch plans at any time. Billing differences are prorated. Founding Members who downgrade lose the lifetime rate.',
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
                  link.href === '/pricing'
                    ? 'font-semibold text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button size="sm" asChild style={{ backgroundColor: '#A87C30' }} className="hover:opacity-90">
              <Link href="/demo">Request Demo</Link>
            </Button>
          </div>

          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-6 py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block text-sm text-muted-foreground hover:text-foreground py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild className="w-full" style={{ backgroundColor: '#A87C30' }}>
                <Link href="/demo">Request Demo</Link>
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-16 px-6 text-center">
        <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#C9A96E' }}>
          Pricing
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Start free for 21 days. Lock in lifetime rates as a Founding Member. Scale as you grow.
        </p>
      </section>

      {/* ── PLANS ── */}
      <section className="pb-24 px-6">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'relative rounded-2xl p-7 flex flex-col transition-all duration-300',
                plan.highlighted
                  ? 'border-2 shadow-xl scale-[1.03]'
                  : 'border border-border bg-card hover:shadow-lg hover:-translate-y-1'
              )}
              style={plan.highlighted ? { borderColor: '#C9A96E', background: 'linear-gradient(160deg, hsl(var(--card)) 0%, hsl(var(--card)/0.7) 100%)' } : {}}
            >
              {plan.badge && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap"
                  style={{ backgroundColor: '#A87C30', color: '#fff' }}
                >
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground leading-snug">{plan.desc}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check size={15} className="mt-0.5 flex-shrink-0" style={{ color: '#C9A96E' }} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={cn(
                  'block w-full py-2.5 rounded-lg text-sm font-semibold text-center transition-all',
                  plan.highlighted
                    ? 'text-white hover:opacity-90'
                    : 'border border-border text-foreground hover:bg-accent'
                )}
                style={plan.highlighted ? { backgroundColor: '#A87C30' } : {}}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOUNDING MEMBER CALLOUT ── */}
      <section className="py-16 px-6 border-y border-border bg-card/50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#C9A96E' }}>
            Why Founding Member?
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Be an Architect of the Ecosystem — Not Just a User
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            We are offering 50 Founding Member slots with lifetime pricing, direct roadmap influence,
            and white-glove onboarding. Once they are gone, they are gone.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 text-left mb-8 max-w-xl mx-auto">
            {[
              'Lifetime $29/month — locked forever',
              'Genesis Verified Badge on your profile',
              'Vote on what gets built next',
              'Personal onboarding from our team',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Check size={15} className="mt-0.5 flex-shrink-0" style={{ color: '#C9A96E' }} />
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
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
                >
                  {faq.q}
                  <ChevronDown
                    size={16}
                    className={cn(
                      'flex-shrink-0 text-muted-foreground transition-transform duration-200',
                      openFaq === i && 'rotate-180'
                    )}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="py-20 px-6 text-center" style={{ background: 'linear-gradient(135deg, #0D0D0F 0%, #1A1208 100%)' }}>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to transform your supply chain?
        </h2>
        <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
          Join the founding cohort building the future of fashion manufacturing intelligence.
        </p>
        <Button asChild size="lg" className="hover:opacity-90" style={{ backgroundColor: '#A87C30' }}>
          <Link href="/demo">Request a Demo →</Link>
        </Button>
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
