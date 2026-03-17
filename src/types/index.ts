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
  /** 'form' reads from submitted field values; 'context' reads from trigger results */
  source?: 'form' | 'context'
  /**
   * When source='form': the fieldKey of another form field.
   * When source='context': a dot-path into formContext, e.g. "credit_result.tier"
   */
  fieldKey: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty'
  value: string | number | boolean
  logic?: 'AND' | 'OR'
}

// ─────────────────────────────────────────────────────────────
// Section Triggers — mid-form API calls
// Defined on a FormSection; fire when the section completes.
// Results are stored in formContext under `contextKey`.
// ─────────────────────────────────────────────────────────────

export type TriggerType = 'CREDIT_SEARCH' | 'QUOTATION' | 'OPEN_BANKING' | 'WEBHOOK'

export interface TriggerFieldMapping {
  /** Field key in the form (e.g. "first_name") */
  formFieldKey: string
  /** Parameter name expected by the API (e.g. "firstName") */
  apiField: string
}

export interface SectionTrigger {
  id: string
  name: string
  triggerType: TriggerType
  /** Key under which the API result is stored in formContext, e.g. "credit_result" */
  contextKey: string
  /** Maps form field values to the API request payload */
  fieldMappings: TriggerFieldMapping[]
  /** Only SECTION_COMPLETE is supported today */
  fireOn: 'SECTION_COMPLETE'
  /** WEBHOOK only: the URL to POST to */
  endpoint?: string
  /** Message shown to the applicant while the trigger is running */
  loadingMessage?: string
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
  /** Triggers fire after this section is validated and before advancing */
  triggers?: SectionTrigger[]
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
// Journey Builder Types
// ─────────────────────────────────────────────────────────────

export type JourneyStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type StepType = 'START' | 'FORM' | 'ID_CHECK' | 'CREDIT_CHECK' | 'CONDITION' | 'END'

/** Condition evaluated on a journey edge to decide which path to follow */
export interface JourneyEdgeCondition {
  /** 'step_result' reads from a processing step's outcome; 'form_data' reads from collected form fields */
  source: 'step_result' | 'form_data'
  /** For step_result: e.g. "id_check.status". For form_data: the fieldKey */
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains'
  value: string | number | boolean
}

export interface JourneyEdgeDef {
  [key: string]: unknown
  id: string
  sourceStepId: string
  targetStepId: string
  /** null means always follow this edge (default/fallback path) */
  condition?: JourneyEdgeCondition
  /** Display label shown on the edge, e.g. "Approved", "Rejected" */
  label?: string
  /** Lower order = evaluated first when multiple edges leave the same node */
  order: number
}

export interface JourneyStepConfig {
  // END step
  endType?: 'SUCCESS' | 'REJECTED'
  message?: string
  // CREDIT_CHECK / custom processing
  loadingMessage?: string
  contextKey?: string
}

export interface JourneyStepDef {
  // Index signature required by @xyflow/react Node data constraint
  [key: string]: unknown
  id: string
  type: StepType
  title: string
  positionX: number
  positionY: number
  formId?: string
  form?: { id: string; name: string; slug: string }
  config?: JourneyStepConfig
}

export interface JourneyDef {
  id: string
  tenantId: string
  name: string
  description?: string
  slug: string
  status: JourneyStatus
  steps: JourneyStepDef[]
  edges: JourneyEdgeDef[]
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
