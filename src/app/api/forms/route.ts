import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SYSTEM_FIELDS } from '@/lib/field-palette'
import { v4 as uuid } from 'uuid'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const forms = await prisma.form.findMany({
    where: { tenantId: session.user.tenantId },
    include: { _count: { select: { applications: true, sections: true } } },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(forms)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, slug, description, formType, includesSavings, includesLoan, allowsCorporate, allowsChildren, requireCommonBond, chatbotEnabled, loanRedirectUrl } = body

  // Create form with a default personal details section
  const form = await prisma.form.create({
    data: {
      tenantId: session.user.tenantId,
      name,
      slug,
      description,
      formType: formType || 'STANDARD',
      includesSavings: includesSavings ?? true,
      includesLoan: includesLoan ?? false,
      allowsCorporate: allowsCorporate ?? false,
      allowsChildren: allowsChildren ?? false,
      requireCommonBond: requireCommonBond ?? true,
      chatbotEnabled: chatbotEnabled ?? false,
      loanRedirectUrl: loanRedirectUrl || null,
      sections: {
        create: [
          {
            title: 'Who are you applying for?',
            description: 'Tell us what you\'d like to apply for and confirm your eligibility',
            order: 0,
            fields: {
              create: [
                {
                  fieldKey: 'member_type',
                  fieldType: 'MEMBER_TYPE_SELECTOR',
                  label: 'Who is applying?',
                  required: true,
                  order: 0,
                  width: 'FULL',
                  isSystemField: true,
                  options: [
                    { label: 'Individual (Personal)', value: 'INDIVIDUAL', description: 'Applying for yourself' },
                    ...(allowsCorporate ? [{ label: 'Business / Organisation', value: 'CORPORATE', description: 'Applying on behalf of a business' }] : []),
                    ...(allowsChildren ? [{ label: 'Child / Junior', value: 'CHILD', description: 'Applying for a child under 18' }] : []),
                  ],
                },
                {
                  fieldKey: 'product_selector',
                  fieldType: 'PRODUCT_SELECTOR',
                  label: 'What would you like to apply for?',
                  required: true,
                  order: 1,
                  width: 'FULL',
                  isSystemField: true,
                },
                ...(requireCommonBond ? [{
                  fieldKey: 'common_bond',
                  fieldType: 'COMMON_BOND_SELECTOR',
                  label: 'Confirm your eligibility',
                  helpText: 'You must meet the common bond requirements to join',
                  required: true,
                  order: 2,
                  width: 'FULL' as const,
                  isSystemField: true,
                }] : []),
              ],
            },
          },
          {
            title: 'Personal Details',
            description: 'Please provide your personal information',
            order: 1,
            fields: {
              create: [
                {
                  fieldKey: 'title',
                  fieldType: 'SELECT',
                  label: 'Title',
                  required: false,
                  order: 0,
                  width: 'HALF',
                  isSystemField: true,
                  incutoFieldKey: 'title',
                  options: [
                    { label: 'Mr', value: 'Mr' },
                    { label: 'Mrs', value: 'Mrs' },
                    { label: 'Miss', value: 'Miss' },
                    { label: 'Ms', value: 'Ms' },
                    { label: 'Dr', value: 'Dr' },
                    { label: 'Prof', value: 'Prof' },
                    { label: 'Mx', value: 'Mx' },
                  ],
                },
                {
                  fieldKey: 'first_name',
                  fieldType: 'TEXT',
                  label: 'First Name',
                  required: true,
                  order: 1,
                  width: 'HALF',
                  isSystemField: true,
                  incutoFieldKey: 'firstName',
                },
                {
                  fieldKey: 'last_name',
                  fieldType: 'TEXT',
                  label: 'Last Name',
                  required: true,
                  order: 2,
                  width: 'HALF',
                  isSystemField: true,
                  incutoFieldKey: 'lastName',
                },
                {
                  fieldKey: 'date_of_birth',
                  fieldType: 'DATE',
                  label: 'Date of Birth',
                  required: true,
                  order: 3,
                  width: 'HALF',
                  isSystemField: true,
                  incutoFieldKey: 'dateOfBirth',
                },
                {
                  fieldKey: 'email',
                  fieldType: 'EMAIL',
                  label: 'Email Address',
                  placeholder: 'your@email.com',
                  required: true,
                  order: 4,
                  width: 'FULL',
                  isSystemField: true,
                  incutoFieldKey: 'email',
                },
                {
                  fieldKey: 'phone',
                  fieldType: 'PHONE',
                  label: 'Mobile Number',
                  placeholder: '07700 900000',
                  required: false,
                  order: 5,
                  width: 'HALF',
                  isSystemField: true,
                  incutoFieldKey: 'phone',
                },
              ],
            },
          },
          {
            title: 'Your Address',
            description: 'We need your current address for verification purposes',
            order: 2,
            fields: {
              create: [
                {
                  fieldKey: 'address',
                  fieldType: 'ADDRESS_LOOKUP',
                  label: 'Home Address',
                  required: true,
                  order: 0,
                  width: 'FULL',
                  isSystemField: true,
                  incutoFieldKey: 'address',
                  helpText: 'Start typing your postcode to find your address',
                },
              ],
            },
          },
          {
            title: 'Declaration & Consent',
            description: 'Please read and agree to the following',
            order: 3,
            fields: {
              create: [
                {
                  fieldKey: 'gdpr_consent',
                  fieldType: 'CONSENT',
                  label: 'GDPR Consent',
                  placeholder: 'I consent to my personal data being processed in accordance with the credit union\'s privacy policy for the purpose of managing my membership.',
                  required: true,
                  order: 0,
                  width: 'FULL',
                  isSystemField: true,
                  incutoFieldKey: 'gdprConsent',
                },
                {
                  fieldKey: 'declaration',
                  fieldType: 'DECLARATION',
                  label: 'Declaration',
                  placeholder: 'I declare that the information I have provided is true and accurate to the best of my knowledge.',
                  required: true,
                  order: 1,
                  width: 'FULL',
                  isSystemField: true,
                  incutoFieldKey: 'declaration',
                },
                {
                  fieldKey: 'marketing_consent',
                  fieldType: 'CONSENT',
                  label: 'Marketing Consent',
                  placeholder: 'I would like to receive news, updates and offers from the credit union. You can unsubscribe at any time.',
                  required: false,
                  order: 2,
                  width: 'FULL',
                  isSystemField: false,
                  incutoFieldKey: 'marketingConsent',
                },
              ],
            },
          },
          ...(includesLoan ? [{
            title: 'Loan Details',
            description: 'Tell us about the loan you\'d like to apply for',
            order: 4,
            conditions: [{ id: uuid(), fieldKey: 'product_selector', operator: 'equals', value: 'loan' }],
            fields: {
              create: [
                {
                  fieldKey: 'loan_amount',
                  fieldType: 'LOAN_AMOUNT',
                  label: 'How much would you like to borrow?',
                  required: true,
                  order: 0,
                  width: 'FULL',
                  isSystemField: false,
                  incutoFieldKey: 'loanAmount',
                },
                {
                  fieldKey: 'loan_term',
                  fieldType: 'LOAN_TERM',
                  label: 'Over how many months?',
                  required: true,
                  order: 1,
                  width: 'HALF',
                  isSystemField: false,
                  incutoFieldKey: 'loanTerm',
                  options: [
                    { label: '6 months', value: '6' },
                    { label: '12 months', value: '12' },
                    { label: '18 months', value: '18' },
                    { label: '24 months', value: '24' },
                    { label: '36 months', value: '36' },
                    { label: '48 months', value: '48' },
                    { label: '60 months', value: '60' },
                  ],
                },
                {
                  fieldKey: 'loan_purpose',
                  fieldType: 'LOAN_PURPOSE',
                  label: 'What is the loan for?',
                  required: true,
                  order: 2,
                  width: 'HALF',
                  isSystemField: false,
                  incutoFieldKey: 'loanPurpose',
                  options: [
                    { label: 'Home improvements', value: 'home_improvements' },
                    { label: 'Car purchase', value: 'car' },
                    { label: 'Debt consolidation', value: 'debt_consolidation' },
                    { label: 'Holiday', value: 'holiday' },
                    { label: 'Education', value: 'education' },
                    { label: 'Medical expenses', value: 'medical' },
                    { label: 'Other', value: 'other' },
                  ],
                },
              ],
            },
          }] : []),
        ],
      },
    },
  })

  return NextResponse.json(form)
}
