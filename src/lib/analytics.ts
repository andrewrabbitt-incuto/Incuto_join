/**
 * Client-side analytics helper.
 * Fire-and-forget — never throws, never blocks.
 */

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = sessionStorage.getItem('_inc_sid')
  if (!sid) {
    sid = crypto.randomUUID()
    sessionStorage.setItem('_inc_sid', sid)
  }
  return sid
}

function getUtm() {
  if (typeof window === 'undefined') return {}
  const p = new URLSearchParams(window.location.search)
  return {
    utmSource:   p.get('utm_source')   ?? undefined,
    utmMedium:   p.get('utm_medium')   ?? undefined,
    utmCampaign: p.get('utm_campaign') ?? undefined,
  }
}

export function trackEvent(
  eventType: 'PAGE_VIEW' | 'FORM_START' | 'FORM_COMPLETE' | 'JOURNEY_START' | 'JOURNEY_COMPLETE',
  payload: {
    landingPageId?: string
    formId?: string
    journeyId?: string
    metadata?: Record<string, unknown>
  } = {}
) {
  if (typeof window === 'undefined') return
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType,
      sessionId: getSessionId(),
      referrer: document.referrer || undefined,
      ...getUtm(),
      ...payload,
    }),
  }).catch(() => {})
}
