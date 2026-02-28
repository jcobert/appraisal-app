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
      organizationId: organization.id,
      name: 'First National Bank',
      email: 'orders@firstnationalbank.com',
      phone: '(212) 789-4500',
      street: '100 Banking Plaza',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      website: 'https://www.firstnationalbank.com',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=FirstNationalBank',
      pocFirstName: 'Jennifer',
      pocLastName: 'Davis',
      pocEmail: 'jdavis@firstnationalbank.com',
      pocPhone: '(212) 555-8821',
      note: 'Preferred lender - fast turnaround',
      favorite: true,
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const client2 = await prisma.client.create({
    data: {
      organizationId: organization.id,
      name: 'Metro Mortgage Company',
      email: 'appraisals@metromorgage.com',
      phone: '(312) 661-8200',
      website: 'https://www.metromortgage.com',
      logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=MetroMortgage',
      pocFirstName: 'Robert',
      pocEmail: 'rchen@metromortgage.com',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const client3 = await prisma.client.create({
    data: {
      organizationId: organization.id,
      name: 'Coastal Lending Group',
      email: 'orders@coastallending.com',
      phone: '(305) 892-3344',
      city: 'Miami',
      state: 'FL',
      website: 'https://www.coastallending.com',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=CoastalLending',
      pocFirstName: 'Maria',
      pocLastName: 'Santos',
      pocPhone: '(786) 412-9033',
      note: 'Large volume client',
      favorite: true,
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const client4 = await prisma.client.create({
    data: {
      organizationId: organization.id,
      name: 'Summit Financial Services',
      email: 'appraisals@summitfs.com',
      phone: '(720) 445-5512',
      city: 'Denver',
      state: 'CO',
      logo: 'https://api.dicebear.com/7.x/rings/svg?seed=SummitFinancial',
      pocFirstName: 'David',
      pocLastName: 'Park',
      pocEmail: 'dpark@summitfs.com',
      pocPhone: '(303) 827-4156',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const client5 = await prisma.client.create({
    data: {
      organizationId: organization.id,
      name: 'Capital Credit Union',
      email: 'lending@capitalcu.org',
      phone: '(206) 447-9811',
      city: 'Seattle',
      state: 'WA',
      website: 'https://www.capitalcu.org',
      favorite: true,
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const client6 = await prisma.client.create({
    data: {
      organizationId: organization.id,
      name: 'Pacific Home Loans',
      email: 'orders@pacifichomeloans.com',
      phone: '(619) 221-7630',
      street: '1200 Harbor Way',
      street2: 'Suite 300',
      city: 'San Diego',
      state: 'CA',
      zip: '92101',
      website: 'https://www.pacifichomeloans.com',
      logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=PacificHomeLoans',
      pocFirstName: 'Angela',
      pocEmail: 'amartinez@pacifichomeloans.com',
      note: 'Net 30 payment terms',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const client7 = await prisma.client.create({
    data: {
      organizationId: organization.id,
      name: 'Heritage Bank & Trust',
      email: 'realestate@heritagebank.com',
      city: 'Boston',
      website: 'https://www.heritagebank.com',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=HeritageBank',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const client8 = await prisma.client.create({
    data: {
      organizationId: organization.id,
      name: 'Apex Lending Solutions',
      email: 'appraisals@apexlending.com',
      phone: '(512) 445-8870',
      state: 'TX',
      logo: 'https://api.dicebear.com/7.x/thumbs/svg?seed=ApexLending',
      pocFirstName: 'Michael',
      pocLastName: 'Foster',
      pocEmail: 'mfoster@apexlending.com',
      pocPhone: '(512) 451-9308',
      favorite: true,
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const client9 = await prisma.client.create({
    data: {
      organizationId: organization.id,
      name: 'Riverside Community Bank',
      email: 'mortgages@riversidecb.com',
      phone: '(971) 228-3345',
      pocFirstName: 'Sarah',
      pocLastName: 'Williams',
      pocPhone: '(503) 284-7719',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const client10 = await prisma.client.create({
    data: {
      organizationId: organization.id,
      name: 'Empire Realty Group',
      email: 'commercial@empirerealty.com',
      phone: '(917) 558-2290',
      street: '750 Park Place',
      street2: '15th Floor',
      city: 'New York',
      state: 'NY',
      zip: '10022',
      website: 'https://www.empirerealty.com',
      logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=EmpireRealty',
      pocFirstName: 'Thomas',
      pocLastName: 'Reed',
      pocEmail: 'treed@empirerealty.com',
      pocPhone: '(646) 392-1147',
      note: 'Specializes in commercial properties',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const client11 = await prisma.client.create({
    data: {
      organizationId: organization.id,
      name: 'Sunshine Mortgage Corp',
      email: 'orders@sunshinemortgage.com',
      city: 'Tampa',
      website: 'https://www.sunshinemortgage.com',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const client12 = await prisma.client.create({
    data: {
      organizationId: organization.id,
      name: 'Midwest Federal Savings',
      email: 'appraisals@mwfederal.com',
      phone: '(612) 339-4521',
      city: 'Minneapolis',
      state: 'MN',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=MidwestFederal',
      pocFirstName: 'Patricia',
      pocEmail: 'pjohnson@mwfederal.com',
      favorite: true,
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const client13 = await prisma.client.create({
    data: {
      organizationId: organization.id,
      name: 'United Home Funding',
      email: 'info@unitedhomefunding.com',
      phone: '(602) 254-7766',
      website: 'https://www.unitedhomefunding.com',
      logo: 'https://api.dicebear.com/7.x/rings/svg?seed=UnitedHomeFunding',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const client14 = await prisma.client.create({
    data: {
      organizationId: organization.id,
      name: 'Premier Mortgage Services',
      phone: '(404) 873-5692',
      city: 'Atlanta',
      state: 'GA',
      pocFirstName: 'Daniel',
      pocLastName: 'Kim',
      pocPhone: '(770) 456-6234',
      note: 'Rush orders available',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const client15 = await prisma.client.create({
    data: {
      organizationId: organization.id,
      name: 'Gateway Financial Group',
      email: 'appraisals@gatewayfinancial.com',
      phone: '(314) 567-8901',
      website: 'https://www.gatewayfinancial.com',
      logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=GatewayFinancial',
      pocFirstName: 'Rebecca',
      pocLastName: 'Thompson',
      pocEmail: 'rthompson@gatewayfinancial.com',
      pocPhone: '(314) 725-8893',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const clients = [
    client1,
    client2,
    client3,
    client4,
    client5,
    client6,
    client7,
    client8,
    client9,
    client10,
    client11,
    client12,
    client13,
    client14,
    client15,
  ]

  console.log('✅ Created 15 clients')

  // Create Borrowers
  const borrower1 = await prisma.borrower.create({
    data: {
      organizationId: organization.id,
      firstName: 'Alice',
      lastName: 'Thompson',
      email: 'alice.thompson@email.com',
      phone: '555-5000',
      street: '1234 Elm Street',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      note: 'Prefers email contact',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const borrower2 = await prisma.borrower.create({
    data: {
      organizationId: organization.id,
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
      organizationId: organization.id,
      firstName: 'Jennifer',
      lastName: 'Lee',
      phone: '555-5002',
      street: '890 Ocean View',
      street2: 'Apt 5B',
      city: 'San Diego',
      state: 'CA',
      zip: '92101',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const borrower4 = await prisma.borrower.create({
    data: {
      organizationId: organization.id,
      firstName: 'Robert',
      lastName: 'Anderson',
      email: 'robert.anderson@email.com',
      phone: '555-5003',
      city: 'Denver',
      state: 'CO',
      zip: '80202',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const borrower5 = await prisma.borrower.create({
    data: {
      organizationId: organization.id,
      firstName: 'Lisa',
      lastName: 'Taylor',
      email: 'lisa.taylor@email.com',
      phone: '555-5004',
      street: '567 Maple Avenue',
      city: 'Seattle',
      state: 'WA',
      zip: '98101',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const borrower6 = await prisma.borrower.create({
    data: {
      organizationId: organization.id,
      firstName: 'Michael',
      lastName: 'Chang',
      email: 'mchang@email.com',
      street: '2345 Park Place',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      note: 'First-time buyer',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const borrower7 = await prisma.borrower.create({
    data: {
      organizationId: organization.id,
      firstName: 'Emma',
      lastName: 'Wilson',
      phone: '555-5007',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const borrower8 = await prisma.borrower.create({
    data: {
      organizationId: organization.id,
      firstName: 'James',
      lastName: "O'Brien",
      email: 'james.obrien@email.com',
      phone: '555-5008',
      street: '4567 Highland Drive',
      city: 'Boston',
      state: 'MA',
      zip: '02101',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const borrower9 = await prisma.borrower.create({
    data: {
      organizationId: organization.id,
      firstName: 'Sophia',
      lastName: 'Patel',
      email: 'sophia.patel@email.com',
      street: '789 Valley Road',
      street2: 'Unit 12',
      city: 'Phoenix',
      state: 'AZ',
      zip: '85001',
      note: 'Self-employed',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const borrower10 = await prisma.borrower.create({
    data: {
      organizationId: organization.id,
      firstName: 'Daniel',
      lastName: 'Rodriguez',
      phone: '555-5010',
      city: 'Miami',
      state: 'FL',
      zip: '33101',
      createdBy: user1.id,
      updatedBy: user1.id,
    },
  })

  const borrowers = [
    borrower1,
    borrower2,
    borrower3,
    borrower4,
    borrower5,
    borrower6,
    borrower7,
    borrower8,
    borrower9,
    borrower10,
  ]

  console.log('✅ Created 10 borrowers')

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
        organizationId: organization.id,
        propertyType: propertyTypes[i % propertyTypes.length],
        street: streets[i],
        street2:
          i % 5 === 0
            ? `Unit ${String.fromCharCode(65 + (i % 10))}`
            : undefined,
        city: cities[i % cities.length],
        state: states[i % states.length],
        zip: zips[i % zips.length],
        note:
          i % 7 === 0
            ? 'Corner lot'
            : i % 11 === 0
              ? 'Recently renovated'
              : i % 13 === 0
                ? 'Needs foundation inspection'
                : undefined,
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

  // Sets a wall-clock UTC time on a date (hours/minutes stored as-is in UTC
  // so all viewers see the same time regardless of their timezone).
  const withTime = (date: Date, hours: number, minutes: number) =>
    new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hours,
        minutes,
      ),
    )

  // Pre-planned inspection schedule.
  // Columns: [daysAgo (order received), inspDaysFromOrder, appraiserIdx (0–2), inspHours, inspMins]
  //
  // Inspection day = today - daysAgo + inspDaysFromOrder.
  // Multiple orders intentionally share inspection days to reflect a realistic
  // schedule. Constraint: same appraiser on the same day is always ≥60 min apart.
  //
  // Shared inspection days (absolute offset from today):
  //   -25: i=0(a0@9:00),  i=1(a1@11:00), i=2(a2@14:00)
  //   -22: i=3(a0@10:00), i=4(a1@13:00)
  //   -20: i=5(a2@9:30),  i=6(a0@14:30), i=7(a1@15:30)
  //   -17: i=8(a2@8:00),  i=9(a0@11:00)
  //   -14: i=10(a1@9:00), i=11(a2@10:30), i=12(a0@13:00)
  //   -11: i=13(a1@14:00),i=14(a2@15:00)
  //   -15,-16,-17 = cancelled (no inspection)
  //    -7: i=18(a0@9:00), i=19(a1@10:30), i=20(a2@13:30)
  //    -3: i=21(a0@11:00),i=22(a1@9:00)
  //    -1: i=23(a2@10:00),i=24(a0@14:00)
  const orderSchedule: [
    daysAgo: number,
    inspDays: number,
    appraiserIdx: number,
    h: number,
    m: number,
  ][] = [
    // ── Inspection day –25 ────────────────────────────────────────────────────
    [30, 5, 0, 9, 0], // i=0  appraiser0 9:00 AM
    [28, 3, 1, 11, 0], // i=1  appraiser1 11:00 AM
    [27, 2, 2, 14, 0], // i=2  appraiser2 2:00 PM
    // ── Inspection day –22 ────────────────────────────────────────────────────
    [29, 7, 0, 10, 0], // i=3  appraiser0 10:00 AM
    [26, 4, 1, 13, 0], // i=4  appraiser1 1:00 PM
    // ── Inspection day –20 ────────────────────────────────────────────────────
    [25, 5, 2, 9, 30], // i=5  appraiser2 9:30 AM
    [23, 3, 0, 14, 30], // i=6  appraiser0 2:30 PM
    [22, 2, 1, 15, 30], // i=7  appraiser1 3:30 PM
    // ── Inspection day –17 ────────────────────────────────────────────────────
    [24, 7, 2, 8, 0], // i=8  appraiser2 8:00 AM
    [21, 4, 0, 11, 0], // i=9  appraiser0 11:00 AM
    // ── Inspection day –14 ────────────────────────────────────────────────────
    [20, 6, 1, 9, 0], // i=10 appraiser1 9:00 AM
    [18, 4, 2, 10, 30], // i=11 appraiser2 10:30 AM
    [17, 3, 0, 13, 0], // i=12 appraiser0 1:00 PM
    // ── Inspection day –11 ────────────────────────────────────────────────────
    [19, 8, 1, 14, 0], // i=13 appraiser1 2:00 PM
    [16, 5, 2, 15, 0], // i=14 appraiser2 3:00 PM
    // ── Cancelled — inspection dates are null (times unused) ──────────────────
    [15, 5, 0, 0, 0], // i=15 cancelled
    [14, 5, 1, 0, 0], // i=16 cancelled
    [13, 5, 2, 0, 0], // i=17 cancelled
    // ── Inspection day –7 ─────────────────────────────────────────────────────
    [12, 5, 0, 9, 0], // i=18 appraiser0 9:00 AM
    [11, 4, 1, 10, 30], // i=19 appraiser1 10:30 AM
    [10, 3, 2, 13, 30], // i=20 appraiser2 1:30 PM
    // ── Inspection day –3 ─────────────────────────────────────────────────────
    [9, 6, 0, 11, 0], // i=21 appraiser0 11:00 AM
    [8, 5, 1, 9, 0], // i=22 appraiser1 9:00 AM
    // ── Inspection day –1 ─────────────────────────────────────────────────────
    [7, 6, 2, 10, 0], // i=23 appraiser2 10:00 AM
    [6, 5, 0, 14, 0], // i=24 appraiser0 2:00 PM
  ]

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

  // Payment statuses must follow business rules:
  // - Closed orders must be paid
  // - Cancelled orders must be unpaid
  // - Partial payments are rare (only on open orders)
  const paymentStatuses = [
    PaymentStatus.unpaid, // 0: open
    PaymentStatus.partial, // 1: open - rare partial payment
    PaymentStatus.unpaid, // 2: open
    PaymentStatus.unpaid, // 3: open
    PaymentStatus.unpaid, // 4: open
    PaymentStatus.unpaid, // 5: open
    PaymentStatus.unpaid, // 6: open
    PaymentStatus.partial, // 7: open - rare partial payment
    PaymentStatus.paid, // 8: closed (must be paid)
    PaymentStatus.paid, // 9: closed (must be paid)
    PaymentStatus.paid, // 10: closed (must be paid)
    PaymentStatus.paid, // 11: closed (must be paid)
    PaymentStatus.paid, // 12: closed (must be paid)
    PaymentStatus.paid, // 13: closed (must be paid)
    PaymentStatus.paid, // 14: closed (must be paid)
    PaymentStatus.unpaid, // 15: cancelled (must be unpaid)
    PaymentStatus.unpaid, // 16: cancelled (must be unpaid)
    PaymentStatus.unpaid, // 17: cancelled (must be unpaid)
    PaymentStatus.unpaid, // 18: open
    PaymentStatus.unpaid, // 19: open
    PaymentStatus.paid, // 20: closed (must be paid)
    PaymentStatus.paid, // 21: closed (must be paid)
    PaymentStatus.unpaid, // 22: open
    PaymentStatus.unpaid, // 23: open
    PaymentStatus.unpaid, // 24: open
  ]

  const appraisalTypes = [
    AppraisalType.purchase,
    AppraisalType.refinance,
    AppraisalType.purchase,
    AppraisalType.refinance,
    AppraisalType.purchase,
  ]

  const orders = []

  // Fee structure for more realistic variation
  // baseFee: typically 200-900, with a few outliers
  const baseFees = [
    450, 375, 525, 600, 325, 750, 425, 550, 800, 650, 350, 475, 700, 400, 575,
    150, 900, 625, 1200, 500, 825, 675, 450, 1000, 550,
  ]

  // techFee: typically under 100, some missing, one outlier
  const techFees = [
    45,
    60,
    undefined,
    75,
    50,
    85,
    40,
    65,
    90,
    55,
    70,
    undefined,
    80,
    150,
    50,
    60,
    75,
    45,
    undefined,
    85,
    65,
    55,
    70,
    60,
    80,
  ]

  // questionnaireFee: when present, typically under 100
  const questionnaireFees = [50, 75]

  // Only orders 3 and 17 have questionnaires (8% of orders)
  const questionnaireOrders = [3, 17]

  // Client-specific order number formats and counters
  // Each client has their own numbering system
  const clientOrderCounters = new Map<number, number>()
  const generateClientOrderNum = (
    clientIndex: number,
    orderDate: Date,
  ): string | undefined => {
    // Initialize counter for this client
    const count = (clientOrderCounters.get(clientIndex) || 0) + 1
    clientOrderCounters.set(clientIndex, count)

    const year = orderDate.getFullYear()
    const month = String(orderDate.getMonth() + 1).padStart(2, '0')

    // Different clients use different order number formats
    switch (clientIndex) {
      case 0: // First National Bank
        return `FNB-${year}-${String(1200 + count * 5).padStart(4, '0')}`
      case 1: // Metro Mortgage Company
        return `MMC${year}${month}${String(count).padStart(3, '0')}`
      case 2: // Coastal Lending Group
        return `CL-${String(5000 + count * 10).padStart(5, '0')}`
      case 3: // Summit Financial Services
        return `SFS-APR-${String(count).padStart(4, '0')}`
      case 4: // Capital Credit Union
        return undefined // This client doesn't provide order numbers
      case 5: // Pacific Home Loans
        return `PHL${year.toString().slice(-2)}${month}-${String(count).padStart(2, '0')}`
      case 6: // Heritage Bank & Trust
        return `HB${String(10000 + count * 25).padStart(5, '0')}`
      case 7: // Apex Lending Solutions
        return undefined // This client doesn't provide order numbers
      case 8: // Riverside Community Bank
        return `RCB-${year}-${String.fromCharCode(65 + count - 1)}${String(100 + count).padStart(3, '0')}`
      case 9: // Empire Realty Group
        return `ERG-COM-${String(count).padStart(3, '0')}`
      case 10: // Sunshine Mortgage Corp
        return `SM${String(8000 + count * 15).padStart(4, '0')}`
      case 11: // Midwest Federal Savings
        return `MW-${year}${month}-${String(count).padStart(4, '0')}`
      case 12: // United Home Funding
        return `UHF${String(count * 100).padStart(4, '0')}`
      case 13: // Premier Mortgage Services
        return undefined // This client doesn't provide order numbers
      case 14: // Gateway Financial Group
        return `GFG-${String(2000 + count * 7).padStart(4, '0')}-${year.toString().slice(-2)}`
      default:
        return `ORD-${String(1000 + count)}`
    }
  }

  for (let i = 0; i < 25; i++) {
    const [daysAgo, inspDays, appraiserIdx, h, m] = orderSchedule[i]!
    const orderDate = addDays(today, -daysAgo)
    const inspectionDate = withTime(addDays(orderDate, inspDays), h, m)
    const dueDate = addDays(orderDate, 14 + (i % 7))
    const hasQuestionnaire = questionnaireOrders.includes(i)
    const clientIndex = i % clients.length

    const order = await prisma.order.create({
      data: {
        organizationId: organization.id,
        clientId: clients[clientIndex].id,
        borrowerId: i % 3 === 0 ? borrowers[i % borrowers.length].id : null,
        propertyId: properties[i].id,
        appraiserId: appraisers[appraiserIdx]!.id,
        fileNumber: `APR-2026-${String(i + 1).padStart(3, '0')}`,
        clientOrderNum: generateClientOrderNum(clientIndex, orderDate),
        orderDate,
        inspectionDate:
          orderStatuses[i] !== OrderStatus.cancelled ? inspectionDate : null,
        dueDate,
        appraisalType: appraisalTypes[i % appraisalTypes.length],
        orderStatus: orderStatuses[i],
        paymentStatus: paymentStatuses[i],
        baseFee: baseFees[i],
        techFee: techFees[i],
        questionnaireFee: hasQuestionnaire
          ? questionnaireFees[questionnaireOrders.indexOf(i)]
          : undefined,
        questionnaire: hasQuestionnaire,
        contract: i % 9 !== 0,
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
  const paymentDescriptions = [
    'Wire transfer received',
    'Check payment',
    'ACH payment processed',
    'Credit card payment',
    'Full payment received',
    undefined,
    'Deposit received',
    'Partial payment',
  ]

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i]
    if (
      paymentStatuses[i] === PaymentStatus.paid ||
      paymentStatuses[i] === PaymentStatus.partial
    ) {
      const paymentAmount =
        paymentStatuses[i] === PaymentStatus.paid
          ? (order.baseFee || 0) +
            (order.techFee || 0) +
            (order.questionnaireFee || 0)
          : Math.floor(
              ((order.baseFee || 0) +
                (order.techFee || 0) +
                (order.questionnaireFee || 0)) *
                (0.4 + (i % 3) * 0.1),
            )

      await prisma.payment.create({
        data: {
          organizationId: organization.id,
          orderId: order.id,
          amount: paymentAmount,
          paymentDate:
            i % 8 === 0 ? undefined : addDays(order.orderDate!, 2 + (i % 5)),
          paymentType:
            paymentStatuses[i] === PaymentStatus.paid
              ? PaymentType.full
              : PaymentType.partial,
          description: paymentDescriptions[i % paymentDescriptions.length],
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
