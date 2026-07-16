"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  const searchParams = useSearchParams();
  const variantParam = searchParams.get("variant");

  const activeVariants = useMemo(
    () => (product.variants ?? []).filter((v) => v.is_active !== false),
    [product.variants]
  );

  // Collect images keeping track of their source variant if any
  const galleryMediaWithSource = useMemo(() => {
    const media: { url: string; type: "image" | "video"; variantId: string | null }[] = [];

    (product.images ?? []).forEach((img) => {
      const url = resolveProductImageUrl(img.url);
      if (url && !media.some((i) => i.url === url)) {
        media.push({
          url,
          type: (img as any).type === "video" ? "video" : "image",
          variantId: null,
        });
      }
    });

    (product.variants ?? []).forEach((v) => {
      const url = resolveProductImageUrl(v.image_url);
      if (url && !media.some((i) => i.url === url)) {
        media.push({ url, type: "image", variantId: String(v.id) });
      } else if (url) {
        const existing = media.find((i) => i.url === url);
        if (existing && !existing.variantId) {
          existing.variantId = String(v.id);
        }
      }
    });

    return media;
  }, [product.images, product.variants]);

  const galleryItems = useMemo(
    () => galleryMediaWithSource.map((i) => ({ url: i.url, type: i.type })),
    [galleryMediaWithSource]
  );

  const [selectedVariantId, setSelectedVariantId] = useState(() => {
    if (variantParam) {
      const found = activeVariants.find((v) => String(v.id) === String(variantParam));
      if (found) return String(found.id);
    }
    return activeVariants[0]?.id ?? "";
  });

  // Whether the current selectedVariantId reflects an actual explicit pick
  // (a swatch click, a variant-tagged gallery thumbnail, or a deep link) as
  // opposed to just the arbitrary "first variant" fallback used for pricing
  // before the user has interacted. The purchase panel uses this to decide
  // whether a swatch should visually look selected.
  const [variantExplicitlySelected, setVariantExplicitlySelected] = useState(() =>
    Boolean(
      variantParam && activeVariants.some((v) => String(v.id) === String(variantParam))
    )
  );

  const [activeIndex, setActiveIndex] = useState(0);

  // Sync state if variant collection changes or param changes
  useEffect(() => {
    if (variantParam) {
      const found = activeVariants.find((v) => String(v.id) === String(variantParam));
      if (found) {
        const vId = String(found.id);
        setSelectedVariantId(vId);
        setVariantExplicitlySelected(true);

        // Also update gallery index if variant has image
        if (found.image_url) {
          const url = resolveProductImageUrl(found.image_url);
          const index = galleryItems.findIndex((i) => i.url === url);
          if (index !== -1) {
            setActiveIndex(index);
          }
        }
      }
    }
  }, [variantParam, activeVariants, galleryItems]);

  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId);
    setVariantExplicitlySelected(true);
    const selectedVariant = activeVariants.find((v) => v.id === variantId);
    if (selectedVariant && selectedVariant.image_url) {
      const url = resolveProductImageUrl(selectedVariant.image_url);
      const index = galleryItems.findIndex((i) => i.url === url);
      if (index !== -1) {
        setActiveIndex(index);
      }
    }
  };

  const handleImageChange = (index: number) => {
    setActiveIndex(index);
    const source = galleryMediaWithSource[index];
    if (source && source.variantId) {
      // This thumbnail belongs to a specific variant — treat viewing it as
      // picking that variant.
      setSelectedVariantId(source.variantId);
      setVariantExplicitlySelected(true);
    } else {
      // Back on a general/primary product photo that isn't tied to any one
      // variant — don't let a swatch keep looking "selected" while it's on
      // screen, even though selectedVariantId still holds a value for
      // pricing/stock purposes underneath.
      setVariantExplicitlySelected(false);
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
        showVariantAsSelected={variantExplicitlySelected}
      />
    </div>
  );
}