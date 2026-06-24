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
  const galleryMediaWithSource = useMemo(() => {
    const media: { url: string; type: 'image' | 'video'; variantId: string | null }[] = [];

    (product.images ?? []).forEach((img) => {
      const url = resolveProductImageUrl(img.url);
      if (url && !media.some(i => i.url === url)) {
        media.push({ url, type: (img as any).type === 'video' ? 'video' : 'image', variantId: null });
      }
    });

    (product.variants ?? []).forEach((v) => {
      const url = resolveProductImageUrl(v.image_url);
      if (url && !media.some(i => i.url === url)) {
        media.push({ url, type: 'image', variantId: String(v.id) });
      } else if (url) {
        const existing = media.find(i => i.url === url);
        if (existing && !existing.variantId) {
            existing.variantId = String(v.id);
        }
      }
    });

    return media;
  }, [product.images, product.variants]);

  const galleryItems = galleryMediaWithSource.map(i => ({ url: i.url, type: i.type }));
  const [activeIndex, setActiveIndex] = useState(0);

  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId);
    const selectedVariant = activeVariants.find((v) => v.id === variantId);
    if (selectedVariant && selectedVariant.image_url) {
      const url = resolveProductImageUrl(selectedVariant.image_url);
      const index = galleryItems.findIndex(i => i.url === url);
      if (index !== -1) {
        setActiveIndex(index);
      }
    }
  };

  const handleImageChange = (index: number) => {
    setActiveIndex(index);
    const source = galleryMediaWithSource[index];
    if (source && source.variantId) {
      setSelectedVariantId(source.variantId);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
      <ProductGallery
        items={galleryItems}
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
