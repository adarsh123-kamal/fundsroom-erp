import { PrismaClient, Role, CustomerType, CustomerStatus, MovementType, ChallanStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Users ────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Password@123', 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: { name: 'Admin User', email: 'admin@example.com', password: passwordHash, role: Role.ADMIN },
    }),
    prisma.user.upsert({
      where: { email: 'sales@example.com' },
      update: {},
      create: { name: 'Sales Executive', email: 'sales@example.com', password: passwordHash, role: Role.SALES },
    }),
    prisma.user.upsert({
      where: { email: 'warehouse@example.com' },
      update: {},
      create: { name: 'Warehouse Manager', email: 'warehouse@example.com', password: passwordHash, role: Role.WAREHOUSE },
    }),
    prisma.user.upsert({
      where: { email: 'accounts@example.com' },
      update: {},
      create: { name: 'Accounts Executive', email: 'accounts@example.com', password: passwordHash, role: Role.ACCOUNTS },
    }),
  ]);

  console.log(`  ✔ ${users.length} users created`);

  const salesId = users[1].id;

  // ─── Customers ────────────────────────────────────────────────────────────
  const customersData = [
    {
      name: 'Rajesh Kumar',
      mobile: '9876543210',
      email: 'rajesh.kumar@example.com',
      businessName: 'Kumar Traders',
      gstNumber: '27AAPFK2329L1ZV',
      customerType: CustomerType.WHOLESALE,
      address: '12 MG Road, Mumbai, Maharashtra',
      status: CustomerStatus.ACTIVE,
      notes: 'Long-term wholesale partner. Prefers bulk orders.',
    },
    {
      name: 'Priya Sharma',
      mobile: '9123456789',
      email: 'priya.sharma@example.com',
      businessName: 'Sharma General Store',
      customerType: CustomerType.RETAIL,
      address: '45 Lal Bazaar, Delhi',
      status: CustomerStatus.ACTIVE,
      notes: 'Regular retail customer.',
    },
    {
      name: 'Amit Patel',
      mobile: '8765432109',
      email: 'amit.patel@example.com',
      businessName: 'Patel Distributors',
      gstNumber: '24AACCP5543Q1ZQ',
      customerType: CustomerType.DISTRIBUTOR,
      address: '78 Industrial Area, Ahmedabad, Gujarat',
      status: CustomerStatus.ACTIVE,
      notes: 'Key distributor for the western region.',
    },
    {
      name: 'Sunita Verma',
      mobile: '7890123456',
      email: 'sunita.verma@example.com',
      businessName: 'Verma Enterprises',
      customerType: CustomerType.WHOLESALE,
      address: '23 Nehru Nagar, Jaipur, Rajasthan',
      status: CustomerStatus.LEAD,
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      notes: 'New lead from trade fair. Follow up about wholesale terms.',
    },
    {
      name: 'Mohammed Ali',
      mobile: '9988776655',
      businessName: 'Ali Bros Trading',
      customerType: CustomerType.DISTRIBUTOR,
      address: '56 Commercial Street, Hyderabad, Telangana',
      status: CustomerStatus.INACTIVE,
      notes: 'Inactive since last quarter.',
    },
  ];

  const customers = await Promise.all(
    customersData.map((data) =>
      prisma.customer.upsert({
        where: { id: data.name.replace(/\s/g, '-').toLowerCase() },
        update: {},
        create: data,
      }).catch(() => prisma.customer.create({ data }))
    )
  );

  console.log(`  ✔ ${customers.length} customers created`);

  // ─── Follow-ups ───────────────────────────────────────────────────────────
  await prisma.customerFollowUp.create({
    data: {
      customerId: customers[0].id,
      createdById: salesId,
      note: 'Called Rajesh about Q4 bulk order. He needs 200 units of rice and 100 units of oil. Will confirm by Friday.',
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.customerFollowUp.create({
    data: {
      customerId: customers[3].id,
      createdById: salesId,
      note: 'Initial call made. Sunita is interested in our wholesale rates. Sent product catalog.',
    },
  });

  console.log('  ✔ Follow-ups created');

  // ─── Products ─────────────────────────────────────────────────────────────
  const productsData = [
    {
      name: 'Basmati Rice Premium',
      sku: 'RICE-BAS-001',
      category: 'Grains',
      unitPrice: 120.00,
      currentStock: 500,
      minimumStock: 50,
      location: 'Rack A-1',
    },
    {
      name: 'Sunflower Oil 1L',
      sku: 'OIL-SUN-001',
      category: 'Oils & Ghee',
      unitPrice: 175.00,
      currentStock: 200,
      minimumStock: 30,
      location: 'Rack B-2',
    },
    {
      name: 'Toor Dal 1kg',
      sku: 'DAL-TOR-001',
      category: 'Pulses',
      unitPrice: 145.00,
      currentStock: 8,   // Low stock (min = 20)
      minimumStock: 20,
      location: 'Rack A-3',
    },
    {
      name: 'Sugar Fine 1kg',
      sku: 'SUG-FIN-001',
      category: 'Sugar & Salt',
      unitPrice: 45.00,
      currentStock: 5,   // Low stock (min = 25)
      minimumStock: 25,
      location: 'Rack C-1',
    },
    {
      name: 'Wheat Flour 10kg',
      sku: 'FLR-WHT-001',
      category: 'Flours',
      unitPrice: 380.00,
      currentStock: 150,
      minimumStock: 20,
      location: 'Rack A-2',
    },
    {
      name: 'Mustard Oil 1L',
      sku: 'OIL-MUS-001',
      category: 'Oils & Ghee',
      unitPrice: 195.00,
      currentStock: 80,
      minimumStock: 15,
      location: 'Rack B-3',
    },
    {
      name: 'Chana Dal 1kg',
      sku: 'DAL-CHA-001',
      category: 'Pulses',
      unitPrice: 120.00,
      currentStock: 12,  // Low stock (min = 15)
      minimumStock: 15,
      location: 'Rack A-4',
    },
    {
      name: 'Salt Iodised 1kg',
      sku: 'SAL-IOD-001',
      category: 'Sugar & Salt',
      unitPrice: 18.00,
      currentStock: 300,
      minimumStock: 50,
      location: 'Rack C-2',
    },
  ];

  const products = await Promise.all(
    productsData.map((data) =>
      prisma.product.upsert({
        where: { sku: data.sku },
        update: {},
        create: data,
      })
    )
  );

  console.log(`  ✔ ${products.length} products created`);

  // ─── Stock Movements ──────────────────────────────────────────────────────
  const warehouseId = users[2].id;

  await prisma.stockMovement.createMany({
    data: [
      {
        productId: products[0].id,
        quantity: 500,
        movementType: MovementType.IN,
        reason: 'Initial stock entry',
        createdById: warehouseId,
      },
      {
        productId: products[1].id,
        quantity: 200,
        movementType: MovementType.IN,
        reason: 'Initial stock entry',
        createdById: warehouseId,
      },
      {
        productId: products[2].id,
        quantity: 50,
        movementType: MovementType.IN,
        reason: 'Initial stock entry',
        createdById: warehouseId,
      },
      {
        productId: products[2].id,
        quantity: 42,
        movementType: MovementType.OUT,
        reason: 'Sold to distributor',
        createdById: warehouseId,
      },
      {
        productId: products[3].id,
        quantity: 30,
        movementType: MovementType.IN,
        reason: 'Purchase order received',
        createdById: warehouseId,
      },
      {
        productId: products[3].id,
        quantity: 25,
        movementType: MovementType.OUT,
        reason: 'Retail sales',
        createdById: salesId,
      },
    ],
    skipDuplicates: true,
  });

  console.log('  ✔ Stock movements created');

  // ─── Challans ─────────────────────────────────────────────────────────────
  // Challan 1 — Confirmed (stock was deducted at confirmation time)
  const challan1 = await prisma.challan.create({
    data: {
      challanNumber: 'CH-20260101-0001',
      customerId: customers[0].id,
      status: ChallanStatus.CONFIRMED,
      totalQuantity: 25,
      totalAmount: 7375,
      notes: 'Bulk order for Rajesh Kumar',
      createdById: salesId,
      confirmedAt: new Date('2026-01-15T10:00:00Z'),
      items: {
        createMany: {
          data: [
            {
              productId: products[0].id,
              productName: 'Basmati Rice Premium',
              productSku: 'RICE-BAS-001',
              unitPrice: 120.00,
              quantity: 20,
              totalPrice: 2400.00,
            },
            {
              productId: products[4].id,
              productName: 'Wheat Flour 10kg',
              productSku: 'FLR-WHT-001',
              unitPrice: 380.00,
              quantity: 5,
              totalPrice: 1900.00,
            },
          ],
        },
      },
    },
  });

  // Challan 2 — Draft (no stock deducted)
  await prisma.challan.create({
    data: {
      challanNumber: 'CH-20260801-0002',
      customerId: customers[1].id,
      status: ChallanStatus.DRAFT,
      totalQuantity: 10,
      totalAmount: 1750,
      notes: 'Pending review',
      createdById: salesId,
      items: {
        createMany: {
          data: [
            {
              productId: products[1].id,
              productName: 'Sunflower Oil 1L',
              productSku: 'OIL-SUN-001',
              unitPrice: 175.00,
              quantity: 10,
              totalPrice: 1750.00,
            },
          ],
        },
      },
    },
  });

  // Challan 3 — Cancelled
  await prisma.challan.create({
    data: {
      challanNumber: 'CH-20260701-0003',
      customerId: customers[2].id,
      status: ChallanStatus.CANCELLED,
      totalQuantity: 5,
      totalAmount: 975,
      notes: 'Cancelled by customer',
      createdById: salesId,
      cancelledAt: new Date('2026-07-10T14:00:00Z'),
      items: {
        createMany: {
          data: [
            {
              productId: products[5].id,
              productName: 'Mustard Oil 1L',
              productSku: 'OIL-MUS-001',
              unitPrice: 195.00,
              quantity: 5,
              totalPrice: 975.00,
            },
          ],
        },
      },
    },
  });

  console.log('  ✔ 3 challans created');
  console.log('\n✅ Seed completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('   admin@example.com     | Password@123 | Role: ADMIN');
  console.log('   sales@example.com     | Password@123 | Role: SALES');
  console.log('   warehouse@example.com | Password@123 | Role: WAREHOUSE');
  console.log('   accounts@example.com  | Password@123 | Role: ACCOUNTS');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
