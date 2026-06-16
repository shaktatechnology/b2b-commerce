import BrandSpecialOffers from "../components/home-page-components/BrandSpecialOffers";
import MiddleSectionOffers from "../components/home-page-components/MiddleSectionOffers";
import CategorySidebar from "../components/home-page-components/CategorySidebar";
import DealOfTheDay from "../components/home-page-components/DealOfTheDay";
import HeroSlider from "../components/home-page-components/HeroSlider";
import PopularProducts from "../components/home-page-components/PopularProducts";
import ProductSuggestions from "../components/home-page-components/ProductSuggestions";
import Footer from "../components/layouts/Footer";
import Navbar from "../components/layouts/Navbar";

export default async function Page() {
  const [categoryRes, settingsRes, productRes, offersRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, { cache: "no-store" }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`, { cache: "no-store" }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, { cache: "no-store" }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers`, { cache: "no-store" }),
  ]);

  const categoryData = (await categoryRes.json()) || { data: [] };
  const settingsData = (await settingsRes.json()) || { data: { general: {}, social: {} } };
  const productData = (await productRes.json()) || { data: [] };
  const offersData = (await offersRes.json()) || { data: [] };

  const rawOffers = offersData?.data || [];

  const rawLogo = settingsData?.data?.general?.site_logo;
  const logo =
    typeof rawLogo === "string" &&
    (rawLogo.startsWith("data:image") || rawLogo.startsWith("http"))
      ? rawLogo
      : null;

  const slides = [
    "/banner/image.png",
    "/banner/image-1.png",
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
        categories={categoryData?.data || []}
        contactPhone={settingsData?.data?.general?.contact_phone || ""}
        logo={logo}
      />
      <HeroSlider slides={slides} />

      <div className="flex gap-6 px-4 md:px-10 mt-6 max-w-7xl mx-auto">
        <main className="w-full md:w-3/4">
          <PopularProducts
            products={productData?.data || []}
            categories={categoryData?.data || []}
          />
        </main>
        <aside className="w-1/4 hidden md:block">
          <CategorySidebar
            categories={categoryData?.data || []}
            products={productData?.data || []}
          />
        </aside>
      </div>

      {/* Top Banner offers — above Deal of the Day */}
      <BrandSpecialOffers
        offers={rawOffers}
        categories={categoryData?.data || []}
      />

      <DealOfTheDay dealProducts={dealOfTheDayProducts} />

      {/* Middle Section offers — below Deal of the Day */}
      <MiddleSectionOffers offers={rawOffers} />

      <ProductSuggestions products={productData?.data || []} />

      <Footer
        logo={logo}
        metaDescription={settingsData?.data?.general?.meta_description || ""}
        socialLinks={settingsData?.data?.social || []}
        categories={categoryData?.data || []}
      />
    </div>
  );
}