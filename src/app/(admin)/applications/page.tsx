import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Users, Search, Filter } from 'lucide-react'

export default async function ApplicationsPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const applications = await prisma.application.findMany({
    where: { tenantId: session.user.tenantId },
    include: {
      form: true,
      landingPage: true,
    },
    orderBy: { startedAt: 'desc' },
    take: 100,
  })

  const stats = {
    total: applications.length,
    completed: applications.filter(a => a.status === 'COMPLETED').length,
    inProgress: applications.filter(a => ['STARTED', 'IN_PROGRESS', 'SUBMITTED'].includes(a.status)).length,
    failed: applications.filter(a => ['ID_CHECK_FAILED', 'REJECTED', 'ABANDONED'].includes(a.status)).length,
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-gray-500">All member join applications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-700' },
          { label: 'Completed', value: stats.completed, color: 'text-green-600' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-blue-600' },
          { label: 'Failed/Abandoned', value: stats.failed, color: 'text-red-500' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-5 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
          <CardDescription>Showing latest 100 applications</CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-200" />
              <p className="text-gray-400">No applications yet. Share your form link to start collecting applications.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-gray-500 uppercase">
                    <th className="text-left pb-3 pr-4">Date</th>
                    <th className="text-left pb-3 pr-4">Form</th>
                    <th className="text-left pb-3 pr-4">Member Type</th>
                    <th className="text-left pb-3 pr-4">Products</th>
                    <th className="text-left pb-3 pr-4">Status</th>
                    <th className="text-left pb-3 pr-4">Landing Page</th>
                    <th className="text-left pb-3 pr-4">ID Check</th>
                    <th className="text-left pb-3">Incuto ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {applications.map(app => {
                    const products = app.products as Record<string, boolean> || {}
                    return (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="py-3 pr-4 text-gray-500">{formatDate(app.startedAt)}</td>
                        <td className="py-3 pr-4 font-medium">{app.form.name}</td>
                        <td className="py-3 pr-4 text-gray-500">{app.memberType}</td>
                        <td className="py-3 pr-4">
                          <div className="flex gap-1">
                            {products.savings && <Badge variant="info" className="text-xs">Savings</Badge>}
                            {products.loan && <Badge variant="warning" className="text-xs">Loan</Badge>}
                          </div>
                        </td>
                        <td className="py-3 pr-4"><AppStatusBadge status={app.status} /></td>
                        <td className="py-3 pr-4 text-gray-500">{app.landingPage?.name || '—'}</td>
                        <td className="py-3 pr-4">
                          {app.idCheckStatus ? <IdBadge status={app.idCheckStatus} /> : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3 font-mono text-xs text-gray-400">
                          {app.incutoMemberId || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AppStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'success' | 'destructive' | 'secondary' | 'warning' | 'info' }> = {
    COMPLETED: { label: 'Completed', variant: 'success' },
    ABANDONED: { label: 'Abandoned', variant: 'destructive' },
    STARTED: { label: 'Started', variant: 'secondary' },
    IN_PROGRESS: { label: 'In Progress', variant: 'info' },
    SUBMITTED: { label: 'Submitted', variant: 'info' },
    ID_CHECK_PENDING: { label: 'ID Pending', variant: 'warning' },
    ID_CHECK_FAILED: { label: 'ID Failed', variant: 'destructive' },
    VOUCHSAFE_PENDING: { label: 'Vouchsafe', variant: 'warning' },
    REJECTED: { label: 'Rejected', variant: 'destructive' },
  }
  const c = map[status] || { label: status, variant: 'secondary' as const }
  return <Badge variant={c.variant}>{c.label}</Badge>
}

function IdBadge({ status }: { status: string }) {
  if (status === 'PASSED') return <Badge variant="success" className="text-xs">Passed</Badge>
  if (status === 'FAILED') return <Badge variant="destructive" className="text-xs">Failed</Badge>
  return <Badge variant="warning" className="text-xs">{status}</Badge>
}
