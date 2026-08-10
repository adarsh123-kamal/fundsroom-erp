import { api } from './api';
import { Customer, CustomerFollowUp, PaginatedData } from '../types';

export interface CustomerFilters {
  search?: string;
  status?: string;
  customerType?: string;
  page?: number;
  limit?: number;
}

export async function getCustomers(filters: CustomerFilters = {}) {
  const res = await api.get<{ success: boolean; data: PaginatedData<Customer> }>('/customers', {
    params: filters,
  });
  return res.data.data!;
}

export async function getCustomer(id: string) {
  const res = await api.get<{ success: boolean; data: Customer & { followUps: CustomerFollowUp[] } }>(
    `/customers/${id}`
  );
  return res.data.data!;
}

export async function createCustomer(data: Partial<Customer>) {
  const res = await api.post<{ success: boolean; data: Customer }>('/customers', data);
  return res.data.data!;
}

export async function updateCustomer(id: string, data: Partial<Customer>) {
  const res = await api.put<{ success: boolean; data: Customer }>(`/customers/${id}`, data);
  return res.data.data!;
}

export async function deleteCustomer(id: string) {
  await api.delete(`/customers/${id}`);
}

export async function addFollowUp(customerId: string, note: string, followUpDate?: string) {
  const res = await api.post<{ success: boolean; data: CustomerFollowUp }>(
    `/customers/${customerId}/followups`,
    { note, followUpDate }
  );
  return res.data.data!;
}

export async function getFollowUps(customerId: string) {
  const res = await api.get<{ success: boolean; data: CustomerFollowUp[] }>(
    `/customers/${customerId}/followups`
  );
  return res.data.data!;
}
