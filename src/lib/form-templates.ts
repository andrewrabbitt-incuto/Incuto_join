import { v4 as uuid } from 'uuid'

export interface FormTemplate {
  id: string
  name: string
  description: string
  icon: string
  formType: string
  includesSavings: boolean
  includesLoan: boolean
  allowsCorporate: boolean
  allowsChildren: boolean
  requireCommonBond: boolean
  sections: TemplateSectionDef[]
}

interface TemplateSectionDef {
  title: string
  description?: string
  order: number
  fields: TemplateFieldDef[]
}

interface TemplateFieldDef {
  fieldKey: string
  fieldType: string
  label: string
  placeholder?: string
  helpText?: string
  required: boolean
  order: number
  width: 'FULL' | 'HALF' | 'THIRD' | 'TWO_THIRDS'
  isSystemField?: boolean
  incutoFieldKey?: string
  options?: { label: string; value: string; description?: string }[]
}

// ─── Shared section builders ───────────────────────────────────────

function memberTypeSection(allowsCorporate: boolean, allowsChildren: boolean, requireCommonBond: boolean, order: number): TemplateSectionDef {
  return {
    title: 'Who are you applying for?',
    description: 'Tell us what you\'d like to apply for and confirm your eligibility',
    order,
    fields: [
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
  }
}

function personalDetailsSection(order: number): TemplateSectionDef {
  return {
    title: 'Personal Details',
    description: 'Please provide your personal information',
    order,
    fields: [
      { fieldKey: 'title', fieldType: 'SELECT', label: 'Title', required: false, order: 0, width: 'HALF', isSystemField: true, incutoFieldKey: 'title', options: [{ label: 'Mr', value: 'Mr' }, { label: 'Mrs', value: 'Mrs' }, { label: 'Miss', value: 'Miss' }, { label: 'Ms', value: 'Ms' }, { label: 'Dr', value: 'Dr' }, { label: 'Prof', value: 'Prof' }, { label: 'Mx', value: 'Mx' }] },
      { fieldKey: 'first_name', fieldType: 'TEXT', label: 'First Name', required: true, order: 1, width: 'HALF', isSystemField: true, incutoFieldKey: 'firstName' },
      { fieldKey: 'last_name', fieldType: 'TEXT', label: 'Last Name', required: true, order: 2, width: 'HALF', isSystemField: true, incutoFieldKey: 'lastName' },
      { fieldKey: 'date_of_birth', fieldType: 'DATE', label: 'Date of Birth', required: true, order: 3, width: 'HALF', isSystemField: true, incutoFieldKey: 'dateOfBirth' },
      { fieldKey: 'email', fieldType: 'EMAIL', label: 'Email Address', placeholder: 'your@email.com', required: true, order: 4, width: 'FULL', isSystemField: true, incutoFieldKey: 'email' },
      { fieldKey: 'phone', fieldType: 'PHONE', label: 'Mobile Number', placeholder: '07700 900000', required: false, order: 5, width: 'HALF', isSystemField: true, incutoFieldKey: 'phone' },
      { fieldKey: 'national_insurance', fieldType: 'NATIONAL_INSURANCE', label: 'National Insurance Number', placeholder: 'AB 12 34 56 C', required: false, order: 6, width: 'HALF', isSystemField: true, incutoFieldKey: 'nationalInsurance' },
    ],
  }
}

function addressSection(order: number): TemplateSectionDef {
  return {
    title: 'Your Address',
    description: 'We need your current address for verification purposes',
    order,
    fields: [
      { fieldKey: 'address', fieldType: 'ADDRESS_LOOKUP', label: 'Home Address', required: true, order: 0, width: 'FULL', isSystemField: true, incutoFieldKey: 'address', helpText: 'Start typing your postcode to find your address' },
    ],
  }
}

function declarationSection(order: number): TemplateSectionDef {
  return {
    title: 'Declaration & Consent',
    description: 'Please read and agree to the following',
    order,
    fields: [
      { fieldKey: 'gdpr_consent', fieldType: 'CONSENT', label: 'GDPR Consent', placeholder: 'I consent to my personal data being processed in accordance with the credit union\'s privacy policy for the purpose of managing my membership.', required: true, order: 0, width: 'FULL', isSystemField: true, incutoFieldKey: 'gdprConsent' },
      { fieldKey: 'declaration', fieldType: 'DECLARATION', label: 'Declaration', placeholder: 'I declare that the information I have provided is true and accurate to the best of my knowledge.', required: true, order: 1, width: 'FULL', isSystemField: true, incutoFieldKey: 'declaration' },
      { fieldKey: 'marketing_consent', fieldType: 'CONSENT', label: 'Marketing Consent', placeholder: 'I would like to receive news, updates and offers from the credit union. You can unsubscribe at any time.', required: false, order: 2, width: 'FULL', isSystemField: false, incutoFieldKey: 'marketingConsent' },
    ],
  }
}

// ─── Templates ─────────────────────────────────────────────────────

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Form',
    description: 'Start from scratch with a minimal default layout',
    icon: 'FileText',
    formType: 'STANDARD',
    includesSavings: true,
    includesLoan: false,
    allowsCorporate: false,
    allowsChildren: false,
    requireCommonBond: true,
    sections: [
      memberTypeSection(false, false, true, 0),
      personalDetailsSection(1),
      addressSection(2),
      declarationSection(3),
    ],
  },
  {
    id: 'new-member-standard',
    name: 'New Member (Standard)',
    description: 'Best-practice full membership application with savings, address history, tax residency and ID upload',
    icon: 'UserPlus',
    formType: 'STANDARD',
    includesSavings: true,
    includesLoan: false,
    allowsCorporate: false,
    allowsChildren: false,
    requireCommonBond: true,
    sections: [
      memberTypeSection(false, false, true, 0),
      personalDetailsSection(1),
      {
        title: 'Address History',
        description: 'We need 3 years of address history for identity and credit verification',
        order: 2,
        fields: [
          { fieldKey: 'address_history', fieldType: 'ADDRESS_HISTORY', label: 'Address History (last 3 years)', required: true, order: 0, width: 'FULL', helpText: 'Please provide all addresses you have lived at for the past 3 years' },
        ],
      },
      {
        title: 'Employment',
        description: 'Tell us about your current employment',
        order: 3,
        fields: [
          { fieldKey: 'employment_status', fieldType: 'SELECT', label: 'Employment Status', required: true, order: 0, width: 'HALF', incutoFieldKey: 'employmentStatus', options: [{ label: 'Employed (full-time)', value: 'EMPLOYED_FT' }, { label: 'Employed (part-time)', value: 'EMPLOYED_PT' }, { label: 'Self-employed', value: 'SELF_EMPLOYED' }, { label: 'Retired', value: 'RETIRED' }, { label: 'Student', value: 'STUDENT' }, { label: 'Unemployed', value: 'UNEMPLOYED' }, { label: 'Other', value: 'OTHER' }] },
          { fieldKey: 'employer_name', fieldType: 'TEXT', label: 'Employer / Organisation', required: false, order: 1, width: 'HALF', incutoFieldKey: 'employer' },
        ],
      },
      {
        title: 'Tax Residency',
        description: 'Required by the Common Reporting Standard (CRS)',
        order: 4,
        fields: [
          { fieldKey: 'tax_residency', fieldType: 'TAX_RESIDENCY', label: 'Tax Residency Declaration', required: true, order: 0, width: 'FULL' },
        ],
      },
      {
        title: 'Identity Verification',
        description: 'We need to verify your identity to comply with anti-money laundering regulations',
        order: 5,
        fields: [
          { fieldKey: 'id_document', fieldType: 'ID_UPLOAD', label: 'Photo ID', helpText: 'Upload a clear photo of your passport, driving licence or national identity card', required: true, order: 0, width: 'FULL' },
        ],
      },
      declarationSection(6),
    ],
  },
  {
    id: 'loan-application',
    name: 'Loan Application',
    description: 'Full loan application with calculator, affordability assessment and income & expenditure',
    icon: 'Calculator',
    formType: 'LOAN',
    includesSavings: false,
    includesLoan: true,
    allowsCorporate: false,
    allowsChildren: false,
    requireCommonBond: false,
    sections: [
      {
        title: 'Loan Calculator',
        description: 'Use our loan calculator to find the right loan for you',
        order: 0,
        fields: [
          {
            fieldKey: 'loan_calculator',
            fieldType: 'LOAN_CALCULATOR',
            label: 'Loan Calculator',
            required: true,
            order: 0,
            width: 'FULL',
            options: [
              { label: 'minAmount', value: '500' },
              { label: 'maxAmount', value: '25000' },
              { label: 'stepAmount', value: '500' },
              { label: 'minTerm', value: '6' },
              { label: 'maxTerm', value: '60' },
              { label: 'stepTerm', value: '6' },
              { label: 'apr', value: '12.9' },
              { label: 'defaultAmount', value: '5000' },
              { label: 'defaultTerm', value: '24' },
            ],
          },
          { fieldKey: 'loan_purpose', fieldType: 'LOAN_PURPOSE', label: 'What is the loan for?', required: true, order: 1, width: 'HALF', incutoFieldKey: 'loanPurpose', options: [{ label: 'Home improvements', value: 'home_improvements' }, { label: 'Car purchase', value: 'car' }, { label: 'Debt consolidation', value: 'debt_consolidation' }, { label: 'Holiday', value: 'holiday' }, { label: 'Education', value: 'education' }, { label: 'Medical expenses', value: 'medical' }, { label: 'Other', value: 'other' }] },
        ],
      },
      personalDetailsSection(1),
      addressSection(2),
      {
        title: 'Employment & Income',
        description: 'Tell us about your employment and income',
        order: 3,
        fields: [
          { fieldKey: 'employment_status', fieldType: 'SELECT', label: 'Employment Status', required: true, order: 0, width: 'HALF', incutoFieldKey: 'employmentStatus', options: [{ label: 'Employed (full-time)', value: 'EMPLOYED_FT' }, { label: 'Employed (part-time)', value: 'EMPLOYED_PT' }, { label: 'Self-employed', value: 'SELF_EMPLOYED' }, { label: 'Retired', value: 'RETIRED' }, { label: 'Student', value: 'STUDENT' }, { label: 'Unemployed', value: 'UNEMPLOYED' }] },
          { fieldKey: 'employer_name', fieldType: 'TEXT', label: 'Employer Name', required: false, order: 1, width: 'HALF', incutoFieldKey: 'employer' },
          { fieldKey: 'income_expenditure', fieldType: 'INCOME_EXPENDITURE', label: 'Monthly Income & Expenditure', required: true, order: 2, width: 'FULL', helpText: 'Please provide accurate monthly figures to help us assess your application' },
        ],
      },
      {
        title: 'Bank Details',
        description: 'Where would you like the loan paid into?',
        order: 4,
        fields: [
          { fieldKey: 'sort_code', fieldType: 'SORT_CODE', label: 'Sort Code', placeholder: '00-00-00', required: true, order: 0, width: 'HALF', incutoFieldKey: 'sortCode' },
          { fieldKey: 'account_number', fieldType: 'ACCOUNT_NUMBER', label: 'Account Number', placeholder: '12345678', required: true, order: 1, width: 'HALF', incutoFieldKey: 'accountNumber' },
        ],
      },
      declarationSection(5),
    ],
  },
  {
    id: 'savings-account',
    name: 'Savings Account',
    description: 'Simple savings account opening form with product selection and bank details',
    icon: 'PiggyBank',
    formType: 'SAVINGS_ONLY',
    includesSavings: true,
    includesLoan: false,
    allowsCorporate: false,
    allowsChildren: false,
    requireCommonBond: true,
    sections: [
      memberTypeSection(false, false, true, 0),
      personalDetailsSection(1),
      addressSection(2),
      {
        title: 'Bank Details',
        description: 'We may use these to set up a regular savings transfer',
        order: 3,
        fields: [
          { fieldKey: 'sort_code', fieldType: 'SORT_CODE', label: 'Sort Code', placeholder: '00-00-00', required: false, order: 0, width: 'HALF', incutoFieldKey: 'sortCode' },
          { fieldKey: 'account_number', fieldType: 'ACCOUNT_NUMBER', label: 'Account Number', placeholder: '12345678', required: false, order: 1, width: 'HALF', incutoFieldKey: 'accountNumber' },
          { fieldKey: 'monthly_saving', fieldType: 'NUMBER', label: 'How much would you like to save per month? (£)', placeholder: '50', required: false, order: 2, width: 'HALF' },
        ],
      },
      declarationSection(4),
    ],
  },
  {
    id: 'junior-member',
    name: 'Junior Member',
    description: 'Junior/child savings account with parent or guardian details',
    icon: 'Baby',
    formType: 'CHILDREN',
    includesSavings: true,
    includesLoan: false,
    allowsCorporate: false,
    allowsChildren: true,
    requireCommonBond: true,
    sections: [
      {
        title: 'Account Type',
        description: 'Tell us who this account is for',
        order: 0,
        fields: [
          {
            fieldKey: 'member_type',
            fieldType: 'MEMBER_TYPE_SELECTOR',
            label: 'Who is applying?',
            required: true,
            order: 0,
            width: 'FULL',
            isSystemField: true,
            options: [{ label: 'Child / Junior', value: 'CHILD', description: 'Applying for a child under 18' }],
          },
          { fieldKey: 'common_bond', fieldType: 'COMMON_BOND_SELECTOR', label: 'Confirm your eligibility', helpText: 'You must meet the common bond requirements to join', required: true, order: 1, width: 'FULL', isSystemField: true },
        ],
      },
      {
        title: "Child's Details",
        description: 'Please provide the details of the child this account is for',
        order: 1,
        fields: [
          { fieldKey: 'first_name', fieldType: 'TEXT', label: "Child's First Name", required: true, order: 0, width: 'HALF', isSystemField: true, incutoFieldKey: 'firstName' },
          { fieldKey: 'last_name', fieldType: 'TEXT', label: "Child's Last Name", required: true, order: 1, width: 'HALF', isSystemField: true, incutoFieldKey: 'lastName' },
          { fieldKey: 'date_of_birth', fieldType: 'DATE', label: 'Date of Birth', required: true, order: 2, width: 'HALF', isSystemField: true, incutoFieldKey: 'dateOfBirth' },
          { fieldKey: 'address', fieldType: 'ADDRESS_LOOKUP', label: "Child's Address", required: true, order: 3, width: 'FULL', isSystemField: true, incutoFieldKey: 'address' },
        ],
      },
      {
        title: 'Parent / Guardian Details',
        description: 'The responsible adult for this account',
        order: 2,
        fields: [
          { fieldKey: 'guardian_first_name', fieldType: 'TEXT', label: "Guardian's First Name", required: true, order: 0, width: 'HALF' },
          { fieldKey: 'guardian_last_name', fieldType: 'TEXT', label: "Guardian's Last Name", required: true, order: 1, width: 'HALF' },
          { fieldKey: 'guardian_relationship', fieldType: 'SELECT', label: 'Relationship to Child', required: true, order: 2, width: 'HALF', options: [{ label: 'Parent', value: 'parent' }, { label: 'Legal Guardian', value: 'guardian' }, { label: 'Grandparent', value: 'grandparent' }, { label: 'Other', value: 'other' }] },
          { fieldKey: 'email', fieldType: 'EMAIL', label: "Guardian's Email", required: true, order: 3, width: 'HALF', isSystemField: true, incutoFieldKey: 'email' },
          { fieldKey: 'phone', fieldType: 'PHONE', label: "Guardian's Phone", required: true, order: 4, width: 'HALF', isSystemField: true, incutoFieldKey: 'phone' },
        ],
      },
      declarationSection(3),
    ],
  },
]

export function getTemplate(id: string): FormTemplate | undefined {
  return FORM_TEMPLATES.find(t => t.id === id)
}

/** Convert a template's sections/fields into Prisma create input */
export function templateToPrismaInput(template: FormTemplate) {
  return template.sections.map(section => ({
    title: section.title,
    description: section.description,
    order: section.order,
    fields: {
      create: section.fields.map(field => ({
        fieldKey: field.fieldKey,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fieldType: field.fieldType as any,
        label: field.label,
        placeholder: field.placeholder,
        helpText: field.helpText,
        required: field.required,
        order: field.order,
        width: field.width,
        isSystemField: field.isSystemField ?? false,
        incutoFieldKey: field.incutoFieldKey,
        options: field.options ?? [],
      })),
    },
  }))
}
