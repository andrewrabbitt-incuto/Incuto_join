import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const journeys = await prisma.journey.findMany({
    where: { tenantId: session.user.tenantId },
    include: {
      steps: {
        include: { form: { select: { id: true, name: true, slug: true } } },
      },
      _count: { select: { steps: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(journeys)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, description } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // Ensure slug is unique within tenant
  const existing = await prisma.journey.findUnique({
    where: { tenantId_slug: { tenantId: session.user.tenantId, slug } },
  })
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug

  // Create journey with a START and END node already placed
  const journey = await prisma.journey.create({
    data: {
      tenantId: session.user.tenantId,
      name: name.trim(),
      description: description?.trim() || null,
      slug: finalSlug,
      steps: {
        create: [
          { type: 'START', title: 'Start', positionX: 250, positionY: 50 },
          { type: 'END', title: 'Complete', positionX: 250, positionY: 500, config: { endType: 'SUCCESS', message: 'Thank you — your application is complete.' } },
        ],
      },
    },
    include: {
      steps: {
        include: { outgoingEdges: true, incomingEdges: true },
      },
    },
  })

  return NextResponse.json(journey, { status: 201 })
}
