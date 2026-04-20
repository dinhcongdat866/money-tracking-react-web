"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectUser, selectUserDisplayName } from "@/store/slices/auth/authSelectors";
import { logoutThunk } from "@/store/slices/auth/authThunks";
import { useAuthSync } from "@/hooks/useAuthSync";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/transactions/kanban", label: "Kanban" },
  { href: "/reports/monthly", label: "Monthly Reports" },
  { href: "/account", label: "Account" },
];

type AppNavProps = {
  userEmail?: string | null;
  userId?: string | null;
};

export function AppNav({ userEmail: serverUserEmail, userId: serverUserId }: AppNavProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  
  // Sync server session (source of truth) to Redux on mount
  useAuthSync({
    serverUser: serverUserEmail && serverUserId
      ? { id: serverUserId, email: serverUserEmail }
      : null,
  });
  
  const user = useAppSelector(selectUser);
  const displayName = useAppSelector(selectUserDisplayName);
  
  const isLoginPage = pathname === "/login";

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.push('/login');
  };

  return (
    <header className="border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-tight">
            Money Tracker
          </span>
          {!!user && !isLoginPage && (
            <span className="text-xs text-muted-foreground">
              Signed in as <span className="font-medium">{displayName}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <nav className="flex items-center gap-4">
            {links.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    "transition-colors hover:text-foreground/80 " +
                    (isActive
                      ? "font-medium text-foreground"
                      : "text-muted-foreground")
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {!isLoginPage && user && (
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              size="sm"
            >
              Logout
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

