import { api } from './api';
import { Product, StockMovement, PaginatedData } from '../types';

export interface ProductFilters {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export async function getProducts(filters: ProductFilters = {}) {
  const res = await api.get<{ success: boolean; data: PaginatedData<Product> }>('/products', {
    params: filters,
  });
  return res.data.data!;
}

export async function getProduct(id: string) {
  const res = await api.get<{ success: boolean; data: Product }>(`/products/${id}`);
  return res.data.data!;
}

export async function createProduct(data: Partial<Product>) {
  const res = await api.post<{ success: boolean; data: Product }>('/products', data);
  return res.data.data!;
}

export async function updateProduct(id: string, data: Partial<Product>) {
  const res = await api.put<{ success: boolean; data: Product }>(`/products/${id}`, data);
  return res.data.data!;
}

export async function deleteProduct(id: string) {
  await api.delete(`/products/${id}`);
}

export interface MovementFilters {
  productId?: string;
  movementType?: string;
  page?: number;
  limit?: number;
}

export async function getStockMovements(filters: MovementFilters = {}) {
  const res = await api.get<{ success: boolean; data: PaginatedData<StockMovement> }>(
    '/stock/movements',
    { params: filters }
  );
  return res.data.data!;
}

export async function createStockMovement(data: {
  productId: string;
  quantity: number;
  movementType: 'IN' | 'OUT';
  reason?: string;
  reference?: string;
}) {
  const res = await api.post<{ success: boolean; data: StockMovement }>('/stock/movements', data);
  return res.data.data!;
}

export async function getLowStockProducts() {
  const res = await api.get<{ success: boolean; data: unknown[] }>('/stock/low-stock');
  return res.data.data!;
}
