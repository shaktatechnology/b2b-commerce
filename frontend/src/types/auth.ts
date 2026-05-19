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
  role: string;
}

export interface LogoutResponse {
  message: string;
}
