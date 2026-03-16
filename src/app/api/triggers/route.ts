import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getIncutoClient } from '@/lib/incuto'
import type { TriggerType, TriggerFieldMapping } from '@/types'

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    applicationId: string
    triggerType: TriggerType
    contextKey: string
    fieldMappings: TriggerFieldMapping[]
    formData: Record<string, unknown>
    endpoint?: string
  }

  const { applicationId, triggerType, contextKey, fieldMappings, formData, endpoint } = body

  // Resolve the tenant so we can use their Incuto credentials
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { tenant: true },
  })
  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  // Build the API payload from field mappings
  const payload: Record<string, unknown> = {}
  for (const mapping of fieldMappings) {
    if (formData[mapping.formFieldKey] !== undefined) {
      payload[mapping.apiField] = formData[mapping.formFieldKey]
    }
  }

  // Also pass through address if it's a structured object
  if (formData.address && typeof formData.address === 'object') {
    payload.address = formData.address
  }

  try {
    const client = getIncutoClient(application.tenant)
    let result: unknown

    switch (triggerType) {
      case 'CREDIT_SEARCH': {
        const address = (formData.address as Record<string, string>) || {}
        result = await client.runCreditSearch({
          firstName: String(payload.firstName || formData.first_name || ''),
          lastName: String(payload.lastName || formData.last_name || ''),
          dateOfBirth: String(payload.dateOfBirth || formData.date_of_birth || ''),
          address: {
            line1: address.line1 || '',
            postcode: address.postcode || '',
            country: 'GB',
          },
          nationalInsurance: formData.national_insurance
            ? String(formData.national_insurance)
            : undefined,
          loanAmount: formData.loan_amount ? Number(formData.loan_amount) : undefined,
        })
        break
      }

      case 'QUOTATION': {
        result = await client.runQuotation({
          loanAmount: Number(payload.loanAmount || formData.loan_amount || 0),
          loanTerm: Number(payload.loanTerm || formData.loan_term || 36),
          loanPurpose: String(payload.loanPurpose || formData.loan_purpose || ''),
        })
        break
      }

      case 'OPEN_BANKING': {
        // Open banking initiation — returns a redirect URL for the applicant to connect their bank
        // The full callback flow requires additional webhook/redirect handling
        result = { status: 'NOT_CONFIGURED', message: 'Open Banking integration requires additional setup' }
        break
      }

      case 'WEBHOOK': {
        if (!endpoint) {
          return NextResponse.json({ error: 'endpoint required for WEBHOOK trigger' }, { status: 400 })
        }
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId, contextKey, ...payload }),
        })
        if (!res.ok) throw new Error(`Webhook returned ${res.status}`)
        result = await res.json()
        break
      }

      default:
        return NextResponse.json({ error: `Unknown trigger type: ${triggerType}` }, { status: 400 })
    }

    // Store the trigger result on the application for audit
    await prisma.applicationEvent.create({
      data: {
        applicationId,
        eventType: 'trigger_fired',
        eventData: { triggerType, contextKey, result } as never,
      },
    })

    return NextResponse.json({ contextKey, result })
  } catch (err) {
    console.error(`Trigger ${triggerType} failed:`, err)
    // Return a non-error response so the form can continue — the result will be null/empty
    // and context conditions will evaluate to false, keeping the form in a safe state
    return NextResponse.json({
      contextKey,
      result: null,
      error: err instanceof Error ? err.message : 'Trigger failed',
    })
  }
}
