import type { Metadata } from "next";
import { AccountSettingsPage } from "@/features/account/components/AccountSettingsPage";

export const metadata: Metadata = {
  title: "Account | Money Tracker",
  description: "Account settings backed by REST API routes.",
};

export default function AccountPage() {
  return <AccountSettingsPage />;
}
