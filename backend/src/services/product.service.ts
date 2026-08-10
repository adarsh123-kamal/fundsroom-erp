import { Prisma, MovementType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { parsePagination, getPaginationMeta } from '../utils/pagination';

interface ProductFilters {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export async function listProducts(filters: ProductFilters) {
  const { page, limit } = parsePagination(filters);
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = { isActive: true };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { sku: { contains: filters.search, mode: 'insensitive' } },
      { category: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.category) {
    where.category = { contains: filters.category, mode: 'insensitive' };
  }

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.product.count({ where }),
  ]);

  return { data: products, pagination: getPaginationMeta(total, page, limit) };
}

export async function getProductById(id: string) {
  return prisma.product.findFirst({ where: { id, isActive: true } });
}

export async function getProductBySku(sku: string) {
  return prisma.product.findFirst({ where: { sku, isActive: true } });
}

export async function createProduct(data: Prisma.ProductCreateInput) {
  return prisma.product.create({ data });
}

export async function updateProduct(id: string, data: Prisma.ProductUpdateInput) {
  return prisma.product.update({ where: { id }, data });
}

export async function softDeleteProduct(id: string) {
  return prisma.product.update({ where: { id }, data: { isActive: false } });
}

export async function getLowStockProducts() {
  return prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      sku: string;
      category: string | null;
      current_stock: number;
      minimum_stock: number;
      unit_price: number;
      location: string | null;
    }>
  >`
    SELECT id, name, sku, category, "currentStock" as current_stock,
           "minimumStock" as minimum_stock, "unitPrice" as unit_price, location
    FROM products
    WHERE "isActive" = true AND "currentStock" <= "minimumStock"
    ORDER BY ("minimumStock" - "currentStock") DESC
  `;
}

export async function createStockMovement(
  productId: string,
  quantity: number,
  movementType: MovementType,
  createdById: string,
  reason?: string,
  reference?: string
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });

    if (!product || !product.isActive) {
      throw new Error('Product not found');
    }

    if (movementType === 'OUT' && product.currentStock < quantity) {
      throw new Error(
        `Insufficient stock. Available: ${product.currentStock}, Requested: ${quantity}`
      );
    }

    const newStock =
      movementType === 'IN'
        ? product.currentStock + quantity
        : product.currentStock - quantity;

    if (newStock < 0) {
      throw new Error('Stock cannot become negative');
    }

    const [movement] = await Promise.all([
      tx.stockMovement.create({
        data: {
          productId,
          quantity,
          movementType,
          reason,
          reference,
          createdById,
        },
        include: {
          product: true,
          createdBy: { select: { id: true, name: true, role: true } },
        },
      }),
      tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      }),
    ]);

    return movement;
  });
}

export async function listStockMovements(filters: {
  productId?: string;
  movementType?: MovementType;
  page?: number;
  limit?: number;
}) {
  const { page, limit } = parsePagination(filters);
  const skip = (page - 1) * limit;

  const where: Prisma.StockMovementWhereInput = {};
  if (filters.productId) where.productId = filters.productId;
  if (filters.movementType) where.movementType = filters.movementType;

  const [movements, total] = await prisma.$transaction([
    prisma.stockMovement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        createdBy: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return { data: movements, pagination: getPaginationMeta(total, page, limit) };
}
