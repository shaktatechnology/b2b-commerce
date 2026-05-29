import Link from "next/link";
import StorefrontLayout from "@/src/components/layouts/StorefrontLayout";
import ProductCard from "@/src/components/cards/ProductCard";
import {
  fetchAllSettings,
  fetchCategories,
  fetchProducts,
  fetchOffers,
} from "@/src/lib/storefront-api";

interface PageProps {
  searchParams: Promise<{ category?: string; offer_id?: string }>;
}

export default async function ProductsListingPage({ searchParams }: PageProps) {
  const { category: categorySlug, offer_id } = await searchParams;

  const [{ storefront }, categories, products, offers] = await Promise.all([
    fetchAllSettings(),
    fetchCategories(),
    fetchProducts(),
    fetchOffers(),
  ]);

  let filtered = products;

  if (categorySlug) {
    filtered = filtered.filter((p) =>
      p.categories?.some((c) => c.slug === categorySlug)
    );
  }

  if (offer_id) {
    const offer = offers.find((o) => o.id.toString() === offer_id);
    if (offer) {
      const linkedIds = (offer.product_ids || (offer as any).products || [])?.map((p: any) => 
        (typeof p === 'object' ? p.id.toString() : p.toString())
      );
      
      if (linkedIds && linkedIds.length > 0) {
        filtered = filtered.filter((p) => linkedIds.includes(p.id.toString()));
      } else {
        // If an offer is selected but has no linked products, show nothing
        filtered = [];
      }
    }
  }

  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const activeOffer = offers.find((o) => o.id.toString() === offer_id);

  const pageTitle = activeOffer 
    ? `Special Offer: ${activeOffer.title}` 
    : (activeCategory ? activeCategory.name : "All Products");

  return (
    <StorefrontLayout categories={categories} settings={storefront}>
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-6 pb-16">
        <nav className="text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <span className="mx-2">&gt;</span>
          <span className="text-primary font-medium">
            {pageTitle}
          </span>
        </nav>

        <h1 className="text-2xl font-semibold text-primary mb-2">
          {pageTitle}
        </h1>
        {activeOffer?.description && (
          <p className="text-gray-500 mb-8 max-w-2xl">{activeOffer.description}</p>
        )}

        {filtered.length === 0 ? (
          <p className="text-gray-500">No products found for this selection.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        
      </div>
    </StorefrontLayout>
  );
}
