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

  // Collect images:
  // 1) Product-level media from product.images (Main Product Image Primary + Product Gallery Images/Videos)
  // 2) Variant-level media from product.variants (Color Family / variant images)
  const galleryMediaWithSource = useMemo(() => {
    const media: {
      url: string;
      type: "image" | "video";
      variantId: string | null;
      isProductGallery: boolean;
    }[] = [];

    (product.images ?? []).forEach((img) => {
      const url = resolveProductImageUrl(img.url);
      if (url && !media.some((i) => i.url === url)) {
        media.push({
          url,
          type: (img as any).type === "video" ? "video" : "image",
          variantId: null,
          isProductGallery: true,
        });
      }
    });

    if (media.length === 0 && product.image_url) {
      const primaryUrl = resolveProductImageUrl(product.image_url);
      if (primaryUrl) {
        media.push({
          url: primaryUrl,
          type: "image",
          variantId: null,
          isProductGallery: true,
        });
      }
    }

    // Append variant images (e.g. Color Family swatches) so selecting them renders the variant image in the main viewer
    (product.variants ?? []).forEach((v) => {
      const url = resolveProductImageUrl(v.image_url);
      if (url) {
        const existing = media.find((i) => i.url === url);
        if (existing) {
          if (!existing.variantId) {
            existing.variantId = String(v.id);
          }
        } else {
          media.push({
            url,
            type: "image",
            variantId: String(v.id),
            isProductGallery: false,
          });
        }
      }
    });

    return media;
  }, [product.images, product.image_url, product.variants]);

  const galleryItems = useMemo(
    () => galleryMediaWithSource.map((i) => ({ url: i.url, type: i.type })),
    [galleryMediaWithSource]
  );

  // Thumbnail strip ONLY shows product-level images (Primary + Product Gallery)
  const productOnlyGalleryItems = useMemo(
    () =>
      galleryMediaWithSource
        .filter((i) => i.isProductGallery)
        .map((i) => ({ url: i.url, type: i.type })),
    [galleryMediaWithSource]
  );

  const productGalleryCount = useMemo(
    () => galleryMediaWithSource.filter((i) => i.isProductGallery).length,
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
    if (selectedVariant?.image_url) {
      const resolvedUrl = resolveProductImageUrl(selectedVariant.image_url);
      // Search the full gallery for this variant's image (try exact URL match first)
      let idx = galleryItems.findIndex((i) => i.url === resolvedUrl);
      // Fallback: try matching by the raw path suffix in case of URL encoding differences
      if (idx === -1 && resolvedUrl) {
        const suffix = selectedVariant.image_url.replace(/^\//, '');
        idx = galleryItems.findIndex((i) => i.url.endsWith(suffix));
      }
      if (idx !== -1) {
        setActiveIndex(idx);
      }
    }
    // If variant has no image, don't reset gallery — stay on current slide
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
        thumbnailItems={productOnlyGalleryItems}
        totalGalleryCount={productGalleryCount}
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