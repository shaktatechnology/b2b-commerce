import { AccountPageFeature } from "@/src/features/account/account-page";
import { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/src/components/ui/spinner";

export const metadata: Metadata = {
  title: "My Account | Shakta B2B",
  description: "Manage your account profile and preferences.",
};

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    }>
      <AccountPageFeature />
    </Suspense>
  );
}
