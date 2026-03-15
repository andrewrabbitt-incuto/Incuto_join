import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: {
      name: true,
      incutoApiUrl: true,
      incutoApiKey: true,
      incutoTenantId: true,
      idCheckEnabled: true,
      vouchsafeEnabled: true,
      aiChatbotEnabled: true,
    },
  })
  return NextResponse.json(tenant)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const tenant = await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: {
      ...(body.name && { name: body.name }),
      incutoApiUrl: body.incutoApiUrl || null,
      incutoApiKey: body.incutoApiKey || null,
      incutoTenantId: body.incutoTenantId || null,
      idCheckEnabled: body.idCheckEnabled ?? true,
      vouchsafeEnabled: body.vouchsafeEnabled ?? true,
      aiChatbotEnabled: body.aiChatbotEnabled ?? true,
    },
  })
  return NextResponse.json(tenant)
}
