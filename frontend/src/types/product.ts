import { Category } from './category';

export interface Discount {
  id?: string;
  type: 'percent' | 'fixed';
  value: number | '';
  international_type?: 'percent' | 'fixed' | null;
  international_value?: number | '' | null;
  wholesale_type?: 'percent' | 'fixed' | null;
  wholesale_value?: number | '' | null;
  wholesale_international_type?: 'percent' | 'fixed' | null;
  wholesale_international_value?: number | '' | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

export interface ProductVariant {
  id?: string | number;
  variant_name: string;
  sku: string;
  retail_price: number;
  wholesale_price: number;
  international_price?: number | '' | null;
  moq: number;
  stock: number;
  weight?: string | number | null;
  color_id?: string | null;
  size_id?: string | null;
  is_active: boolean;
  image_url?: string;
  image?: File | null;
  discount?: Discount | null;
}

export interface ProductImage {
  id: string | number;
  url: string;
  type?: 'image' | 'video';
  is_primary: boolean;
  sort_order?: number;
}

export interface Product {
  id: string | number;
  name: string;
  slug: string;
  description?: string;
  long_description?: string;
  additional_info?: string;
  is_active: boolean;
  is_popular?: boolean;
  is_top_selling?: boolean;
  is_trending?: boolean;
  category_id?: string;
  brand_id?: string | null;
  color_id?: string | null;
  size_id?: string | null;
  weight?: string | null;
  categories?: Category[];
  tags?: Array<{ id: string | number; name: string; slug: string }>;
  image?: string;
  thumbnail?: string;
  image_url?: string;
  images?: ProductImage[];
  variants: ProductVariant[];
  discounts?: Discount[];
  reviews_avg_rating?: number | null;
  reviews_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  long_description: string;
  additional_info: string;
  is_active: boolean;
  is_popular?: boolean;
  is_top_selling?: boolean;
  is_trending?: boolean;
  category_ids: string[];
  tag_ids: string[];
  brand_id?: string | null;
  color_id?: string | null;
  size_id?: string | null;
  weight?: string | null;
  variants: ProductVariant[];
  image?: File | null;
  images?: ProductImage[];
  discount?: Discount | null;
}
