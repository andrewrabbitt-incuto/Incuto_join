import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuid } from 'uuid'
import { sendEmail, sendSms, buildResumeEmail } from '@/lib/notify'
import crypto from 'crypto'

const SESSION_HOURS = 72 // token valid for 72 hours
const OTP_MINUTES = 15

function generateOtp(): string {
  return String(crypto.randomInt(100000, 999999))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { journeyId, email, phone, currentStepId, journeyData, stepResults } = body

  if (!journeyId || !email) {
    return NextResponse.json({ error: 'journeyId and email are required' }, { status: 400 })
  }

  // Check journey exists and is resumable
  const journey = await prisma.journey.findUnique({ where: { id: journeyId } })
  if (!journey) return NextResponse.json({ error: 'Journey not found' }, { status: 404 })
  if (!journey.resumable) return NextResponse.json({ error: 'This journey does not support resume' }, { status: 400 })

  const resumeToken = uuid()
  const otp = generateOtp()
  const tokenExpiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000)
  const otpExpiresAt = new Date(Date.now() + OTP_MINUTES * 60 * 1000)

  const session = await prisma.journeySession.upsert({
    where: { resumeToken: '' as string }, // always insert
    update: {},
    create: {
      journeyId,
      email,
      phone: phone || null,
      currentStepId: currentStepId || null,
      journeyData: journeyData ?? {},
      stepResults: stepResults ?? {},
      resumeToken,
      tokenExpiresAt,
      otp,
      otpExpiresAt,
    },
  }).catch(async () => {
    // upsert trick fails — just create
    return prisma.journeySession.create({
      data: {
        journeyId,
        email,
        phone: phone || null,
        currentStepId: currentStepId || null,
        journeyData: journeyData ?? {},
        stepResults: stepResults ?? {},
        resumeToken,
        tokenExpiresAt,
        otp,
        otpExpiresAt,
      },
    })
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const resumeUrl = `${baseUrl}/journey/${journey.slug}/resume/${resumeToken}`

  const { subject, html } = buildResumeEmail({
    journeyName: journey.name,
    resumeUrl,
    otp,
    expiresHours: SESSION_HOURS,
  })

  await sendEmail({ to: email, subject, html })

  if (phone) {
    await sendSms({ to: phone, body: `Your ${journey.name} application code: ${otp}. Or use: ${resumeUrl}` })
  }

  return NextResponse.json({ sessionId: session.id, message: 'Resume link sent' }, { status: 201 })
}
