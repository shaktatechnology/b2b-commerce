export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: number | null;
  parent_name?: string;
  created_at?: string;
  updated_at?: string;
}
