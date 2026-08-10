import { Prisma, ChallanStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { parsePagination, getPaginationMeta } from '../utils/pagination';
import { generateChallanNumber } from '../utils/challanNumber';

interface ChallanItem {
  productId: string;
  quantity: number;
}

interface ChallanFilters {
  status?: ChallanStatus;
  customerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function listChallans(filters: ChallanFilters) {
  const { page, limit } = parsePagination(filters);
  const skip = (page - 1) * limit;

  const where: Prisma.ChallanWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.search) {
    where.OR = [
      { challanNumber: { contains: filters.search, mode: 'insensitive' } },
      { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  const [challans, total] = await prisma.$transaction([
    prisma.challan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, mobile: true, businessName: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.challan.count({ where }),
  ]);

  return { data: challans, pagination: getPaginationMeta(total, page, limit) };
}

export async function getChallanById(id: string) {
  return prisma.challan.findUnique({
    where: { id },
    include: {
      customer: true,
      createdBy: { select: { id: true, name: true, role: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true, currentStock: true } },
        },
      },
    },
  });
}

async function getNextChallanSequence(): Promise<number> {
  const count = await prisma.challan.count();
  return count + 1;
}

export async function createChallan(
  customerId: string,
  items: ChallanItem[],
  createdById: string,
  notes?: string
) {
  // Validate customer exists
  const customer = await prisma.customer.findFirst({ where: { id: customerId, isActive: true } });
  if (!customer) throw new Error('Customer not found');

  // Validate all products exist and fetch their data for snapshot
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  if (products.length !== productIds.length) {
    const foundIds = products.map((p) => p.id);
    const missing = productIds.filter((id) => !foundIds.includes(id));
    throw new Error(`Products not found: ${missing.join(', ')}`);
  }

  // Build challan items with product snapshot
  const productMap = new Map(products.map((p) => [p.id, p]));
  const challanItemsData: Prisma.ChallanItemCreateManyChallanInput[] = items.map((item) => {
    const product = productMap.get(item.productId)!;
    const unitPrice = Number(product.unitPrice);
    return {
      productId: item.productId,
      productName: product.name,   // snapshot
      productSku: product.sku,      // snapshot
      unitPrice: product.unitPrice, // snapshot
      quantity: item.quantity,
      totalPrice: new Prisma.Decimal(unitPrice * item.quantity),
    };
  });

  const totalQuantity = challanItemsData.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = challanItemsData.reduce(
    (sum, i) => sum + Number(i.totalPrice),
    0
  );

  const sequence = await getNextChallanSequence();
  const challanNumber = generateChallanNumber(sequence);

  // Draft — NO stock deduction
  return prisma.challan.create({
    data: {
      challanNumber,
      customerId,
      status: 'DRAFT',
      totalQuantity,
      totalAmount,
      notes,
      createdById,
      items: { createMany: { data: challanItemsData } },
    },
    include: {
      customer: { select: { id: true, name: true, mobile: true } },
      createdBy: { select: { id: true, name: true, role: true } },
      items: true,
    },
  });
}

export async function updateChallan(
  id: string,
  customerId: string | undefined,
  items: ChallanItem[] | undefined,
  notes: string | undefined
) {
  const challan = await getChallanById(id);
  if (!challan) throw new Error('Challan not found');
  if (challan.status !== 'DRAFT') {
    throw new Error('Only DRAFT challans can be updated');
  }

  return prisma.$transaction(async (tx) => {
    if (customerId) {
      const customer = await tx.customer.findFirst({ where: { id: customerId, isActive: true } });
      if (!customer) throw new Error('Customer not found');
    }

    if (items && items.length > 0) {
      const productIds = items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, isActive: true },
      });

      if (products.length !== productIds.length) {
        const foundIds = products.map((p) => p.id);
        const missing = productIds.filter((pid) => !foundIds.includes(pid));
        throw new Error(`Products not found: ${missing.join(', ')}`);
      }

      const productMap = new Map(products.map((p) => [p.id, p]));
      const challanItemsData: Prisma.ChallanItemCreateManyChallanInput[] = items.map((item) => {
        const product = productMap.get(item.productId)!;
        const unitPrice = Number(product.unitPrice);
        return {
          productId: item.productId,
          productName: product.name,
          productSku: product.sku,
          unitPrice: product.unitPrice,
          quantity: item.quantity,
          totalPrice: new Prisma.Decimal(unitPrice * item.quantity),
        };
      });

      const totalQuantity = challanItemsData.reduce((sum, i) => sum + i.quantity, 0);
      const totalAmount = challanItemsData.reduce(
        (sum, i) => sum + Number(i.totalPrice),
        0
      );

      // Delete old items and recreate
      await tx.challanItem.deleteMany({ where: { challanId: id } });

      await tx.challan.update({
        where: { id },
        data: {
          customerId: customerId || challan.customerId,
          notes: notes !== undefined ? notes : challan.notes,
          totalQuantity,
          totalAmount,
          items: { createMany: { data: challanItemsData } },
        },
      });
    } else {
      await tx.challan.update({
        where: { id },
        data: {
          customerId: customerId || challan.customerId,
          notes: notes !== undefined ? notes : challan.notes,
        },
      });
    }

    return tx.challan.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, mobile: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        items: true,
      },
    });
  });
}

/**
 * CRITICAL BUSINESS LOGIC: Confirm a challan
 *
 * - Validates ALL items have sufficient stock before touching anything
 * - Uses a database transaction to atomically:
 *   1. Validate stock for every item
 *   2. Deduct stock from every product
 *   3. Create stock movement records for every item
 *   4. Mark challan as CONFIRMED
 * - If ANY item fails, the ENTIRE transaction is rolled back
 */
export async function confirmChallan(id: string, confirmedById: string) {
  const challan = await getChallanById(id);
  if (!challan) throw new Error('Challan not found');
  if (challan.status !== 'DRAFT') {
    throw new Error(`Challan is already ${challan.status}`);
  }

  return prisma.$transaction(async (tx) => {
    // Step 1: Lock products and validate ALL stock in a single pass
    const insufficientItems: string[] = [];

    for (const item of challan.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product || !product.isActive) {
        throw new Error(`Product "${item.productName}" no longer exists`);
      }

      if (product.currentStock < item.quantity) {
        insufficientItems.push(
          `"${item.productName}" (available: ${product.currentStock}, required: ${item.quantity})`
        );
      }
    }

    // If ANY item has insufficient stock, fail the whole thing
    if (insufficientItems.length > 0) {
      throw new Error(
        `Insufficient stock for: ${insufficientItems.join('; ')}. No stock was deducted.`
      );
    }

    // Step 2: All items passed — now atomically deduct stock and create movements
    for (const item of challan.items) {
      // Deduct stock
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });

      // Create stock movement record
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          movementType: 'OUT',
          reason: `Challan confirmed: ${challan.challanNumber}`,
          reference: challan.challanNumber,
          createdById: confirmedById,
        },
      });
    }

    // Step 3: Update challan status to CONFIRMED
    return tx.challan.update({
      where: { id },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
      include: {
        customer: { select: { id: true, name: true, mobile: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        items: true,
      },
    });
  });
}

export async function cancelChallan(id: string) {
  const challan = await getChallanById(id);
  if (!challan) throw new Error('Challan not found');

  if (challan.status === 'CANCELLED') {
    throw new Error('Challan is already cancelled');
  }

  if (challan.status === 'CONFIRMED') {
    // Confirmed challan cancellation: restore stock
    return prisma.$transaction(async (tx) => {
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'IN',
            reason: `Challan cancelled: ${challan.challanNumber}`,
            reference: challan.challanNumber,
            createdById: challan.createdById,
          },
        });
      }

      return tx.challan.update({
        where: { id },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
        include: {
          customer: { select: { id: true, name: true, mobile: true } },
          createdBy: { select: { id: true, name: true, role: true } },
          items: true,
        },
      });
    });
  }

  // Draft cancellation — just mark as cancelled, no stock to restore
  return prisma.challan.update({
    where: { id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
    include: {
      customer: { select: { id: true, name: true, mobile: true } },
      createdBy: { select: { id: true, name: true, role: true } },
      items: true,
    },
  });
}

export async function getDashboardStats() {
  // low-stock count uses raw query (can't be compared column-to-column in Prisma ORM)
  const lowStockRaw = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*)::bigint as count
    FROM products
    WHERE "isActive" = true AND "currentStock" <= "minimumStock"
  `;
  const lowStockCount = Number(lowStockRaw[0].count);

  const [
    totalCustomers,
    totalProducts,
    draftChallans,
    confirmedChallans,
    recentChallans,
    stockSum,
  ] = await prisma.$transaction([
    prisma.customer.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.challan.count({ where: { status: 'DRAFT' } }),
    prisma.challan.count({ where: { status: 'CONFIRMED' } }),
    prisma.challan.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.product.aggregate({
      where: { isActive: true },
      _sum: { currentStock: true },
    }),
  ]);

  return {
    totalCustomers,
    totalProducts,
    lowStockCount,
    draftChallans,
    confirmedChallans,
    totalStock: stockSum._sum.currentStock || 0,
    recentChallans,
  };
}
