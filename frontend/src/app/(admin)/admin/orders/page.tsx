import { fetchAllOrdersAdmin } from "@/src/lib/orders-api";
import { OrdersPageClient } from "@/src/components/admin-components/OrdersPageClient";
import type { Order } from "@/src/types/orders";
import { cookies } from "next/headers";

export const metadata = {
  title: "Orders | Admin",
};

export default async function OrdersPage() {
  let orders: Order[] = [];
  let total = 0;
  let lastPage = 1;
  let perPage = 15;
  try {
    const data = await fetchAllOrdersAdmin();
    orders = data.orders;
    total = data.total;
    lastPage = data.lastPage;
    perPage = data.perPage;
  } catch {
    // fall back to empty list
  }

  return (
    <OrdersPageClient 
      
      initialOrders={orders} 
      initialTotal={total}
      initialLastPage={lastPage}
      initialPerPage={perPage}
    />
  );
}
