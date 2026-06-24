import type { Discount } from './product';

export interface StorefrontCategory {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
}

export interface StorefrontProductVariant {
  id: string;
  variant_name: string;
  sku?: string;
  retail_price: string | number;
  wholesale_price?: string | number;
  stock?: number;
  weight?: string | number;
  image_url?: string | null;
  is_active?: boolean;
  color?: { id: string; name: string } | null;
  size?: { id: string; name: string } | null;
  discounts?: Discount[];
  moq?: number;
}

export interface StorefrontProductImage {
  id?: string;
  url: string;
  is_primary?: boolean;
  type?: 'image' | 'video';
}

export interface StorefrontProduct {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  is_active?: boolean;
  categories?: StorefrontCategory[];
  images?: StorefrontProductImage[];
  variants?: StorefrontProductVariant[];
  image_url?: string | null;
  color?: { id: string; name: string } | null;
  size?: { id: string; name: string } | null;
  weight?: string | null;
  discounts?: Discount[];
  long_description?: string | null;
  additional_info?: string | null;
  brand?: { id: string; name: string; slug: string; long_description?: string | null } | null;
  tags?: StorefrontTag[];
  reviews_avg_rating?: string | number | null;
  reviews_count?: number;
}

export interface StorefrontTag {
  id: string;
  name: string;
  slug: string;
}


export interface StorefrontSettings {
  logo: string | null;
  contactPhone: string;
  metaDescription: string;
  socialLinks: Record<string, string | null>;
}
