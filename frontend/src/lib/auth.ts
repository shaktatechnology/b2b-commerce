import { apiFetch } from './api';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  role?: string; // e.g. 'admin' | 'wholeseller' | 'user'
}

export interface LoginResponse {
  message: string;
  data: AuthUser;
  access_token: string;
  token_type: string;
}

interface LogoutResponse {
  message: string;
}

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
    token_type: res.data.token_type
  };
  
  setAuthCookie(transformedRes.access_token);
  return transformedRes;
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
