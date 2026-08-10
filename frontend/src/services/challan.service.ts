import { api } from './api';
import { Challan, PaginatedData, ChallanStatus } from '../types';

export interface ChallanFilters {
  status?: ChallanStatus;
  customerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getChallans(filters: ChallanFilters = {}) {
  const res = await api.get<{ success: boolean; data: PaginatedData<Challan> }>('/challans', {
    params: filters,
  });
  return res.data.data!;
}

export async function getChallan(id: string) {
  const res = await api.get<{ success: boolean; data: Challan }>(`/challans/${id}`);
  return res.data.data!;
}

export async function createChallan(data: {
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
  notes?: string;
}) {
  const res = await api.post<{ success: boolean; data: Challan }>('/challans', data);
  return res.data.data!;
}

export async function updateChallan(
  id: string,
  data: {
    customerId?: string;
    items?: Array<{ productId: string; quantity: number }>;
    notes?: string;
  }
) {
  const res = await api.put<{ success: boolean; data: Challan }>(`/challans/${id}`, data);
  return res.data.data!;
}

export async function confirmChallan(id: string) {
  const res = await api.post<{ success: boolean; data: Challan }>(`/challans/${id}/confirm`);
  return res.data.data!;
}

export async function cancelChallan(id: string) {
  const res = await api.post<{ success: boolean; data: Challan }>(`/challans/${id}/cancel`);
  return res.data.data!;
}
