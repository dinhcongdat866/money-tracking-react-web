import { AppNav } from "./app-nav";
import { getCurrentUser } from "@/lib/auth";

export async function AppHeader() {
  const user = await getCurrentUser();

  return <AppNav userEmail={user?.email} />;
}


