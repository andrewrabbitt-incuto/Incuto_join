import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await prisma.form.findFirst({
    where: { id: params.id, tenantId: session.user.tenantId },
    include: {
      sections: {
        orderBy: { order: 'asc' },
        include: { fields: { orderBy: { order: 'asc' } } }
      }
    }
  })
  if (!form) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(form)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await prisma.form.findFirst({
    where: { id: params.id, tenantId: session.user.tenantId }
  })
  if (!form) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { sections, status, name, description, brandingOverride, chatbotEnabled, chatbotConfig, ...rest } = body

  // Update form meta
  const updatedForm = await prisma.form.update({
    where: { id: params.id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(status && { status, ...(status === 'PUBLISHED' && { publishedAt: new Date() }) }),
      ...(brandingOverride !== undefined && { brandingOverride }),
      ...(chatbotEnabled !== undefined && { chatbotEnabled }),
      ...(chatbotConfig !== undefined && { chatbotConfig }),
    },
  })

  // If sections provided, do a full replacement
  if (sections) {
    // Delete existing sections and fields
    await prisma.formSection.deleteMany({ where: { formId: params.id } })

    // Re-create sections with fields
    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const section = sections[sIdx]
      const createdSection = await prisma.formSection.create({
        data: {
          id: section.id,
          formId: params.id,
          title: section.title,
          description: section.description || null,
          helpText: section.helpText || null,
          infoButton: section.infoButton || undefined,
          order: sIdx,
          conditions: section.conditions || undefined,
        },
      })

      for (let fIdx = 0; fIdx < (section.fields || []).length; fIdx++) {
        const field = section.fields[fIdx]
        await prisma.formField.create({
          data: {
            id: field.id,
            sectionId: createdSection.id,
            fieldKey: field.fieldKey,
            fieldType: field.fieldType,
            label: field.label,
            placeholder: field.placeholder || null,
            helpText: field.helpText || null,
            infoButton: field.infoButton || undefined,
            required: field.required,
            order: fIdx,
            validation: field.validation || undefined,
            options: field.options || undefined,
            incutoFieldKey: field.incutoFieldKey || null,
            isSystemField: field.isSystemField || false,
            systemFieldName: field.systemFieldName || null,
            conditions: field.conditions || undefined,
            width: field.width || 'FULL',
            cssClass: field.cssClass || null,
          },
        })
      }
    }
  }

  return NextResponse.json(updatedForm)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await prisma.form.findFirst({
    where: { id: params.id, tenantId: session.user.tenantId }
  })
  if (!form) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.form.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
