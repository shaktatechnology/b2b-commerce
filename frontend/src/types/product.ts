import { Category } from './category';

export interface ProductVariant {
  id?: string | number;
  variant_name: string;
  sku: string;
  retail_price: number;
  wholesale_price: number;
  moq: number;
  stock: number;
  weight: number;
  is_active: boolean;
}

export interface Product {
  id: string | number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  category_id?: string;
  categories?: Category[];
  image?: string;
  thumbnail?: string;
  image_url?: string;
  images?: Array<{ id: string | number; image_path: string }>;
  variants: ProductVariant[];
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  category_ids: string[];
  variants: ProductVariant[];
  image?: File | null;
}
