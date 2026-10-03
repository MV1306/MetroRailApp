import api from './axios';
import type { AuthResponse } from '../types';

export const login = (email: string, password: string) =>
  api.post<AuthResponse>('/auth/login', { email, password });

export const register = (fullName: string, email: string, password: string) =>
  api.post<AuthResponse>('/auth/register', { fullName, email, password });
