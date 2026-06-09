export interface WholesalerRequest {
  id: number;
  business_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  product_category: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}
