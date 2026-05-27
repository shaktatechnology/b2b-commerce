import { apiFetch } from './api';
import { AuthUser, LoginResponse, LogoutResponse } from '@/src/types';

const TOKEN_COOKIE = 'auth-token';

/** Store token in a cookie so Next.js middleware can read it server-side */
export function setAuthCookie(token: string) {
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearAuthCookie() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
}

export function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const res = await apiFetch<any>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  const transformedRes: LoginResponse = {
    message: res.message,
    data: res.data.user,
    access_token: res.data.access_token,
    token_type: res.data.token_type,
    role: res.data.user.role,
  };
  
  
  setAuthCookie(transformedRes.access_token);
  document.cookie = `role=${transformedRes.role}; path=/; SameSite=Lax`;

  return transformedRes;
}

export function getUserRole(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )role=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function logoutApi(): Promise<void> {
  const token = getAuthToken();
  if (token) {
    try {
      await apiFetch<LogoutResponse>('/logout', {
        method: 'POST',
        token,
      });
    } catch {
      // Even if the API call fails we still clear the local session
    }
  }
  clearAuthCookie();
}

export async function updateProfile(payload: {
  name: string;
  email: string;
  phone?: string | null;
  company_name?: string | null;
  address?: string | null;
  password?: string | null;
  password_confirmation?: string | null;
}): Promise<void> {
  const token = getAuthToken();
  await apiFetch('/profile', {
    method: 'PUT',
    token: token || undefined,
    body: JSON.stringify(payload),
  });
}
