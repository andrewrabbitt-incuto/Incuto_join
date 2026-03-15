import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getIncutoClient } from '@/lib/incuto'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { applicationId, formData } = body

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { tenant: true },
  })
  if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const client = getIncutoClient(application.tenant)
  const address = (formData.address as Record<string, string>) || {}

  let idCheckResult
  try {
    idCheckResult = await client.runIdCheck({
      firstName: String(formData.first_name || ''),
      lastName: String(formData.last_name || ''),
      dateOfBirth: String(formData.date_of_birth || ''),
      address: {
        line1: address.line1 || '',
        line2: address.line2,
        city: address.city || '',
        postcode: address.postcode || '',
        country: 'GB',
      },
      nationalInsurance: formData.national_insurance ? String(formData.national_insurance) : undefined,
    })
  } catch (err) {
    console.error('ID check error:', err)
    idCheckResult = { status: 'FAILED', referenceId: '', success: false }
  }

  // Update application with ID check result
  const newStatus = idCheckResult.status === 'PASSED'
    ? 'COMPLETED'
    : idCheckResult.status === 'FAILED'
    ? 'ID_CHECK_FAILED'
    : 'ID_CHECK_PENDING'

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      idCheckStatus: idCheckResult.status as 'PASSED' | 'FAILED' | 'REQUIRES_MORE_INFO',
      idCheckData: idCheckResult as unknown as Prisma.InputJsonValue,
      idCheckAttempts: { increment: 1 },
      status: newStatus,
      ...(idCheckResult.status === 'PASSED' && {
        completedAt: new Date(),
      }),
    },
  })

  // If passed, submit to Incuto
  if (idCheckResult.status === 'PASSED') {
    try {
      const incuRes = await client.submitMember({
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
          postcode: address.postcode || '',
          country: 'GB',
        },
        products: {
          savings: formData.product_selector !== 'loan',
          loan: formData.product_selector === 'loan' || formData.product_selector === 'both',
        },
        marketingConsent: !!formData.marketing_consent,
      })

      await prisma.application.update({
        where: { id: applicationId },
        data: {
          incutoMemberId: incuRes.memberId,
          incutoSubmittedAt: new Date(),
          incutoResponse: incuRes as unknown as Record<string, unknown>,
        },
      })

      idCheckResult = { ...idCheckResult, memberId: incuRes.memberId }
    } catch (err) {
      console.error('Incuto submit after ID check:', err)
    }
  }

  return NextResponse.json(idCheckResult)
}
