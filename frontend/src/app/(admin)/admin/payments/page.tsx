import { fetchAllPaymentsAdmin } from "@/src/lib/payments-api";
import { PaymentsPageClient } from "@/src/features/admin-payments/payments-page";
import type { Payment } from "@/src/types/payments";

export const metadata = {
  title: "Payments | Admin Dashboard",
};

export default async function PaymentsPage() {
  let initialPayments: Payment[] = [];
  try {
    initialPayments = await fetchAllPaymentsAdmin();
  } catch (error) {
    console.error("Failed to load payments:", error);
  }

  return <PaymentsPageClient initialPayments={initialPayments} />;
}
