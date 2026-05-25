export interface CartLineItem {
  productId: string;
  variantId: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image: string | null;
  seller: string;
}

export interface CartProductInput {
  id: string;
  name: string;
  slug?: string;
  categories?: { id: string; name: string; slug?: string }[];
  variants?: {
    id: string;
    retail_price: string | number;
    variant_name?: string;
    image_url?: string | null;
  }[];
  images?: { url: string }[];
}
