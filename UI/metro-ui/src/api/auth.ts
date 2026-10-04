import api from './axios';
import type { AuthResponse, UserProfile } from '../types';

export const login = (email: string, password: string) =>
  api.post<AuthResponse>('/auth/login', { email, password });

export const register = (fullName: string, email: string, password: string) =>
  api.post<AuthResponse>('/auth/register', { fullName, email, password });

export const verifyMfa = (userId: string, code: string) =>
  api.post<AuthResponse>(`/auth/mfa/verify?userId=${userId}`, { code });

export const disableMfa = () =>
  api.post('/auth/mfa/disable');

export const getMfaStatus = () =>
  api.get<{ enabled: boolean }>('/auth/mfa/status');

export const getMfaSetup = () =>
  api.get<{ sharedKey: string; authenticatorUri: string }>('/auth/mfa/setup');

export const enableMfa = (code: string) =>
  api.post('/auth/mfa/enable', { code });

export const getProfile = () =>
  api.get<UserProfile>('/auth/profile');

export const updateProfile = (fullName: string) =>
  api.put<UserProfile>('/auth/profile', { fullName });

export const changePassword = (currentPassword: string, newPassword: string) =>
  api.post('/auth/change-password', { currentPassword, newPassword });
