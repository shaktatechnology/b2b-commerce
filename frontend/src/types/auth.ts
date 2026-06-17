export interface AuthUser {
  id: string;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at?: string;
  updated_at?: string;
  role: string;
  google_id?: string | null;
  phone?: string | null;
  company_name?: string | null;
  address?: string | null;
  is_verified?: boolean;
  wholeseller_status?: string | null;
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
