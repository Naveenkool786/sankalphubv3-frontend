'use client'

import Link from 'next/link'
import {
  ShieldCheck, ClipboardCheck, BarChart3, Zap, FileText, Users,
  CheckCircle2, ArrowRight, Building2, Factory, UserCheck, Globe,
  Menu, X,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: ClipboardCheck,
    title: 'Dynamic Template Builder',
    desc: 'Build inspection templates with custom sections, field types, score formulas, and conditional logic — no code required.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    desc: 'KPI dashboards, pass/fail rates, factory benchmarking, and defect trend reports — all in one place.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Zap,
    title: 'Automated Workflows',
    desc: 'Trigger notifications, re-inspections, and report generation automatically based on scores and defect thresholds.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: FileText,
    title: 'Auto-generated Reports',
    desc: 'Inspection reports generated instantly with scores, defect breakdowns, photos, and complete audit trails.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Users,
    title: 'Role-based Access',
    desc: 'Separate views for Brands, Factories, Inspectors, and 3rd Party Agencies with row-level data isolation.',
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
  },
  {
    icon: Globe,
    title: 'Multi-tenant Architecture',
    desc: 'Each organization gets isolated data. Brands manage factories. Agencies run inspections. All in one platform.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
]

const roles = [
  {
    icon: Building2,
    role: 'Brand / Buyer',
    color: 'bg-blue-600',
    points: [
      'Create & manage projects',
      'Assign factories & inspectors',
      'Monitor reports & KPIs',
      'Define custom templates',
    ],
  },
  {
    icon: Factory,
    role: 'Factory / Manufacturer',
    color: 'bg-orange-500',
    points: [
      'View assigned orders',
      'Track inspection results',
      'Respond to defect reports',
      'Access production status',
    ],
  },
  {
    icon: UserCheck,
    role: 'Inspector / Agency',
    color: 'bg-green-600',
    points: [
      'Conduct mobile inspections',
      'Log defects with photos',
      'Auto-calculated AQL scores',
      'Submit reports instantly',
    ],
  },
]

const stats = [
  { value: '10,000+', label: 'Inspections logged' },
  { value: '98.4%', label: 'Report accuracy' },
  { value: '3 roles', label: 'Stakeholder types' },
  { value: '< 5 min', label: 'To generate a report' },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-base tracking-tight">SankalpHub</span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#roles" className="hover:text-foreground transition-colors">Who it's for</a>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/login">
              <Button size="sm" variant="ghost">Login</Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="gap-1.5">
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-6 py-4 space-y-3">
            <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#roles" className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>Who it's for</a>
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="flex-1">
                <Button size="sm" variant="secondary" className="w-full">Login</Button>
              </Link>
              <Link href="/login" className="flex-1">
                <Button size="sm" className="w-full">Get Started</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <Badge className="mb-6 px-3 py-1 bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
            Quality Management Platform
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground text-balance leading-[1.08]">
            Quality Inspection &<br />
            <span className="text-primary">Supply Chain Management</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Connect Brands, Factories, and Inspection Agencies on a single platform. Streamline inspections, automate reports, and gain real-time quality visibility.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/login">
              <Button size="lg" className="gap-2 text-base px-6">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="secondary" size="lg" className="text-base px-6">
                See Features
              </Button>
            </a>
          </div>

          {/* Stats */}
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

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Everything you need to manage quality at scale</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              From template creation to automated reporting — built for multi-org workflows.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow"
                >
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

      {/* Roles */}
      <section id="roles" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Built for every stakeholder</h2>
            <p className="text-muted-foreground mt-3">Each role gets a purpose-built experience.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {roles.map((r) => {
              const Icon = r.icon
              return (
                <div
                  key={r.role}
                  className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', r.color)}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-3">{r.role}</h3>
                  <ul className="space-y-2">
                    {r.points.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
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

      {/* CTA Banner */}
      <section className="py-20 px-6 bg-primary">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-primary-foreground">Ready to streamline your quality operations?</h2>
          <p className="text-primary-foreground/80 mt-3 text-lg">
            Join teams managing inspections, factories, and supply chains on SankalpHub.
          </p>
          <Link href="/login">
            <Button
              size="lg"
              variant="secondary"
              className="mt-8 gap-2 text-base px-8"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span className="font-semibold text-foreground">SankalpHub</span>
            <span>— Quality Management Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <Link href="/login" className="hover:text-foreground transition-colors">Login</Link>
            <span>© {new Date().getFullYear()} SankalpHub. All rights reserved.</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
