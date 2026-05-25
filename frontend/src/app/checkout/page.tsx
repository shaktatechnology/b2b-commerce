import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import StorefrontLayout from "@/src/components/layouts/StorefrontLayout";
import CheckoutPageClient from "@/src/components/checkout/CheckoutPageClient";
import {
  fetchAllSettings,
  fetchCategories,
} from "@/src/lib/storefront-api";

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token");

  if (!token?.value) {
    redirect("/login?redirect=/checkout");
  }

  const [categories, { storefront, payment }] = await Promise.all([
    fetchCategories(),
    fetchAllSettings(),
  ]);

  return (
    <StorefrontLayout categories={categories} settings={storefront}>
      <CheckoutPageClient paymentSettings={payment} />
    </StorefrontLayout>
  );
}
