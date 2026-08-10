import { api } from './api';
import { User } from '../types';

export interface LoginResponse {
  token: string;
  user: User;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post<{ success: boolean; data: LoginResponse }>('/auth/login', {
    email,
    password,
  });
  return res.data.data!;
}

export async function getMe(): Promise<User> {
  const res = await api.get<{ success: boolean; data: User }>('/auth/me');
  return res.data.data!;
}
