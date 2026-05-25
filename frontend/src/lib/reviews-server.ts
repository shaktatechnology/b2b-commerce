import { cookies } from 'next/headers';
import type {
  CanReviewPayload,
  ProductReview,
  ProductReviewsPayload,
} from '@/src/types/review';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function serverGet<T>(path: string, token?: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export async function fetchProductReviewsServer(
  productSlugOrId: string
): Promise<ProductReviewsPayload> {
  const identifier = encodeURIComponent(decodeURIComponent(productSlugOrId));
  const json = await serverGet<{ data: ProductReviewsPayload }>(
    `/products/${identifier}/reviews`
  );

  return (
    json?.data ?? {
      product_id: '',
      summary: { count: 0, average_rating: 0 },
      reviews: [],
    }
  );
}

export async function fetchCanReviewServer(
  productSlugOrId: string
): Promise<CanReviewPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return {
      can_review: false,
      has_purchased: false,
      has_reviewed: false,
      existing_review_id: null,
    };
  }

  const identifier = encodeURIComponent(decodeURIComponent(productSlugOrId));
  const json = await serverGet<{ data: CanReviewPayload }>(
    `/products/${identifier}/reviews/can-review`,
    token
  );

  return (
    json?.data ?? {
      can_review: false,
      has_purchased: false,
      has_reviewed: false,
      existing_review_id: null,
    }
  );
}

export async function fetchMyReviewServer(
  productSlugOrId: string
): Promise<ProductReview | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;

  const identifier = encodeURIComponent(decodeURIComponent(productSlugOrId));
  const json = await serverGet<{ data: ProductReview | null }>(
    `/products/${identifier}/reviews/me`,
    token
  );

  return json?.data ?? null;
}
