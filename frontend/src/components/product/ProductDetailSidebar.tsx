import Link from "next/link";
import type { StorefrontCategory, StorefrontProduct } from "@/src/types/storefront";
import { resolveProductImageUrl, getProductPath, productToCartLineItem } from "@/src/lib/product-utils";
import CategorySidebar from "../home-page-components/CategorySidebar";
import { Offer } from "@/src/types/offer";

interface CategoryWithCount {
  category: StorefrontCategory;
  count: number;
}

interface ProductDetailSidebarProps {
  categoriesWithCounts: CategoryWithCount[];
  similarProducts: StorefrontProduct[];
  offers?: Offer[];
}

const STORAGE_URL =
  process.env.NEXT_PUBLIC_STORAGE_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:8000";

function resolveOfferImage(offer: Offer): string {
  const raw = offer.image_url || offer.image;
  if (!raw) return "/placeholder.png";
  if (raw.startsWith("http") || raw.startsWith("blob")) return raw;
  if (raw.startsWith("/storage/")) return `${STORAGE_URL}${raw}`;
  if (raw.startsWith("storage/")) return `${STORAGE_URL}/${raw}`;
  if (raw.startsWith("/")) return `${STORAGE_URL}${raw}`;
  return `${STORAGE_URL}/storage/${raw}`;
}

export default function ProductDetailSidebar({
  categoriesWithCounts,
  similarProducts,
  offers = [],
}: ProductDetailSidebarProps) {

  // Price range from similar products
  let minPrice = Infinity, maxPrice = 0;
  similarProducts.forEach((p) => {
    p.variants?.forEach((v: any) => {
      const price = parseFloat(String(v.retail_price ?? 0));
      if (price > 0 && price < minPrice) minPrice = price;
      if (price > maxPrice) maxPrice = price;
    });
  });
  if (minPrice === Infinity) minPrice = 0;

  const activeOffers = offers.filter(o => o.is_active);

  return (
    <aside className="space-y-5 w-full lg:w-72 shrink-0">
      {activeOffers.length > 0 && (
        <div className="space-y-3">
          {activeOffers.map((offer) => (
            <div key={offer.id} className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-sm group border border-gray-100">
              <img
                src={resolveOfferImage(offer)}
                alt={offer.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-[13px] font-bold line-clamp-2">{offer.title}</p>
                {offer.description && (
                  <p className="text-white/70 text-[10px] mt-1 line-clamp-2 leading-relaxed">{offer.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <CategorySidebar

        categories={categoriesWithCounts.map((c) => ({
          id: c.category.id.toString(),
          name: c.category.name,
          slug: c.category.slug,
          products_count: c.count,
        }))}
      />

      {/* Price Range Display */}
      {/* {maxPrice > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-bold text-primary mb-3">
            Price Range
          </h3>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">From:</span>
              <span className="font-semibold text-primary">Rs.{Math.floor(minPrice)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">To:</span>
              <span className="font-semibold text-primary">Rs.{Math.ceil(maxPrice)}</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-primary/40 rounded-full" style={{ width: "100%" }} />
          </div>
        </div>
      )} */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-base font-bold text-primary mb-3">
          Similar Products
        </h3>
        <ul className="space-y-3">
          {similarProducts.slice(0, 4).map((item) => {
            const lineItem = productToCartLineItem(item);
            const basePrice = lineItem?.price ?? 0;
            const discountAmount = lineItem?.discount ?? 0;
            const finalPrice = basePrice - discountAmount;
            const hasDiscount = discountAmount > 0;

            const image = resolveProductImageUrl(
              lineItem?.image ?? item.images?.[0]?.url ?? item.image_url
            );

            return (
              <li key={item.id}>
                <Link
                  href={getProductPath({ id: item.id, slug: item.slug })}
                  className="flex gap-3 group"
                >
                  <div className="w-16 h-16 border border-gray-100 rounded-lg bg-gray-50 shrink-0 overflow-hidden flex items-center justify-center p-1">
                    {image ? (
                      <img
                        src={image}
                        alt=""
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-gray-800 line-clamp-1 group-hover:text-primary transition-colors">
                      {item.name}
                    </p>
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-primary">
                        Rs.{finalPrice.toFixed(0)}
                      </p>
                      {hasDiscount && (
                        <p className="text-[10px] text-gray-400 line-through">
                          Rs.{basePrice.toFixed(0)}
                        </p>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400">
                      By <span className="text-primary">{item.brand?.name || "Store"}</span>
                    </p>
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
