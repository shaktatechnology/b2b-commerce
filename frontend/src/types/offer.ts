export type Offer = {
  id: string;
  title: string;
  description?: string | null;
  image: string;
  image_url?: string | null;
  placement: "top" | "mid" | "page";
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at?: string | null;
  product_ids?: string[] | null;
  brand_id?: string | null;
};

export type OfferFormData = {
  title: string;
  description: string;
  placement: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
  product_ids: string[];
  brand_id?: string | null;
};
