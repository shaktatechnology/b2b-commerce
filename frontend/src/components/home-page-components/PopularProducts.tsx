// components/home-page-components/PopularProducts.tsx
import React from "react";

interface Category {
  id: string;
  name: string;
}

interface Variant {
  id: string;
  retail_price: string;
}

interface Product {
  id: string;
  name: string;
  categories: Category[];
  variants: Variant[];
  images: { url: string }[];
}

interface PopularProductsProps {
  products: Product[];
}

const PopularProducts: React.FC<PopularProductsProps> = ({ products }) => {
  if (!products || products.length === 0) {
    return <p>No products available.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {products.map((product: Product) => {
        const variant = product.variants[0];
        const image = product.images[0]?.url || "/placeholder.png";
        const retailPrice = parseFloat(variant.retail_price);
        const originalPrice = retailPrice + 100; // example for discount badge
        const discount = Math.round(((originalPrice - retailPrice) / originalPrice) * 100);

        return (
          <div
            key={product.id}
            className="border p-4 rounded-lg shadow hover:shadow-lg transition relative"
          >
            {discount > 0 && (
              <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                {discount}% OFF
              </span>
            )}

            <img
              src={image}
              alt={product.name}
              className="w-full h-48 object-cover rounded"
            />

            <h3 className="mt-2 font-semibold">{product.name}</h3>

            <p className="text-gray-500 text-sm">
              {product.categories.map((c: Category) => c.name).join(", ")}
            </p>

            <p className="mt-1 font-bold text-lg">
              Rs.{retailPrice.toFixed(2)}
              {discount > 0 && (
                <span className="line-through text-gray-400 text-sm ml-2">
                  Rs.{originalPrice.toFixed(2)}
                </span>
              )}
            </p>

            <button className="mt-2 w-full bg-purple-600 text-white py-1 rounded hover:bg-purple-700">
              Add
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default PopularProducts;