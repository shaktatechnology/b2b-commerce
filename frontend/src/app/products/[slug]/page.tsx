import { notFound } from "next/navigation";
import StorefrontLayout from "@/src/components/layouts/StorefrontLayout";
import ProductBreadcrumb from "@/src/components/product/ProductBreadcrumb";
import ProductMainArea from "@/src/components/product/ProductMainArea";
import ProductDetailSidebar from "@/src/components/product/ProductDetailSidebar";
import ProductDetailTabs from "@/src/components/product/ProductDetailTabs";
import ProductCarouselSection from "@/src/components/product/ProductCarouselSection";
import {
  fetchAllSettings,
  fetchCategories,
  fetchProductBySlug,
  fetchProducts,
  fetchOffers,
  countProductsByCategory,
  fetchCoupons,
  getRelatedProducts,
  getAlsoViewedProducts,
} from "@/src/lib/storefront-api";
import CouponsSection from "@/src/components/coupons/CouponsSection";
import {
  fetchCanReviewServer,
  fetchMyReviewServer,
  fetchProductReviewsServer,
} from "@/src/lib/reviews-server";
import type { CartProductInput } from "@/src/types/cart";
import { Offer } from "@/src/types/offer";


interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug).trim();

  const [product, categories, allProducts, { storefront }, reviewsData, canReview, myReview, allOffers, coupons] =
    await Promise.all([
      fetchProductBySlug(slug),
      fetchCategories(),
      fetchProducts(),
      fetchAllSettings(),
      fetchProductReviewsServer(slug),
      fetchCanReviewServer(slug),
      fetchMyReviewServer(slug),
      fetchOffers(),
      fetchCoupons(),
    ]);

  if (!product) {
    notFound();
  }

  const pageSpecificOffers = (allOffers || []).filter((offer: Offer) => 
    offer.placement === 'page' && 
    offer.is_active &&
    (offer.product_ids?.includes(product.id) || (product.brand?.id && offer.brand_id === product.brand?.id.toString()))
  );



  const productKey = product.slug?.trim() || product.id;
  const primaryCategory = product.categories?.[0];
  const categoriesWithCounts = countProductsByCategory(allProducts, categories);
  const similarProducts = getRelatedProducts(product, allProducts, 4);
  const relatedProducts = getRelatedProducts(product, allProducts, 8);
  const alsoViewed = getAlsoViewedProducts(product, allProducts, 8);

  const applicableCoupons = (coupons || []).filter((coupon: any) => {
    const hasProducts = coupon.products && coupon.products.length > 0;
    const hasCategories = coupon.categories && coupon.categories.length > 0;
    const hasBrands = coupon.brands && coupon.brands.length > 0;

    if (!hasProducts && !hasCategories && !hasBrands) {
      return true;
    }

    if (hasProducts && coupon.products.some((p: any) => String(p.id) === String(product.id))) {
      return true;
    }

    const brandId = product.brand?.id;
    if (hasBrands && brandId && coupon.brands.some((b: any) => String(b.id) === String(brandId))) {
      return true;
    }

    if (hasCategories && product.categories && product.categories.length > 0) {
      const productCatIds = product.categories.map((c: any) => String(c.id));
      if (coupon.categories.some((cat: any) => productCatIds.includes(String(cat.id)))) {
        return true;
      }
    }

    return false;
  });

  const cartProduct: CartProductInput = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    categories: product.categories,
    variants: product.variants,
    images: product.images,
  };
  // Removed getProductDisplayImages since ProductMainArea handles images internally.

  return (
    <StorefrontLayout categories={categories} settings={storefront}>
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-6 pb-16">
        <ProductBreadcrumb
          category={primaryCategory}
          productName={product.name}
        />

        <div className="flex flex-col xl:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <ProductMainArea 
              product={product}
              reviewCount={reviewsData.summary.count}
              averageRating={reviewsData.summary.average_rating}
            />

            {applicableCoupons.length > 0 && (
              <div className="my-2 border-t pt-4">
                <CouponsSection coupons={applicableCoupons} title="Available Coupons" showMoreLink={true} />
              </div>
            )}

            <ProductDetailTabs
              product={product}
              productSlug={productKey}
              reviewsData={reviewsData}
              canReview={canReview}
              myReview={myReview}
            />
            <ProductCarouselSection
              title="Related Product"
              products={relatedProducts}
            />
            <ProductCarouselSection
              title="Customer Also Viewed"
              products={alsoViewed}
            />
          </div>

          <ProductDetailSidebar
            categoriesWithCounts={categoriesWithCounts}
            similarProducts={similarProducts}
            offers={pageSpecificOffers}
          />

        </div>
      </div>
    </StorefrontLayout>
  );
}
