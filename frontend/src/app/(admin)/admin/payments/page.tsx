import { fetchAllPaymentsAdmin } from "@/src/lib/payments-api";
import { PaymentsPageClient } from "@/src/features/admin-payments/payments-page";
import type { Payment } from "@/src/types/payments";
import { cookies } from "next/headers";

export const metadata = {
  title: "Payments | Admin Dashboard",
};

export default async function PaymentsPage() {
  let initialPayments: Payment[] = [];
  let initialTotal = 0;
  let initialLastPage = 1;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    const res = await fetchAllPaymentsAdmin({ token });
    
    if (Array.isArray(res)) {
      initialPayments = res;
      initialTotal = res.length;
    } else {
      const resData = res?.data?.data || res?.data || [];
      initialPayments = Array.isArray(resData) ? resData : [];
      initialTotal = res?.total || res?.meta?.total || initialPayments.length;
      initialLastPage = res?.last_page || res?.meta?.last_page || 1;
    }
  } catch (error) {
    console.error("Failed to load payments:", error);
  }

  return (
    <PaymentsPageClient 
      initialPayments={initialPayments} 
      initialTotal={initialTotal}
      initialLastPage={initialLastPage}
    />
  );
}
