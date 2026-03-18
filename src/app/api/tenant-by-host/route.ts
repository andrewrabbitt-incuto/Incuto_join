import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Lightweight lookup: given a hostname (custom domain), return the tenantSlug.
 * Called by middleware for custom-domain routing. Cached by middleware for 5 min.
 */
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const host = req.nextUrl.searchParams.get('host')
  if (!host) return NextResponse.json({}, { status: 400 })

  const tenant = await prisma.tenant.findUnique({
    where: { customDomain: host },
    select: { slug: true },
  })

  if (!tenant) return NextResponse.json({})
  return NextResponse.json({ tenantSlug: tenant.slug })
}
