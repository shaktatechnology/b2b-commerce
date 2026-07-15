import BrandSpecialOffers from "./BrandSpecialOffers";
import MiddleSectionOffers from "./MiddleSectionOffers";
import CategorySidebar from "./CategorySidebar";
import DealOfTheDay from "./DealOfTheDay";
import HeroSlider from "./HeroSlider";
import PopularProducts from "./PopularProducts";
import ProductSuggestions from "./ProductSuggestions";
import Footer from "../layouts/Footer";
import Navbar from "../layouts/Navbar";
import CouponsSection from "../coupons/CouponsSection";
import { isOfferLive } from "@/src/lib/offer-utils";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

async function safeFetch(url: string) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`Fetch failed for ${url}:`, err);
    return null;
  }
}

export default async function HomePage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const [categoryData, settingsData, productData, offersData, tagsData, dailyDealsData, couponsData] = await Promise.all([
    safeFetch(`${apiUrl}/categories`),
    safeFetch(`${apiUrl}/settings`),
    safeFetch(`${apiUrl}/products`),
    safeFetch(`${apiUrl}/offers`),
    safeFetch(`${apiUrl}/tags`),
    safeFetch(`${apiUrl}/products/daily-deals`),
    safeFetch(`${apiUrl}/coupons`),
  ]);

  const rawOffers = offersData?.data || [];
  const tags = tagsData?.data || [];
  const coupons = couponsData?.data || [];

  const dealOffers = rawOffers.filter((o: any) => o.placement === "deal");
  // Use automated cached deals from API
  const dailyDeals = dailyDealsData?.data || [];


  const topOffers = rawOffers.filter((o: any) => 
    (o.placement === "top" || o.placement === "Top Banner") && isOfferLive(o)
  );

  const rawLogo = settingsData?.data?.general?.site_logo;
  const logo =
    typeof rawLogo === "string" &&
    (rawLogo.startsWith("data:image") || rawLogo.startsWith("http"))
      ? rawLogo
      : rawLogo 
        ? `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}/storage/${rawLogo}`
        : null;

  return (
    <div>
      <Navbar
        categories={categoryData?.data || []}
        contactPhone={settingsData?.data?.general?.contact_phone || ""}
        logo={logo}
      />
      <HeroSlider offers={topOffers} />
      <CouponsSection coupons={coupons} />

      <div className="flex gap-6 px-4 md:px-10 mt-6 max-w-7xl mx-auto">
        <main className="w-full md:w-3/4">
          <PopularProducts
            products={productData?.data || []}
            categories={categoryData?.data || []}
          />
        </main>
        <aside className="w-1/4 hidden md:block">
          <Suspense fallback={<div className="h-40 animate-pulse bg-gray-100 rounded-xl" />}>
            <CategorySidebar
              categories={categoryData?.data || []}
              products={productData?.data || []}
            />
          </Suspense>
        </aside>
      </div>

      <BrandSpecialOffers
        offers={rawOffers}
        categories={categoryData?.data || []}
        tags={tags}
      />


      <DealOfTheDay dealProducts={dailyDeals} />

      <MiddleSectionOffers offers={rawOffers} />

      <ProductSuggestions products={productData?.data || []} />

      <Footer
        logo={logo}
        metaDescription={settingsData?.data?.general?.meta_description || ""}
        socialLinks={settingsData?.data?.social || []}
        categories={categoryData?.data || []}
        site_name={settingsData?.data?.general?.site_name || ""}
      />
    </div>
  );
}
