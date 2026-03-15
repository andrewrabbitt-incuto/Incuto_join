import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { formId, sessionId, campaignCode } = body

  const form = await prisma.form.findFirst({ where: { id: formId } })
  if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 })

  // Resolve campaign if code provided
  let campaignId: string | undefined
  if (campaignCode) {
    const campaign = await prisma.campaign.findFirst({ where: { trackingCode: campaignCode } })
    if (campaign) campaignId = campaign.id
  }

  // Extract UTM params from referrer
  const userAgent = req.headers.get('user-agent') || undefined
  const referrer = req.headers.get('referer') || undefined

  const application = await prisma.application.create({
    data: {
      tenantId: form.tenantId,
      formId,
      sessionId,
      campaignId,
      status: 'STARTED',
      memberType: 'INDIVIDUAL',
      products: {},
      userAgent,
      referrer,
    },
  })

  // Track event
  await prisma.applicationEvent.create({
    data: {
      applicationId: application.id,
      eventType: 'form_start',
      sectionIndex: 0,
    },
  })

  return NextResponse.json(application)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenantId')
  if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 })

  const applications = await prisma.application.findMany({
    where: { tenantId },
    include: { form: true, campaign: true },
    orderBy: { startedAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(applications)
}
