import type { StepType, JourneyEdgeCondition } from '@/types'

// ─── Template types ─────────────────────────────────────────────────

export interface JourneyStepTemplate {
  /** Local key used only for edge wiring within this template */
  key: string
  type: StepType
  title: string
  description?: string
  positionX: number
  positionY: number
  /** If set, a form will be auto-created from this template ID when the journey is created */
  formTemplateId?: string
  config?: Record<string, unknown>
}

export interface JourneyEdgeTemplate {
  sourceKey: string
  targetKey: string
  condition?: Omit<JourneyEdgeCondition, never>
  label?: string
  order: number
}

export interface JourneyTemplate {
  id: string
  name: string
  description: string
  icon: string
  steps: JourneyStepTemplate[]
  edges: JourneyEdgeTemplate[]
}

// ─── Templates ─────────────────────────────────────────────────────

export const JOURNEY_TEMPLATES: JourneyTemplate[] = [
  // ─── Blank journey ──────────────────────────────────────────────
  {
    id: 'blank',
    name: 'Blank Journey',
    description: 'Start from scratch with just a Start and End node',
    icon: 'GitBranch',
    steps: [
      { key: 'start', type: 'START', title: 'Start', positionX: 300, positionY: 50 },
      { key: 'end', type: 'END', title: 'Complete', positionX: 300, positionY: 400, config: { endType: 'SUCCESS', message: 'Thank you — your application is complete.' } },
    ],
    edges: [
      { sourceKey: 'start', targetKey: 'end', order: 0 },
    ],
  },

  // ─── Simple join ────────────────────────────────────────────────
  {
    id: 'simple-join',
    name: 'Simple Join',
    description: 'Standard new member journey — join form, ID check, success',
    icon: 'UserPlus',
    steps: [
      { key: 'start',  type: 'START',    title: 'Start',                positionX: 300, positionY: 50  },
      { key: 'form1',  type: 'FORM',     title: 'Membership Application', positionX: 300, positionY: 200, formTemplateId: 'new-member-standard' },
      { key: 'id',     type: 'ID_CHECK', title: 'Verify Identity',       positionX: 300, positionY: 380 },
      { key: 'end',    type: 'END',      title: 'Application Complete',   positionX: 300, positionY: 560, config: { endType: 'SUCCESS', message: 'Welcome! Your membership application has been received and your identity verified. We will be in touch shortly.' } },
    ],
    edges: [
      { sourceKey: 'start', targetKey: 'form1', order: 0 },
      { sourceKey: 'form1', targetKey: 'id',    order: 0 },
      { sourceKey: 'id',    targetKey: 'end',   order: 0 },
    ],
  },

  // ─── GetToYes ───────────────────────────────────────────────────
  {
    id: 'get-to-yes',
    name: 'GetToYes',
    description: 'Guided loan decision journey — collects initial details, runs a credit search, and routes the applicant to the right outcome: approved, referred to an advisor, or declined with alternatives',
    icon: 'ThumbsUp',
    steps: [
      // Row 1 — entry
      { key: 'start',   type: 'START',        title: 'Start',                  positionX: 300, positionY: 50  },
      // Row 2 — initial loan interest + personal details
      { key: 'form1',   type: 'FORM',         title: 'Loan Details & Personal Information',
        description: 'Capture the loan amount, purpose and basic personal details needed to run a credit search',
        positionX: 300, positionY: 210,
        formTemplateId: 'loan-application',
      },
      // Row 3 — automated credit search
      { key: 'credit',  type: 'CREDIT_CHECK', title: 'Credit Search',          positionX: 300, positionY: 390,
        config: { contextKey: 'credit_result', loadingMessage: 'Please wait while we carry out a credit search…' },
      },
      // Row 4 — decision condition
      { key: 'decision', type: 'CONDITION',   title: 'Assess Credit Result',   positionX: 300, positionY: 570 },
      // Row 5 — three outcome branches (left=approved, centre=referred, right=declined)
      { key: 'form2',   type: 'FORM',         title: 'Complete Your Application',
        description: 'Collect address history, income & expenditure and bank details to complete the loan application',
        positionX: 50,  positionY: 760,
        formTemplateId: 'join-and-borrow',
      },
      { key: 'end_referred', type: 'END',     title: 'Referred to Advisor',    positionX: 300, positionY: 760,
        config: { endType: 'SUCCESS', message: 'Thank you for your application. Based on our initial assessment, your case has been referred to one of our loan advisors who will be in touch within 2 working days to discuss your options.' },
      },
      { key: 'end_declined', type: 'END',     title: 'Unable to Proceed',      positionX: 550, positionY: 760,
        config: { endType: 'REJECTED', message: 'We\'re sorry, but based on the information provided we are unable to approve a loan at this time. One of our advisors can help you explore savings or credit-builder options — please contact us to find out more.' },
      },
      // Row 6 — identity check (approved path only)
      { key: 'id',      type: 'ID_CHECK',     title: 'Verify Identity',        positionX: 50,  positionY: 960 },
      // Row 7 — success end
      { key: 'end_success', type: 'END',      title: 'Application Approved',   positionX: 50,  positionY: 1140,
        config: { endType: 'SUCCESS', message: 'Congratulations! Your loan application has been approved. You will receive a confirmation email shortly, and your funds will be transferred within 2 working days of you accepting the loan agreement.' },
      },
    ],
    edges: [
      // Linear pre-decision path
      { sourceKey: 'start',    targetKey: 'form1',        order: 0 },
      { sourceKey: 'form1',    targetKey: 'credit',       order: 0 },
      { sourceKey: 'credit',   targetKey: 'decision',     order: 0 },

      // Decision branches — evaluated in order; last edge is fallback (no condition)
      {
        sourceKey: 'decision', targetKey: 'end_declined',
        label: 'Declined',
        order: 0,
        condition: { source: 'step_result', field: 'credit_result.tier', operator: 'equals', value: 'RED' },
      },
      {
        sourceKey: 'decision', targetKey: 'end_referred',
        label: 'Referred',
        order: 1,
        condition: { source: 'step_result', field: 'credit_result.tier', operator: 'equals', value: 'AMBER' },
      },
      {
        // GREEN (or no result) — proceed to full application
        sourceKey: 'decision', targetKey: 'form2',
        label: 'Approved',
        order: 2,
      },

      // Approved path
      { sourceKey: 'form2', targetKey: 'id',          order: 0 },
      { sourceKey: 'id',    targetKey: 'end_success', order: 0 },
    ],
  },
]

export function getJourneyTemplate(id: string): JourneyTemplate | undefined {
  return JOURNEY_TEMPLATES.find(t => t.id === id)
}
