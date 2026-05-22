export interface Offer {
  id: string | number;
  title: string;
  description: string | null;
  image_url: string;
  placement: 'top' | 'mid' | 'page';
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  product_ids: string[] | null;
  created_at?: string;
  updated_at?: string;
}
