import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const page = await prisma.landingPage.findFirst({
    where: { id: params.id, tenantId: session.user.tenantId },
    include: { _count: { select: { applications: true, analyticsEvents: true } } },
  })
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(page)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const page = await prisma.landingPage.findFirst({
    where: { id: params.id, tenantId: session.user.tenantId },
  })
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const updated = await prisma.landingPage.update({
    where: { id: params.id },
    data: {
      name: body.name ?? page.name,
      description: body.description ?? page.description,
      slug: body.slug ?? page.slug,
      published: body.published ?? page.published,
      pageTitle: body.pageTitle ?? page.pageTitle,
      seoDescription: body.seoDescription ?? page.seoDescription,
      ogImageUrl: body.ogImageUrl ?? page.ogImageUrl,
      content: body.content ?? page.content,
      utmSource: body.utmSource ?? page.utmSource,
      utmMedium: body.utmMedium ?? page.utmMedium,
      utmCampaign: body.utmCampaign ?? page.utmCampaign,
      isActive: body.isActive ?? page.isActive,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const page = await prisma.landingPage.findFirst({
    where: { id: params.id, tenantId: session.user.tenantId },
  })
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.landingPage.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
