// ─────────────────────────────────────────────────────────────
// Form Builder Types
// ─────────────────────────────────────────────────────────────

export type FieldType =
  | 'TEXT' | 'EMAIL' | 'PHONE' | 'NUMBER' | 'DATE'
  | 'SELECT' | 'MULTI_SELECT' | 'RADIO' | 'CHECKBOX'
  | 'TEXTAREA' | 'FILE_UPLOAD' | 'HEADING' | 'PARAGRAPH' | 'DIVIDER'
  | 'COMMON_BOND_SELECTOR' | 'PRODUCT_SELECTOR' | 'MEMBER_TYPE_SELECTOR'
  | 'SIGNATURE' | 'ADDRESS_LOOKUP' | 'SORT_CODE' | 'ACCOUNT_NUMBER'
  | 'NATIONAL_INSURANCE' | 'ID_UPLOAD' | 'CONSENT' | 'DECLARATION'
  | 'LOAN_AMOUNT' | 'LOAN_PURPOSE' | 'LOAN_TERM'

export type FieldWidth = 'FULL' | 'HALF' | 'THIRD' | 'TWO_THIRDS'

export interface FieldOption {
  label: string
  value: string
  description?: string
}

export interface FieldCondition {
  id: string
  fieldKey: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty'
  value: string | number | boolean
  logic?: 'AND' | 'OR'
}

export interface InfoButton {
  title: string
  content: string
  type: 'tooltip' | 'modal' | 'drawer'
}

export interface FieldValidation {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  message?: string
}

export interface FormFieldDef {
  id: string
  sectionId: string
  fieldKey: string
  fieldType: FieldType
  label: string
  placeholder?: string
  helpText?: string
  infoButton?: InfoButton
  required: boolean
  order: number
  validation?: FieldValidation
  options?: FieldOption[]
  incutoFieldKey?: string
  isSystemField?: boolean
  systemFieldName?: string
  conditions?: FieldCondition[]
  width: FieldWidth
  cssClass?: string
}

export interface FormSectionDef {
  id: string
  formId: string
  title: string
  description?: string
  helpText?: string
  infoButton?: InfoButton
  order: number
  conditions?: FieldCondition[]
  fields: FormFieldDef[]
}

export interface FormBranding {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl?: string
  fontFamily: string
  borderRadius: string
  customCss?: string
  backgroundType?: 'solid' | 'gradient' | 'image'
  backgroundColor?: string
  backgroundGradient?: string
  backgroundImage?: string
  buttonStyle?: 'rounded' | 'square' | 'pill'
  headerText?: string
  footerText?: string
}

export interface FormDef {
  id: string
  tenantId: string
  name: string
  slug: string
  description?: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  formType: string
  includesSavings: boolean
  includesLoan: boolean
  allowsCorporate: boolean
  allowsChildren: boolean
  loanRedirectUrl?: string
  loanJourneyEmbed: boolean
  brandingOverride?: FormBranding
  chatbotEnabled: boolean
  chatbotConfig?: ChatbotConfig
  requireCommonBond: boolean
  sections: FormSectionDef[]
}

export interface ChatbotConfig {
  name: string
  greeting: string
  personality: string
  primaryColor?: string
  avatarUrl?: string
  position: 'bottom-right' | 'bottom-left'
}

// ─────────────────────────────────────────────────────────────
// Field Palette Categories
// ─────────────────────────────────────────────────────────────

export interface FieldPaletteItem {
  type: FieldType
  label: string
  icon: string
  description: string
  category: 'PERSONAL' | 'ADDRESS' | 'FINANCIAL' | 'PRODUCTS' | 'COMPLIANCE' | 'LAYOUT' | 'CUSTOM'
  defaultLabel: string
  isSystemField?: boolean
}

// ─────────────────────────────────────────────────────────────
// Analytics Types
// ─────────────────────────────────────────────────────────────

export interface FormAnalytics {
  totalStarts: number
  totalCompletions: number
  totalDropouts: number
  conversionRate: number
  avgCompletionTime: number
  dropoutBySectionData: Record<string, number>
  byProduct: { savings: number; loan: number; both: number }
  byMemberType: { individual: number; corporate: number; child: number }
  byLandingPage: Record<string, number>
  recentApplications: ApplicationSummary[]
  trend: TrendPoint[]
}

export interface ApplicationSummary {
  id: string
  status: string
  memberType: string
  products: unknown
  startedAt: string
  completedAt?: string
  landingPageName?: string
}

export interface TrendPoint {
  date: string
  starts: number
  completions: number
}

// ─────────────────────────────────────────────────────────────
// Common Bond Types
// ─────────────────────────────────────────────────────────────

export interface CommonBondDef {
  id: string
  name: string
  type: 'GEOGRAPHICAL' | 'POSTCODE' | 'EMPLOYMENT' | 'COMMUNITY' | 'ASSOCIATION'
  description?: string
  values: string[]
}

// ─────────────────────────────────────────────────────────────
// Tenant / Branding
// ─────────────────────────────────────────────────────────────

export interface TenantBranding {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl?: string
  faviconUrl?: string
  fontFamily: string
  borderRadius: string
  customCss?: string
}
