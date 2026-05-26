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
  countProductsByCategory,
  getRelatedProducts,
  getAlsoViewedProducts,
} from "@/src/lib/storefront-api";
import {
  fetchCanReviewServer,
  fetchMyReviewServer,
  fetchProductReviewsServer,
} from "@/src/lib/reviews-server";
import { getProductDisplayImages } from "@/src/lib/product-utils";
import type { CartProductInput } from "@/src/types/cart";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug).trim();

  const [product, categories, allProducts, { storefront }, reviewsData, canReview, myReview] =
    await Promise.all([
      fetchProductBySlug(slug),
      fetchCategories(),
      fetchProducts(),
      fetchAllSettings(),
      fetchProductReviewsServer(slug),
      fetchCanReviewServer(slug),
      fetchMyReviewServer(slug),
    ]);

  if (!product) {
    notFound();
  }

  const productKey = product.slug?.trim() || product.id;
  const primaryCategory = product.categories?.[0];
  const categoriesWithCounts = countProductsByCategory(allProducts, categories);
  const similarProducts = getRelatedProducts(product, allProducts, 4);
  const relatedProducts = getRelatedProducts(product, allProducts, 8);
  const alsoViewed = getAlsoViewedProducts(product, allProducts, 8);

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
          />
        </div>
      </div>
    </StorefrontLayout>
  );
}
