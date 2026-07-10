export type Market = 'NP' | 'INT';
export type Currency = 'NPR' | 'USD';
export type DiscountType = 'percentage' | 'fixed';
export type CouponStatus = 'active' | 'inactive';

export interface CouponRegionRule {
  market: Market;
  currency: Currency;
  discount_type: DiscountType;
  discount_value: number;
  minimum_subtotal?: number | null;
  maximum_discount?: number | null;
  free_shipping?: boolean | null;
}

export interface Coupon {
  id: string;
  name: string;
  code?: string; // display code, if backend echoes it back on show/index
  customer_code?: string | null;
  description?: string | null;
  status: CouponStatus;
  starts_at?: string | null;
  expires_at?: string | null;
  usage_limit?: number | null;
  usage_per_user?: number | null;
  stackable?: boolean | null;
  first_order_only?: boolean | null;
  customer_type?: string | null;
  product_ids?: string[] | null;
  category_ids?: string[] | null;
  brand_ids?: string[] | null;
  user_ids?: string[] | null;
  region_rules: CouponRegionRule[];
  used_count?: number;
  created_at?: string;
  updated_at?: string;
}

// Payload shared by create + update. Update makes every field optional.
export interface CouponPayload {
  name: string;
  customer_code?: string | null;
  description?: string | null;
  status?: CouponStatus | null;
  starts_at?: string | null;
  expires_at?: string | null;
  usage_limit?: number | null;
  usage_per_user?: number | null;
  stackable?: boolean | null;
  first_order_only?: boolean | null;
  customer_type?: string | null;
  product_ids?: string[] | null;
  category_ids?: string[] | null;
  brand_ids?: string[] | null;
  user_ids?: string[] | null;
  region_rules: CouponRegionRule[];
}

export interface CouponRedemption {
  id: string;
  order_id?: string;
  user_id?: string;
  user_name?: string;
  discount_applied?: number;
  redeemed_at?: string;
  [key: string]: unknown;
}

// Minimal shape used by the relation pickers (products / categories / brands / users)
export interface RelationOption {
  id: string;
  label: string;
  meta?: string;
}