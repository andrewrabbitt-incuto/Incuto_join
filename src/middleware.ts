import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// The root domain for all credit union subdomains, e.g. cuaccount.com
// Set BASE_DOMAIN in your environment variables.
const BASE_DOMAIN = process.env.BASE_DOMAIN || 'cuaccount.com'

export function middleware(request: NextRequest) {
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

  return NextResponse.next()
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
