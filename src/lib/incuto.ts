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

  private mockResponse<T>(endpoint: string, _body?: unknown): T {
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
