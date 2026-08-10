import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import * as ProductService from '../services/product.service';
import { MovementType } from '@prisma/client';

export async function listProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { search, category, page, limit } = req.query;

  const result = await ProductService.listProducts({
    search: search as string | undefined,
    category: category as string | undefined,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });

  sendSuccess(res, result);
}

export async function getProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  const product = await ProductService.getProductById(req.params.id);

  if (!product) {
    sendError(res, 'Product not found', 404);
    return;
  }

  sendSuccess(res, product);
}

export async function createProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { name, sku, category, unitPrice, currentStock, minimumStock, location } = req.body;

  // Check for duplicate SKU
  const existing = await ProductService.getProductBySku(sku);
  if (existing) {
    sendError(res, `A product with SKU "${sku}" already exists`, 409);
    return;
  }

  const product = await ProductService.createProduct({
    name,
    sku,
    category: category || null,
    unitPrice,
    currentStock: currentStock || 0,
    minimumStock: minimumStock || 0,
    location: location || null,
  });

  sendSuccess(res, product, 'Product created successfully', 201);
}

export async function updateProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  const existing = await ProductService.getProductById(req.params.id);

  if (!existing) {
    sendError(res, 'Product not found', 404);
    return;
  }

  const data = req.body;

  // If SKU is being changed, check uniqueness
  if (data.sku && data.sku !== existing.sku) {
    const skuConflict = await ProductService.getProductBySku(data.sku);
    if (skuConflict) {
      sendError(res, `A product with SKU "${data.sku}" already exists`, 409);
      return;
    }
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.sku !== undefined) updateData.sku = data.sku;
  if (data.category !== undefined) updateData.category = data.category || null;
  if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice;
  if (data.minimumStock !== undefined) updateData.minimumStock = data.minimumStock;
  if (data.location !== undefined) updateData.location = data.location || null;

  const product = await ProductService.updateProduct(req.params.id, updateData);
  sendSuccess(res, product, 'Product updated successfully');
}

export async function deleteProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  const existing = await ProductService.getProductById(req.params.id);

  if (!existing) {
    sendError(res, 'Product not found', 404);
    return;
  }

  await ProductService.softDeleteProduct(req.params.id);
  sendSuccess(res, null, 'Product deleted successfully');
}

export async function listStockMovements(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { productId, movementType, page, limit } = req.query;

  const result = await ProductService.listStockMovements({
    productId: productId as string | undefined,
    movementType: movementType as MovementType | undefined,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });

  sendSuccess(res, result);
}

export async function createStockMovement(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { productId, quantity, movementType, reason, reference } = req.body;

  try {
    const movement = await ProductService.createStockMovement(
      productId,
      parseInt(quantity),
      movementType as MovementType,
      req.user!.userId,
      reason,
      reference
    );

    sendSuccess(res, movement, 'Stock movement recorded', 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to record stock movement';
    sendError(res, message, 400);
  }
}

export async function getLowStock(req: AuthenticatedRequest, res: Response): Promise<void> {
  const products = await ProductService.getLowStockProducts();
  sendSuccess(res, products);
}
