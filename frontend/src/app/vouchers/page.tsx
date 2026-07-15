import StorefrontLayout from "@/src/components/layouts/StorefrontLayout";
import { fetchCategories, fetchAllSettings, fetchCoupons } from "@/src/lib/storefront-api";
import VoucherCenterClient from "@/src/components/coupons/VoucherCenterClient";

export const dynamic = "force-dynamic";

export default async function VouchersPage() {
  const [categories, settingsData, coupons] = await Promise.all([
    fetchCategories(),
    fetchAllSettings(),
    fetchCoupons(),
  ]);

  const storefront = settingsData?.storefront || null;

  return (
    <StorefrontLayout categories={categories} settings={storefront}>
      <div className="bg-gray-50/50 min-h-screen">
        <VoucherCenterClient initialCoupons={coupons} />
      </div>
    </StorefrontLayout>
  );
}
