'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, XCircle, ShieldCheck, Search, Loader2, ChevronRight } from 'lucide-react'
import { FormRenderer } from '@/components/form-renderer/FormRenderer'
import { Button } from '@/components/ui/button'
import type { JourneyDef, JourneyStepDef, JourneyEdgeDef, FormDef, FormBranding } from '@/types'

// ─── Condition evaluation ─────────────────────────────────────────────────────

function evaluateEdgeCondition(
  condition: JourneyEdgeDef['condition'],
  formData: Record<string, unknown>,
  stepResults: Record<string, unknown>,
): boolean {
  if (!condition) return true // unconditional — always matches
  const { source, field, operator, value } = condition
  const actual = source === 'form_data'
    ? formData[field]
    : getNestedValue(stepResults, field)

  switch (operator) {
    case 'equals':        return String(actual) === String(value)
    case 'not_equals':    return String(actual) !== String(value)
    case 'greater_than':  return Number(actual) > Number(value)
    case 'less_than':     return Number(actual) < Number(value)
    case 'contains':      return String(actual).includes(String(value))
    default:              return false
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, obj)
}

function findNextStep(
  currentStep: JourneyStepDef,
  edges: JourneyEdgeDef[],
  steps: JourneyStepDef[],
  formData: Record<string, unknown>,
  stepResults: Record<string, unknown>,
): JourneyStepDef | null {
  const outgoing = edges
    .filter(e => e.sourceStepId === currentStep.id)
    .sort((a, b) => a.order - b.order)

  // Evaluate conditional edges first; fall back to the first unconditional edge
  const conditional = outgoing.find(e => e.condition && evaluateEdgeCondition(e.condition, formData, stepResults))
  const fallback    = outgoing.find(e => !e.condition)
  const match = conditional ?? fallback
  if (!match) return null
  return steps.find(s => s.id === match.targetStepId) ?? null
}

// ─── Processing step screens ──────────────────────────────────────────────────

function ProcessingScreen({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      <p className="text-gray-600 text-lg font-medium">{message}</p>
    </div>
  )
}

function EndScreen({ step, primaryColor }: { step: JourneyStepDef; primaryColor: string }) {
  const isRejected = step.config?.endType === 'REJECTED'
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center px-4">
      {isRejected
        ? <XCircle className="w-16 h-16 text-red-500" />
        : <CheckCircle2 className="w-16 h-16" style={{ color: primaryColor }} />}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isRejected ? 'Application Unsuccessful' : 'Application Complete'}
        </h2>
        <p className="text-gray-500 max-w-md">
          {step.config?.message ?? (isRejected
            ? 'Unfortunately we are unable to proceed with your application at this time.'
            : 'Thank you — your application has been received and is being processed.')}
        </p>
      </div>
    </div>
  )
}

// ─── Main JourneyRenderer ─────────────────────────────────────────────────────

interface Props {
  journey: JourneyDef
  /** Forms keyed by step ID — pre-loaded server-side */
  formsByStepId: Record<string, FormDef>
  branding: FormBranding
  campaignCode?: string
}

export function JourneyRenderer({ journey, formsByStepId, branding, campaignCode }: Props) {
  // Accumulated data from all form steps
  const [journeyData, setJourneyData] = useState<Record<string, unknown>>({})
  // Results from processing steps (id_check, credit_check)
  const [stepResults, setStepResults] = useState<Record<string, unknown>>({})

  // Find the START node then immediately resolve to the next real step
  const startStep = journey.steps.find(s => s.type === 'START')
  const firstRealStep = startStep
    ? findNextStep(startStep, journey.edges, journey.steps, {}, {})
    : journey.steps[0] ?? null

  const [currentStep, setCurrentStep] = useState<JourneyStepDef | null>(firstRealStep)
  const [processing, setProcessing] = useState(false)

  const advance = useCallback((
    from: JourneyStepDef,
    fd: Record<string, unknown>,
    sr: Record<string, unknown>,
  ) => {
    const next = findNextStep(from, journey.edges, journey.steps, fd, sr)
    setCurrentStep(next)
  }, [journey.edges, journey.steps])

  // When a FORM step completes, merge data and advance
  const onFormStepComplete = useCallback((formData: Record<string, unknown>) => {
    if (!currentStep) return
    const merged = { ...journeyData, ...formData }
    setJourneyData(merged)
    advance(currentStep, merged, stepResults)
  }, [currentStep, journeyData, stepResults, advance])

  // Process ID_CHECK / CREDIT_CHECK steps automatically
  useEffect(() => {
    if (!currentStep || processing) return
    if (currentStep.type !== 'ID_CHECK' && currentStep.type !== 'CREDIT_CHECK') return

    setProcessing(true)
    ;(async () => {
      try {
        if (currentStep.type === 'ID_CHECK') {
          // Find the application ID created during the last form step
          const appId = stepResults._lastApplicationId as string | undefined
          const res = await fetch('/api/incuto/id-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId: appId, formData: journeyData }),
          })
          const data = await res.json()
          const key = currentStep.config?.contextKey ?? 'id_check'
          const newSr = { ...stepResults, [key]: data }
          setStepResults(newSr)
          advance(currentStep, journeyData, newSr)
        } else {
          // CREDIT_CHECK — placeholder (call webhook / trigger API)
          const key = currentStep.config?.contextKey ?? 'credit_check'
          const newSr = { ...stepResults, [key]: { status: 'COMPLETED' } }
          setStepResults(newSr)
          advance(currentStep, journeyData, newSr)
        }
      } catch {
        // On error, try to find a fallback edge; if none, stay on this step
        const fallbackNext = findNextStep(currentStep, journey.edges, journey.steps, journeyData, stepResults)
        if (fallbackNext) setCurrentStep(fallbackNext)
      } finally {
        setProcessing(false)
      }
    })()
  }, [currentStep?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentStep) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-400">Journey has no steps — please check your journey configuration.</p>
      </div>
    )
  }

  // END step
  if (currentStep.type === 'END') {
    return <EndScreen step={currentStep} primaryColor={branding.primaryColor} />
  }

  // FORM step — render the pre-loaded form using FormRenderer in journey mode
  if (currentStep.type === 'FORM') {
    const form = formsByStepId[currentStep.id]
    if (!form) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-gray-500">Form not found for this step.</p>
          <Button onClick={() => advance(currentStep, journeyData, stepResults)}>
            Skip <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )
    }
    return (
      <FormRenderer
        key={currentStep.id}
        form={form}
        branding={branding}
        campaignCode={campaignCode}
        journeyMode
        onStepComplete={onFormStepComplete}
      />
    )
  }

  // ID_CHECK / CREDIT_CHECK / CONDITION — show processing screen while auto-advancing
  if (currentStep.type === 'ID_CHECK') {
    return <ProcessingScreen message={currentStep.config?.loadingMessage ?? 'Verifying your identity…'} />
  }
  if (currentStep.type === 'CREDIT_CHECK') {
    return <ProcessingScreen message={currentStep.config?.loadingMessage ?? 'Running credit search…'} />
  }
  if (currentStep.type === 'CONDITION') {
    // Condition nodes auto-advance immediately — show a brief spinner
    return <ProcessingScreen message="Processing…" />
  }

  return null
}
