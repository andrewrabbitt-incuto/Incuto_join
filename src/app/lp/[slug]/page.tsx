import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { PageSection } from '@/types/landing-page'
import { LandingPageRenderer } from '@/components/landing-page/LandingPageRenderer'
import type { FormBranding } from '@/types'

interface PageProps {
  params: { slug: string }
  searchParams: { [key: string]: string | undefined }
}

async function findPage(slug: string) {
  const headersList = headers()
  const tenantSlug = headersList.get('x-tenant-slug')

  if (tenantSlug) {
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
    if (!tenant) return null
    return prisma.landingPage.findFirst({
      where: { tenantId: tenant.id, slug, published: true, isActive: true },
      include: { tenant: true },
    })
  }

  return prisma.landingPage.findFirst({
    where: { slug, published: true, isActive: true },
    include: { tenant: true },
  })
}

export default async function LandingPageRoute({ params, searchParams }: PageProps) {
  const page = await findPage(params.slug)
  if (!page) notFound()

  const tenant = page.tenant
  const sections = (page.content ?? []) as PageSection[]

  const branding: FormBranding = {
    primaryColor: tenant.primaryColor,
    secondaryColor: tenant.secondaryColor,
    accentColor: tenant.accentColor,
    logoUrl: tenant.logoUrl || undefined,
    fontFamily: tenant.fontFamily,
    borderRadius: tenant.borderRadius,
    customCss: tenant.customCss || undefined,
  }

  // Build tracking params to append to CTA links
  const utmParams = new URLSearchParams()
  if (page.utmSource) utmParams.set('utm_source', page.utmSource)
  if (page.utmMedium) utmParams.set('utm_medium', page.utmMedium)
  if (page.utmCampaign) utmParams.set('utm_campaign', page.utmCampaign)
  utmParams.set('campaign', page.trackingCode)

  const seoTitle = page.pageTitle ?? page.name
  const seoDesc = page.seoDescription ?? undefined

  return (
    <>
      <head>
        <title>{seoTitle}</title>
        {seoDesc && <meta name="description" content={seoDesc} />}
        {page.ogImageUrl && <meta property="og:image" content={page.ogImageUrl} />}
        <meta property="og:title" content={seoTitle} />
        {seoDesc && <meta property="og:description" content={seoDesc} />}
        {tenant.faviconUrl && <link rel="icon" href={tenant.faviconUrl} />}
      </head>

      <LandingPageRenderer
        pageId={page.id}
        sections={sections}
        branding={branding}
        tenantName={tenant.name}
        utmString={utmParams.toString()}
      />
    </>
  )
}
