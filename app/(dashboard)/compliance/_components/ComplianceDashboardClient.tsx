'use client'

import Link from 'next/link'
import { ShieldCheck, Calendar, Award, AlertTriangle, Leaf, ClipboardList, FileCheck, BarChart3, Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AUDIT_STATUS_CONFIG, RATING_CONFIG, type FactoryAudit, type AuditStatus, type AuditRating } from '@/lib/types/compliance'

interface Props {
  upcomingAudits: number; expiringCerts: number; openCARs: number; avgESG: number
  recentAudits: FactoryAudit[]; canManage: boolean
}

export function ComplianceDashboardClient({ upcomingAudits, expiringCerts, openCARs, avgESG, recentAudits }: Props) {
  const esgColor = avgESG >= 70 ? 'text-green-600' : avgESG >= 40 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" style={{ color: '#D4A843' }} /> Compliance & Certifications
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Regulatory compliance, audits, ESG, and go-to-market</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <Calendar className="w-4 h-4 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{upcomingAudits}</p>
          <p className="text-[10px] text-muted-foreground">Audits Due (30d)</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <Award className="w-4 h-4 text-orange-500 mb-2" />
          <p className="text-2xl font-bold">{expiringCerts}</p>
          <p className="text-[10px] text-muted-foreground">Certs Expiring (60d)</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <AlertTriangle className="w-4 h-4 text-red-500 mb-2" />
          <p className="text-2xl font-bold">{openCARs}</p>
          <p className="text-[10px] text-muted-foreground">Open CARs</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <Leaf className="w-4 h-4 text-green-500 mb-2" />
          <p className={`text-2xl font-bold ${esgColor}`}>{avgESG || '—'}</p>
          <p className="text-[10px] text-muted-foreground">Avg ESG Score</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Regulations', href: '/compliance/regulations', icon: <ClipboardList className="w-4 h-4" /> },
          { label: 'Audits', href: '/compliance/audits', icon: <FileCheck className="w-4 h-4" /> },
          { label: 'Certifications', href: '/compliance/certifications', icon: <Award className="w-4 h-4" /> },
          { label: 'ESG / Sustainability', href: '/compliance/sustainability', icon: <Leaf className="w-4 h-4" /> },
          { label: 'Marketing Milestones', href: '/compliance/marketing', icon: <Target className="w-4 h-4" /> },
        ].map(link => (
          <Link key={link.href} href={link.href} className="bg-card rounded-xl border border-border p-3 hover:bg-muted/20 transition-colors flex items-center gap-2 text-xs font-medium">
            <span style={{ color: '#D4A843' }}>{link.icon}</span> {link.label}
          </Link>
        ))}
      </div>

      {/* Recent audits */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recent Audits</h3>
          <Link href="/compliance/audits" className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
        </div>
        {recentAudits.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No audits yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Factory</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Standard</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">Rating</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {recentAudits.map(a => {
                  const sCfg = AUDIT_STATUS_CONFIG[a.status as AuditStatus] || AUDIT_STATUS_CONFIG.scheduled
                  const rCfg = a.overall_rating ? RATING_CONFIG[a.overall_rating as AuditRating] : null
                  return (
                    <tr key={a.id} className="hover:bg-muted/20">
                      <td className="px-3 py-2"><Link href={`/compliance/audits/${a.id}`} className="hover:underline font-medium">{a.factories?.name || '—'}</Link></td>
                      <td className="px-3 py-2 text-muted-foreground capitalize">{a.audit_type.replace(/_/g, ' ')}</td>
                      <td className="px-3 py-2 text-muted-foreground">{a.audit_standard || '—'}</td>
                      <td className="px-3 py-2">{a.audit_date || '—'}</td>
                      <td className="px-3 py-2 text-center">{rCfg ? <span className="font-bold" style={{ color: rCfg.color }}>{rCfg.label}</span> : '—'}</td>
                      <td className="px-3 py-2"><Badge style={{ backgroundColor: sCfg.bg, color: sCfg.color }} className="text-[10px]">{sCfg.label}</Badge></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
