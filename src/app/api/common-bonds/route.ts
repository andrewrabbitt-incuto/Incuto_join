import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bonds = await prisma.commonBond.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(bonds)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const bond = await prisma.commonBond.create({
    data: {
      tenantId: session.user.tenantId,
      name: body.name,
      type: body.type || 'GEOGRAPHICAL',
      description: body.description || null,
      values: body.values || [],
    },
  })
  return NextResponse.json(bond)
}
