import {
  AppraisalType,
  MemberRole,
  OrderStatus,
  PaymentStatus,
  PaymentType,
  PrismaClient,
  PropertyType,
} from '@prisma/client'

const prisma = new PrismaClient()

// ============================================================================
// CONFIGURATION: Add your real Kinde user ID here
// ============================================================================
// To get your Kinde user ID:
// 1. Log into your app
// 2. Check the user object in your session (e.g., via getKindeServerSession())
// 3. The ID will look something like: "kp_abc123..." or similar
//
// Replace 'YOUR_KINDE_USER_ID' below with your actual Kinde user ID
// ============================================================================

const YOUR_KINDE_ACCOUNT_ID =
  process.env.SEED_KINDE_USER_ID || 'YOUR_KINDE_USER_ID'

// Set this to your actual name/email or leave as defaults
const YOUR_USER_INFO = {
  firstName: process.env.SEED_USER_FIRST_NAME || 'Your',
  lastName: process.env.SEED_USER_LAST_NAME || 'Name',
  email: process.env.SEED_USER_EMAIL || 'you@example.com',
}

async function main() {
  console.log('🌱 Starting database seed...')

  // Check if Kinde user ID is configured
  if (YOUR_KINDE_ACCOUNT_ID === 'YOUR_KINDE_USER_ID') {
    console.warn('⚠️  WARNING: Using placeholder Kinde user ID.')
    console.warn(
      '⚠️  Update YOUR_KINDE_ACCOUNT_ID in seed.ts or set SEED_KINDE_USER_ID env var',
    )
    console.warn("⚠️  You won't be able to log in with this seed data!\n")
  }

  // Create your actual user (the one you'll log in with)
  const user1 = await prisma.user.create({
    data: {
      accountId: YOUR_KINDE_ACCOUNT_ID,
      firstName: YOUR_USER_INFO.firstName,
      lastName: YOUR_USER_INFO.lastName,
      email: YOUR_USER_INFO.email,
    },
  })

  console.log(
    `✅ Created user: ${user1.firstName} ${user1.lastName} (${user1.accountId})`,
  )

  // Create additional test users (these won't be able to log in unless you add them to Kinde)
  const user2 = await prisma.user.create({
    data: {
      accountId: 'kinde_test_user_2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@example.com',
    },
  })

  const user3 = await prisma.user.create({
    data: {
      accountId: 'kinde_test_user_3',
      firstName: 'Mike',
      lastName: 'Williams',
      email: 'mike.williams@example.com',
    },
  })

  const user4 = await prisma.user.create({
    data: {
      accountId: 'kinde_test_user_4',
      firstName: 'Emily',
      lastName: 'Rodriguez',
      email: 'emily.rodriguez@example.com',
    },
  })

  const user5 = await prisma.user.create({
    data: {
      accountId: 'kinde_test_user_5',
      firstName: 'James',
      lastName: 'Chen',
      email: 'james.chen@example.com',
    },
  })

  console.log('✅ Created 5 users')

  // Create Organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Smith Appraisal Services',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  console.log('✅ Created organization')

  // Create Organization Members (5 total: 1 admin owner, 1 manager, 3 appraisers)
  const member1 = await prisma.orgMember.create({
    data: {
      userId: user1.id,
      organizationId: organization.id,
      isOwner: true,
      roles: [MemberRole.admin],
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const member2 = await prisma.orgMember.create({
    data: {
      userId: user2.id,
      organizationId: organization.id,
      roles: [MemberRole.appraiser],
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const member3 = await prisma.orgMember.create({
    data: {
      userId: user3.id,
      organizationId: organization.id,
      roles: [MemberRole.appraiser],
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const member4 = await prisma.orgMember.create({
    data: {
      userId: user4.id,
      organizationId: organization.id,
      roles: [MemberRole.appraiser],
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const member5 = await prisma.orgMember.create({
    data: {
      userId: user5.id,
      organizationId: organization.id,
      roles: [MemberRole.manager],
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  // Store appraisers for easy assignment
  const appraisers = [member2, member3, member4]

  console.log('✅ Created 5 organization members (3 appraisers)')

  // Create Clients
  const client1 = await prisma.client.create({
    data: {
      name: 'First National Bank',
      email: 'orders@firstnationalbank.com',
      phone: '555-1000',
      street: '100 Banking Plaza',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      poc: 'Jennifer Davis',
      favorite: true,
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const client2 = await prisma.client.create({
    data: {
      name: 'Metro Mortgage Company',
      email: 'appraisals@metromorgage.com',
      phone: '555-2000',
      street: '250 Mortgage Street',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      poc: 'Robert Chen',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const client3 = await prisma.client.create({
    data: {
      name: 'Coastal Lending Group',
      email: 'orders@coastallending.com',
      phone: '555-3000',
      street: '789 Ocean Drive',
      city: 'Miami',
      state: 'FL',
      zip: '33101',
      poc: 'Maria Santos',
      favorite: true,
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const client4 = await prisma.client.create({
    data: {
      name: 'Summit Financial Services',
      email: 'appraisals@summitfs.com',
      phone: '555-4000',
      street: '456 Mountain View',
      city: 'Denver',
      state: 'CO',
      zip: '80201',
      poc: 'David Park',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const clients = [client1, client2, client3, client4]

  console.log('✅ Created 4 clients')

  // Create Borrowers
  const borrower1 = await prisma.borrower.create({
    data: {
      firstName: 'Alice',
      lastName: 'Thompson',
      email: 'alice.thompson@email.com',
      phone: '555-5000',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const borrower2 = await prisma.borrower.create({
    data: {
      firstName: 'David',
      lastName: 'Martinez',
      email: 'david.martinez@email.com',
      phone: '555-5001',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const borrower3 = await prisma.borrower.create({
    data: {
      firstName: 'Jennifer',
      lastName: 'Lee',
      email: 'jennifer.lee@email.com',
      phone: '555-5002',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const borrower4 = await prisma.borrower.create({
    data: {
      firstName: 'Robert',
      lastName: 'Anderson',
      email: 'robert.anderson@email.com',
      phone: '555-5003',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const borrower5 = await prisma.borrower.create({
    data: {
      firstName: 'Lisa',
      lastName: 'Taylor',
      email: 'lisa.taylor@email.com',
      phone: '555-5004',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const borrowers = [borrower1, borrower2, borrower3, borrower4, borrower5]

  console.log('✅ Created 5 borrowers')

  // Create Properties
  const properties = []
  const streets = [
    '789 Maple Drive',
    '321 Beach Boulevard',
    '555 Investment Lane',
    '123 Oak Street',
    '456 Pine Avenue',
    '789 Elm Court',
    '234 Birch Lane',
    '567 Cedar Road',
    '890 Willow Way',
    '111 Spruce Street',
    '222 Ash Avenue',
    '333 Cherry Drive',
    '444 Walnut Place',
    '555 Hickory Lane',
    '666 Magnolia Court',
    '777 Cypress Road',
    '888 Redwood Drive',
    '999 Sequoia Street',
    '101 Palm Avenue',
    '202 Aspen Way',
    '303 Juniper Lane',
    '404 Dogwood Circle',
    '505 Poplar Street',
    '606 Sycamore Drive',
    '707 Beech Avenue',
  ]
  const cities = [
    'Austin',
    'San Diego',
    'Houston',
    'Phoenix',
    'Denver',
    'Seattle',
    'Boston',
    'Atlanta',
  ]
  const states = ['TX', 'CA', 'TX', 'AZ', 'CO', 'WA', 'MA', 'GA']
  const zips = [
    '78702',
    '92102',
    '77001',
    '85001',
    '80201',
    '98101',
    '02101',
    '30301',
  ]
  const propertyTypes = [
    PropertyType.singleFamily,
    PropertyType.singleFamilyFHA,
    PropertyType.condo,
    PropertyType.multiFamily,
    PropertyType.multiFamilyFHA,
  ]

  for (let i = 0; i < 25; i++) {
    const property = await prisma.property.create({
      data: {
        propertyType: propertyTypes[i % propertyTypes.length],
        street: streets[i],
        city: cities[i % cities.length],
        state: states[i % states.length],
        zip: zips[i % zips.length],
        createdBy: user1.id,
        updatedBy: user1.id,
      },
    })
    properties.push(property)
  }

  console.log('✅ Created 25 properties')

  // Helper function for date calculations
  const today = new Date()
  const addDays = (date: Date, days: number) => {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }

  // Create 25 Orders with mixed statuses and relative dates
  const orderStatuses = [
    OrderStatus.open,
    OrderStatus.open,
    OrderStatus.open,
    OrderStatus.open,
    OrderStatus.open,
    OrderStatus.open,
    OrderStatus.open,
    OrderStatus.open,
    OrderStatus.closed,
    OrderStatus.closed,
    OrderStatus.closed,
    OrderStatus.closed,
    OrderStatus.closed,
    OrderStatus.closed,
    OrderStatus.closed,
    OrderStatus.cancelled,
    OrderStatus.cancelled,
    OrderStatus.cancelled,
    OrderStatus.open,
    OrderStatus.open,
    OrderStatus.closed,
    OrderStatus.closed,
    OrderStatus.open,
    OrderStatus.open,
    OrderStatus.open,
  ]

  const paymentStatuses = [
    PaymentStatus.unpaid,
    PaymentStatus.partial,
    PaymentStatus.unpaid,
    PaymentStatus.unpaid,
    PaymentStatus.partial,
    PaymentStatus.unpaid,
    PaymentStatus.unpaid,
    PaymentStatus.unpaid,
    PaymentStatus.paid,
    PaymentStatus.paid,
    PaymentStatus.paid,
    PaymentStatus.paid,
    PaymentStatus.partial,
    PaymentStatus.paid,
    PaymentStatus.paid,
    PaymentStatus.unpaid,
    PaymentStatus.unpaid,
    PaymentStatus.partial,
    PaymentStatus.unpaid,
    PaymentStatus.partial,
    PaymentStatus.paid,
    PaymentStatus.paid,
    PaymentStatus.unpaid,
    PaymentStatus.unpaid,
    PaymentStatus.partial,
  ]

  const appraisalTypes = [
    AppraisalType.purchase,
    AppraisalType.refinance,
    AppraisalType.purchase,
    AppraisalType.refinance,
    AppraisalType.purchase,
  ]

  const orders = []

  for (let i = 0; i < 25; i++) {
    const daysAgo = 30 - i
    const orderDate = addDays(today, -daysAgo)
    const inspectionDate = addDays(orderDate, 5 + (i % 3))
    const dueDate = addDays(orderDate, 14 + (i % 7))

    const order = await prisma.order.create({
      data: {
        organizationId: organization.id,
        clientId: clients[i % clients.length].id,
        borrowerId: i % 2 === 0 ? borrowers[i % borrowers.length].id : null,
        propertyId: properties[i].id,
        appraiserId: appraisers[i % appraisers.length].id,
        fileNumber: `APR-2026-${String(i + 1).padStart(3, '0')}`,
        clientOrderNum: `ORD-${String(1000 + i)}`,
        orderDate,
        inspectionDate:
          orderStatuses[i] !== OrderStatus.cancelled ? inspectionDate : null,
        dueDate,
        appraisalType: appraisalTypes[i % appraisalTypes.length],
        orderStatus: orderStatuses[i],
        paymentStatus: paymentStatuses[i],
        baseFee: 40000 + (i % 10) * 2500,
        techFee: 5000 + (i % 3) * 500,
        questionnaireFee: i % 4 === 0 ? 5000 : null,
        questionnaire: i % 4 === 0,
        contract: true,
        sent: i % 3 !== 0,
        createdBy: user1.id,
        updatedBy: user1.id,
      },
    })
    orders.push(order)
  }

  console.log('✅ Created 25 orders with mixed statuses')

  // Create some payments for the orders
  let paymentCount = 0
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i]
    if (
      paymentStatuses[i] === PaymentStatus.paid ||
      paymentStatuses[i] === PaymentStatus.partial
    ) {
      const paymentAmount =
        paymentStatuses[i] === PaymentStatus.paid
          ? (order.baseFee || 0) + (order.techFee || 0)
          : Math.floor(((order.baseFee || 0) + (order.techFee || 0)) * 0.5)

      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: paymentAmount,
          paymentDate: addDays(order.orderDate!, 2 + (i % 5)),
          paymentType:
            paymentStatuses[i] === PaymentStatus.paid
              ? PaymentType.full
              : PaymentType.partial,
          description:
            paymentStatuses[i] === PaymentStatus.paid
              ? 'Full payment received'
              : 'Partial payment - deposit',
          createdBy: user1.id,
          updatedBy: user1.id,
        },
      })
      paymentCount++
    }
  }

  console.log(`✅ Created ${paymentCount} payments`)

  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
