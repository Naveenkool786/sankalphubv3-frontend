import { Building2, Users, Clock, Inbox, ClipboardCheck, Target, AlertCircle, UserPlus } from 'lucide-react'
import { getConsoleContext } from '@/lib/console/getConsoleContext'
import { getOverviewStats, getExpiringTrials, getRecentDemoRequests, getRecentSignups } from '@/lib/console/queries'
import { ConsoleKpiCard } from '@/components/console/ConsoleKpiCard'

export default async function ConsolePage() {
  const ctx = await getConsoleContext()

  const [stats, expiringTrials, recentDemos, recentSignups] = await Promise.all([
    getOverviewStats(),
    getExpiringTrials(3),
    getRecentDemoRequests(5),
    getRecentSignups(5),
  ])

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {ctx.fullName.split(' ')[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <ConsoleKpiCard title="Total Orgs" value={stats.totalOrgs} icon={Building2} />
        <ConsoleKpiCard title="Total Users" value={stats.totalUsers} icon={Users} />
        <ConsoleKpiCard title="Active Trials" value={stats.activeTrials} icon={Clock} />
        <ConsoleKpiCard title="Demo Requests" value={stats.demoRequests} icon={Inbox} />
        <ConsoleKpiCard title="Inspections" value={stats.totalInspections} icon={ClipboardCheck} />
        <ConsoleKpiCard title="Pass Rate" value={`${stats.passRate}%`} icon={Target} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Critical Signals */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" style={{ color: '#C9A96E' }} />
            Critical Signals
          </h2>
          <div className="space-y-3">
            {expiringTrials.length > 0 ? (
              expiringTrials.map((trial) => {
                const daysLeft = Math.max(0, Math.ceil(
                  (new Date(trial.trial_end!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                ))
                return (
                  <div key={trial.id} className="flex items-start gap-2.5">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${daysLeft <= 1 ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{trial.name}</p>
                      <p className="text-[11px] text-muted-foreground">Trial expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-xs text-muted-foreground">No critical signals right now.</p>
            )}
          </div>
        </div>

        {/* Recent Demo Requests */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Inbox className="w-4 h-4" style={{ color: '#C9A96E' }} />
            Recent Demo Requests
          </h2>
          <div className="space-y-3">
            {recentDemos.length > 0 ? (
              recentDemos.map((demo) => (
                <div key={demo.id} className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-blue-500" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{demo.full_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {demo.company_name} · {demo.role}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">
                    {new Date(demo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No demo requests yet.</p>
            )}
          </div>
        </div>

        {/* Recent Signups */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4" style={{ color: '#C9A96E' }} />
            Recent Signups
          </h2>
          <div className="space-y-3">
            {recentSignups.length > 0 ? (
              recentSignups.map((user) => (
                <div key={user.id} className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-emerald-500" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{user.full_name}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">{user.role.replace('_', ' ')}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">
                    {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No recent signups.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
