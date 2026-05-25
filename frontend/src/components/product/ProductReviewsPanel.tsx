"use client";

import { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { toast } from "sonner";
import type {
  CanReviewPayload,
  ProductReview,
  ProductReviewsPayload,
} from "@/src/types/review";
import {
  submitReview,
  updateReview,
} from "@/src/lib/reviews-api";
import { getAuthToken } from "@/src/lib/auth";

interface ProductReviewsPanelProps {
  productSlug: string;
  initialData: ProductReviewsPayload;
  initialCanReview: CanReviewPayload;
  initialMyReview: ProductReview | null;
}

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={readonly ? "cursor-default" : "cursor-pointer"}
          aria-label={`${star} star`}
        >
          <Star
            size={20}
            className={
              star <= value
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }
          />
        </button>
      ))}
    </div>
  );
}

function formatReviewDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ProductReviewsPanel({
  productSlug,
  initialData,
  initialCanReview,
  initialMyReview,
}: ProductReviewsPanelProps) {
  const [reviewsData, setReviewsData] = useState(initialData);
  const [canReview, setCanReview] = useState(initialCanReview);
  const [myReview, setMyReview] = useState(initialMyReview);
  const [rating, setRating] = useState(initialMyReview?.rating ?? 5);
  const [message, setMessage] = useState(initialMyReview?.message ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const isLoggedIn = typeof document !== "undefined" && !!getAuthToken();

  const handleSubmit = async () => {
    if (message.trim().length < 10) {
      toast.error("Review message must be at least 10 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (myReview && isEditing) {
        const updated = await updateReview(productSlug, myReview.id, {
          rating,
          message: message.trim(),
        });
        setMyReview(updated);
        setReviewsData((prev) => ({
          ...prev,
          reviews: prev.reviews.map((r) =>
            r.id === updated.id ? updated : r
          ),
        }));
        setIsEditing(false);
        toast.success("Review updated.");
      } else {
        const created = await submitReview(productSlug, {
          rating,
          message: message.trim(),
        });
        setMyReview(created);
        setReviewsData((prev) => ({
          ...prev,
          reviews: [created, ...prev.reviews],
          summary: {
            count: prev.summary.count + 1,
            average_rating:
              prev.summary.count === 0
                ? created.rating
                : Math.round(
                    ((prev.summary.average_rating * prev.summary.count +
                      created.rating) /
                      (prev.summary.count + 1)) *
                      10
                  ) / 10,
          },
        }));
        setCanReview({
          can_review: false,
          has_purchased: true,
          has_reviewed: true,
          existing_review_id: created.id,
        });
        setMessage("");
        toast.success("Thank you for your review!");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not submit review."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {reviewsData.summary.count > 0 && (
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <StarRating
            value={Math.round(reviewsData.summary.average_rating)}
            readonly
          />
          <span>
            {reviewsData.summary.average_rating} out of 5 ·{" "}
            {reviewsData.summary.count}{" "}
            {reviewsData.summary.count === 1 ? "review" : "reviews"}
          </span>
        </div>
      )}

      {!isLoggedIn && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
          <Link href={`/login?redirect=/products/${encodeURIComponent(productSlug)}`} className="text-primary font-medium hover:underline">
            Log in
          </Link>{" "}
          to leave a review after you have completed a purchase.
        </div>
      )}

      {isLoggedIn && canReview.can_review && !myReview && (
        <div className="rounded-lg border border-gray-200 p-4 space-y-4 bg-gray-50">
          <h4 className="font-medium text-gray-900">Write a review</h4>
          <p className="text-xs text-gray-500">
            You purchased this product. Share your experience (one review per
            product).
          </p>
          <div>
            <p className="text-sm text-gray-600 mb-1">Your rating</p>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Describe your experience with this product…"
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary text-white text-sm font-medium px-5 py-2 rounded hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? "Submitting…" : "Submit review"}
          </button>
        </div>
      )}

      {isLoggedIn && !canReview.can_review && !myReview && (
        <p className="text-sm text-gray-500 rounded-lg border border-gray-100 p-4 bg-gray-50">
          {canReview.has_reviewed
            ? "You have already reviewed this product."
            : canReview.has_purchased
              ? "You cannot submit another review for this product."
              : "You can review this product after completing a paid purchase."}
        </p>
      )}

      {myReview && (
        <div className="rounded-lg border border-primary/20 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-sm text-primary">Your review</p>
            {!isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setRating(myReview.rating);
                  setMessage(myReview.message);
                }}
                className="text-xs text-gray-500 hover:text-primary"
              >
                Edit
              </button>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-3">
              <StarRating value={rating} onChange={setRating} />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-primary text-white text-sm px-4 py-1.5 rounded"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-sm text-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <StarRating value={myReview.rating} readonly />
              <p className="text-sm text-gray-700">{myReview.message}</p>
            </>
          )}
        </div>
      )}

      <ul className="space-y-4">
        {reviewsData.reviews.length === 0 ? (
          <li className="text-sm text-gray-500">No reviews yet.</li>
        ) : (
          reviewsData.reviews.map((review) => (
            <li
              key={review.id}
              className="border-b border-gray-100 pb-4 last:border-0"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-medium text-sm text-gray-900">
                  {review.user?.name ?? "Customer"}
                </p>
                <span className="text-xs text-gray-400">
                  {formatReviewDate(review.created_at)}
                </span>
              </div>
              <StarRating value={review.rating} readonly />
              <p className="text-sm text-gray-700 mt-2">{review.message}</p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
