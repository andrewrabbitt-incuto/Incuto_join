import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { eventType, sectionIndex, fieldKey, eventData } = body

  const event = await prisma.applicationEvent.create({
    data: {
      applicationId: params.id,
      eventType,
      sectionIndex,
      fieldKey,
      eventData,
    },
  })
  return NextResponse.json(event)
}
