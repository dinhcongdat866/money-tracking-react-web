"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import { Button } from "./ui/button";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/reports/monthly", label: "Monthly Reports" },
];

type AppNavProps = {
  userEmail?: string | null;
};

export function AppNav({ userEmail }: AppNavProps) {
  const pathname = usePathname();

  const isLoginPage = pathname === "/login";

  return (
    <header className="border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-tight">
            Money Tracker
          </span>
          {!!userEmail && !isLoginPage && (
            <span className="text-xs text-muted-foreground">
              Signed in as <span className="font-medium">{userEmail}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <nav className="flex items-center gap-4">
            {links.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);

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

          {!isLoginPage && (
            <form action={logout}>
              <Button type="submit" variant="outline" size="sm">
                Logout
              </Button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}

