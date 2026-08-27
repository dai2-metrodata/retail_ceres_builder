"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Promotional Calendar", num: 1 },
  { href: "/compliance", label: "Compliance Check", num: 2 },
  { href: "/lifts", label: "Volume Lifts & ROI", num: 3 },
  { href: "/optimization", label: "Trade Optimization", num: 4 },
  { href: "/upload", label: "Upload Calendar", num: 5 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-6">
          <div className="flex items-center gap-3 mr-8">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              C
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-none">Ceres Trade Promotions</h1>
              <p className="text-xs text-muted-foreground">Post-Event Analytics — Indonesia</p>
            </div>
          </div>
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-current/10 text-xs">
                  {item.num}
                </span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
