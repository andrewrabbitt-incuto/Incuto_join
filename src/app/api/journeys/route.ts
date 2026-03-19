import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getJourneyTemplate } from '@/lib/journey-templates'
import { getTemplate, templateToPrismaInput } from '@/lib/form-templates'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const journeys = await prisma.journey.findMany({
    where: { tenantId: session.user.tenantId },
    include: {
      steps: {
        include: { form: { select: { id: true, name: true, slug: true } } },
      },
      _count: { select: { steps: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(journeys)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, description, templateId } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const existing = await prisma.journey.findUnique({
    where: { tenantId_slug: { tenantId: session.user.tenantId, slug } },
  })
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug

  // ─── Template-based creation ──────────────────────────────────────
  const journeyTemplate = templateId ? getJourneyTemplate(templateId) : null

  if (journeyTemplate) {
    // 1. Create any forms referenced by FORM steps
    //    Map: step.key → form.id
    const formIdByStepKey: Record<string, string> = {}

    for (const step of journeyTemplate.steps) {
      if (step.type === 'FORM' && step.formTemplateId) {
        const formTemplate = getTemplate(step.formTemplateId)
        if (!formTemplate) continue

        const formSlugBase = `${finalSlug}-${step.key}`
        const existingForm = await prisma.form.findUnique({
          where: { tenantId_slug: { tenantId: session.user.tenantId, slug: formSlugBase } },
        })
        const formSlug = existingForm ? `${formSlugBase}-${Date.now()}` : formSlugBase

        const form = await prisma.form.create({
          data: {
            tenantId: session.user.tenantId,
            name: `${name} — ${step.title}`,
            slug: formSlug,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formType: formTemplate.formType as any,
            includesSavings: formTemplate.includesSavings,
            includesLoan: formTemplate.includesLoan,
            allowsCorporate: formTemplate.allowsCorporate,
            allowsChildren: formTemplate.allowsChildren,
            requireCommonBond: formTemplate.requireCommonBond,
            sections: { create: templateToPrismaInput(formTemplate) },
          },
        })

        formIdByStepKey[step.key] = form.id
      }
    }

    // 2. Create the journey first, then add steps to get their IDs
    const journeyBase = await prisma.journey.create({
      data: {
        tenantId: session.user.tenantId,
        name: name.trim(),
        description: description?.trim() || null,
        slug: finalSlug,
      },
    })

    // Create steps sequentially to preserve order for key mapping
    const createdStepIds: string[] = []
    for (const s of journeyTemplate.steps) {
      const step = await prisma.journeyStep.create({
        data: {
          journeyId: journeyBase.id,
          type: s.type,
          title: s.title,
          positionX: s.positionX,
          positionY: s.positionY,
          formId: s.type === 'FORM' ? (formIdByStepKey[s.key] ?? undefined) : undefined,
          config: s.config ? (s.config as Prisma.InputJsonValue) : Prisma.JsonNull,
        },
      })
      createdStepIds.push(step.id)
    }

    // 3. Build key → actual DB step ID map
    const stepIdByKey: Record<string, string> = {}
    journeyTemplate.steps.forEach((tmplStep, idx) => {
      stepIdByKey[tmplStep.key] = createdStepIds[idx]
    })

    // 4. Create edges
    if (journeyTemplate.edges.length > 0) {
      await prisma.journeyEdge.createMany({
        data: journeyTemplate.edges.map(e => ({
          journeyId: journeyBase.id,
          sourceStepId: stepIdByKey[e.sourceKey],
          targetStepId: stepIdByKey[e.targetKey],
          condition: e.condition ? (e.condition as Prisma.InputJsonValue) : Prisma.JsonNull,
          label: e.label ?? null,
          order: e.order,
        })),
      })
    }

    // 5. Return full journey with edges
    const full = await prisma.journey.findUnique({
      where: { id: journeyBase.id },
      include: {
        steps: { include: { outgoingEdges: true, incomingEdges: true } },
      },
    })
    return NextResponse.json(full, { status: 201 })
  }

  // ─── Default: blank journey (START + END only) ────────────────────
  const journey = await prisma.journey.create({
    data: {
      tenantId: session.user.tenantId,
      name: name.trim(),
      description: description?.trim() || null,
      slug: finalSlug,
      steps: {
        create: [
          { type: 'START', title: 'Start', positionX: 300, positionY: 50 },
          { type: 'END', title: 'Complete', positionX: 300, positionY: 500, config: { endType: 'SUCCESS', message: 'Thank you — your application is complete.' } },
        ],
      },
    },
    include: {
      steps: {
        include: { outgoingEdges: true, incomingEdges: true },
      },
    },
  })

  return NextResponse.json(journey, { status: 201 })
}
