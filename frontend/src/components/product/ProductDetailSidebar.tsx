import Link from "next/link";
import type { StorefrontCategory, StorefrontProduct } from "@/src/types/storefront";
import { resolveProductImageUrl, getProductPath } from "@/src/lib/product-utils";
import CategorySidebar from "../home-page-components/CategorySidebar";

interface CategoryWithCount {
  category: StorefrontCategory;
  count: number;
}

interface ProductDetailSidebarProps {
  categoriesWithCounts: CategoryWithCount[];
  similarProducts: StorefrontProduct[];
}

export default function ProductDetailSidebar({
  categoriesWithCounts,
  similarProducts,
}: ProductDetailSidebarProps) {
  return (
    <aside className="space-y-6 w-full lg:w-72 shrink-0">
      <CategorySidebar 
        categories={categoriesWithCounts.map((c) => ({
          id: c.category.id.toString(),
          name: c.category.name,
          slug: c.category.slug,
          products_count: c.count,
        }))} 
      />

      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <h3 className="text-primary font-semibold text-base mb-3">
          Fill by Price
        </h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>From:</span>
            <span className="font-medium">Rs.500</span>
          </div>
          <div className="flex justify-between">
            <span>To:</span>
            <span className="font-medium">Rs.5000</span>
          </div>
        </div>
        <input
          type="range"
          min={500}
          max={5000}
          defaultValue={2500}
          className="w-full mt-3 accent-primary"
          readOnly
          aria-hidden
        />
        <button
          type="button"
          className="w-full mt-3 bg-primary text-white text-sm py-2 rounded hover:opacity-90"
        >
          Filter
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <h3 className="text-primary font-semibold text-base mb-3">
          Similar Product
        </h3>
        <ul className="space-y-3">
          {similarProducts.slice(0, 4).map((item) => {
            const variant = item.variants?.[0];
            const price = parseFloat(String(variant?.retail_price ?? 0));
            const image = resolveProductImageUrl(
              item.images?.[0]?.url ?? item.image_url ?? variant?.image_url
            );

            return (
              <li key={item.id}>
                <Link
                  href={getProductPath({ id: item.id, slug: item.slug })}
                  className="flex gap-3 group"
                >
                  <div className="w-14 h-14 border border-gray-200 rounded bg-gray-50 shrink-0 overflow-hidden">
                    {image ? (
                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 line-clamp-2 group-hover:text-primary">
                      {item.name}
                    </p>
                    <p className="text-sm font-bold text-primary mt-0.5">
                      Rs.{price.toFixed(0)}
                    </p>
                    <p className="text-[10px] text-primary">By Store</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
