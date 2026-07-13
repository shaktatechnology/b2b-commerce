import StorefrontLayout from "@/src/components/layouts/StorefrontLayout";
import ProductListingClient from "@/src/components/products/ProductListingClient";
import {
  fetchAllSettings,
  fetchCategories,
  fetchProducts,
  fetchOffers,
  fetchTags,
} from "@/src/lib/storefront-api";

interface PageProps {
  searchParams: Promise<{
    category?: string;
    offer_id?: string;
    brand?: string;
    product_id?: string;
    search?: string;
    tag?: string;
  }>;
}

export default async function ProductsListingPage({ searchParams }: PageProps) {
  const { category: categorySlug, offer_id, brand: brandId, product_id, search, tag: tagSlug } = await searchParams;

  const queryParams: Record<string, string> = {};
  if (offer_id) queryParams.offer_id = offer_id;
  if (search) queryParams.search = search;

  const [{ storefront }, categories, tags, products, offers] = await Promise.all([
    fetchAllSettings(),
    fetchCategories(),
    fetchTags(),
    fetchProducts(Object.keys(queryParams).length > 0 ? queryParams : undefined),
    fetchOffers(),
  ]);

  let resolvedCategorySlug = categorySlug;
  let resolvedTagSlug: string | undefined = undefined;

  if (tagSlug) {
    const matchingCategory = categories.find((c) => 
      c.slug?.toLowerCase() === tagSlug.toLowerCase() || 
      c.name?.toLowerCase() === tagSlug.toLowerCase()
    );
    if (matchingCategory) {
      resolvedCategorySlug = matchingCategory.slug;
    } else {
      const matchingTag = tags.find((t) => 
        t.slug?.toLowerCase() === tagSlug.toLowerCase() || 
        t.name?.toLowerCase() === tagSlug.toLowerCase()
      );
      if (matchingTag) {
        resolvedTagSlug = matchingTag.slug;
      } else {
        resolvedTagSlug = tagSlug;
      }
    }
  }

  // Category filter
  // 1. Identify all target groups
  const activeOffer = offers.find((o) => o.id.toString() === offer_id) || null;
  const targetBrandId = brandId || activeOffer?.brand_id;
  const offerProductIds = new Set(activeOffer?.product_ids?.map(id => id.toString()) || []);

  const targetProdId = product_id;

  // 2. Build the prioritized list
  // Group 0: Specifically requested product (from card click)
  const group0 = targetProdId ? products.filter(p => p.id === targetProdId) : [];
  const group0Ids = new Set(group0.map(p => p.id));

  // Group 1: Products specifically linked to the active offer
  const group1 = products.filter(p => offerProductIds.has(p.id) && !group0Ids.has(p.id));
  const group1Ids = new Set(group1.map(p => p.id));

  // Group 2: Products from the target brand
  const group2 = targetBrandId
    ? products.filter(p => p.brand?.id?.toString() === targetBrandId.toString() && !group0Ids.has(p.id) && !group1Ids.has(p.id))
    : [];
  const group2Ids = new Set(group2.map(p => p.id));

  // Group 3: Products from categories relevant to Group 0, 1, or 2
  const relevantCategoryIds = new Set(
    [...group0, ...group1, ...group2].flatMap(p => p.categories?.map(c => c.id) || [])
  );

  const group3 = products.filter(p =>
    !group0Ids.has(p.id) &&
    !group1Ids.has(p.id) &&
    !group2Ids.has(p.id) &&
    p.categories?.some(c => relevantCategoryIds.has(c.id))
  );
  const group3Ids = new Set(group3.map(p => p.id));

  // Group 4: Everything else
  const group4 = products.filter(p =>
    !group0Ids.has(p.id) &&
    !group1Ids.has(p.id) &&
    !group2Ids.has(p.id) &&
    !group3Ids.has(p.id)
  );

  // 3. Apply the reordering
  const reordered = [...group0, ...group1, ...group2, ...group3, ...group4];

  // 4. Handle initial category/tag filters if present (keep reordered items that match)
  let filtered = reordered;
  if (resolvedCategorySlug) {
    filtered = reordered.filter((p) =>
      p.categories?.some((c) => c.slug?.toLowerCase() === resolvedCategorySlug?.toLowerCase())
    );
  }

  if (resolvedTagSlug) {
    filtered = filtered.filter((p) =>
      p.tags?.some((t) => t.slug?.toLowerCase() === resolvedTagSlug?.toLowerCase() || t.name?.toLowerCase() === resolvedTagSlug?.toLowerCase())
    );
  }

  // Determine page title
  const activeCategory = categories.find((c) => c.slug?.toLowerCase() === resolvedCategorySlug?.toLowerCase());
  const activeTag = tags.find((t) => t.slug?.toLowerCase() === resolvedTagSlug?.toLowerCase());
  const activeBrand = targetBrandId
    ? products.find((p) => p.brand?.id?.toString() === targetBrandId.toString())?.brand
    : null;

  const pageTitle = search
    ? `Search Results for "${search}"`
    : activeOffer
      ? `Special Offer: ${activeOffer.title}`
      : activeCategory
        ? activeCategory.name
        : activeTag
          ? `Tag: ${activeTag.name}`
          : activeBrand
            ? activeBrand.name
            : "All Products";

  return (
    <StorefrontLayout categories={categories} settings={storefront}>
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-6 pb-16">
        <ProductListingClient
          products={filtered}
          categories={categories}
          allProducts={products}
          offers={offers}
          initialCategorySlug={resolvedCategorySlug}
          initialOfferId={offer_id}
          initialBrandId={brandId}
          pageTitle={pageTitle}
          activeOffer={activeOffer}
        />
      </div>
    </StorefrontLayout>
  );
}
