import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { formId, sessionId, campaignCode } = body

  const form = await prisma.form.findFirst({ where: { id: formId } })
  if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 })

  // Resolve landing page by tracking code if provided
  let landingPageId: string | undefined
  if (campaignCode) {
    const lp = await prisma.landingPage.findFirst({ where: { trackingCode: campaignCode } })
    if (lp) landingPageId = lp.id
  }

  const userAgent = req.headers.get('user-agent') || undefined
  const referrer = req.headers.get('referer') || undefined

  const application = await prisma.application.create({
    data: {
      tenantId: form.tenantId,
      formId,
      sessionId,
      landingPageId,
      status: 'STARTED',
      memberType: 'INDIVIDUAL',
      products: {},
      userAgent,
      referrer,
    },
  })

  await prisma.applicationEvent.create({
    data: { applicationId: application.id, eventType: 'form_start', sectionIndex: 0 },
  })

  return NextResponse.json(application)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenantId')
  if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 })

  const search = searchParams.get('search')?.trim() || ''

  const where: Prisma.ApplicationWhereInput = { tenantId }

  if (search) {
    // Search across all indexed field values for this tenant's applications
    where.fieldValues = {
      some: {
        stringValue: { contains: search, mode: 'insensitive' }
      }
    }
  }

  const applications = await prisma.application.findMany({
    where,
    include: {
      form: true,
      landingPage: true,
      // Return matching field values when searching so the UI can highlight them
      fieldValues: search
        ? { where: { stringValue: { contains: search, mode: 'insensitive' } } }
        : false,
    },
    orderBy: { startedAt: 'desc' },
    take: 100,
  })

  return NextResponse.json(applications)
}
