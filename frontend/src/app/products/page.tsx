import Link from "next/link";
import StorefrontLayout from "@/src/components/layouts/StorefrontLayout";
import ProductCard from "@/src/components/cards/ProductCard";
import {
  fetchAllSettings,
  fetchCategories,
  fetchProducts,
} from "@/src/lib/storefront-api";
import type { CartProductInput } from "@/src/types/cart";

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function ProductsListingPage({ searchParams }: PageProps) {
  const { category: categorySlug } = await searchParams;

  const [{ storefront }, categories, products] = await Promise.all([
    fetchAllSettings(),
    fetchCategories(),
    fetchProducts(),
  ]);

  const filtered = categorySlug
    ? products.filter((p) =>
        p.categories?.some((c) => c.slug === categorySlug)
      )
    : products;

  const activeCategory = categories.find((c) => c.slug === categorySlug);

  return (
    <StorefrontLayout categories={categories} settings={storefront}>
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-6 pb-16">
        <nav className="text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <span className="mx-2">&gt;</span>
          <span className="text-primary font-medium">
            {activeCategory ? activeCategory.name : "All Products"}
          </span>
        </nav>

        <h1 className="text-2xl font-semibold text-primary mb-6">
          {activeCategory ? activeCategory.name : "All Products"}
        </h1>

        {filtered.length === 0 ? (
          <p className="text-gray-500">No products found in this category.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product as CartProductInput}
              />
            ))}
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
