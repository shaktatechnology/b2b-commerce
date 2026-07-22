export interface CartLineItem {
  productId: string;
  variantId: string;
  name: string;
  category: string;
  price: number;
  discount?: number;
  quantity: number;
  image: string | null;
  seller: string;
  moq?: number;
  stock?: number;
  currency?: string;
  is_active?: boolean;
  prices?: {
    NPR: number;
    USD: number;
  };
  discounts?: {
    NPR: number;
    USD: number;
  };
  isUnavailable?: boolean;
  brandId?: string | null;
  categoryIds?: string[];
  variantName?: string;
}

export interface CartDiscount {
  type: 'percent' | 'fixed';
  value: number | '';
  international_type?: 'percent' | 'fixed' | null;
  international_value?: number | '' | null;
  wholesale_type?: 'percent' | 'fixed' | null;
  wholesale_value?: number | '' | null;
  wholesale_international_type?: 'percent' | 'fixed' | null;
  wholesale_international_value?: number | '' | null;
  is_active: boolean;
}

export interface CartProductImageInput {
  url?: string;
  image_path?: string;
  is_primary?: boolean;
  type?: 'image' | 'video';
}

export interface CartProductInput {
  id: string;
  name: string;
  slug?: string;
  categories?: { id: string; name: string; slug?: string }[];
  variants?: {
    id: string;
    retail_price: string | number;
    wholesale_price?: string | number;
    international_price?: string | number;
    international_wholesale_price?: string | number;
    moq?: number;
    stock?: number;
    variant_name?: string;
    image_url?: string | null;
    discounts?: CartDiscount[];
  }[];
  image?: string;
  thumbnail?: string;
  image_url?: string | null;
  images?: CartProductImageInput[];
  brand?: { id: string; name: string; slug: string; long_description?: string | null } | null;
  discounts?: CartDiscount[];
  reviews_avg_rating?: string | number | null;
  reviews_count?: number;
}