"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Offer } from "../../types/offer";
import { X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  offers: Offer[];
  categories?: Category[];
}

const defaultOffers = [
  {
    id: "default-1",
    image: "/offers/shoe_offer.png",
    title: "Shoe Collection",
    description: "Up to 50% Off",
    link: "/products?category=shoes",
    bgColor: "bg-[#8B1A1A]",
  },
  {
    id: "default-2",
    image: "/offers/electronics_offer.png",
    title: "Electronics Sale",
    description: "45% Discount",
    link: "/products?category=electronics",
    bgColor: "bg-[#1A237E]",
  },
  {
    id: "default-3",
    image: "/offers/saree_offer.png",
    title: "Saree Special",
    description: "Flat 50% Off",
    link: "/products?category=saree",
    bgColor: "bg-[#FBC02D]",
  },
];

export default function BrandSpecialOffers({ offers, categories = [] }: Props) {
  // Use API offers if available, otherwise use defaults
  const displayOffers = (offers && offers.length > 0) 
    ? offers.slice(0, 3).map((offer, idx) => {
        const rawImage = offer.image_url || offer.image;
        const image = rawImage
          ? rawImage.startsWith("http")
            ? rawImage
            : `${process.env.NEXT_PUBLIC_STORAGE_URL}${rawImage.startsWith("/") ? "" : "/"}${rawImage}`
          : "/placeholder.png";

        return {
          id: offer.id,
          image,
          title: offer.title,
          description: offer.description || "",
          link: `/products?offer_id=${offer.id}`,
          bgColor: idx === 0 ? "bg-[#8B1A1A]" : idx === 1 ? "bg-[#1A237E]" : "bg-[#FBC02D]",
        };
      })
    : defaultOffers;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-10 py-8 md:py-10">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Main Content: Brand Special Offers */}
        <div className="w-full lg:w-3/4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-primary">
              Brands Special Offer
            </h2>
            <Link 
              href="/offers" 
              className="text-sm font-medium text-gray-500 hover:text-primary transition-colors"
            >
              View All Offers
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {displayOffers.map((offer, index) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-[10px] shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <div className={`relative aspect-[3/4] w-full ${offer.bgColor}`}>
                  <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
                    <img
                      src={offer.image}
                      alt={offer.title}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                  </div>

                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
                  
                  {/*<div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                    <h3 className="text-white text-xl font-bold mb-1 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      {offer.title}
                    </h3>
                    {offer.description && (
                      <p className="text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 mb-2">
                        {offer.description}
                      </p>
                    )}
                    <div className="w-10 h-1 bg-primary rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  </div>*/}
                </div>
                
                <Link href={offer.link} className="absolute inset-0 z-10">
                  <span className="sr-only">View {offer.title}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar: Product Tags */}
        <aside className="w-full lg:w-1/4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
            <h2 className="text-2xl font-bold text-primary mb-2">Product Tag</h2>
            <div className="w-12 h-1 bg-primary/30 rounded-full mb-8" />

            <div className="flex flex-wrap gap-3">
              {categories.slice(0, 12).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-full hover:bg-primary/5 hover:border-primary/20 transition-all duration-300"
                >
                  <X size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-gray-500 group-hover:text-primary transition-colors">
                    {cat.name}
                  </span>
                </Link>
              ))}
              
              {/* Fallback mock tags if no categories */}
              {categories.length === 0 && ["Brown", "Coffees", "Cream", "Hodo Foods", "Meats", "Organic", "Snack", "Vegetables"].map((tag) => (
                <div
                  key={tag}
                  className="group flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-full hover:bg-primary/5 hover:border-primary/20 cursor-pointer transition-all duration-300"
                >
                  <X size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-gray-500 group-hover:text-primary transition-colors">
                    {tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

      </div>
    </section>
  );
}
