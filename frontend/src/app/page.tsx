import CategorySidebar from "../components/home-page-components/CategorySidebar";
import HeroSlider from "../components/home-page-components/HeroSlider";
import PopularProducts from "../components/home-page-components/PopularProducts";
import Footer from "../components/layouts/Footer";


import Navbar from "../components/layouts/Navbar";

export default async function Page() {
  const [categoryRes, settingsRes, productRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
      cache: "no-store",
    }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`, {
      cache: "no-store",
    }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
      cache: "no-store",
    }),
  ]);

  const categoryData = await categoryRes.json();
  const settingsData = await settingsRes.json();
  const productData = await productRes.json();

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
    "/banner/image-1.png",
  ];

  return (
    <div>
      <Navbar
        categories={categoryData.data}
        contactPhone={settingsData.data.general.contact_phone}
        logo={logo}
      />
      <HeroSlider slides={slides} />

      <div className="flex gap-6  md:px-10 mt-6  max-w-7xl mx-auto">
        {/* LEFT SIDEBAR */}

        {/* RIGHT CONTENT */}
        <main className="w-full md:w-3/4">
          <PopularProducts products={productData.data} />
        </main>

        <aside className="w-1/4 hidden md:block">
          <CategorySidebar categories={categoryData.data} />
        </aside>
      </div>

      <Footer
        logo={logo}
        metaDescription={settingsData.data.general.meta_description}
        socialLinks={settingsData.data.social}
        categories={categoryData.data}
      />
    </div>
  );
}
