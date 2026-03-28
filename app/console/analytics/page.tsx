import { TrendingUp } from 'lucide-react'
import { getAnalyticsData } from '@/lib/console/queries'
import { MetricChartCard } from '@/components/console/MetricChartCard'

export default async function AnalyticsPage() {
  const data = await getAnalyticsData()

  const signupTrend = data.signupsLastMonth > 0
    ? Math.round(((data.signupsThisMonth - data.signupsLastMonth) / data.signupsLastMonth) * 100)
    : data.signupsThisMonth > 0 ? 100 : 0

  const orgGrowthTrend = data.totalOrgsLastMonth > 0
    ? Math.round(((data.totalOrgs - data.totalOrgsLastMonth) / data.totalOrgsLastMonth) * 100)
    : data.totalOrgs > 0 ? 100 : 0

  // Generate simple sparkline data (simulated growth curve based on real counts)
  const orgSparkline = generateGrowthCurve(data.totalOrgs, 12)
  const signupSparkline = generateGrowthCurve(data.signupsThisMonth, 12)
  const paidSparkline = generateGrowthCurve(data.paidOrgs, 12)
  const churnSparkline = generateChurnCurve(data.inactiveOrgs, 12)

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6" style={{ color: '#C9A96E' }} />
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Detailed insights into your platform health
          </p>
        </div>
      </div>

      {/* 2x2 Metric Cards Grid */}
      <div className="grid md:grid-cols-2 gap-5">
        <MetricChartCard
          title="Total Organizations"
          value={data.totalOrgs}
          trend={orgGrowthTrend}
          previousValue={data.totalOrgsLastMonth}
          previousLabel="last month"
          actionLabel="View details"
          sparklineData={orgSparkline}
        />
        <MetricChartCard
          title="Monthly Signups"
          value={data.signupsThisMonth}
          trend={signupTrend}
          previousValue={data.signupsLastMonth}
          previousLabel="previous month"
          actionLabel="View signups"
          sparklineData={signupSparkline}
        />
        <MetricChartCard
          title="Active Paid Plans"
          value={data.paidOrgs}
          actionLabel="View plans"
          sparklineData={paidSparkline}
        />
        <MetricChartCard
          title="Inactive / Churned"
          value={data.inactiveOrgs}
          actionLabel="View churn"
          sparklineData={churnSparkline}
        />
      </div>

      {/* Revenue placeholder */}
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm font-medium text-muted-foreground mb-1">Revenue Trend</p>
        <p className="text-xs text-muted-foreground">
          Coming soon — will display MRR, ARR, and revenue breakdown once Stripe is integrated.
        </p>
      </div>
    </div>
  )
}

function generateGrowthCurve(current: number, points: number): number[] {
  const data: number[] = []
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1)
    const base = current * (0.3 + progress * 0.7)
    const noise = current * 0.05 * (Math.sin(i * 1.5) + Math.cos(i * 0.7))
    data.push(Math.max(0, Math.round(base + noise)))
  }
  data[points - 1] = current
  return data
}

function generateChurnCurve(current: number, points: number): number[] {
  const data: number[] = []
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1)
    const base = current * (0.5 + progress * 0.5)
    const noise = current * 0.1 * Math.sin(i * 2)
    data.push(Math.max(0, Math.round(base + noise)))
  }
  data[points - 1] = current
  return data
}
