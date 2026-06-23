import StorefrontLayout from "@/src/components/layouts/StorefrontLayout";
import { fetchAllSettings, fetchCategories, fetchAllDeals } from "@/src/lib/storefront-api";
import { Tag } from "lucide-react";
import DealOfTheDayCard from "@/src/components/cards/DealOfTheDayCard";
import Link from "next/link";

export const metadata = {
  title: "All Deals | B2B Commerce",
  description: "Browse all product deals with the highest discounts available today.",
};

export default async function DealsPage() {
  const [{ storefront }, categories, deals] = await Promise.all([
    fetchAllSettings(),
    fetchCategories(),
    fetchAllDeals(),
  ]);

  return (
    <StorefrontLayout categories={categories} settings={storefront}>
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-8 pb-16">

        {/* Page Header */}
        <div className="flex items-center gap-3 mb-8">
          <Tag size={22} className="text-[#8b5cf6]" />
          <h1 className="text-2xl font-bold text-[#8b5cf6]">All Deals of the Day</h1>
          <span className="ml-auto text-sm text-gray-400">
            {deals.length} deal{deals.length !== 1 ? "s" : ""} found
          </span>
        </div>

        {deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Tag size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">No deals available right now.</p>
            <Link href="/products" className="mt-4 text-sm text-[#8b5cf6] hover:underline">
              Browse all products →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {deals.map((product: any) => (
              <DealOfTheDayCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
