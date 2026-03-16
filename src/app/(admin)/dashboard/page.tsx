import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  FileText, Users, TrendingUp, CheckCircle2,
  Plus, BarChart3, Globe, ArrowRight
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

async function getDashboardData(tenantId: string) {
  const [forms, applications, landingPages] = await Promise.all([
    prisma.form.findMany({
      where: { tenantId },
      include: { _count: { select: { applications: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.application.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { _all: true },
    }),
    prisma.landingPage.findMany({
      where: { tenantId, isActive: true },
      take: 3,
    }),
  ])
  return { forms, applications, landingPages }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const { forms, applications, landingPages } = await getDashboardData(session.user.tenantId)

  const totalApps = applications.reduce((sum, a) => sum + a._count._all, 0)
  const completedApps = applications.find(a => a.status === 'COMPLETED')?._count._all || 0
  const publishedForms = forms.filter(f => f.status === 'PUBLISHED').length
  const conversionRate = totalApps > 0 ? Math.round((completedApps / totalApps) * 100) : 0

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {session.user.name}</p>
        </div>
        <Link href="/forms/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Form
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={FileText} label="Published Forms" value={publishedForms} color="blue" />
        <StatCard icon={Users} label="Total Applications" value={totalApps} color="green" />
        <StatCard icon={CheckCircle2} label="Completions" value={completedApps} color="purple" />
        <StatCard icon={TrendingUp} label="Conversion Rate" value={`${conversionRate}%`} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forms */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Forms</CardTitle>
                <CardDescription>Your join forms and their performance</CardDescription>
              </div>
              <Link href="/forms">
                <Button variant="outline" size="sm">View all <ArrowRight className="w-3 h-3 ml-1" /></Button>
              </Link>
            </CardHeader>
            <CardContent>
              {forms.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No forms yet. Create your first form.</p>
                  <Link href="/forms/new">
                    <Button className="mt-4" size="sm">
                      <Plus className="w-4 h-4 mr-2" />Create form
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {forms.map(form => (
                    <div key={form.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{form.name}</span>
                          <StatusBadge status={form.status} />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">Updated {formatDate(form.updatedAt)}</p>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right">
                          <div className="text-sm font-semibold">{form._count.applications}</div>
                          <div className="text-xs text-gray-400">apps</div>
                        </div>
                        <Link href={`/forms/${form.id}`}>
                          <Button variant="ghost" size="sm"><ArrowRight className="w-4 h-4" /></Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions + Campaigns */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: '/forms/new', icon: FileText, label: 'Create new form' },
                { href: '/landing-pages', icon: Globe, label: 'Manage landing pages' },
                { href: '/branding', icon: BarChart3, label: 'Update branding' },
                { href: '/applications', icon: Users, label: 'View applications' },
              ].map(item => (
                <Link key={item.href} href={item.href}>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                    <ArrowRight className="w-3 h-3 ml-auto text-gray-400" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {landingPages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Active Landing Pages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {landingPages.map(lp => (
                  <div key={lp.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">{lp.name}</span>
                    <Badge variant="success" className="ml-auto text-xs">Active</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.FC<React.SVGProps<SVGSVGElement>>, label: string, value: string | number, color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'PUBLISHED') return <Badge variant="success">Live</Badge>
  if (status === 'DRAFT') return <Badge variant="secondary">Draft</Badge>
  return <Badge variant="outline">Archived</Badge>
}
