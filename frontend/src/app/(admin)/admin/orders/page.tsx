import { fetchAllOrdersAdmin } from "@/src/lib/orders-api";
import { OrdersPageClient } from "@/src/components/admin-components/OrdersPageClient";
import type { Order } from "@/src/types/orders";

export const metadata = {
  title: "Orders | Admin",
};

export default async function OrdersPage() {
  let orders: Order[] = [];
  try {
    orders = await fetchAllOrdersAdmin();
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
