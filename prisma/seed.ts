import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding demo data...')

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-credit-union' },
    update: {},
    create: {
      name: 'Demo Credit Union',
      slug: 'demo-credit-union',
      primaryColor: '#1E40AF',
      secondaryColor: '#DBEAFE',
      accentColor: '#3B82F6',
      fontFamily: 'Inter',
      borderRadius: '8',
      idCheckEnabled: true,
      vouchsafeEnabled: true,
      aiChatbotEnabled: true,
    },
  })

  console.log('Created tenant:', tenant.slug)

  // Create admin user
  const hashedPassword = await bcrypt.hash('demo', 10)
  const user = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@demo-cu.co.uk' } },
    update: { password: hashedPassword },
    create: {
      tenantId: tenant.id,
      email: 'admin@demo-cu.co.uk',
      name: 'Demo Admin',
      password: hashedPassword,
      role: 'OWNER',
    },
  })

  console.log('Created user:', user.email)

  // Create common bonds
  await prisma.commonBond.createMany({
    skipDuplicates: true,
    data: [
      {
        tenantId: tenant.id,
        name: 'Greater Manchester Area',
        type: 'GEOGRAPHICAL',
        description: 'Live or work in Greater Manchester',
        values: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'M9', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16', 'M20', 'M21', 'M22', 'M23', 'M40', 'M41', 'M45', 'M60', 'Salford', 'Trafford', 'Stockport', 'Tameside'],
      },
      {
        tenantId: tenant.id,
        name: 'NHS Employees',
        type: 'EMPLOYMENT',
        description: 'Current NHS employees',
        values: ['Manchester University NHS Trust', 'Salford Royal NHS Trust', 'Stockport NHS Foundation Trust', 'NHS England'],
      },
    ],
  })

  // Create sample landing pages
  await prisma.landingPage.createMany({
    skipDuplicates: true,
    data: [
      {
        tenantId: tenant.id,
        name: 'Facebook January Campaign',
        utmSource: 'facebook',
        utmMedium: 'social',
        utmCampaign: 'jan_2025',
        trackingCode: 'FB2501',
        isActive: true,
      },
      {
        tenantId: tenant.id,
        name: 'Email Newsletter Q1',
        utmSource: 'email',
        utmMedium: 'newsletter',
        utmCampaign: 'q1_2025',
        trackingCode: 'EM2501',
        isActive: true,
      },
    ],
  })

  console.log('Seeding complete!')
  console.log('\n=== DEMO LOGIN ===')
  console.log('URL: http://localhost:3000/login')
  console.log('Tenant Identifier: demo-credit-union')
  console.log('Email: admin@demo-cu.co.uk')
  console.log('Password: demo')
  console.log('==================\n')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async e => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
