"use client";

import { useMemo, useState } from "react";
import { resolveProductImageUrl } from "@/src/lib/product-utils";
import ProductGallery from "./ProductGallery";
import ProductPurchasePanel from "./ProductPurchasePanel";
import type { StorefrontProduct } from "@/src/types/storefront";

interface ProductMainAreaProps {
  product: StorefrontProduct;
  reviewCount?: number;
  averageRating?: number;
}

export default function ProductMainArea({
  product,
  reviewCount = 0,
  averageRating = 0,
}: ProductMainAreaProps) {
  const activeVariants = useMemo(
    () => (product.variants ?? []).filter((v) => v.is_active !== false),
    [product.variants]
  );

  const [selectedVariantId, setSelectedVariantId] = useState(
    activeVariants[0]?.id ?? ""
  );

  // Collect images keeping track of their source variant if any
  const galleryImagesWithSource = useMemo(() => {
    const images: { url: string; variantId: string | null }[] = [];

    (product.images ?? []).forEach((img) => {
      const url = resolveProductImageUrl(img.url);
      if (url && !images.some(i => i.url === url)) {
        images.push({ url, variantId: null });
      }
    });

    (product.variants ?? []).forEach((v) => {
      const url = resolveProductImageUrl(v.image_url);
      if (url && !images.some(i => i.url === url)) {
        images.push({ url, variantId: String(v.id) });
      } else if (url) {
        // if image is already there, maybe map variantId if it was null?
        const existing = images.find(i => i.url === url);
        if (existing && !existing.variantId) {
            existing.variantId = String(v.id);
        }
      }
    });

    return images;
  }, [product.images, product.variants]);

  const galleryImageUrls = galleryImagesWithSource.map(i => i.url);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId);
    const selectedVariant = activeVariants.find((v) => v.id === variantId);
    if (selectedVariant && selectedVariant.image_url) {
      const url = resolveProductImageUrl(selectedVariant.image_url);
      const index = galleryImageUrls.indexOf(url || '');
      if (index !== -1) {
        setActiveIndex(index);
      }
    }
  };

  const handleImageChange = (index: number) => {
    setActiveIndex(index);
    const source = galleryImagesWithSource[index];
    if (source && source.variantId) {
      setSelectedVariantId(source.variantId);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
      <ProductGallery
        images={galleryImageUrls}
        productName={product.name}
        activeIndex={activeIndex}
        onChangeImage={handleImageChange}
      />
      <ProductPurchasePanel
        product={product}
        reviewCount={reviewCount}
        averageRating={averageRating}
        selectedVariantId={selectedVariantId}
        onVariantChange={handleVariantChange}
      />
    </div>
  );
}
