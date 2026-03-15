import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, FileText, BarChart3, Eye, Settings2, Copy, Globe } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function FormsPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const forms = await prisma.form.findMany({
    where: { tenantId: session.user.tenantId },
    include: {
      _count: { select: { applications: true, sections: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
          <p className="text-gray-500">Build and manage your member join forms</p>
        </div>
        <Link href="/forms/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Form
          </Button>
        </Link>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No forms yet</h3>
            <p className="text-gray-500 mb-6">Create your first join form to start collecting applications</p>
            <Link href="/forms/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create your first form
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {forms.map(form => (
            <Card key={form.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{form.name}</CardTitle>
                    <CardDescription className="truncate">/{form.slug}</CardDescription>
                  </div>
                  <FormStatusBadge status={form.status} />
                </div>
              </CardHeader>
              <CardContent>
                {form.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{form.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span>{form._count.sections} sections</span>
                  <span>{form._count.applications} applications</span>
                  <span>Updated {formatDate(form.updatedAt)}</span>
                </div>

                {/* Product badges */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {form.includesSavings && <Badge variant="info" className="text-xs">Savings</Badge>}
                  {form.includesLoan && <Badge variant="warning" className="text-xs">Loan</Badge>}
                  {form.allowsCorporate && <Badge variant="secondary" className="text-xs">Corporate</Badge>}
                  {form.allowsChildren && <Badge variant="secondary" className="text-xs">Children</Badge>}
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/forms/${form.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Settings2 className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </Link>
                  <Link href={`/forms/${form.id}/analytics`}>
                    <Button variant="ghost" size="sm">
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                  </Link>
                  {form.status === 'PUBLISHED' && (
                    <Link href={`/join/${form.slug}`} target="_blank">
                      <Button variant="ghost" size="sm">
                        <Globe className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function FormStatusBadge({ status }: { status: string }) {
  if (status === 'PUBLISHED') return <Badge variant="success">Live</Badge>
  if (status === 'DRAFT') return <Badge variant="secondary">Draft</Badge>
  return <Badge variant="outline">Archived</Badge>
}
