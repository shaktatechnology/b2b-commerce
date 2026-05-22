export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  image_url?: string;
  parent_id?: number | null;
  parent_name?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
