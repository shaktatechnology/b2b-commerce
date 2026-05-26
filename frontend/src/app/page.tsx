import BrandSpecialOffers from "../components/home-page-components/BrandSpecialOffers";
import MiddleSectionOffers from "../components/home-page-components/MiddleSectionOffers";
import CategorySidebar from "../components/home-page-components/CategorySidebar";
import DealOfTheDay from "../components/home-page-components/DealOfTheDay";
import HeroSlider from "../components/home-page-components/HeroSlider";
import PopularProducts from "../components/home-page-components/PopularProducts";
import ProductSuggestions from "../components/home-page-components/ProductSuggestions";
import CategoryShowcase from "../components/home-page-components/CategoryShowcase";
import Footer from "../components/layouts/Footer";
import Navbar from "../components/layouts/Navbar";

export default async function Page() {
  const [categoryRes, settingsRes, productRes, offersRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, { cache: "no-store" }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`, { cache: "no-store" }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, { cache: "no-store" }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers`, { cache: "no-store" }),
  ]);

  const categoryData = await categoryRes.json();
  const settingsData = await settingsRes.json();
  const productData = await productRes.json();
  const offersData = await offersRes.json();

  // ── DEBUG: log offer shape so you can confirm placement values & image paths ──
  // Remove this once everything is working
  const rawOffers = offersData?.data || [];
  console.log("[Offers API] total:", rawOffers.length);
  if (rawOffers.length > 0) {
    console.log("[Offers API] first offer:", JSON.stringify(rawOffers[0], null, 2));
    console.log("[Offers API] placements:", rawOffers.map((o: any) => o.placement));
  }

  const rawLogo = settingsData.data.general.site_logo;
  const logo =
    typeof rawLogo === "string" &&
    (rawLogo.startsWith("data:image") || rawLogo.startsWith("http"))
      ? rawLogo
      : null;

  const slides = [
    "/banner/image.png",
    "/banner/image-1.png",
    "/banner/image-2.png",
    "/banner/image-3.png",
    "/banner/image-4.png",
    "/banner/image-3.png",
    "/banner/image-1.png",
  ];

  const dealOfTheDayProducts = [
    {
      id: 1,
      name: "Half Sleeves Printed Cotton Casual Shirt For Men",
      image: "/day-of-deal/pro-1.png",
      price: 1200,
      reviews: 32,
      brand: "ABC",
      days: "03",
      hours: "23",
      minutes: "19",
      seconds: "56",
    },
    {
      id: 2,
      name: "100% Organic Nepali Green Tea Available in 50gm",
      image: "/day-of-deal/pro-2.png",
      price: 200,
      reviews: 10,
      brand: "ABC",
      days: "03",
      hours: "23",
      minutes: "19",
      seconds: "56",
    },
    {
      id: 3,
      name: "Dabur Honey - 1kg | 100% Pure Honey",
      image: "/day-of-deal/pro-3.png",
      price: 450,
      reviews: 32,
      brand: "ABC",
      days: "03",
      hours: "23",
      minutes: "19",
      seconds: "56",
    },
  ];

  return (
    <div>
      <Navbar
        categories={categoryData.data}
        contactPhone={settingsData.data.general.contact_phone}
        logo={logo}
      />
      <HeroSlider slides={slides} />

      <div className="flex gap-6 px-4 md:px-10 mt-6 max-w-7xl mx-auto">
        <main className="w-full md:w-3/4">
          <PopularProducts
            products={productData.data}
            categories={categoryData.data}
          />
        </main>
        <aside className="w-1/4 hidden md:block">
          <CategorySidebar
            categories={categoryData.data}
            products={productData.data}
          />
        </aside>
      </div>

      {/* Top Banner offers — above Deal of the Day */}
      <BrandSpecialOffers
        offers={rawOffers}
        categories={categoryData?.data || []}
      />

      {/* Category Showcase Section */}
      {(() => {
        const rootCategories = (categoryData?.data || []).filter((c: any) => !c.parent_id);
        const showcaseId = settingsData?.data?.general?.showcase_category_id;
        
        // Try to find the category selected by admin, otherwise fallback to first non-empty root
        let featuredCategory = rootCategories.find((c: any) => String(c.id) === showcaseId);
        
        if (!featuredCategory || showcaseId === 'none' || showcaseId === '') {
          featuredCategory = rootCategories.find((c: any) => 
            (productData?.data || []).some((p: any) => p.categories?.some((cat: any) => cat.name === c.name))
          ) || rootCategories[0];
        }
        
        if (featuredCategory) {
          const subCategories = (categoryData?.data || []).filter((c: any) => c.parent_id === featuredCategory.id);
          return (
            <CategoryShowcase 
              category={featuredCategory}
              subCategories={subCategories}
              products={productData.data}
            />
          );
        }
        return null;
      })()}

      <DealOfTheDay dealProducts={dealOfTheDayProducts} />

      {/* Middle Section offers — below Deal of the Day */}
      <MiddleSectionOffers offers={rawOffers} />

      <ProductSuggestions products={productData.data} />

      <Footer
        logo={logo}
        metaDescription={settingsData.data.general.meta_description}
        socialLinks={settingsData.data.social}
        categories={categoryData.data}
      />
    </div>
  );
}