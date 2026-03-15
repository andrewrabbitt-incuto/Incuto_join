import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Users, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { AnalyticsCharts } from '@/components/admin/AnalyticsCharts'
import { formatDate } from '@/lib/utils'

export default async function FormAnalyticsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const form = await prisma.form.findFirst({
    where: { id: params.id, tenantId: session.user.tenantId },
  })
  if (!form) notFound()

  // Fetch applications for this form
  const applications = await prisma.application.findMany({
    where: { formId: params.id },
    include: { campaign: true },
    orderBy: { startedAt: 'desc' },
  })

  const total = applications.length
  const completed = applications.filter(a => a.status === 'COMPLETED').length
  const abandoned = applications.filter(a => a.status === 'ABANDONED').length
  const inProgress = applications.filter(a => ['STARTED', 'IN_PROGRESS', 'SUBMITTED', 'ID_CHECK_PENDING'].includes(a.status)).length
  const conversionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  // Dropout by section
  const dropoutBySection: Record<string, number> = {}
  applications.filter(a => a.dropoutSection).forEach(a => {
    const key = a.dropoutSection || 'unknown'
    dropoutBySection[key] = (dropoutBySection[key] || 0) + 1
  })

  // By product
  const byProduct = {
    savings: applications.filter(a => {
      const p = a.products as Record<string, boolean>
      return p?.savings && !p?.loan
    }).length,
    loan: applications.filter(a => {
      const p = a.products as Record<string, boolean>
      return p?.loan && !p?.savings
    }).length,
    both: applications.filter(a => {
      const p = a.products as Record<string, boolean>
      return p?.savings && p?.loan
    }).length,
  }

  // Trend (last 7 days)
  const trend = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const dayApps = applications.filter(a => a.startedAt.toISOString().split('T')[0] === dateStr)
    return {
      date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      starts: dayApps.length,
      completions: dayApps.filter(a => a.status === 'COMPLETED').length,
    }
  })

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/forms/${params.id}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Analytics: {form.name}</h1>
          <p className="text-gray-500">Application performance and insights</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard icon={Users} label="Total Starts" value={total} color="blue" />
        <StatCard icon={CheckCircle2} label="Completed" value={completed} color="green" />
        <StatCard icon={XCircle} label="Abandoned" value={abandoned} color="red" />
        <StatCard icon={Clock} label="In Progress" value={inProgress} color="yellow" />
        <StatCard icon={TrendingUp} label="Conversion" value={`${conversionRate}%`} color="purple" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">7-Day Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsCharts trend={trend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications by Product</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Savings Only', value: byProduct.savings, color: 'bg-blue-500' },
                { label: 'Loan Only', value: byProduct.loan, color: 'bg-orange-500' },
                { label: 'Savings + Loan', value: byProduct.both, color: 'bg-purple-500' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.label}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full`}
                      style={{ width: total > 0 ? `${(item.value / total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent applications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Applications</CardTitle>
          <CardDescription>Last 20 applications</CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No applications yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-gray-500 uppercase">
                    <th className="text-left pb-2 pr-4">Started</th>
                    <th className="text-left pb-2 pr-4">Status</th>
                    <th className="text-left pb-2 pr-4">Member Type</th>
                    <th className="text-left pb-2 pr-4">Campaign</th>
                    <th className="text-left pb-2">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {applications.slice(0, 20).map(app => (
                    <tr key={app.id}>
                      <td className="py-2 pr-4 text-gray-600">{formatDate(app.startedAt)}</td>
                      <td className="py-2 pr-4"><AppStatusBadge status={app.status} /></td>
                      <td className="py-2 pr-4 text-gray-600">{app.memberType}</td>
                      <td className="py-2 pr-4 text-gray-600">{app.campaign?.name || '—'}</td>
                      <td className="py-2 text-gray-600">{app.completedAt ? formatDate(app.completedAt) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.FC<React.SVGProps<SVGSVGElement>>, label: string, value: string | number, color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AppStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'success' | 'destructive' | 'secondary' | 'warning' | 'info' }> = {
    COMPLETED: { label: 'Completed', variant: 'success' },
    ABANDONED: { label: 'Abandoned', variant: 'destructive' },
    STARTED: { label: 'Started', variant: 'secondary' },
    IN_PROGRESS: { label: 'In Progress', variant: 'info' },
    SUBMITTED: { label: 'Submitted', variant: 'info' },
    ID_CHECK_PENDING: { label: 'ID Check', variant: 'warning' },
    ID_CHECK_FAILED: { label: 'ID Failed', variant: 'destructive' },
    REJECTED: { label: 'Rejected', variant: 'destructive' },
  }
  const config = map[status] || { label: status, variant: 'secondary' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
