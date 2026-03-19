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

// ─── Employment status options (reused across templates) ───────────
const EMPLOYMENT_OPTIONS = [
  { label: 'Employed (full-time)', value: 'EMPLOYED_FT' },
  { label: 'Employed (part-time)', value: 'EMPLOYED_PT' },
  { label: 'Self-employed', value: 'SELF_EMPLOYED' },
  { label: 'Retired', value: 'RETIRED' },
  { label: 'Student', value: 'STUDENT' },
  { label: 'Unemployed', value: 'UNEMPLOYED' },
  { label: 'Other', value: 'OTHER' },
]

const LOAN_PURPOSE_OPTIONS = [
  { label: 'Home improvements', value: 'home_improvements' },
  { label: 'Car purchase', value: 'car' },
  { label: 'Debt consolidation', value: 'debt_consolidation' },
  { label: 'Holiday', value: 'holiday' },
  { label: 'Education', value: 'education' },
  { label: 'Medical expenses', value: 'medical' },
  { label: 'Wedding', value: 'wedding' },
  { label: 'Other', value: 'other' },
]

const LOAN_CALCULATOR_OPTIONS = [
  { label: 'minAmount', value: '500' },
  { label: 'maxAmount', value: '25000' },
  { label: 'stepAmount', value: '500' },
  { label: 'minTerm', value: '6' },
  { label: 'maxTerm', value: '60' },
  { label: 'stepTerm', value: '6' },
  { label: 'apr', value: '12.9' },
  { label: 'defaultAmount', value: '5000' },
  { label: 'defaultTerm', value: '24' },
]

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
          { fieldKey: 'employment_status', fieldType: 'SELECT', label: 'Employment Status', required: true, order: 0, width: 'HALF', incutoFieldKey: 'employmentStatus', options: EMPLOYMENT_OPTIONS },
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
          { fieldKey: 'loan_calculator', fieldType: 'LOAN_CALCULATOR', label: 'Loan Calculator', required: true, order: 0, width: 'FULL', options: LOAN_CALCULATOR_OPTIONS },
          { fieldKey: 'loan_purpose', fieldType: 'LOAN_PURPOSE', label: 'What is the loan for?', required: true, order: 1, width: 'HALF', incutoFieldKey: 'loanPurpose', options: LOAN_PURPOSE_OPTIONS },
        ],
      },
      personalDetailsSection(1),
      addressSection(2),
      {
        title: 'Employment & Income',
        description: 'Tell us about your employment and income',
        order: 3,
        fields: [
          { fieldKey: 'employment_status', fieldType: 'SELECT', label: 'Employment Status', required: true, order: 0, width: 'HALF', incutoFieldKey: 'employmentStatus', options: EMPLOYMENT_OPTIONS },
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
  // ─── Join & Borrow ───────────────────────────────────────────────
  {
    id: 'join-and-borrow',
    name: 'Join & Borrow',
    description: 'Single end-to-end application to join the credit union and apply for a loan — membership, loan details, affordability and identity in one flow',
    icon: 'ArrowRightLeft',
    formType: 'STANDARD',
    includesSavings: true,
    includesLoan: true,
    allowsCorporate: false,
    allowsChildren: false,
    requireCommonBond: true,
    sections: [
      memberTypeSection(false, false, true, 0),
      {
        title: 'Loan Details',
        description: 'Tell us about the loan you would like to apply for',
        order: 1,
        fields: [
          { fieldKey: 'loan_calculator', fieldType: 'LOAN_CALCULATOR', label: 'Loan Calculator', required: true, order: 0, width: 'FULL', options: LOAN_CALCULATOR_OPTIONS },
          { fieldKey: 'loan_purpose', fieldType: 'LOAN_PURPOSE', label: 'What is the loan for?', required: true, order: 1, width: 'HALF', incutoFieldKey: 'loanPurpose', options: LOAN_PURPOSE_OPTIONS },
        ],
      },
      personalDetailsSection(2),
      {
        title: 'Address History',
        description: 'We need 3 years of address history for identity and credit verification',
        order: 3,
        fields: [
          { fieldKey: 'address_history', fieldType: 'ADDRESS_HISTORY', label: 'Address History (last 3 years)', required: true, order: 0, width: 'FULL', helpText: 'Please provide all addresses you have lived at for the past 3 years' },
        ],
      },
      {
        title: 'Employment & Income',
        description: 'Tell us about your current employment and monthly finances',
        order: 4,
        fields: [
          { fieldKey: 'employment_status', fieldType: 'SELECT', label: 'Employment Status', required: true, order: 0, width: 'HALF', incutoFieldKey: 'employmentStatus', options: EMPLOYMENT_OPTIONS },
          { fieldKey: 'employer_name', fieldType: 'TEXT', label: 'Employer Name', required: false, order: 1, width: 'HALF', incutoFieldKey: 'employer' },
          { fieldKey: 'income_expenditure', fieldType: 'INCOME_EXPENDITURE', label: 'Monthly Income & Expenditure', required: true, order: 2, width: 'FULL', helpText: 'Please provide accurate monthly figures to help us assess your application' },
        ],
      },
      {
        title: 'Bank Details',
        description: 'Where would you like the loan paid into?',
        order: 5,
        fields: [
          { fieldKey: 'sort_code', fieldType: 'SORT_CODE', label: 'Sort Code', placeholder: '00-00-00', required: true, order: 0, width: 'HALF', incutoFieldKey: 'sortCode' },
          { fieldKey: 'account_number', fieldType: 'ACCOUNT_NUMBER', label: 'Account Number', placeholder: '12345678', required: true, order: 1, width: 'HALF', incutoFieldKey: 'accountNumber' },
        ],
      },
      {
        title: 'Tax Residency',
        description: 'Required by the Common Reporting Standard (CRS)',
        order: 6,
        fields: [
          { fieldKey: 'tax_residency', fieldType: 'TAX_RESIDENCY', label: 'Tax Residency Declaration', required: true, order: 0, width: 'FULL' },
        ],
      },
      {
        title: 'Identity Verification',
        description: 'We need to verify your identity in line with anti-money laundering regulations',
        order: 7,
        fields: [
          { fieldKey: 'id_document', fieldType: 'ID_UPLOAD', label: 'Photo ID', helpText: 'Upload a clear photo of your passport, driving licence or national identity card', required: true, order: 0, width: 'FULL' },
        ],
      },
      declarationSection(8),
    ],
  },

  // ─── Payroll Deduction ───────────────────────────────────────────
  {
    id: 'payroll-deduction',
    name: 'Payroll Deduction',
    description: 'Authorises the credit union to deduct regular savings contributions directly from the member\'s payroll. Signed by the employee.',
    icon: 'Building2',
    formType: 'STANDARD',
    includesSavings: false,
    includesLoan: false,
    allowsCorporate: false,
    allowsChildren: false,
    requireCommonBond: false,
    sections: [
      {
        title: 'Your Details',
        description: 'Please confirm your details exactly as they appear on your payslip',
        order: 0,
        fields: [
          { fieldKey: 'title', fieldType: 'SELECT', label: 'Title', required: false, order: 0, width: 'HALF', isSystemField: true, incutoFieldKey: 'title', options: [{ label: 'Mr', value: 'Mr' }, { label: 'Mrs', value: 'Mrs' }, { label: 'Miss', value: 'Miss' }, { label: 'Ms', value: 'Ms' }, { label: 'Dr', value: 'Dr' }, { label: 'Mx', value: 'Mx' }] },
          { fieldKey: 'first_name', fieldType: 'TEXT', label: 'First Name', required: true, order: 1, width: 'HALF', isSystemField: true, incutoFieldKey: 'firstName' },
          { fieldKey: 'last_name', fieldType: 'TEXT', label: 'Last Name', required: true, order: 2, width: 'HALF', isSystemField: true, incutoFieldKey: 'lastName' },
          { fieldKey: 'date_of_birth', fieldType: 'DATE', label: 'Date of Birth', required: true, order: 3, width: 'HALF', isSystemField: true, incutoFieldKey: 'dateOfBirth' },
          { fieldKey: 'national_insurance', fieldType: 'NATIONAL_INSURANCE', label: 'National Insurance Number', placeholder: 'AB 12 34 56 C', required: true, order: 4, width: 'HALF', isSystemField: true, incutoFieldKey: 'nationalInsurance' },
          { fieldKey: 'email', fieldType: 'EMAIL', label: 'Email Address', placeholder: 'your@email.com', required: true, order: 5, width: 'HALF', isSystemField: true, incutoFieldKey: 'email' },
          { fieldKey: 'phone', fieldType: 'PHONE', label: 'Mobile Number', placeholder: '07700 900000', required: false, order: 6, width: 'HALF', isSystemField: true, incutoFieldKey: 'phone' },
        ],
      },
      {
        title: 'Employer Details',
        description: 'Tell us about your employer so they can action your deduction request',
        order: 1,
        fields: [
          { fieldKey: 'employer_name', fieldType: 'TEXT', label: 'Employer Name', required: true, order: 0, width: 'FULL', incutoFieldKey: 'employer' },
          { fieldKey: 'payroll_reference', fieldType: 'TEXT', label: 'Payroll / Staff Reference Number', placeholder: 'e.g. EMP00123', required: false, order: 1, width: 'HALF' },
          { fieldKey: 'department', fieldType: 'TEXT', label: 'Department / Team', required: false, order: 2, width: 'HALF' },
          { fieldKey: 'pay_frequency', fieldType: 'SELECT', label: 'Pay Frequency', required: true, order: 3, width: 'HALF', options: [{ label: 'Weekly', value: 'WEEKLY' }, { label: 'Fortnightly', value: 'FORTNIGHTLY' }, { label: 'Four-weekly', value: 'FOUR_WEEKLY' }, { label: 'Monthly', value: 'MONTHLY' }] },
        ],
      },
      {
        title: 'Savings Instruction',
        description: 'How much would you like deducted from your pay and credited to your savings account?',
        order: 2,
        fields: [
          { fieldKey: 'savings_product', fieldType: 'TEXT', label: 'Savings Account / Product', placeholder: 'e.g. Regular Saver', required: false, order: 0, width: 'HALF', helpText: 'The name of the savings account you want contributions paid into' },
          { fieldKey: 'deduction_amount', fieldType: 'NUMBER', label: 'Amount to Deduct per Pay Period (£)', placeholder: '50', required: true, order: 1, width: 'HALF' },
          { fieldKey: 'deduction_start_date', fieldType: 'DATE', label: 'Deduction Start Date', required: true, order: 2, width: 'HALF' },
          { fieldKey: 'increase_permission', fieldType: 'CHECKBOX', label: 'I agree the credit union may contact me about increasing my savings contributions', required: false, order: 3, width: 'FULL' },
        ],
      },
      {
        title: 'Authorisation',
        description: 'By signing below you authorise your employer to make the deductions described above and pay them to the credit union on your behalf',
        order: 3,
        fields: [
          { fieldKey: 'signature', fieldType: 'SIGNATURE', label: 'Your Signature', required: true, order: 0, width: 'FULL' },
          { fieldKey: 'declaration', fieldType: 'DECLARATION', label: 'Declaration', placeholder: 'I authorise my employer to deduct the amount specified above from my pay and remit it to the credit union on my behalf. I understand I can cancel or amend this instruction by giving notice in writing.', required: true, order: 1, width: 'FULL', isSystemField: true },
        ],
      },
    ],
  },

  // ─── Loan Insurance ─────────────────────────────────────────────
  {
    id: 'insurance',
    name: 'Loan Insurance',
    description: 'Captures additional insurance information for enhanced cover on larger loans — health declaration, cover selection and beneficiary details',
    icon: 'ShieldCheck',
    formType: 'STANDARD',
    includesSavings: false,
    includesLoan: false,
    allowsCorporate: false,
    allowsChildren: false,
    requireCommonBond: false,
    sections: [
      {
        title: 'Your Details',
        description: 'Please confirm the member details for this insurance application',
        order: 0,
        fields: [
          { fieldKey: 'title', fieldType: 'SELECT', label: 'Title', required: false, order: 0, width: 'HALF', isSystemField: true, incutoFieldKey: 'title', options: [{ label: 'Mr', value: 'Mr' }, { label: 'Mrs', value: 'Mrs' }, { label: 'Miss', value: 'Miss' }, { label: 'Ms', value: 'Ms' }, { label: 'Dr', value: 'Dr' }, { label: 'Mx', value: 'Mx' }] },
          { fieldKey: 'first_name', fieldType: 'TEXT', label: 'First Name', required: true, order: 1, width: 'HALF', isSystemField: true, incutoFieldKey: 'firstName' },
          { fieldKey: 'last_name', fieldType: 'TEXT', label: 'Last Name', required: true, order: 2, width: 'HALF', isSystemField: true, incutoFieldKey: 'lastName' },
          { fieldKey: 'date_of_birth', fieldType: 'DATE', label: 'Date of Birth', required: true, order: 3, width: 'HALF', isSystemField: true, incutoFieldKey: 'dateOfBirth' },
          { fieldKey: 'email', fieldType: 'EMAIL', label: 'Email Address', required: true, order: 4, width: 'HALF', isSystemField: true, incutoFieldKey: 'email' },
          { fieldKey: 'phone', fieldType: 'PHONE', label: 'Mobile Number', required: false, order: 5, width: 'HALF', isSystemField: true, incutoFieldKey: 'phone' },
        ],
      },
      {
        title: 'Loan Details',
        description: 'Confirm the loan this insurance application relates to',
        order: 1,
        fields: [
          { fieldKey: 'loan_amount', fieldType: 'NUMBER', label: 'Loan Amount (£)', required: true, order: 0, width: 'HALF' },
          { fieldKey: 'loan_term', fieldType: 'NUMBER', label: 'Loan Term (months)', required: true, order: 1, width: 'HALF' },
          { fieldKey: 'loan_reference', fieldType: 'TEXT', label: 'Loan Reference (if known)', required: false, order: 2, width: 'HALF', helpText: 'Leave blank if applying at the same time as your loan' },
        ],
      },
      {
        title: 'Cover Selection',
        description: 'Select the type of insurance cover you would like',
        order: 2,
        fields: [
          { fieldKey: 'cover_type', fieldType: 'RADIO', label: 'Type of Cover', required: true, order: 0, width: 'FULL', options: [{ label: 'Payment Protection Insurance (PPI)', value: 'PPI', description: 'Covers your loan repayments if you cannot work due to accident, sickness or unemployment' }, { label: 'Life Assurance', value: 'LIFE', description: 'Repays the outstanding loan balance in the event of your death' }, { label: 'Critical Illness Cover', value: 'CRITICAL_ILLNESS', description: 'Covers your loan if you are diagnosed with a specified critical illness' }, { label: 'Combined Cover (PPI + Life)', value: 'COMBINED', description: 'Comprehensive cover combining payment protection and life assurance' }] },
          { fieldKey: 'cover_start_date', fieldType: 'DATE', label: 'Requested Cover Start Date', required: true, order: 1, width: 'HALF' },
        ],
      },
      {
        title: 'Health Declaration',
        description: 'We need to ask a few health questions before we can confirm your cover. All answers are treated in strict confidence.',
        order: 3,
        fields: [
          { fieldKey: 'smoker_status', fieldType: 'RADIO', label: 'Smoking Status', required: true, order: 0, width: 'HALF', options: [{ label: 'Non-smoker', value: 'NON_SMOKER' }, { label: 'Ex-smoker (quit 12+ months ago)', value: 'EX_SMOKER' }, { label: 'Current smoker', value: 'SMOKER' }] },
          { fieldKey: 'pre_existing_conditions', fieldType: 'CHECKBOX', label: 'I have, or have had in the last 5 years, a pre-existing medical condition, disability or long-term illness', required: false, order: 1, width: 'FULL' },
          { fieldKey: 'pre_existing_details', fieldType: 'TEXTAREA', label: 'Please describe your condition(s)', required: false, order: 2, width: 'FULL', helpText: 'Include diagnosis, treatment received and current status' },
          { fieldKey: 'awaiting_treatment', fieldType: 'CHECKBOX', label: 'I am currently awaiting medical treatment, tests, investigations or a referral to a specialist', required: false, order: 3, width: 'FULL' },
        ],
      },
      {
        title: 'Beneficiary Details',
        description: 'For life assurance cover — who should receive the benefit of this policy? You can update this at any time.',
        order: 4,
        fields: [
          { fieldKey: 'beneficiary_first_name', fieldType: 'TEXT', label: "Beneficiary's First Name", required: false, order: 0, width: 'HALF' },
          { fieldKey: 'beneficiary_last_name', fieldType: 'TEXT', label: "Beneficiary's Last Name", required: false, order: 1, width: 'HALF' },
          { fieldKey: 'beneficiary_relationship', fieldType: 'SELECT', label: 'Relationship to You', required: false, order: 2, width: 'HALF', options: [{ label: 'Spouse / Civil Partner', value: 'SPOUSE' }, { label: 'Partner', value: 'PARTNER' }, { label: 'Parent', value: 'PARENT' }, { label: 'Child', value: 'CHILD' }, { label: 'Sibling', value: 'SIBLING' }, { label: 'Other', value: 'OTHER' }] },
          { fieldKey: 'beneficiary_dob', fieldType: 'DATE', label: "Beneficiary's Date of Birth", required: false, order: 3, width: 'HALF' },
          { fieldKey: 'beneficiary_email', fieldType: 'EMAIL', label: "Beneficiary's Email", required: false, order: 4, width: 'HALF' },
          { fieldKey: 'beneficiary_phone', fieldType: 'PHONE', label: "Beneficiary's Phone", required: false, order: 5, width: 'HALF' },
        ],
      },
      declarationSection(5),
    ],
  },

  // ─── Source of Funds ─────────────────────────────────────────────
  {
    id: 'source-of-funds',
    name: 'Source of Funds',
    description: 'AML-compliant source of funds declaration for larger deposits — captures the origin of funds with supporting documentary evidence',
    icon: 'BadgeCheck',
    formType: 'STANDARD',
    includesSavings: false,
    includesLoan: false,
    allowsCorporate: false,
    allowsChildren: false,
    requireCommonBond: false,
    sections: [
      {
        title: 'Your Details',
        description: 'Please confirm your personal details for our records',
        order: 0,
        fields: [
          { fieldKey: 'title', fieldType: 'SELECT', label: 'Title', required: false, order: 0, width: 'HALF', isSystemField: true, incutoFieldKey: 'title', options: [{ label: 'Mr', value: 'Mr' }, { label: 'Mrs', value: 'Mrs' }, { label: 'Miss', value: 'Miss' }, { label: 'Ms', value: 'Ms' }, { label: 'Dr', value: 'Dr' }, { label: 'Mx', value: 'Mx' }] },
          { fieldKey: 'first_name', fieldType: 'TEXT', label: 'First Name', required: true, order: 1, width: 'HALF', isSystemField: true, incutoFieldKey: 'firstName' },
          { fieldKey: 'last_name', fieldType: 'TEXT', label: 'Last Name', required: true, order: 2, width: 'HALF', isSystemField: true, incutoFieldKey: 'lastName' },
          { fieldKey: 'date_of_birth', fieldType: 'DATE', label: 'Date of Birth', required: true, order: 3, width: 'HALF', isSystemField: true, incutoFieldKey: 'dateOfBirth' },
          { fieldKey: 'national_insurance', fieldType: 'NATIONAL_INSURANCE', label: 'National Insurance Number', placeholder: 'AB 12 34 56 C', required: true, order: 4, width: 'HALF', isSystemField: true, incutoFieldKey: 'nationalInsurance' },
          { fieldKey: 'email', fieldType: 'EMAIL', label: 'Email Address', required: true, order: 5, width: 'HALF', isSystemField: true, incutoFieldKey: 'email' },
          { fieldKey: 'phone', fieldType: 'PHONE', label: 'Mobile Number', required: false, order: 6, width: 'HALF', isSystemField: true, incutoFieldKey: 'phone' },
        ],
      },
      {
        title: 'Deposit Details',
        description: 'Tell us about the deposit you are making',
        order: 1,
        fields: [
          { fieldKey: 'deposit_amount', fieldType: 'NUMBER', label: 'Deposit Amount (£)', required: true, order: 0, width: 'HALF' },
          { fieldKey: 'deposit_date', fieldType: 'DATE', label: 'Expected Deposit Date', required: true, order: 1, width: 'HALF' },
          { fieldKey: 'account_name', fieldType: 'TEXT', label: 'Account / Product to Deposit Into', placeholder: 'e.g. Easy Access Saver', required: false, order: 2, width: 'HALF' },
        ],
      },
      {
        title: 'Source of Funds',
        description: 'Please tell us where this money has come from. All funds must be legally obtained. This information is required under the Money Laundering Regulations.',
        order: 2,
        fields: [
          { fieldKey: 'primary_source', fieldType: 'SELECT', label: 'Primary Source of Funds', required: true, order: 0, width: 'FULL', options: [{ label: 'Employment income / salary', value: 'EMPLOYMENT' }, { label: 'Savings built up over time', value: 'SAVINGS' }, { label: 'Inheritance', value: 'INHERITANCE' }, { label: 'Sale of property', value: 'PROPERTY_SALE' }, { label: 'Sale of a business', value: 'BUSINESS_SALE' }, { label: 'Gift from family or friend', value: 'GIFT' }, { label: 'Investment or dividend returns', value: 'INVESTMENT' }, { label: 'Legal compensation or settlement', value: 'COMPENSATION' }, { label: 'Pension or retirement fund', value: 'PENSION' }, { label: 'Other (please describe below)', value: 'OTHER' }] },
          { fieldKey: 'source_description', fieldType: 'TEXTAREA', label: 'Further Details', required: true, order: 1, width: 'FULL', helpText: 'Please provide as much detail as possible — for example, name of employer, name of solicitor handling a property sale, or details of a bequest' },
          { fieldKey: 'source_country', fieldType: 'SELECT', label: 'Country Where Funds Originated', required: false, order: 2, width: 'HALF', helpText: 'If the funds came from outside the UK, please specify the country', options: [{ label: 'United Kingdom', value: 'GB' }, { label: 'Republic of Ireland', value: 'IE' }, { label: 'United States', value: 'US' }, { label: 'European Union (other)', value: 'EU' }, { label: 'Other — please describe above', value: 'OTHER' }] },
        ],
      },
      {
        title: 'Supporting Documents',
        description: 'Please upload evidence to support your declaration. Accepted documents include bank statements, solicitor letters, payslips, grant of probate, or a signed gift letter.',
        order: 3,
        fields: [
          { fieldKey: 'supporting_documents', fieldType: 'FILE_UPLOAD', label: 'Upload Supporting Evidence', required: true, order: 0, width: 'FULL', helpText: 'You can upload multiple documents. Accepted formats: PDF, JPG, PNG (max 10 MB each)' },
        ],
      },
      declarationSection(4),
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
