import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { FormRenderer } from '@/components/form-renderer/FormRenderer'
import type { FormDef, FormSectionDef, FormFieldDef, FieldType, FieldWidth, FormBranding } from '@/types'

interface PageProps {
  params: { slug: string }
  searchParams: { campaign?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string }
}

// Shared query shape used in both the page and generateMetadata
const formInclude = {
  tenant: true,
  sections: {
    orderBy: { order: 'asc' as const },
    include: { fields: { orderBy: { order: 'asc' as const } } }
  }
}

async function findForm(slug: string) {
  const headersList = headers()
  const tenantSlug = headersList.get('x-tenant-slug')

  if (tenantSlug) {
    // Subdomain request: resolve the tenant first, then scope the form lookup.
    // This prevents one credit union from accidentally serving another's forms.
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
    if (!tenant) return null

    return prisma.form.findFirst({
      where: { tenantId: tenant.id, slug, status: 'PUBLISHED' },
      include: formInclude
    })
  }

  // Fallback for direct Railway domain access (no subdomain context)
  return prisma.form.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: formInclude
  })
}

export default async function JoinFormPage({ params, searchParams }: PageProps) {
  const form = await findForm(params.slug)
  if (!form) notFound()

  const tenant = form.tenant

  // Build branding from tenant defaults + any form-level overrides
  const baseBranding: FormBranding = {
    primaryColor: tenant.primaryColor,
    secondaryColor: tenant.secondaryColor,
    accentColor: tenant.accentColor,
    logoUrl: tenant.logoUrl || undefined,
    fontFamily: tenant.fontFamily,
    borderRadius: tenant.borderRadius,
    customCss: tenant.customCss || undefined,
  }

  const branding: FormBranding = form.brandingOverride
    ? { ...baseBranding, ...(form.brandingOverride as Partial<FormBranding>) }
    : baseBranding

  const formDef: FormDef = {
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
    brandingOverride: branding,
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
      }))
    }))
  }

  return (
    <FormRenderer
      form={formDef}
      branding={branding}
      campaignCode={searchParams.campaign}
    />
  )
}

export async function generateMetadata({ params }: PageProps) {
  const form = await findForm(params.slug)
  if (!form) return { title: 'Not Found' }
  return {
    title: `${form.name} — ${form.tenant.name}`,
    description: form.description || `Apply to join ${form.tenant.name}`,
  }
}
