import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { JourneyBuilder } from '@/components/journey-builder/JourneyBuilder'
import type { JourneyDef } from '@/types'

export default async function JourneyBuilderPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const [journeyData, forms] = await Promise.all([
    prisma.journey.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId },
      include: {
        steps: {
          include: {
            form: { select: { id: true, name: true, slug: true } },
            outgoingEdges: { orderBy: { order: 'asc' } },
          },
        },
      },
    }),
    prisma.form.findMany({
      where: { tenantId: session.user.tenantId, status: 'PUBLISHED' },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!journeyData) notFound()

  const edges = journeyData.steps.flatMap(s =>
    s.outgoingEdges.map(e => ({
      id: e.id,
      sourceStepId: e.sourceStepId,
      targetStepId: e.targetStepId,
      condition: e.condition as unknown as JourneyDef['edges'][number]['condition'],
      label: e.label ?? undefined,
      order: e.order,
    }))
  )

  const journey: JourneyDef = {
    id: journeyData.id,
    tenantId: journeyData.tenantId,
    name: journeyData.name,
    description: journeyData.description ?? undefined,
    slug: journeyData.slug,
    status: journeyData.status as JourneyDef['status'],
    steps: journeyData.steps.map(s => ({
      id: s.id,
      type: s.type as JourneyDef['steps'][number]['type'],
      title: s.title,
      positionX: s.positionX,
      positionY: s.positionY,
      formId: s.formId ?? undefined,
      form: s.form ?? undefined,
      config: s.config as JourneyDef['steps'][number]['config'],
    })),
    edges,
  }

  return (
    <div className="h-screen flex flex-col">
      <JourneyBuilder journey={journey} availableForms={forms} />
    </div>
  )
}
