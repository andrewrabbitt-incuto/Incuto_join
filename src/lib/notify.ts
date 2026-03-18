/**
 * Notification stub — logs to console in development.
 * Replace with Resend / SendGrid / Twilio calls in production.
 */

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export interface SendSmsOptions {
  to: string
  body: string
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  if (process.env.RESEND_API_KEY) {
    // Production: send via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? 'noreply@incuto.com',
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('[notify] Email send failed:', err)
    }
  } else {
    // Dev: log to console
    console.log('[notify] sendEmail →', opts.to, '|', opts.subject)
    console.log('[notify] html preview:', opts.html.replace(/<[^>]+>/g, '').slice(0, 200))
  }
}

export async function sendSms(opts: SendSmsOptions): Promise<void> {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const params = new URLSearchParams({
      From: process.env.TWILIO_PHONE_NUMBER ?? '',
      To: opts.to,
      Body: opts.body,
    })
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        },
        body: params.toString(),
      }
    )
    if (!res.ok) {
      const err = await res.text()
      console.error('[notify] SMS send failed:', err)
    }
  } else {
    console.log('[notify] sendSms →', opts.to, '|', opts.body)
  }
}

export function buildResumeEmail(opts: {
  journeyName: string
  resumeUrl: string
  otp: string
  expiresHours: number
}): { subject: string; html: string } {
  const subject = `Resume your ${opts.journeyName} application`
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
      <h2>Resume your application</h2>
      <p>Click the link below to continue your <strong>${opts.journeyName}</strong> application:</p>
      <p style="margin:24px 0;">
        <a href="${opts.resumeUrl}" style="background:#1d4ed8;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
          Continue application
        </a>
      </p>
      <p>Or enter this one-time code on the verification page:</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;padding:16px;background:#f3f4f6;border-radius:8px;">
        ${opts.otp}
      </p>
      <p style="color:#6b7280;font-size:13px;">
        This link and code will expire in ${opts.expiresHours} hours. If you didn't request this, you can ignore this email.
      </p>
    </div>
  `
  return { subject, html }
}
