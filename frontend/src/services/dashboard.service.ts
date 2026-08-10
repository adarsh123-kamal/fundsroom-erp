import { api } from './api';
import { DashboardStats } from '../types';

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await api.get<{ success: boolean; data: DashboardStats }>('/dashboard/stats');
  return res.data.data!;
}
