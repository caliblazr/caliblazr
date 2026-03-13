import type { User } from '../types';

export const getToken = (): string | null => localStorage.getItem('lifesync_token');

export const getUser = (): User | null => {
  const raw = localStorage.getItem('lifesync_user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

export const setAuth = (token: string, user: User): void => {
  localStorage.setItem('lifesync_token', token);
  localStorage.setItem('lifesync_user', JSON.stringify(user));
};

export const clearAuth = (): void => {
  localStorage.removeItem('lifesync_token');
  localStorage.removeItem('lifesync_user');
};

export const isAuthenticated = (): boolean => !!getToken() && !!getUser();
