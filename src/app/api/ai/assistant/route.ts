import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'demo',
})

const SYSTEM_PROMPT = `You are an AI assistant helping credit union staff build join forms for their members.
You help design form sections and fields, add show/hide logic, and suggest best practices.

When suggesting additions, respond in JSON format with both a message and an actions array.
Each action has: type (ADD_SECTION), payload (section data with fields), and label (button text).

For ADD_SECTION payloads, use this structure:
{
  "title": "Section Title",
  "description": "Optional description",
  "fields": [
    {
      "fieldKey": "field_key",
      "fieldType": "TEXT|EMAIL|DATE|SELECT|RADIO|CHECKBOX|TEXTAREA|ADDRESS_LOOKUP|NATIONAL_INSURANCE|CONSENT|DECLARATION|PRODUCT_SELECTOR|MEMBER_TYPE_SELECTOR|COMMON_BOND_SELECTOR|LOAN_AMOUNT|LOAN_TERM|LOAN_PURPOSE",
      "label": "Field Label",
      "required": true,
      "width": "FULL|HALF",
      "options": [{"label": "Option", "value": "value"}],
      "incutoFieldKey": "incutoKey"
    }
  ]
}

Always explain what you're doing in plain English before/after the JSON.
Keep responses concise and friendly.`

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, formId, history } = await req.json()

  // Demo mode - return smart canned responses
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'demo') {
    return NextResponse.json(getDemoResponse(message))
  }

  try {
    const messages = [
      ...(history || []).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ]

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages,
    })

    const responseText = response.content[0].type === 'text' ? response.content[0].text : ''

    // Try to extract JSON actions from response
    let responseMessage = responseText
    let actions = []

    try {
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1])
        if (parsed.actions) {
          actions = parsed.actions
          responseMessage = responseText.replace(/```json[\s\S]*?```/, '').trim()
        } else if (parsed.title) {
          // Direct section object
          actions = [{
            type: 'ADD_SECTION',
            payload: parsed,
            label: `Add "${parsed.title}" section`,
          }]
        }
      }
    } catch {}

    return NextResponse.json({ message: responseMessage, actions })
  } catch (err) {
    console.error('AI assistant error:', err)
    return NextResponse.json(getDemoResponse(message))
  }
}

function getDemoResponse(message: string) {
  const lower = message.toLowerCase()

  if (lower.includes('personal') || lower.includes('details')) {
    return {
      message: "I'll add a Personal Details section with all the standard fields needed for a credit union join form.",
      actions: [{
        type: 'ADD_SECTION',
        label: 'Add Personal Details section',
        payload: {
          title: 'Personal Details',
          description: 'Please provide your personal information',
          fields: [
            { fieldKey: 'ni_number', fieldType: 'NATIONAL_INSURANCE', label: 'National Insurance Number', required: false, width: 'HALF', incutoFieldKey: 'nationalInsurance' },
            { fieldKey: 'employment_status', fieldType: 'SELECT', label: 'Employment Status', required: true, width: 'HALF', incutoFieldKey: 'employmentStatus', options: [{ label: 'Employed', value: 'employed' }, { label: 'Self-employed', value: 'self_employed' }, { label: 'Retired', value: 'retired' }, { label: 'Unemployed', value: 'unemployed' }, { label: 'Student', value: 'student' }] },
            { fieldKey: 'marital_status', fieldType: 'SELECT', label: 'Marital Status', required: false, width: 'HALF', options: [{ label: 'Single', value: 'single' }, { label: 'Married', value: 'married' }, { label: 'Civil Partnership', value: 'civil_partnership' }, { label: 'Divorced', value: 'divorced' }, { label: 'Widowed', value: 'widowed' }] },
          ],
        },
      }],
    }
  }

  if (lower.includes('loan')) {
    return {
      message: "I'll add a Loan Application section with all required fields. This section will only show when the member has selected loan as their product.",
      actions: [{
        type: 'ADD_SECTION',
        label: 'Add Loan Details section',
        payload: {
          title: 'Loan Details',
          description: 'Tell us about the loan you\'d like to apply for',
          fields: [
            { fieldKey: 'loan_amount', fieldType: 'LOAN_AMOUNT', label: 'How much would you like to borrow?', required: true, width: 'FULL', incutoFieldKey: 'loanAmount' },
            { fieldKey: 'loan_term', fieldType: 'LOAN_TERM', label: 'Repayment period', required: true, width: 'HALF', incutoFieldKey: 'loanTerm', options: [{ label: '6 months', value: '6' }, { label: '12 months', value: '12' }, { label: '24 months', value: '24' }, { label: '36 months', value: '36' }, { label: '60 months', value: '60' }] },
            { fieldKey: 'loan_purpose', fieldType: 'LOAN_PURPOSE', label: 'Purpose of loan', required: true, width: 'HALF', incutoFieldKey: 'loanPurpose', options: [{ label: 'Home improvements', value: 'home' }, { label: 'Car', value: 'car' }, { label: 'Debt consolidation', value: 'debt' }, { label: 'Education', value: 'education' }, { label: 'Other', value: 'other' }] },
          ],
        },
      }],
    }
  }

  if (lower.includes('id') || lower.includes('kyc') || lower.includes('verificat')) {
    return {
      message: "I'll add a KYC/Identity section. This collects additional information needed for identity verification.",
      actions: [{
        type: 'ADD_SECTION',
        label: 'Add Identity Verification section',
        payload: {
          title: 'Identity Verification',
          description: 'To comply with regulations, we need to verify your identity',
          helpText: 'Please have a form of photo ID ready. We use this to verify your identity securely.',
          fields: [
            { fieldKey: 'id_type', fieldType: 'SELECT', label: 'Type of ID', required: true, width: 'HALF', options: [{ label: 'Passport', value: 'passport' }, { label: 'Driving Licence', value: 'driving_licence' }, { label: 'National ID Card', value: 'national_id' }] },
            { fieldKey: 'id_number', fieldType: 'TEXT', label: 'ID Number', required: true, width: 'HALF' },
            { fieldKey: 'id_upload', fieldType: 'ID_UPLOAD', label: 'Upload ID Document', required: false, width: 'FULL' },
          ],
        },
      }],
    }
  }

  if (lower.includes('employment') || lower.includes('income')) {
    return {
      message: "I'll add an Employment & Income section. This is useful for loan applications or affordability checks.",
      actions: [{
        type: 'ADD_SECTION',
        label: 'Add Employment & Income section',
        payload: {
          title: 'Employment & Income',
          description: 'Tell us about your employment and income',
          fields: [
            { fieldKey: 'employment_status', fieldType: 'RADIO', label: 'Employment Status', required: true, width: 'FULL', options: [{ label: 'Employed full-time', value: 'full_time' }, { label: 'Employed part-time', value: 'part_time' }, { label: 'Self-employed', value: 'self_employed' }, { label: 'Retired', value: 'retired' }, { label: 'Unemployed', value: 'unemployed' }] },
            { fieldKey: 'employer_name', fieldType: 'TEXT', label: 'Employer Name', required: false, width: 'HALF', conditions: [{ id: 'c1', fieldKey: 'employment_status', operator: 'contains', value: 'employed' }] },
            { fieldKey: 'annual_income', fieldType: 'NUMBER', label: 'Annual Income (£)', required: false, width: 'HALF', incutoFieldKey: 'annualIncome' },
          ],
        },
      }],
    }
  }

  if (lower.includes('common bond') || lower.includes('eligibility')) {
    return {
      message: "I'll add a Common Bond / Eligibility section to ensure members qualify to join your credit union.",
      actions: [{
        type: 'ADD_SECTION',
        label: 'Add Common Bond section',
        payload: {
          title: 'Eligibility Check',
          description: 'To join our credit union, you must meet our common bond requirements',
          helpText: 'Not sure if you qualify? Contact us and we\'ll be happy to help.',
          fields: [
            { fieldKey: 'common_bond', fieldType: 'COMMON_BOND_SELECTOR', label: 'How do you qualify to join?', required: true, width: 'FULL', isSystemField: true },
          ],
        },
      }],
    }
  }

  if (lower.includes('corporate') || lower.includes('business')) {
    return {
      message: "I'll add a Corporate Member section for business applications. This will appear when 'Business' is selected as the member type.",
      actions: [{
        type: 'ADD_SECTION',
        label: 'Add Corporate Details section',
        payload: {
          title: 'Business Details',
          description: 'Tell us about your business or organisation',
          conditions: [{ id: 'c1', fieldKey: 'member_type', operator: 'equals', value: 'CORPORATE' }],
          fields: [
            { fieldKey: 'company_name', fieldType: 'TEXT', label: 'Company / Organisation Name', required: true, width: 'FULL', incutoFieldKey: 'companyName' },
            { fieldKey: 'company_number', fieldType: 'TEXT', label: 'Companies House Number', required: false, width: 'HALF' },
            { fieldKey: 'business_type', fieldType: 'SELECT', label: 'Type of Business', required: true, width: 'HALF', options: [{ label: 'Limited Company', value: 'ltd' }, { label: 'Sole Trader', value: 'sole_trader' }, { label: 'Partnership', value: 'partnership' }, { label: 'Charity', value: 'charity' }, { label: 'Other', value: 'other' }] },
          ],
        },
      }],
    }
  }

  return {
    message: `I can help you with that! Here are some things I can add to your form:

• **Personal details** — name, DOB, contact info
• **Address lookup** — postcode finder
• **Employment & income** — for affordability checks
• **Loan application** — amount, term, purpose
• **KYC / ID verification** — document upload
• **Common bond** — eligibility check
• **Corporate details** — for business members
• **Custom questions** — any field type you need

What would you like to add?`,
    actions: [],
  }
}
