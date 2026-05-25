export interface ReviewUser {
  id: string;
  name: string;
}

export interface ProductReview {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  message: string;
  created_at: string;
  updated_at: string;
  user?: ReviewUser;
}

export interface ReviewSummary {
  count: number;
  average_rating: number;
}

export interface ProductReviewsPayload {
  product_id: string;
  summary: ReviewSummary;
  reviews: ProductReview[];
}

export interface CanReviewPayload {
  can_review: boolean;
  has_purchased: boolean;
  has_reviewed: boolean;
  existing_review_id: string | null;
}
