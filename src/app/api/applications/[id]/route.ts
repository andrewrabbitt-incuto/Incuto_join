import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { currentSectionIndex, formData, status, dropoutSection } = body

  const application = await prisma.application.update({
    where: { id: params.id },
    data: {
      ...(currentSectionIndex !== undefined && { currentSectionIndex }),
      ...(formData !== undefined && { formData }),
      ...(status && { status }),
      ...(dropoutSection && { dropoutSection, dropoutAt: new Date(), status: 'ABANDONED' }),
      updatedAt: new Date(),
    },
  })
  return NextResponse.json(application)
}
