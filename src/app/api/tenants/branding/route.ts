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
      primaryColor: true, secondaryColor: true, accentColor: true,
      logoUrl: true, faviconUrl: true, fontFamily: true, borderRadius: true, customCss: true,
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
      primaryColor: body.primaryColor,
      secondaryColor: body.secondaryColor,
      accentColor: body.accentColor,
      logoUrl: body.logoUrl || null,
      faviconUrl: body.faviconUrl || null,
      fontFamily: body.fontFamily,
      borderRadius: body.borderRadius,
      customCss: body.customCss || null,
    },
  })
  return NextResponse.json(tenant)
}
