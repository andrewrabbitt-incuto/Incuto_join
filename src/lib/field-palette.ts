import type { FieldPaletteItem } from '@/types'

export const FIELD_PALETTE: FieldPaletteItem[] = [
  // Personal Details
  { type: 'TEXT', label: 'Text Input', icon: 'Type', description: 'Single line text', category: 'PERSONAL', defaultLabel: 'Text Field' },
  { type: 'EMAIL', label: 'Email Address', icon: 'Mail', description: 'Email input with validation', category: 'PERSONAL', defaultLabel: 'Email Address' },
  { type: 'PHONE', label: 'Phone Number', icon: 'Phone', description: 'Phone number input', category: 'PERSONAL', defaultLabel: 'Phone Number' },
  { type: 'DATE', label: 'Date', icon: 'Calendar', description: 'Date picker', category: 'PERSONAL', defaultLabel: 'Date' },
  { type: 'NUMBER', label: 'Number', icon: 'Hash', description: 'Numeric input', category: 'PERSONAL', defaultLabel: 'Number' },
  { type: 'SELECT', label: 'Dropdown', icon: 'ChevronDown', description: 'Single selection dropdown', category: 'PERSONAL', defaultLabel: 'Select Option' },
  { type: 'RADIO', label: 'Radio Buttons', icon: 'Circle', description: 'Single choice from list', category: 'PERSONAL', defaultLabel: 'Choose One' },
  { type: 'CHECKBOX', label: 'Checkbox', icon: 'CheckSquare', description: 'Yes/No checkbox', category: 'PERSONAL', defaultLabel: 'I agree' },
  { type: 'MULTI_SELECT', label: 'Multi-Select', icon: 'CheckSquare', description: 'Multiple selections', category: 'PERSONAL', defaultLabel: 'Select All That Apply' },
  { type: 'TEXTAREA', label: 'Long Text', icon: 'AlignLeft', description: 'Multi-line text area', category: 'PERSONAL', defaultLabel: 'Additional Information' },
  { type: 'NATIONAL_INSURANCE', label: 'National Insurance', icon: 'Shield', description: 'NI number with format validation', category: 'PERSONAL', defaultLabel: 'National Insurance Number' },
  { type: 'FILE_UPLOAD', label: 'File Upload', icon: 'Upload', description: 'Document upload', category: 'PERSONAL', defaultLabel: 'Upload Document' },
  { type: 'ID_UPLOAD', label: 'ID Document Upload', icon: 'CreditCard', description: 'Photo ID upload', category: 'PERSONAL', defaultLabel: 'Upload ID' },
  { type: 'SIGNATURE', label: 'Signature', icon: 'PenLine', description: 'Digital signature capture', category: 'PERSONAL', defaultLabel: 'Signature' },

  // Address
  { type: 'ADDRESS_LOOKUP', label: 'Address Lookup', icon: 'MapPin', description: 'Postcode lookup with autocomplete', category: 'ADDRESS', defaultLabel: 'Home Address' },

  // Financial
  { type: 'SORT_CODE', label: 'Sort Code', icon: 'CreditCard', description: 'Bank sort code', category: 'FINANCIAL', defaultLabel: 'Sort Code' },
  { type: 'ACCOUNT_NUMBER', label: 'Account Number', icon: 'CreditCard', description: 'Bank account number', category: 'FINANCIAL', defaultLabel: 'Account Number' },
  { type: 'LOAN_AMOUNT', label: 'Loan Amount', icon: 'PoundSterling', description: 'Loan amount selector', category: 'FINANCIAL', defaultLabel: 'How much would you like to borrow?' },
  { type: 'LOAN_TERM', label: 'Loan Term', icon: 'Clock', description: 'Repayment term selector', category: 'FINANCIAL', defaultLabel: 'Over how many months?' },
  { type: 'LOAN_PURPOSE', label: 'Loan Purpose', icon: 'HelpCircle', description: 'Purpose of loan', category: 'FINANCIAL', defaultLabel: 'What is the loan for?' },

  // Products & Eligibility
  { type: 'PRODUCT_SELECTOR', label: 'Product Selector', icon: 'Package', description: 'Savings / Loan / Both', category: 'PRODUCTS', defaultLabel: 'What would you like to apply for?', isSystemField: true },
  { type: 'MEMBER_TYPE_SELECTOR', label: 'Member Type', icon: 'Users', description: 'Individual / Corporate / Child', category: 'PRODUCTS', defaultLabel: 'Who is applying?', isSystemField: true },
  { type: 'COMMON_BOND_SELECTOR', label: 'Common Bond', icon: 'Globe', description: 'Eligibility check', category: 'PRODUCTS', defaultLabel: 'Confirm your eligibility', isSystemField: true },

  // Compliance
  { type: 'CONSENT', label: 'Consent / GDPR', icon: 'ShieldCheck', description: 'Marketing or GDPR consent', category: 'COMPLIANCE', defaultLabel: 'I consent to…' },
  { type: 'DECLARATION', label: 'Declaration', icon: 'FileCheck', description: 'Legal declaration statement', category: 'COMPLIANCE', defaultLabel: 'I declare that…' },
  { type: 'TAX_RESIDENCY', label: 'Tax Residency', icon: 'Globe2', description: 'CRS tax residency declaration', category: 'COMPLIANCE', defaultLabel: 'Tax Residency Declaration' },

  // Widgets — pre-built compound elements
  { type: 'LOAN_CALCULATOR', label: 'Loan Calculator', icon: 'Calculator', description: 'Interactive loan slider with monthly payment', category: 'WIDGETS', defaultLabel: 'Loan Calculator' },
  { type: 'ADDRESS_HISTORY', label: 'Address History', icon: 'History', description: '3-year address history with move dates', category: 'WIDGETS', defaultLabel: 'Address History' },
  { type: 'INCOME_EXPENDITURE', label: 'Income & Expenditure', icon: 'BarChart2', description: 'Structured I&E form with ONS categories', category: 'WIDGETS', defaultLabel: 'Income & Expenditure' },

  // Layout
  { type: 'HEADING', label: 'Heading', icon: 'Heading', description: 'Section heading text', category: 'LAYOUT', defaultLabel: 'Section Heading' },
  { type: 'PARAGRAPH', label: 'Paragraph', icon: 'AlignLeft', description: 'Instructional text block', category: 'LAYOUT', defaultLabel: 'Add your instructions here…' },
  { type: 'DIVIDER', label: 'Divider', icon: 'Minus', description: 'Horizontal line separator', category: 'LAYOUT', defaultLabel: 'Divider' },
]

export const FIELD_CATEGORIES = [
  { key: 'PERSONAL', label: 'Personal Details' },
  { key: 'ADDRESS', label: 'Address' },
  { key: 'FINANCIAL', label: 'Financial' },
  { key: 'PRODUCTS', label: 'Products & Eligibility' },
  { key: 'COMPLIANCE', label: 'Compliance' },
  { key: 'WIDGETS', label: 'Widgets' },
  { key: 'LAYOUT', label: 'Layout' },
]

// Minimum required fields for any join form
export const SYSTEM_FIELDS = [
  { fieldKey: 'title', fieldType: 'SELECT' as const, label: 'Title', incutoFieldKey: 'title', systemFieldName: 'title', order: 0, required: true, width: 'HALF' as const },
  { fieldKey: 'first_name', fieldType: 'TEXT' as const, label: 'First Name', incutoFieldKey: 'firstName', systemFieldName: 'first_name', order: 1, required: true, width: 'HALF' as const },
  { fieldKey: 'last_name', fieldType: 'TEXT' as const, label: 'Last Name', incutoFieldKey: 'lastName', systemFieldName: 'last_name', order: 2, required: true, width: 'HALF' as const },
  { fieldKey: 'email', fieldType: 'EMAIL' as const, label: 'Email Address', incutoFieldKey: 'email', systemFieldName: 'email', order: 3, required: true, width: 'FULL' as const },
  { fieldKey: 'phone', fieldType: 'PHONE' as const, label: 'Phone Number', incutoFieldKey: 'phone', systemFieldName: 'phone', order: 4, required: false, width: 'HALF' as const },
  { fieldKey: 'date_of_birth', fieldType: 'DATE' as const, label: 'Date of Birth', incutoFieldKey: 'dateOfBirth', systemFieldName: 'date_of_birth', order: 5, required: true, width: 'HALF' as const },
]
