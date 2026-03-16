/**
 * Standard field mapping between form fieldKeys and Incuto API field paths.
 *
 * Every FormField in the database has an optional `incutoFieldKey` column that
 * overrides this default. This table provides the defaults used when creating
 * new forms and as a reference when building the Incuto submission payload.
 *
 * Paths use dot-notation to denote nested fields in the MemberSubmitRequest:
 *   "firstName"             → personalDetails.firstName
 *   "address.line1"         → address.line1
 *   "employment.status"     → employment.status
 *   "loan.amount"           → loanDetails.amount  (handled separately)
 *
 * Fields with no entry in this map — and no incutoFieldKey on the FormField —
 * are treated as custom fields and sent in the `customFields` object.
 */
export const DEFAULT_INCUTO_FIELD_MAP: Record<string, string> = {
  // ── Personal details ──────────────────────────────────────────
  title:               'title',
  first_name:          'firstName',
  last_name:           'lastName',
  email:               'email',
  phone:               'phone',
  date_of_birth:       'dateOfBirth',
  national_insurance:  'nationalInsurance',

  // ── Address ───────────────────────────────────────────────────
  // ADDRESS_LOOKUP fields submit a structured object; the submit handler
  // maps this object directly to the Incuto address block.
  address:             'address',

  // ── Employment ────────────────────────────────────────────────
  employment_status:   'employment.status',
  employer_name:       'employment.employer',
  occupation:          'employment.occupation',
  annual_income:       'employment.annualIncome',

  // ── Products ─────────────────────────────────────────────────
  // PRODUCT_SELECTOR and savings_type are consumed by the submit handler
  // directly to build the products block; they are not passed as raw values.
  product_selector:    '__product_selector',   // special — handled in submit
  savings_type:        '__savings_type',        // special — handled in submit

  // ── Loan ──────────────────────────────────────────────────────
  loan_amount:         'loan.amount',
  loan_term:           'loan.term',
  loan_purpose:        'loan.purpose',

  // ── Common bond ───────────────────────────────────────────────
  common_bond:         'commonBond',
  common_bond_value:   'commonBond.value',

  // ── Compliance ────────────────────────────────────────────────
  marketing_consent:   'marketingConsent',
  gdpr_consent:        'gdprConsent',
  declaration:         'declaration',
}

// ─────────────────────────────────────────────────────────────
// Required fields per form type
// These fieldKeys MUST be present (and non-empty) before a form
// is considered complete and can be submitted to Incuto.
// The form builder will warn if a published form is missing any.
// ─────────────────────────────────────────────────────────────

export const REQUIRED_FIELDS_BY_TYPE = {
  /** Standard new member join application */
  JOIN: [
    'member_type',
    'first_name',
    'last_name',
    'email',
    'date_of_birth',
    'address',
    'gdpr_consent',
    'declaration',
  ],

  /** Savings-only application (same as JOIN) */
  SAVINGS_ONLY: [
    'member_type',
    'first_name',
    'last_name',
    'email',
    'date_of_birth',
    'address',
    'gdpr_consent',
    'declaration',
  ],

  /** Loan application — requires personal details plus loan specifics */
  LOAN: [
    'first_name',
    'last_name',
    'email',
    'date_of_birth',
    'address',
    'loan_amount',
    'loan_term',
    'loan_purpose',
    'declaration',
  ],

  /** ISA application */
  ISA: [
    'member_type',
    'first_name',
    'last_name',
    'email',
    'date_of_birth',
    'national_insurance',
    'address',
    'gdpr_consent',
    'declaration',
  ],

  /** Corporate / business membership */
  CORPORATE: [
    'first_name',
    'last_name',
    'email',
    'address',
    'gdpr_consent',
    'declaration',
  ],

  /** Junior / children's account */
  CHILDREN: [
    'first_name',
    'last_name',
    'date_of_birth',
    'address',
    'declaration',
  ],
} as const

// ─────────────────────────────────────────────────────────────
// Build helpers
// ─────────────────────────────────────────────────────────────

/**
 * Resolve the Incuto field key for a given fieldKey.
 * Uses the per-field DB override first, falls back to the default map.
 */
export function resolveIncutoKey(
  fieldKey: string,
  dbOverride?: string | null
): string | null {
  if (dbOverride) return dbOverride
  return DEFAULT_INCUTO_FIELD_MAP[fieldKey] ?? null
}

/**
 * Normalise any field value to a plain string suitable for
 * indexing and full-text search in ApplicationFieldValue.stringValue.
 */
export function toStringValue(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (Array.isArray(value)) {
    const parts = value.map(v => toStringValue(v)).filter(Boolean)
    return parts.length ? parts.join(', ') : null
  }
  if (typeof value === 'object') {
    // For address objects, concatenate the meaningful parts
    const obj = value as Record<string, unknown>
    const parts = Object.values(obj)
      .map(v => toStringValue(v))
      .filter(Boolean)
    return parts.length ? parts.join(' ') : null
  }
  return String(value)
}
