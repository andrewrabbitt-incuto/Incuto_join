// Incuto API client

interface IncutoConfig {
  apiUrl: string
  apiKey: string
  tenantId?: string
}

interface IdCheckRequest {
  firstName: string
  lastName: string
  dateOfBirth: string
  address: {
    line1: string
    line2?: string
    city: string
    postcode: string
    country: string
  }
  nationalInsurance?: string
  documentNumber?: string
  documentType?: 'passport' | 'driving_licence' | 'national_id'
}

interface IdCheckResponse {
  success: boolean
  referenceId: string
  status: 'PASSED' | 'FAILED' | 'REFER' | 'REQUIRES_MORE_INFO'
  score?: number
  checks?: {
    name: string
    result: string
    detail?: string
  }[]
  requiresDocuments?: boolean
  errorMessage?: string
}

interface MemberSubmitRequest {
  memberType: 'INDIVIDUAL' | 'CORPORATE' | 'CHILD'
  personalDetails: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    dateOfBirth?: string
    nationalInsurance?: string
    title?: string
  }
  address: {
    line1: string
    line2?: string
    city: string
    county?: string
    postcode: string
    country: string
  }
  employment?: {
    status: string
    employer?: string
    occupation?: string
    annualIncome?: number
  }
  products: {
    savings: boolean
    savingsType?: string
    loan: boolean
  }
  commonBond?: {
    type: string
    value: string
  }
  marketingConsent?: boolean
  customFields?: Record<string, unknown>
}

interface CreditSearchRequest {
  firstName: string
  lastName: string
  dateOfBirth: string
  address: { line1: string; postcode: string; country?: string }
  nationalInsurance?: string
  loanAmount?: number
}

export interface CreditSearchResult {
  score: number
  decision: 'ACCEPT' | 'DECLINE' | 'REFER'
  /** A = excellent, B = good, C = fair, D = poor */
  tier: 'A' | 'B' | 'C' | 'D'
  maxLoanAmount?: number
  /** IDs of loan products the applicant is eligible for */
  eligibleProducts?: string[]
  referenceId: string
}

interface QuotationRequest {
  memberId?: string
  loanAmount: number
  loanTerm: number
  loanPurpose?: string
  creditScore?: number
}

export interface QuotationResult {
  offers: {
    productId: string
    productName: string
    rate: number
    apr: number
    monthlyPayment: number
    totalRepayable: number
  }[]
  bestRate?: number
  maxAmount?: number
  referenceId: string
}

export class IncutoClient {
  private config: IncutoConfig

  constructor(config: IncutoConfig) {
    this.config = config
  }

  private async request<T>(
    endpoint: string,
    method: string = 'GET',
    body?: unknown
  ): Promise<T> {
    // In demo mode, return mock responses
    if (this.config.apiKey === 'demo-api-key') {
      return this.mockResponse<T>(endpoint, body)
    }

    const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
        'X-Tenant-ID': this.config.tenantId || '',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      throw new Error(`Incuto API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  private mockResponse<T>(endpoint: string, body?: unknown): T {
    if (endpoint.includes('/credit-search')) {
      const amount = (body as Record<string, unknown>)?.loanAmount
      return {
        score: 720,
        decision: 'ACCEPT',
        tier: 'A',
        maxLoanAmount: amount ? Math.min(Number(amount) * 1.2, 25000) : 10000,
        eligibleProducts: ['standard_loan', 'premium_loan'],
        referenceId: `MOCK-CS-${Date.now()}`,
      } as T
    }
    if (endpoint.includes('/quotation')) {
      const req = body as Record<string, unknown>
      const amount = Number(req?.loanAmount || 5000)
      const term = Number(req?.loanTerm || 36)
      const monthlyRate = 0.069 / 12
      const monthly = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term))
      return {
        offers: [
          {
            productId: 'premium_loan',
            productName: 'Premium Rate Loan',
            rate: 6.9,
            apr: 7.1,
            monthlyPayment: Math.round(monthly * 100) / 100,
            totalRepayable: Math.round(monthly * term * 100) / 100,
          },
          {
            productId: 'standard_loan',
            productName: 'Standard Loan',
            rate: 9.9,
            apr: 10.3,
            monthlyPayment: Math.round(monthly * 1.04 * 100) / 100,
            totalRepayable: Math.round(monthly * 1.04 * term * 100) / 100,
          },
        ],
        bestRate: 6.9,
        maxAmount: 25000,
        referenceId: `MOCK-QT-${Date.now()}`,
      } as T
    }
    if (endpoint.includes('/open-banking')) {
      return {
        status: 'INITIATED',
        redirectUrl: '#open-banking-mock',
        sessionId: `OB-${Date.now()}`,
        affordability: { monthlyIncome: 2800, monthlyExpenditure: 1600, disposable: 1200, decision: 'PASS' },
      } as T
    }
    if (endpoint.includes('/id-check')) {
      return {
        success: true,
        referenceId: `MOCK-${Date.now()}`,
        status: 'PASSED',
        score: 95,
        checks: [
          { name: 'Identity', result: 'PASS' },
          { name: 'Address', result: 'PASS' },
          { name: 'PEP/Sanctions', result: 'CLEAR' },
        ],
      } as T
    }
    if (endpoint.includes('/members')) {
      return {
        success: true,
        memberId: `MOCK-MBR-${Date.now()}`,
        memberNumber: `MBR${Math.floor(Math.random() * 100000)}`,
        message: 'Member created successfully',
      } as T
    }
    return {} as T
  }

  async runIdCheck(data: IdCheckRequest): Promise<IdCheckResponse> {
    return this.request<IdCheckResponse>('/v1/id-check', 'POST', data)
  }

  async submitMember(data: MemberSubmitRequest): Promise<{
    success: boolean
    memberId: string
    memberNumber: string
    message: string
  }> {
    return this.request('/v1/members', 'POST', data)
  }

  async runCreditSearch(data: CreditSearchRequest): Promise<CreditSearchResult> {
    return this.request<CreditSearchResult>('/v1/credit-search', 'POST', data)
  }

  async runQuotation(data: QuotationRequest): Promise<QuotationResult> {
    return this.request<QuotationResult>('/v1/quotation', 'POST', data)
  }

  async getLoanApplicationUrl(memberId: string, loanData: unknown): Promise<{
    redirectUrl: string
    token: string
  }> {
    return this.request('/v1/loans/application-url', 'POST', { memberId, ...((loanData as object) || {}) })
  }
}

export function getIncutoClient(tenant: {
  incutoApiUrl?: string | null
  incutoApiKey?: string | null
  incutoTenantId?: string | null
}): IncutoClient {
  return new IncutoClient({
    apiUrl: tenant.incutoApiUrl || process.env.INCUTO_API_URL || 'https://api.incuto.com',
    apiKey: tenant.incutoApiKey || process.env.INCUTO_API_KEY || 'demo-api-key',
    tenantId: tenant.incutoTenantId || undefined,
  })
}
