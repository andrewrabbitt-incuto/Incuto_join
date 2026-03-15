import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { FormRenderer } from '@/components/form-renderer/FormRenderer'
import type { FormDef, FormSectionDef, FormFieldDef, FieldType, FieldWidth, FormBranding } from '@/types'

interface PageProps {
  params: { slug: string }
  searchParams: { campaign?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string }
}

export default async function JoinFormPage({ params, searchParams }: PageProps) {
  // Find form by slug (search all tenants, but form must be PUBLISHED)
  const form = await prisma.form.findFirst({
    where: { slug: params.slug, status: 'PUBLISHED' },
    include: {
      tenant: true,
      sections: {
        orderBy: { order: 'asc' },
        include: { fields: { orderBy: { order: 'asc' } } }
      }
    }
  })

  if (!form) notFound()

  const tenant = form.tenant

  // Build branding from tenant + any form overrides
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
    chatbotConfig: (form.chatbotConfig as FormDef['chatbotConfig']) || undefined,
    requireCommonBond: form.requireCommonBond,
    sections: form.sections.map(s => ({
      id: s.id,
      formId: s.formId,
      title: s.title,
      description: s.description || undefined,
      helpText: s.helpText || undefined,
      infoButton: (s.infoButton as FormSectionDef['infoButton']) || undefined,
      order: s.order,
      conditions: (s.conditions as FormSectionDef['conditions']) || undefined,
      fields: s.fields.map(f => ({
        id: f.id,
        sectionId: f.sectionId,
        fieldKey: f.fieldKey,
        fieldType: f.fieldType as FieldType,
        label: f.label,
        placeholder: f.placeholder || undefined,
        helpText: f.helpText || undefined,
        infoButton: (f.infoButton as FormFieldDef['infoButton']) || undefined,
        required: f.required,
        order: f.order,
        validation: (f.validation as FormFieldDef['validation']) || undefined,
        options: (f.options as FormFieldDef['options']) || undefined,
        incutoFieldKey: f.incutoFieldKey || undefined,
        isSystemField: f.isSystemField,
        systemFieldName: f.systemFieldName || undefined,
        conditions: (f.conditions as FormFieldDef['conditions']) || undefined,
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
  const form = await prisma.form.findFirst({
    where: { slug: params.slug, status: 'PUBLISHED' },
    include: { tenant: true }
  })
  if (!form) return { title: 'Not Found' }
  return {
    title: `${form.name} — ${form.tenant.name}`,
    description: form.description || `Apply to join ${form.tenant.name}`,
  }
}
