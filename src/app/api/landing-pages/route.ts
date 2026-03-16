import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateTrackingCode } from '@/lib/utils'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const landingPages = await prisma.landingPage.findMany({
    where: { tenantId: session.user.tenantId },
    include: { _count: { select: { applications: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(landingPages)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const landingPage = await prisma.landingPage.create({
    data: {
      tenantId: session.user.tenantId,
      name: body.name,
      description: body.description || null,
      utmSource: body.utmSource || null,
      utmMedium: body.utmMedium || null,
      utmCampaign: body.utmCampaign || null,
      trackingCode: generateTrackingCode(),
      isActive: body.isActive ?? true,
    },
  })
  return NextResponse.json(landingPage)
}
