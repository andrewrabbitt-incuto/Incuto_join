import { cache } from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import type { PageSection } from '@/types/landing-page'
import { LandingPageRenderer } from '@/components/landing-page/LandingPageRenderer'
import type { FormBranding } from '@/types'

interface PageProps {
  params: { slug: string }
  searchParams: { [key: string]: string | undefined }
}

const findPage = cache(async (slug: string) => {
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
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await findPage(params.slug)
  if (!page) return {}

  const title = page.pageTitle ?? page.name
  const description = page.seoDescription ?? undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: page.ogImageUrl ? [page.ogImageUrl] : [],
    },
    icons: page.tenant.faviconUrl ? { icon: page.tenant.faviconUrl } : undefined,
  }
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

  const utmParams = new URLSearchParams()
  if (page.utmSource) utmParams.set('utm_source', page.utmSource)
  if (page.utmMedium) utmParams.set('utm_medium', page.utmMedium)
  if (page.utmCampaign) utmParams.set('utm_campaign', page.utmCampaign)
  utmParams.set('campaign', page.trackingCode)

  return (
    <LandingPageRenderer
      pageId={page.id}
      sections={sections}
      branding={branding}
      tenantName={tenant.name}
      utmString={utmParams.toString()}
    />
  )
}
