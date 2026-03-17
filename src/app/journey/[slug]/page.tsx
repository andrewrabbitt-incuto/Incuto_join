import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { JourneyRenderer } from '@/components/journey-renderer/JourneyRenderer'
import type {
  JourneyDef, FormDef, FormSectionDef, FormFieldDef,
  FieldType, FieldWidth, FormBranding, SectionTrigger,
} from '@/types'

interface PageProps {
  params: { slug: string }
  searchParams: { campaign?: string }
}

const formInclude = {
  tenant: true,
  sections: {
    orderBy: { order: 'asc' as const },
    include: { fields: { orderBy: { order: 'asc' as const } } },
  },
}

async function findJourney(slug: string) {
  const headersList = headers()
  const tenantSlug = headersList.get('x-tenant-slug')

  if (tenantSlug) {
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
    if (!tenant) return null
    return prisma.journey.findFirst({
      where: { tenantId: tenant.id, slug, status: 'PUBLISHED' },
      include: {
        tenant: true,
        steps: {
          include: {
            form: { include: formInclude },
            outgoingEdges: { orderBy: { order: 'asc' } },
          },
        },
      },
    })
  }

  return prisma.journey.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: {
      tenant: true,
      steps: {
        include: {
          form: { include: formInclude },
          outgoingEdges: { orderBy: { order: 'asc' } },
        },
      },
    },
  })
}

function buildFormDef(
  form: NonNullable<Awaited<ReturnType<typeof findJourney>>>['steps'][number]['form'],
): FormDef | null {
  if (!form) return null
  return {
    id: form.id,
    tenantId: form.tenantId,
    name: form.name,
    slug: form.slug,
    description: form.description || undefined,
    status: form.status as FormDef['status'],
    formType: form.formType,
    includesSavings: form.includesSavings,
    includesLoan: form.includesLoan,
    allowsCorporate: form.allowsCorporate,
    allowsChildren: form.allowsChildren,
    loanRedirectUrl: form.loanRedirectUrl || undefined,
    loanJourneyEmbed: form.loanJourneyEmbed,
    chatbotEnabled: form.chatbotEnabled,
    chatbotConfig: (form.chatbotConfig as unknown as FormDef['chatbotConfig']) || undefined,
    requireCommonBond: form.requireCommonBond,
    sections: form.sections.map(s => ({
      id: s.id,
      formId: s.formId,
      title: s.title,
      description: s.description || undefined,
      helpText: s.helpText || undefined,
      infoButton: (s.infoButton as unknown as FormSectionDef['infoButton']) || undefined,
      order: s.order,
      conditions: (s.conditions as unknown as FormSectionDef['conditions']) || undefined,
      triggers: (s.triggers as unknown as SectionTrigger[]) || undefined,
      fields: s.fields.map(f => ({
        id: f.id,
        sectionId: f.sectionId,
        fieldKey: f.fieldKey,
        fieldType: f.fieldType as FieldType,
        label: f.label,
        placeholder: f.placeholder || undefined,
        helpText: f.helpText || undefined,
        infoButton: (f.infoButton as unknown as FormFieldDef['infoButton']) || undefined,
        required: f.required,
        order: f.order,
        validation: (f.validation as FormFieldDef['validation']) || undefined,
        options: (f.options as unknown as FormFieldDef['options']) || undefined,
        incutoFieldKey: f.incutoFieldKey || undefined,
        isSystemField: f.isSystemField,
        systemFieldName: f.systemFieldName || undefined,
        conditions: (f.conditions as unknown as FormFieldDef['conditions']) || undefined,
        width: f.width as FieldWidth,
        cssClass: f.cssClass || undefined,
      })),
    })),
  }
}

export default async function JourneyPage({ params, searchParams }: PageProps) {
  const journey = await findJourney(params.slug)
  if (!journey) notFound()

  const tenant = journey.tenant

  const branding: FormBranding = {
    primaryColor: tenant.primaryColor,
    secondaryColor: tenant.secondaryColor,
    accentColor: tenant.accentColor,
    logoUrl: tenant.logoUrl || undefined,
    fontFamily: tenant.fontFamily,
    borderRadius: tenant.borderRadius,
    customCss: tenant.customCss || undefined,
  }

  // Build form defs keyed by step ID for the renderer
  const formsByStepId: Record<string, FormDef> = {}
  for (const step of journey.steps) {
    if (step.type === 'FORM' && step.form) {
      const formDef = buildFormDef(step.form)
      if (formDef) formsByStepId[step.id] = formDef
    }
  }

  const journeyDef: JourneyDef = {
    id: journey.id,
    tenantId: journey.tenantId,
    name: journey.name,
    description: journey.description ?? undefined,
    slug: journey.slug,
    status: journey.status as JourneyDef['status'],
    steps: journey.steps.map(s => ({
      id: s.id,
      type: s.type as JourneyDef['steps'][number]['type'],
      title: s.title,
      positionX: s.positionX,
      positionY: s.positionY,
      formId: s.formId ?? undefined,
      config: s.config as JourneyDef['steps'][number]['config'],
    })),
    edges: journey.steps.flatMap(s =>
      s.outgoingEdges.map(e => ({
        id: e.id,
        sourceStepId: e.sourceStepId,
        targetStepId: e.targetStepId,
        condition: e.condition as unknown as JourneyDef['edges'][number]['condition'],
        label: e.label ?? undefined,
        order: e.order,
      }))
    ),
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: branding.secondaryColor,
        fontFamily: branding.fontFamily,
      }}
    >
      {branding.customCss && <style dangerouslySetInnerHTML={{ __html: branding.customCss }} />}
      {branding.logoUrl && (
        <div className="flex justify-center py-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={branding.logoUrl} alt={tenant.name} className="h-10 object-contain" />
        </div>
      )}
      <JourneyRenderer
        journey={journeyDef}
        formsByStepId={formsByStepId}
        branding={branding}
        campaignCode={searchParams.campaign}
      />
    </div>
  )
}
