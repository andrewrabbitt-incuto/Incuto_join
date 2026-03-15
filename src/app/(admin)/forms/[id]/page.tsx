import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { FormBuilder } from '@/components/form-builder/FormBuilder'
import type { FormDef, FormSectionDef, FormFieldDef, FieldType, FieldWidth } from '@/types'

export default async function FormBuilderPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const form = await prisma.form.findFirst({
    where: { id: params.id, tenantId: session.user.tenantId },
    include: {
      sections: {
        orderBy: { order: 'asc' },
        include: {
          fields: { orderBy: { order: 'asc' } }
        }
      }
    }
  })

  if (!form) notFound()

  // Transform to FormDef
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
    brandingOverride: (form.brandingOverride as unknown as FormDef['brandingOverride']) || undefined,
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
        validation: (f.validation as unknown as FormFieldDef['validation']) || undefined,
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

  return <FormBuilder form={formDef} />
}
