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
}

export interface StorefrontProductImage {
  id?: string;
  url: string;
  is_primary?: boolean;
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
}

export interface StorefrontSettings {
  logo: string | null;
  contactPhone: string;
  metaDescription: string;
  socialLinks: Record<string, string | null>;
}
