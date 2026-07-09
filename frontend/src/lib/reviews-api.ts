import { apiFetch } from './api';
import { getAuthToken } from './auth';
import type {
  CanReviewPayload,
  ProductReview,
  ProductReviewsPayload,
} from '@/src/types/review';

export async function fetchProductReviews(
  productSlugOrId: string
): Promise<ProductReviewsPayload> {
  const identifier = encodeURIComponent(decodeURIComponent(productSlugOrId));
  const res = await apiFetch<{ data: ProductReviewsPayload }>(
    `/products/${identifier}/reviews`
  );
  return res.data;
}

export async function fetchCanReview(
  productSlugOrId: string
): Promise<CanReviewPayload> {
  const token = getAuthToken();
  if (!token) {
    return {
      can_review: false,
      has_purchased: false,
      has_reviewed: false,
      existing_review_id: null,
    };
  }

  const identifier = encodeURIComponent(decodeURIComponent(productSlugOrId));
  const res = await apiFetch<{ data: CanReviewPayload }>(
    `/products/${identifier}/reviews/can-review`,
    { token }
  );
  return res.data;
}

export async function fetchMyReview(
  productSlugOrId: string
): Promise<ProductReview | null> {
  const token = getAuthToken();
  if (!token) return null;

  const identifier = encodeURIComponent(decodeURIComponent(productSlugOrId));
  try {
    const res = await apiFetch<{ data: ProductReview | null }>(
      `/products/${identifier}/reviews/me`,
      { token }
    );
    return res.data ?? null;
  } catch {
    return null;
  }
}

export async function submitReview(
  productSlugOrId: string,
  payload: { rating: number; message: string }
): Promise<ProductReview> {
  const token = getAuthToken();
  if (!token) throw new Error('Please log in to leave a review.');

  const identifier = encodeURIComponent(decodeURIComponent(productSlugOrId));
  const res = await apiFetch<{ data: ProductReview }>(
    `/products/${identifier}/reviews`,
    {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    }
  );
  return res.data;
}

export async function updateReview(
  productSlugOrId: string,
  reviewId: string,
  payload: { rating: number; message: string }
): Promise<ProductReview> {
  const token = getAuthToken();
  if (!token) throw new Error('Please log in to update your review.');

  const identifier = encodeURIComponent(decodeURIComponent(productSlugOrId));
  const res = await apiFetch<{ data: ProductReview }>(
    `/products/${identifier}/reviews/${reviewId}`,
    {
      method: 'PUT',
      token,
      body: JSON.stringify(payload),
    }
  );
  return res.data;
}

export async function destroyReview(
  productSlugOrId: string,
  reviewId: string
): Promise<{ message: string }> {
  const token = getAuthToken();
  if (!token) throw new Error('Please log in to delete your review.');

  const identifier = encodeURIComponent(decodeURIComponent(productSlugOrId));
  const res = await apiFetch<{ message: string }>(
    `/products/${identifier}/reviews/${reviewId}`,
    {
      method: 'DELETE',
      token,
    }
  );
  return res;
}

