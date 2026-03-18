import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// The root domain for all credit union subdomains, e.g. cuaccount.com
// Set BASE_DOMAIN in your environment variables.
const BASE_DOMAIN = process.env.BASE_DOMAIN || 'cuaccount.com'

// Internal paths that should never be intercepted for tenant resolution
const SKIP_PATHS = ['/api/tenant-by-host', '/api/health', '/_next']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') || ''
  // Strip port (useful for local dev / Railway internal routing)
  const hostname = host.split(':')[0]

  // If the request is on a subdomain of the base domain, extract the tenant slug
  // e.g. "demo-credit-union.cuaccount.com" → tenantSlug = "demo-credit-union"
  if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
    const tenantSlug = hostname.slice(0, hostname.length - BASE_DOMAIN.length - 1)

    if (tenantSlug) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-tenant-slug', tenantSlug)
      return NextResponse.next({ request: { headers: requestHeaders } })
    }
  }

  // For custom domains (not our own subdomains), look up which tenant owns this domain.
  // This allows CUs to CNAME their own domain to our Railway service.
  const isSkipped = SKIP_PATHS.some(p => pathname.startsWith(p))
  const isOwnDomain = hostname === BASE_DOMAIN || hostname === 'localhost'
  if (!isOwnDomain && !isSkipped) {
    try {
      const baseUrl = process.env.NEXTAUTH_URL ?? `https://${host}`
      const lookupRes = await fetch(
        `${baseUrl}/api/tenant-by-host?host=${encodeURIComponent(hostname)}`,
        { next: { revalidate: 300 } } // cache for 5 minutes
      )
      if (lookupRes.ok) {
        const { tenantSlug } = await lookupRes.json() as { tenantSlug?: string }
        if (tenantSlug) {
          const requestHeaders = new Headers(request.headers)
          requestHeaders.set('x-tenant-slug', tenantSlug)
          requestHeaders.set('x-custom-domain', hostname)
          return NextResponse.next({ request: { headers: requestHeaders } })
        }
      }
    } catch {
      // Lookup failed — continue without tenant context
    }
  }

  return NextResponse.next()
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
