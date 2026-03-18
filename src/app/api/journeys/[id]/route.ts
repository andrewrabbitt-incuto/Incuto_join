import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const journey = await prisma.journey.findFirst({
    where: { id: params.id, tenantId: session.user.tenantId },
    include: {
      steps: {
        include: {
          form: { select: { id: true, name: true, slug: true } },
          outgoingEdges: { orderBy: { order: 'asc' } },
        },
      },
    },
  })

  if (!journey) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Flatten edges onto the journey object for convenience
  const edges = journey.steps.flatMap(s => s.outgoingEdges)
  return NextResponse.json({ ...journey, edges })
}

export async function PUT(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const journey = await prisma.journey.findFirst({
    where: { id: params.id, tenantId: session.user.tenantId },
  })
  if (!journey) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { name, description, status, resumable, steps, edges } = body

  // Upsert all steps, then upsert all edges in a transaction
  await prisma.$transaction(async tx => {
    // Update journey metadata
    await tx.journey.update({
      where: { id: params.id },
      data: {
        name: name ?? journey.name,
        description: description ?? journey.description,
        status: status ?? journey.status,
        resumable: resumable ?? journey.resumable,
        updatedAt: new Date(),
      },
    })

    // Delete edges first (FK constraint), then steps no longer in the graph
    const incomingStepIds: string[] = (steps ?? []).map((s: { id: string }) => s.id)
    await tx.journeyEdge.deleteMany({ where: { journeyId: params.id } })
    await tx.journeyStep.deleteMany({
      where: { journeyId: params.id, id: { notIn: incomingStepIds } },
    })

    // Upsert steps
    for (const step of steps ?? []) {
      await tx.journeyStep.upsert({
        where: { id: step.id },
        create: {
          id: step.id,
          journeyId: params.id,
          type: step.type,
          title: step.title,
          positionX: step.positionX ?? 0,
          positionY: step.positionY ?? 0,
          formId: step.formId ?? null,
          config: step.config ?? null,
        },
        update: {
          type: step.type,
          title: step.title,
          positionX: step.positionX ?? 0,
          positionY: step.positionY ?? 0,
          formId: step.formId ?? null,
          config: step.config ?? null,
        },
      })
    }

    // Re-create edges
    for (const edge of edges ?? []) {
      await tx.journeyEdge.create({
        data: {
          id: edge.id,
          journeyId: params.id,
          sourceStepId: edge.sourceStepId,
          targetStepId: edge.targetStepId,
          condition: edge.condition ?? null,
          label: edge.label ?? null,
          order: edge.order ?? 0,
        },
      })
    }
  })

  // Return updated journey
  const updated = await prisma.journey.findFirst({
    where: { id: params.id },
    include: {
      steps: {
        include: {
          form: { select: { id: true, name: true, slug: true } },
          outgoingEdges: { orderBy: { order: 'asc' } },
        },
      },
    },
  })
  const allEdges = (updated?.steps ?? []).flatMap(s => s.outgoingEdges)
  return NextResponse.json({ ...updated, edges: allEdges })
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const journey = await prisma.journey.findFirst({
    where: { id: params.id, tenantId: session.user.tenantId },
  })
  if (!journey) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.journey.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
