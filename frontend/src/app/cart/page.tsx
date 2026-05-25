import StorefrontLayout from "@/src/components/layouts/StorefrontLayout";
import CartPageClient from "@/src/components/cart/CartPageClient";
import type { CartProductInput } from "@/src/types/cart";
import {
  fetchAllSettings,
  fetchCategories,
  fetchProducts,
} from "@/src/lib/storefront-api";

export default async function CartPage() {
  const [{ storefront }, categories, products] = await Promise.all([
    fetchAllSettings(),
    fetchCategories(),
    fetchProducts(),
  ]);

  const cartProducts = products as CartProductInput[];

  return (
    <StorefrontLayout categories={categories} settings={storefront}>
      <CartPageClient
        recommendedProducts={cartProducts}
        contactPhone={storefront.contactPhone}
      />
    </StorefrontLayout>
  );
}
