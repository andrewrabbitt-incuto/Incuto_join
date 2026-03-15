import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'demo',
})

export async function POST(req: NextRequest) {
  const { message, formSlug, history } = await req.json()

  // Get form context
  let formContext = 'You are a helpful assistant on a credit union join form.'
  try {
    const form = await prisma.form.findFirst({
      where: { slug: formSlug },
      include: { tenant: true }
    })
    if (form) {
      formContext = `You are a friendly and helpful assistant for ${form.tenant.name}, a credit union.
You are embedded on their "${form.name}" join form to help applicants complete it.
Be warm, professional, and concise. Answer questions about:
- How to fill in the form
- What information is needed and why
- Credit union membership benefits
- Common bond requirements
- The application process
If you don't know something specific, suggest they contact the credit union directly.
Keep responses short and friendly.`
    }
  } catch {}

  // Demo mode
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'demo') {
    return NextResponse.json({ message: getDemoResponse(message) })
  }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: formContext,
      messages: [
        ...(history || []).map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: message },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : "I'm sorry, I couldn't process your message."
    return NextResponse.json({ message: text })
  } catch (err) {
    return NextResponse.json({ message: getDemoResponse(message) })
  }
}

function getDemoResponse(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes('common bond') || lower.includes('qualify') || lower.includes('eligible')) {
    return "To join our credit union, you need to meet our common bond — this means you live in our area, work for a qualifying employer, or are a family member of an existing member. If you're unsure, please contact us and we'll check your eligibility."
  }
  if (lower.includes('loan') || lower.includes('borrow')) {
    return "All members can apply for a loan after joining. Our rates are competitive and we consider your individual circumstances. You can apply for a loan as part of this application or after you've joined."
  }
  if (lower.includes('savings') || lower.includes('account')) {
    return "Every member receives a savings account when they join. You can start saving from as little as £5 per week. Your savings are protected up to £85,000 by the FSCS."
  }
  if (lower.includes('id') || lower.includes('verify') || lower.includes('passport')) {
    return "We use an automated identity check as part of the application. This takes just seconds and requires no action from you. If it can't verify you automatically, we'll ask for a photo ID document to be uploaded."
  }
  if (lower.includes('how long') || lower.includes('process')) {
    return "Most applications are processed within 1-2 working days. Once approved, you'll receive a welcome email with your membership details and account information."
  }
  if (lower.includes('safe') || lower.includes('secure') || lower.includes('data')) {
    return "Your data is completely secure. We use 256-bit encryption and are fully GDPR compliant. We will never share your data with third parties without your consent."
  }
  return "I'm here to help you complete your application. Feel free to ask about our membership, savings accounts, loans, or the application process. You can also contact our team directly if you need more help!"
}
