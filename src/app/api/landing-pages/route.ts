import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateTrackingCode, slugify } from '@/lib/utils'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const landingPages = await prisma.landingPage.findMany({
    where: { tenantId: session.user.tenantId },
    include: { _count: { select: { applications: true, analyticsEvents: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(landingPages)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const slug = body.slug || slugify(body.name)

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
      slug,
      published: false,
      pageTitle: body.pageTitle || body.name,
      content: body.content || defaultContent(body.name),
    },
  })
  return NextResponse.json(landingPage)
}

function defaultContent(name: string) {
  return [
    {
      type: 'hero',
      headline: `Join ${name}`,
      subheadline: 'A better way to save and borrow. Become a member today.',
      ctaText: 'Apply now',
      ctaLink: '',
      backgroundColor: '',
    },
    {
      type: 'features',
      heading: 'Why join us?',
      items: [
        { icon: 'Shield', title: 'Safe & secure', body: 'Your savings are protected up to £85,000 by the FSCS.' },
        { icon: 'Percent', title: 'Great rates', body: 'Competitive savings rates and affordable loans for members.' },
        { icon: 'Users', title: 'Community owned', body: 'Credit unions are owned by their members — for people, not profit.' },
      ],
    },
    {
      type: 'cta',
      headline: 'Ready to join?',
      subheadline: 'It only takes a few minutes to apply online.',
      ctaText: 'Start your application',
      ctaLink: '',
    },
  ]
}
