import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getIncutoClient } from '@/lib/incuto'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { formData } = body

  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: { tenant: true, form: true },
  })
  if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  // Update status to submitted
  await prisma.application.update({
    where: { id: params.id },
    data: {
      status: 'SUBMITTED',
      formData,
      submittedAt: new Date(),
      memberType: (formData.member_type as string || 'INDIVIDUAL') as 'INDIVIDUAL' | 'CORPORATE' | 'CHILD' | 'JOINT',
      products: {
        savings: formData.product_selector !== 'loan',
        loan: formData.product_selector === 'loan' || formData.product_selector === 'both',
        savingsType: formData.savings_type || 'standard',
      },
    },
  })

  // Determine if ID check required
  const requiresIdCheck = application.tenant.idCheckEnabled

  let memberId: string | null = null

  if (!requiresIdCheck) {
    // Submit directly to Incuto
    try {
      const client = getIncutoClient(application.tenant)
      const address = formData.address as Record<string, string> || {}
      const result = await client.submitMember({
        memberType: (formData.member_type as 'INDIVIDUAL' | 'CORPORATE' | 'CHILD') || 'INDIVIDUAL',
        personalDetails: {
          firstName: String(formData.first_name || ''),
          lastName: String(formData.last_name || ''),
          email: String(formData.email || ''),
          phone: String(formData.phone || ''),
          dateOfBirth: String(formData.date_of_birth || ''),
          title: String(formData.title || ''),
        },
        address: {
          line1: address.line1 || '',
          line2: address.line2,
          city: address.city || '',
          county: address.county,
          postcode: address.postcode || '',
          country: 'GB',
        },
        products: {
          savings: formData.product_selector !== 'loan',
          loan: formData.product_selector === 'loan' || formData.product_selector === 'both',
        },
        marketingConsent: !!formData.marketing_consent,
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

  // Track submit event
  await prisma.applicationEvent.create({
    data: {
      applicationId: params.id,
      eventType: 'form_submit',
    },
  })

  return NextResponse.json({
    success: true,
    requiresIdCheck,
    memberId,
    applicationId: params.id,
  })
}
