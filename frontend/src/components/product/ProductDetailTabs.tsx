"use client";

import { useState } from "react";
import type { StorefrontProduct } from "@/src/types/storefront";
import type {
  CanReviewPayload,
  ProductReview,
  ProductReviewsPayload,
} from "@/src/types/review";
import ProductReviewsPanel from "./ProductReviewsPanel";

interface ProductDetailTabsProps {
  product: StorefrontProduct;
  productSlug: string;
  reviewsData: ProductReviewsPayload;
  canReview: CanReviewPayload;
  myReview: ProductReview | null;
}

export default function ProductDetailTabs({
  product,
  productSlug,
  reviewsData,
  canReview,
  myReview,
}: ProductDetailTabsProps) {
  const reviewCount = reviewsData.summary.count;
  const tabs = [
    { id: "description" as const, label: "Description" },
    { id: "additional" as const, label: "Additional Info" },
    { id: "brand" as const, label: "Brand" },
    {
      id: "reviews" as const,
      label: `Reviews (${reviewCount})`,
    },
  ];

  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("description");
  const variants = product.variants ?? [];

  return (
    <section className="mt-10 border-t border-gray-200 pt-8">
      <div className="flex flex-wrap gap-4 sm:gap-8 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`pb-3 text-sm font-medium transition-colors ${
              active === tab.id
                ? "text-primary border-b-2 border-primary -mb-px"
                : "text-gray-500 hover:text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="py-6 text-sm text-gray-700 leading-relaxed space-y-4">
        {active === "description" && (
          <>
            {product.description ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              <p>No description available for this product.</p>
            )}
            <ul className="list-disc pl-5 space-y-1">
              <li>Category: {product.categories?.[0]?.name ?? "General"}</li>
              {variants.map((v) => (
                <li key={v.id}>
                  {v.variant_name}: Rs.
                  {parseFloat(String(v.retail_price)).toFixed(0)} — SKU{" "}
                  {v.sku ?? "N/A"}
                </li>
              ))}
            </ul>
          </>
        )}

        {active === "additional" && (
          <ul className="space-y-2">
            {variants.map((v) => (
              <li
                key={v.id}
                className="flex justify-between max-w-md border-b border-gray-100 py-2 gap-4"
              >
                <span>{v.variant_name}</span>
                <span className="text-right text-gray-500">
                  Weight: {v.weight ?? "—"} | Stock: {v.stock ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        )}

        {active === "brand" && (
          <p>
            Distributed by{" "}
            <span className="text-primary font-medium">Store</span>. Contact
            support for brand partnership inquiries.
          </p>
        )}

        {active === "reviews" && (
          <ProductReviewsPanel
            productSlug={productSlug}
            initialData={reviewsData}
            initialCanReview={canReview}
            initialMyReview={myReview}
          />
        )}
      </div>
    </section>
  );
}
