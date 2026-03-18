export type HeroSection = {
  type: 'hero'
  headline: string
  subheadline?: string
  ctaText: string
  ctaLink: string          // relative URL e.g. /form/join?campaign=CODE
  backgroundImageUrl?: string
  backgroundColor?: string // CSS colour or gradient
}

export type FeaturesSection = {
  type: 'features'
  heading?: string
  columns?: 2 | 3 | 4
  items: {
    icon?: string  // Lucide icon name
    title: string
    body: string
  }[]
}

export type RatesSection = {
  type: 'rates'
  heading?: string
  note?: string
  items: {
    product: string
    rate: string   // e.g. "3.0% AER"
    term?: string  // e.g. "Regular savings"
    highlight?: boolean
  }[]
}

export type TestimonialsSection = {
  type: 'testimonials'
  heading?: string
  items: {
    quote: string
    author: string
    role?: string
  }[]
}

export type TrustBadgesSection = {
  type: 'trust'
  items: {
    icon?: string  // Lucide icon name
    label: string
  }[]
}

export type FaqSection = {
  type: 'faq'
  heading?: string
  items: {
    question: string
    answer: string
  }[]
}

export type RichTextSection = {
  type: 'richtext'
  content: string  // plain HTML
}

export type CtaSection = {
  type: 'cta'
  headline: string
  subheadline?: string
  ctaText: string
  ctaLink: string
  backgroundColor?: string
}

export type PageSection =
  | HeroSection
  | FeaturesSection
  | RatesSection
  | TestimonialsSection
  | TrustBadgesSection
  | FaqSection
  | RichTextSection
  | CtaSection

export interface LandingPageDef {
  id: string
  tenantId: string
  name: string
  slug: string | null
  published: boolean
  pageTitle: string | null
  seoDescription: string | null
  ogImageUrl: string | null
  content: PageSection[]
  trackingCode: string
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  isActive: boolean
}
