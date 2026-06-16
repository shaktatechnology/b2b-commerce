import { CODApprovalsPage } from "@/src/features/admin-cod/cod-approvals-page";

export const metadata = {
  title: "COD Approvals | Admin Panel",
  description: "Manage and approve Cash on Delivery requests.",
};

export default function Page() {
  return <CODApprovalsPage />;
}
