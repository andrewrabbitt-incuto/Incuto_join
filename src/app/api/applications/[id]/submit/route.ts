import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getIncutoClient } from '@/lib/incuto'
import { resolveIncutoKey, toStringValue } from '@/lib/field-mapping'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { formData } = await req.json()

  // Fetch application with form fields so we have incutoFieldKey mappings
  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      tenant: true,
      form: {
        include: {
          sections: {
            include: { fields: true }
          }
        }
      }
    }
  })
  if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  // Build a flat map of fieldKey → { label, incutoFieldKey } from the form definition
  const fieldMeta: Record<string, { label: string; incutoFieldKey: string | null }> = {}
  for (const section of application.form.sections) {
    for (const field of section.fields) {
      fieldMeta[field.fieldKey] = {
        label: field.label,
        incutoFieldKey: resolveIncutoKey(field.fieldKey, field.incutoFieldKey),
      }
    }
  }

  // Persist submitted state and extract structured values
  const memberType = (formData.member_type as string || 'INDIVIDUAL') as
    'INDIVIDUAL' | 'CORPORATE' | 'CHILD' | 'JOINT'
  const products = {
    savings: formData.product_selector !== 'loan',
    loan: formData.product_selector === 'loan' || formData.product_selector === 'both',
    savingsType: (formData.savings_type as string) || 'standard',
  }

  await prisma.application.update({
    where: { id: params.id },
    data: { status: 'SUBMITTED', formData, submittedAt: new Date(), memberType, products },
  })

  // Store searchable per-field values
  // Use upsert-style: delete existing then insert fresh (handles re-submissions)
  await prisma.applicationFieldValue.deleteMany({ where: { applicationId: params.id } })

  const fieldValueRows = Object.entries(formData as Record<string, unknown>)
    .filter(([key]) => !key.startsWith('_'))  // skip internal keys
    .map(([key, value]) => ({
      applicationId: params.id,
      fieldKey: key,
      fieldLabel: fieldMeta[key]?.label ?? key,
      stringValue: toStringValue(value),
      rawValue: value !== null && value !== undefined
        ? (value as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      incutoFieldKey: fieldMeta[key]?.incutoFieldKey ?? null,
    }))

  if (fieldValueRows.length) {
    await prisma.applicationFieldValue.createMany({ data: fieldValueRows })
  }

  // Build the Incuto MemberSubmitRequest dynamically from incutoFieldKey mappings
  const address = (formData.address as Record<string, string>) || {}
  const employment = {} as { status?: string; employer?: string; occupation?: string; annualIncome?: number }
  const customFields: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(formData as Record<string, unknown>)) {
    const incutoKey = fieldMeta[key]?.incutoFieldKey
    if (!incutoKey || incutoKey.startsWith('__')) continue  // skip specials and unmapped

    if (incutoKey.startsWith('employment.')) {
      const subKey = incutoKey.slice('employment.'.length) as keyof typeof employment
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(employment as any)[subKey] = value
    } else if (!['title','firstName','lastName','email','phone','dateOfBirth',
                  'nationalInsurance','address','marketingConsent','gdprConsent',
                  'declaration','commonBond'].includes(incutoKey)) {
      // Any mapped field that doesn't fit a standard block goes to customFields
      customFields[incutoKey] = value
    }
  }

  // Unmapped fields (no incutoFieldKey) also go to customFields
  for (const [key, value] of Object.entries(formData as Record<string, unknown>)) {
    const meta = fieldMeta[key]
    if (!meta?.incutoFieldKey) {
      customFields[key] = value
    }
  }

  const requiresIdCheck = application.tenant.idCheckEnabled
  let memberId: string | null = null

  if (!requiresIdCheck) {
    try {
      const client = getIncutoClient(application.tenant)
      const result = await client.submitMember({
        memberType: memberType === 'JOINT' ? 'INDIVIDUAL' : memberType,
        personalDetails: {
          title: String(formData.title || ''),
          firstName: String(formData.first_name || ''),
          lastName: String(formData.last_name || ''),
          email: String(formData.email || ''),
          phone: String(formData.phone || ''),
          dateOfBirth: String(formData.date_of_birth || ''),
          nationalInsurance: formData.national_insurance
            ? String(formData.national_insurance)
            : undefined,
        },
        address: {
          line1: address.line1 || '',
          line2: address.line2,
          city: address.city || '',
          county: address.county,
          postcode: address.postcode || '',
          country: 'GB',
        },
        employment: Object.keys(employment).length ? employment : undefined,
        products: { savings: products.savings, savingsType: products.savingsType, loan: products.loan },
        marketingConsent: !!formData.marketing_consent,
        customFields: Object.keys(customFields).length ? customFields : undefined,
      })

      memberId = result.memberId
      await prisma.application.update({
        where: { id: params.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          incutoMemberId: memberId,
          incutoSubmittedAt: new Date(),
          incutoResponse: result as unknown as Prisma.InputJsonValue,
        },
      })
    } catch (err) {
      console.error('Incuto submission error:', err)
    }
  }

  await prisma.applicationEvent.create({
    data: { applicationId: params.id, eventType: 'form_submit' },
  })

  return NextResponse.json({ success: true, requiresIdCheck, memberId, applicationId: params.id })
}
