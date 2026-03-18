import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { otp } = await req.json()
  if (!otp) return NextResponse.json({ error: 'OTP is required' }, { status: 400 })

  const session = await prisma.journeySession.findUnique({ where: { resumeToken: params.token } })
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.tokenExpiresAt < new Date()) return NextResponse.json({ error: 'Session expired' }, { status: 410 })
  if (session.verifiedAt) return NextResponse.json({ verified: true }) // already verified

  if (!session.otp || !session.otpExpiresAt) {
    return NextResponse.json({ error: 'No OTP issued for this session' }, { status: 400 })
  }
  if (session.otpExpiresAt < new Date()) {
    return NextResponse.json({ error: 'OTP has expired — please request a new link' }, { status: 410 })
  }
  if (session.otp !== String(otp)) {
    return NextResponse.json({ error: 'Incorrect code' }, { status: 400 })
  }

  await prisma.journeySession.update({
    where: { resumeToken: params.token },
    data: { verifiedAt: new Date() },
  })

  return NextResponse.json({ verified: true })
}
