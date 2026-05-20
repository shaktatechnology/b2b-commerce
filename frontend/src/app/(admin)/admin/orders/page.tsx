import { fetchOrders } from "@/src/lib/orders-api";
import { OrdersPageClient } from "@/src/components/admin-components/OrdersPageClient";

export const metadata = {
  title: "Orders | Admin",
};

export default async function OrdersPage() {
  let orders = [];
  try {
    orders = await fetchOrders();
  } catch {
    // fall back to empty list
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <OrdersPageClient initialOrders={orders} />
      </div>
    </main>
  );
}
