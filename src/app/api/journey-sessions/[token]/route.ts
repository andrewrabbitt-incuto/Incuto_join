import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const session = await prisma.journeySession.findUnique({
    where: { resumeToken: params.token },
    include: { journey: { select: { id: true, name: true, slug: true, resumable: true } } },
  })

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.tokenExpiresAt < new Date()) return NextResponse.json({ error: 'Session expired' }, { status: 410 })

  return NextResponse.json({
    sessionId: session.id,
    journeyId: session.journeyId,
    journey: session.journey,
    email: session.email,
    phone: session.phone,
    currentStepId: session.currentStepId,
    journeyData: session.journeyData,
    stepResults: session.stepResults,
    verified: !!session.verifiedAt,
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const session = await prisma.journeySession.findUnique({ where: { resumeToken: params.token } })
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.tokenExpiresAt < new Date()) return NextResponse.json({ error: 'Session expired' }, { status: 410 })

  const body = await req.json()
  const { currentStepId, journeyData, stepResults } = body

  const updated = await prisma.journeySession.update({
    where: { resumeToken: params.token },
    data: {
      currentStepId: currentStepId ?? session.currentStepId,
      journeyData: journeyData ?? session.journeyData,
      stepResults: stepResults ?? session.stepResults,
    },
  })

  return NextResponse.json({ sessionId: updated.id })
}
