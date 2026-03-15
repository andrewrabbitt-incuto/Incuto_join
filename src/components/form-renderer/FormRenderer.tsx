'use client'

import { useState, useEffect, useCallback } from 'react'
import type { FormDef, FormSectionDef, FormBranding } from '@/types'
import { FieldRenderer, evaluateConditions } from './FieldRenderer'
import { ChatBot } from './ChatBot'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import {
  CheckCircle2, Loader2, AlertCircle, ShieldCheck, ChevronRight, ChevronLeft, HelpCircle, Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormRendererProps {
  form: FormDef
  branding: FormBranding
  campaignCode?: string
}

type IdCheckStatus = 'idle' | 'checking' | 'passed' | 'failed' | 'needs_more_info'
type JourneyStage = 'form' | 'id_check' | 'id_check_failed' | 'vouchsafe' | 'complete' | 'loan_redirect'

export function FormRenderer({ form, branding, campaignCode }: FormRendererProps) {
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sessionId] = useState(() => `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [stage, setStage] = useState<JourneyStage>('form')
  const [idCheckStatus, setIdCheckStatus] = useState<IdCheckStatus>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [loanRedirectUrl, setLoanRedirectUrl] = useState<string | null>(null)
  const [infoModal, setInfoModal] = useState<{ title: string; content: string } | null>(null)

  const visibleSections = form.sections.filter(
    s => evaluateConditions(s.conditions, formData)
  )
  const currentSection = visibleSections[currentSectionIdx]
  const isLastSection = currentSectionIdx === visibleSections.length - 1

  // Track application start
  useEffect(() => {
    fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formId: form.id, sessionId, campaignCode }),
    }).then(r => r.json()).then(data => setApplicationId(data.id)).catch(() => {})
  }, [])

  // Track section views
  useEffect(() => {
    if (!applicationId || !currentSection) return
    fetch(`/api/applications/${applicationId}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'section_view', sectionIndex: currentSectionIdx }),
    }).catch(() => {})
  }, [currentSectionIdx, applicationId])

  const setFieldValue = useCallback((fieldKey: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [fieldKey]: value }))
    if (errors[fieldKey]) setErrors(prev => { const e = { ...prev }; delete e[fieldKey]; return e })
  }, [errors])

  // Validate current section
  function validateSection(section: FormSectionDef): boolean {
    const newErrors: Record<string, string> = {}
    section.fields
      .filter(f => evaluateConditions(f.conditions, formData))
      .forEach(field => {
        if (field.required && !formData[field.fieldKey] && formData[field.fieldKey] !== 0) {
          newErrors[field.fieldKey] = field.validation?.message || `${field.label} is required`
        }
        const val = formData[field.fieldKey]
        if (val && field.validation) {
          if (field.fieldType === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val))) {
            newErrors[field.fieldKey] = 'Please enter a valid email address'
          }
        }
      })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleNext() {
    if (!currentSection) return
    if (!validateSection(currentSection)) return

    // Save progress
    if (applicationId) {
      await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentSectionIndex: currentSectionIdx + 1, formData }),
      }).catch(() => {})
    }

    if (isLastSection) {
      await handleSubmit()
    } else {
      setCurrentSectionIdx(i => i + 1)
    }
  }

  function handleBack() {
    setCurrentSectionIdx(i => Math.max(0, i - 1))
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      // Submit application
      const res = await fetch(`/api/applications/${applicationId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData }),
      })
      const data = await res.json()

      if (data.requiresIdCheck) {
        setStage('id_check')
        setIdCheckStatus('checking')
        // Run ID check
        const idRes = await fetch('/api/incuto/id-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId, formData }),
        })
        const idData = await idRes.json()

        if (idData.status === 'PASSED') {
          setIdCheckStatus('passed')
          // Check if loan redirect needed
          const products = formData.product_selector || formData.products
          if ((products === 'loan' || products === 'both') && form.loanRedirectUrl) {
            setLoanRedirectUrl(form.loanRedirectUrl.replace('{memberId}', data.memberId || ''))
            setStage('loan_redirect')
          } else {
            setStage('complete')
          }
        } else if (idData.status === 'FAILED') {
          setIdCheckStatus('failed')
          if (form.requireCommonBond) {
            setStage('id_check_failed')
          } else {
            setStage('id_check_failed')
          }
        } else {
          setIdCheckStatus('needs_more_info')
          setStage('vouchsafe')
        }
      } else {
        setStage('complete')
      }
    } catch {
      setErrors({ _submit: 'An error occurred. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const primaryColor = branding.primaryColor || '#2563EB'
  const progress = ((currentSectionIdx + 1) / Math.max(visibleSections.length, 1)) * 100

  // ─── COMPLETE SCREEN ───
  if (stage === 'complete') {
    return (
      <FormShell branding={branding} form={form}>
        <div className="max-w-lg mx-auto text-center py-16 px-6">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
            <CheckCircle2 className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h2>
          <p className="text-gray-500 mb-8">Thank you for applying to join. We&apos;ll review your application and be in touch shortly.</p>
          <div className="bg-gray-50 rounded-xl p-6 text-left space-y-2">
            <p className="text-sm font-medium text-gray-700">What happens next?</p>
            {['Your application is being reviewed', 'We\'ll verify your identity', 'You\'ll receive a welcome email', 'Your account will be set up'].map((step, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-5 h-5 rounded-full text-white flex items-center justify-center text-xs shrink-0" style={{ backgroundColor: primaryColor }}>{i + 1}</div>
                {step}
              </div>
            ))}
          </div>
        </div>
      </FormShell>
    )
  }

  // ─── LOAN REDIRECT SCREEN ───
  if (stage === 'loan_redirect') {
    return (
      <FormShell branding={branding} form={form}>
        <div className="max-w-lg mx-auto text-center py-16 px-6">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
            <ShieldCheck className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Membership Approved!</h2>
          <p className="text-gray-500 mb-8">Your savings account application has been approved. You can now continue with your loan application.</p>
          <Button
            className="w-full text-white py-6 text-base"
            style={{ backgroundColor: primaryColor }}
            onClick={() => loanRedirectUrl && window.location.assign(loanRedirectUrl)}
          >
            Continue to Loan Application <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </FormShell>
    )
  }

  // ─── ID CHECK SCREEN ───
  if (stage === 'id_check') {
    return (
      <FormShell branding={branding} form={form}>
        <div className="max-w-lg mx-auto text-center py-16 px-6">
          {idCheckStatus === 'checking' ? (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-6 animate-spin" style={{ color: primaryColor }} />
              <h2 className="text-2xl font-bold mb-3">Verifying your identity…</h2>
              <p className="text-gray-500">This usually takes just a few seconds.</p>
            </>
          ) : idCheckStatus === 'passed' ? (
            <>
              <CheckCircle2 className="w-16 h-16 mx-auto mb-6 text-green-500" />
              <h2 className="text-2xl font-bold mb-3">Identity Verified!</h2>
            </>
          ) : null}
        </div>
      </FormShell>
    )
  }

  // ─── ID CHECK FAILED / VOUCHSAFE ───
  if (stage === 'id_check_failed' || stage === 'vouchsafe') {
    return (
      <FormShell branding={branding} form={form}>
        <div className="max-w-lg mx-auto py-16 px-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-yellow-50 mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Additional Verification Needed</h2>
            <p className="text-gray-500">We need to verify your identity with some additional documents. This is a standard security process.</p>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800 mb-2">Please provide one of the following:</p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Passport or driving licence photo</li>
                <li>• Recent utility bill (within 3 months)</li>
                <li>• Bank statement</li>
              </ul>
            </div>
            <Button className="w-full py-5" style={{ backgroundColor: primaryColor }} onClick={() => alert('Vouchsafe journey would launch here')}>
              Upload Documents <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </FormShell>
    )
  }

  // ─── MAIN FORM ───
  return (
    <FormShell branding={branding} form={form}>
      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-8">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: primaryColor }} />
      </div>

      {/* Section steps indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {visibleSections.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
              i < currentSectionIdx ? 'text-white' : i === currentSectionIdx ? 'text-white ring-4 ring-offset-2' : 'bg-gray-100 text-gray-400'
            )} style={i <= currentSectionIdx ? { backgroundColor: primaryColor, '--tw-ring-color': `${primaryColor}40` } as React.CSSProperties : {}}>
              {i < currentSectionIdx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            {i < visibleSections.length - 1 && (
              <div className={cn('w-8 h-0.5', i < currentSectionIdx ? 'bg-green-400' : 'bg-gray-200')} />
            )}
          </div>
        ))}
      </div>

      {currentSection && (
        <>
          {/* Section header */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{currentSection.title}</h2>
              {currentSection.infoButton && (
                <button onClick={() => setInfoModal({ title: currentSection.infoButton!.title, content: currentSection.infoButton!.content })} className="text-gray-400 hover:text-blue-500">
                  <HelpCircle className="w-5 h-5" />
                </button>
              )}
            </div>
            {currentSection.description && (
              <p className="text-gray-500 mt-1">{currentSection.description}</p>
            )}
            {currentSection.helpText && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">{currentSection.helpText}</p>
              </div>
            )}
          </div>

          {/* Fields */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            {currentSection.fields.map(field => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={formData[field.fieldKey]}
                onChange={v => setFieldValue(field.fieldKey, v)}
                error={errors[field.fieldKey]}
                formData={formData}
                branding={{ primaryColor, borderRadius: branding.borderRadius }}
              />
            ))}
          </div>

          {errors._submit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors._submit}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button variant="outline" onClick={handleBack} disabled={currentSectionIdx === 0} className="gap-2">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={submitting}
              className="gap-2 min-w-32 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
              ) : isLastSection ? (
                <>Submit Application <CheckCircle2 className="w-4 h-4" /></>
              ) : (
                <>Next <ChevronRight className="w-4 h-4" /></>
              )}
            </Button>
          </div>
        </>
      )}

      {/* Info modal */}
      {infoModal && (
        <Dialog open onOpenChange={() => setInfoModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{infoModal.title}</DialogTitle>
              <DialogDescription className="text-gray-600 whitespace-pre-wrap">{infoModal.content}</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}

      {/* Chatbot */}
      {form.chatbotEnabled && form.chatbotConfig && (
        <ChatBot config={form.chatbotConfig} formSlug={form.slug} />
      )}
    </FormShell>
  )
}

function FormShell({ children, branding, form }: { children: React.ReactNode; branding: FormBranding; form: FormDef }) {
  return (
    <div className="min-h-screen bg-gray-50" style={branding.backgroundType === 'gradient' ? { background: branding.backgroundGradient } : { backgroundColor: branding.backgroundColor || '#F9FAFB' }}>
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="h-10 object-contain" />
          ) : (
            <div className="text-lg font-bold" style={{ color: branding.primaryColor }}>{form.name}</div>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            Secure &amp; encrypted
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-xs text-gray-400">{branding.footerText || 'Powered by Incuto Join'}</p>
      </div>

      {branding.customCss && <style dangerouslySetInnerHTML={{ __html: branding.customCss }} />}
    </div>
  )
}
