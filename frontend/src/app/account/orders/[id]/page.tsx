import { OrderDetailsFeature } from "@/src/features/account/order-details";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Details | Shakta B2B",
  description: "View your order specifics and tracking information.",
};

export default function OrderDetailsPage() {
  return <OrderDetailsFeature />;
}
