import StorefrontLayout from "@/src/components/layouts/StorefrontLayout";
import { fetchAllSettings, fetchCategories, fetchOffers } from "@/src/lib/storefront-api";
import { isOfferLive, resolveOfferImage, getOfferLink } from "@/src/lib/offer-utils";
import { Tag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Offer } from "@/src/types/offer";

export const metadata = {
  title: "Brand Special Offers | B2B Commerce",
  description: "Explore all our special brand offers and limited time discounts.",
};

export default async function OffersPage() {
  const [{ storefront }, categories, allOffers] = await Promise.all([
    fetchAllSettings(),
    fetchCategories(),
    fetchOffers(),
  ]);

  const MID_PLACEMENTS = new Set(["mid", "middle", "Middle Section", "middle_section"]);
  
  // Filter for Brands Special Offers (mid placement)
  const brandOffers = allOffers.filter(
    (o: Offer) => o.placement != null && MID_PLACEMENTS.has(o.placement) && isOfferLive(o)
  );

  // Other offers (top banners etc)
  const otherOffers = allOffers.filter(
    (o: Offer) => (!o.placement || !MID_PLACEMENTS.has(o.placement)) && isOfferLive(o)
  );

  return (
    <StorefrontLayout categories={categories} settings={storefront}>
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-10 pb-20">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 border-b border-gray-100 pb-8">
          <div>
            <div className="flex items-center gap-2 text-[#8b5cf6]/60 mb-2">
              <Tag size={16} />
              <span className="text-xs font-bold uppercase tracking-widest text-[#8b5cf6]">Special Perks</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-[#8b5cf6] tracking-tight">
              Brands Special <span className="text-zinc-400">Offers</span>
            </h1>
          </div>
          <p className="text-gray-500 max-w-md text-sm md:text-base">
            Discover exclusive deals from your favorite brands. Limited time offers and premium collection discounts.
          </p>
        </div>

        {brandOffers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <Tag size={48} className="mb-4 opacity-10" />
            <p className="text-lg font-medium">No special brand offers available right now.</p>
            <Link href="/products" className="mt-4 text-sm text-[#8b5cf6] font-bold hover:underline">
              Browse all products →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {brandOffers.map((offer: Offer, idx: number) => (
              <Link 
                key={offer.id} 
                href={getOfferLink(offer)}
                className="group relative flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-50"
              >
                {/* Image Section */}
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img 
                    src={resolveOfferImage(offer.image_url || offer.image)} 
                    alt={offer.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Badge */}
                  <div className="absolute top-6 left-6">
                    <span className="px-4 py-1.5 bg-white/90 backdrop-blur text-[10px] font-black uppercase tracking-widest text-[#8b5cf6] rounded-full shadow-lg">
                      Exclusive
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-8">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#8b5cf6] transition-colors duration-300 mb-2">
                    {offer.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-6">
                    {offer.description || "Take advantage of this limited time brand discount."}
                  </p>
                  <div className="flex items-center gap-2 text-sm font-black text-[#8b5cf6] uppercase tracking-wider">
                    Claim Offer <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Other Offers Section */}
        {/* {otherOffers.length > 0 && (
          <div className="mt-24">
            <h2 className="text-2xl font-bold text-gray-900 mb-10 flex items-center gap-3">
              <div className="w-1.5 h-8 bg-zinc-200 rounded-full" />
              General Promotions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {otherOffers.map((offer: Offer) => (
                <Link 
                  key={offer.id} 
                  href={getOfferLink(offer)}
                  className="flex flex-col sm:flex-row gap-6 bg-gray-50 p-6 rounded-3xl hover:bg-white hover:shadow-xl transition-all duration-500 group border border-transparent hover:border-gray-100"
                >
                  <div className="w-full sm:w-48 h-48 rounded-2xl overflow-hidden shrink-0">
                    <img 
                      src={resolveOfferImage(offer.image_url || offer.image)} 
                      alt={offer.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{offer.placement || 'Promotion'}</span>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{offer.title}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{offer.description}</p>
                    <div className="text-xs font-bold text-[#8b5cf6] group-hover:underline">View Details →</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )} */}
      </div>
    </StorefrontLayout>
  );
}
