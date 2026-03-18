import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { v4 as uuid } from 'uuid'

export const dynamic = 'force-dynamic'

const VALID_EVENTS = new Set([
  'PAGE_VIEW', 'FORM_START', 'FORM_COMPLETE',
  'JOURNEY_START', 'JOURNEY_COMPLETE',
])

/**
 * POST /api/analytics
 * Body: { eventType, sessionId, landingPageId?, formId?, journeyId?, utmSource?, utmMedium?, utmCampaign?, referrer?, metadata? }
 * Tenant is resolved via x-tenant-slug header (set by middleware).
 */
export async function POST(req: NextRequest) {
  const headersList = headers()
  const tenantSlug = headersList.get('x-tenant-slug')

  const body = await req.json()
  const { eventType, sessionId, landingPageId, formId, journeyId, utmSource, utmMedium, utmCampaign, referrer, metadata } = body

  if (!VALID_EVENTS.has(eventType)) {
    return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 })
  }

  let tenantId: string | null = null

  if (tenantSlug) {
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug }, select: { id: true } })
    tenantId = tenant?.id ?? null
  }

  // If we still don't have a tenant, try to look it up from the referenceId
  if (!tenantId && formId) {
    const form = await prisma.form.findUnique({ where: { id: formId }, select: { tenantId: true } })
    tenantId = form?.tenantId ?? null
  }
  if (!tenantId && landingPageId) {
    const lp = await prisma.landingPage.findUnique({ where: { id: landingPageId }, select: { tenantId: true } })
    tenantId = lp?.tenantId ?? null
  }

  if (!tenantId) {
    // Accept the event silently without storing (unresolvable tenant)
    return NextResponse.json({ ok: true })
  }

  await prisma.analyticsEvent.create({
    data: {
      id: uuid(),
      tenantId,
      eventType,
      landingPageId: landingPageId || null,
      formId: formId || null,
      journeyId: journeyId || null,
      sessionId: sessionId || uuid(),
      utmSource: utmSource || null,
      utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null,
      referrer: referrer || null,
      metadata: metadata || null,
    },
  })

  return NextResponse.json({ ok: true })
}

/**
 * GET /api/analytics?since=30d
 * Returns aggregated event counts for the tenant's dashboard.
 */
export async function GET(req: NextRequest) {
  const headersList = headers()
  const tenantSlug = headersList.get('x-tenant-slug')
  if (!tenantSlug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug }, select: { id: true } })
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sinceParam = req.nextUrl.searchParams.get('since') ?? '30d'
  const days = sinceParam === '7d' ? 7 : sinceParam === '90d' ? 90 : 30
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // Landing page stats
  const lpEvents = await prisma.analyticsEvent.groupBy({
    by: ['landingPageId', 'eventType'],
    where: { tenantId: tenant.id, landingPageId: { not: null }, createdAt: { gte: since } },
    _count: { id: true },
  })

  // Form stats
  const formEvents = await prisma.analyticsEvent.groupBy({
    by: ['formId', 'eventType'],
    where: { tenantId: tenant.id, formId: { not: null }, createdAt: { gte: since } },
    _count: { id: true },
  })

  // Journey stats
  const journeyEvents = await prisma.analyticsEvent.groupBy({
    by: ['journeyId', 'eventType'],
    where: { tenantId: tenant.id, journeyId: { not: null }, createdAt: { gte: since } },
    _count: { id: true },
  })

  // Daily page views (for sparkline)
  const dailyViews = await prisma.$queryRaw<{ date: string; count: number }[]>`
    SELECT DATE("createdAt")::text as date, COUNT(*)::int as count
    FROM analytics_events
    WHERE "tenantId" = ${tenant.id}
      AND "eventType" = 'PAGE_VIEW'
      AND "createdAt" >= ${since}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `

  return NextResponse.json({ lpEvents, formEvents, journeyEvents, dailyViews, days })
}
