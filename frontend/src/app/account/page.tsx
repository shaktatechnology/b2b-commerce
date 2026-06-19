import { AccountPageFeature } from "@/src/features/account/account-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account | B2B",
  description: "Manage your account profile and preferences.",
};

export default function AccountPage() {
  return <AccountPageFeature />;
}
