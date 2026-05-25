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
    <OrdersPageClient initialOrders={orders} />
  );
}
