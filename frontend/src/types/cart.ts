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
}

export interface CartDiscount {
  type: 'percent' | 'fixed';
  value: number | '';
  is_active: boolean;
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
    moq?: number;
    stock?: number;
    variant_name?: string;
    image_url?: string | null;
    discounts?: CartDiscount[];
  }[];
  images?: { url: string }[];
  brand?: { id: string; name: string; slug: string; long_description?: string | null } | null;
  discounts?: CartDiscount[];
}
