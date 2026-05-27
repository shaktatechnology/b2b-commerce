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

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    const res = await fetchAllOrdersAdmin({ token });
    
    if (Array.isArray(res)) {
      orders = res;
      total = res.length;
    } else {
      const resData = res?.data?.data || res?.data || [];
      orders = Array.isArray(resData) ? resData : [];
      total = res?.total || res?.meta?.total || orders.length;
      lastPage = res?.last_page || res?.meta?.last_page || 1;
    }
  } catch {
    // fall back to empty list
  }

  return (
    <OrdersPageClient 
      initialOrders={orders} 
      initialTotal={total}
      initialLastPage={lastPage}
    />
  );
}
