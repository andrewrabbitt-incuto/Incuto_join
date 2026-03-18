'use client'

import { useEffect, useRef } from 'react'
import { Shield, Percent, Users, Star, Phone, Mail, MapPin, ChevronDown, CheckCircle } from 'lucide-react'
import type { PageSection, HeroSection, FeaturesSection, RatesSection, TestimonialsSection, TrustBadgesSection, FaqSection, CtaSection } from '@/types/landing-page'
import type { FormBranding } from '@/types'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, React.ElementType> = {
  Shield, Percent, Users, Star, Phone, Mail, MapPin, CheckCircle,
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = sessionStorage.getItem('_inc_sid')
  if (!sid) {
    sid = crypto.randomUUID()
    sessionStorage.setItem('_inc_sid', sid)
  }
  return sid
}

function track(eventType: string, payload: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType, sessionId: getSessionId(), referrer: document.referrer, ...payload }),
  }).catch(() => {})
}

// ─── Section components ───────────────────────────────────────────────────────

function HeroBlock({ section, branding, utmString }: { section: HeroSection; branding: FormBranding; utmString: string }) {
  const ctaHref = section.ctaLink
    ? `${section.ctaLink}${section.ctaLink.includes('?') ? '&' : '?'}${utmString}`
    : '#'

  const bgStyle = section.backgroundImageUrl
    ? { backgroundImage: `url(${section.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: section.backgroundColor || branding.primaryColor }

  return (
    <section className="relative text-white py-20 px-4" style={bgStyle}>
      {section.backgroundImageUrl && (
        <div className="absolute inset-0 bg-black/50" />
      )}
      <div className="relative max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">{section.headline}</h1>
        {section.subheadline && (
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl mx-auto">{section.subheadline}</p>
        )}
        {section.ctaLink && (
          <a
            href={ctaHref}
            className="inline-block px-8 py-4 rounded-xl text-lg font-semibold shadow-lg transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: 'white', color: branding.primaryColor }}
          >
            {section.ctaText}
          </a>
        )}
      </div>
    </section>
  )
}

function FeaturesBlock({ section, branding }: { section: FeaturesSection; branding: FormBranding }) {
  const cols = section.columns ?? 3
  const gridClass = cols === 2 ? 'md:grid-cols-2' : cols === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        {section.heading && (
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">{section.heading}</h2>
        )}
        <div className={cn('grid gap-8', gridClass)}>
          {section.items.map((item, i) => {
            const Icon = item.icon ? (ICON_MAP[item.icon] ?? Shield) : Shield
            return (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: `${branding.primaryColor}15` }}>
                  <Icon className="w-7 h-7" style={{ color: branding.primaryColor }} />
                </div>
                <h3 className="font-semibold text-gray-800 text-lg mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function RatesBlock({ section }: { section: RatesSection }) {
  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        {section.heading && (
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">{section.heading}</h2>
        )}
        <div className="rounded-2xl overflow-hidden border border-gray-200">
          <table className="w-full">
            <tbody>
              {section.items.map((item, i) => (
                <tr key={i} className={cn('border-b border-gray-100', item.highlight && 'bg-blue-50 font-semibold')}>
                  <td className="px-6 py-4 text-gray-700">{item.product}</td>
                  {item.term && <td className="px-6 py-4 text-gray-400 text-sm">{item.term}</td>}
                  <td className="px-6 py-4 text-right font-bold text-gray-900">{item.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {section.note && (
          <p className="text-xs text-gray-400 mt-3 text-center">{section.note}</p>
        )}
      </div>
    </section>
  )
}

function TestimonialsBlock({ section }: { section: TestimonialsSection }) {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        {section.heading && (
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">{section.heading}</h2>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {section.items.map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-6">
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">&quot;{item.quote}&quot;</p>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{item.author}</p>
                {item.role && <p className="text-xs text-gray-400">{item.role}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TrustBlock({ section, branding }: { section: TrustBadgesSection; branding: FormBranding }) {
  return (
    <section className="py-10 px-4" style={{ backgroundColor: branding.secondaryColor }}>
      <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8">
        {section.items.map((item, i) => {
          const Icon = item.icon ? (ICON_MAP[item.icon] ?? Shield) : Shield
          return (
            <div key={i} className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Icon className="w-5 h-5" style={{ color: branding.primaryColor }} />
              {item.label}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function FaqBlock({ section }: { section: FaqSection }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-2xl mx-auto">
        {section.heading && (
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">{section.heading}</h2>
        )}
        <div className="space-y-3">
          {section.items.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left font-medium text-gray-800 hover:bg-gray-50 transition-colors"
              >
                {item.question}
                <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', open === i && 'rotate-180')} />
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaBlock({ section, branding, utmString }: { section: CtaSection; branding: FormBranding; utmString: string }) {
  const ctaHref = section.ctaLink
    ? `${section.ctaLink}${section.ctaLink.includes('?') ? '&' : '?'}${utmString}`
    : '#'

  return (
    <section className="py-20 px-4" style={{ backgroundColor: section.backgroundColor || branding.primaryColor }}>
      <div className="max-w-2xl mx-auto text-center text-white">
        <h2 className="text-3xl font-bold mb-3">{section.headline}</h2>
        {section.subheadline && <p className="text-white/80 mb-8">{section.subheadline}</p>}
        {section.ctaLink && (
          <a
            href={ctaHref}
            className="inline-block px-8 py-4 rounded-xl text-lg font-semibold shadow-lg bg-white transition-transform hover:scale-105 active:scale-95"
            style={{ color: branding.primaryColor }}
          >
            {section.ctaText}
          </a>
        )}
      </div>
    </section>
  )
}

// ─── Main renderer ────────────────────────────────────────────────────────────

interface Props {
  pageId: string
  sections: PageSection[]
  branding: FormBranding
  tenantName: string
  utmString: string
}

export function LandingPageRenderer({ pageId, sections, branding, tenantName, utmString }: Props) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    track('PAGE_VIEW', { landingPageId: pageId })
  }, [pageId])

  return (
    <div style={{ fontFamily: branding.fontFamily }}>
      {branding.customCss && <style dangerouslySetInnerHTML={{ __html: branding.customCss }} />}

      {/* Header */}
      <header className="bg-white border-b border-gray-100 py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {branding.logoUrl
            ? <img src={branding.logoUrl} alt={tenantName} className="h-8 object-contain" />
            : <span className="font-bold text-gray-800">{tenantName}</span>}
        </div>
      </header>

      {/* Sections */}
      {sections.map((section, i) => {
        switch (section.type) {
          case 'hero':         return <HeroBlock key={i} section={section} branding={branding} utmString={utmString} />
          case 'features':     return <FeaturesBlock key={i} section={section} branding={branding} />
          case 'rates':        return <RatesBlock key={i} section={section} />
          case 'testimonials': return <TestimonialsBlock key={i} section={section} />
          case 'trust':        return <TrustBlock key={i} section={section} branding={branding} />
          case 'faq':          return <FaqBlock key={i} section={section} />
          case 'cta':          return <CtaBlock key={i} section={section} branding={branding} utmString={utmString} />
          case 'richtext':     return <section key={i} className="py-12 px-4"><div className="max-w-3xl mx-auto prose" dangerouslySetInnerHTML={{ __html: section.content }} /></section>
          default:             return null
        }
      })}

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-800 text-gray-400 text-xs text-center">
        <p>&copy; {new Date().getFullYear()} {tenantName}. Authorised by the Prudential Regulation Authority and regulated by the Financial Conduct Authority and the Prudential Regulation Authority.</p>
      </footer>
    </div>
  )
}
