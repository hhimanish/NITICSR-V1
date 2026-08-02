"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  FileCheck2,
  Gavel,
  HandCoins,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CopilotPanel } from "@/components/dashboard/copilot-panel";
import { ThemeToggle } from "@/components/site/theme-toggle";
import type { DashboardNavItem } from "@/components/dashboard/nav-data";

const iconByHref: Record<string, LucideIcon> = {
  "/corporate": LayoutDashboard,
  "/corporate/discovery": Search,
  "/corporate/grants": HandCoins,
  "/corporate/governance": Gavel,
  "/corporate/compliance": ShieldCheck,
  "/corporate/settings": Settings,
  "/ngo": LayoutDashboard,
  "/ngo/matches": Search,
  "/ngo/verification": FileCheck2,
  "/ngo/settings": Settings,
  "/auditor": LayoutDashboard,
};

function NavLinks({ navItems, onNavigate }: { navItems: DashboardNavItem[]; onNavigate?: boolean }) {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = iconByHref[item.href] ?? LayoutDashboard;
        const link = (
          <Link
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-foreground/80 hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );

        if (onNavigate) {
          return (
            <SheetClose key={item.href} render={link}>
              {item.label}
            </SheetClose>
          );
        }

        return <span key={item.href}>{link}</span>;
      })}
    </>
  );
}

export function DashboardShell({
  portal,
  navItems,
  children,
}: {
  portal: "Corporate" | "NGO" | "Auditor";
  navItems: DashboardNavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <Link href="/" className="flex h-16 items-center gap-2 border-b border-border px-6 font-heading font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            N
          </span>
          NITICSR
        </Link>
        <nav className="flex-1 space-y-1 p-4" aria-label={`${portal} navigation`}>
          <NavLinks navItems={navItems} />
        </nav>
        <div className="border-t border-border p-4 text-xs text-muted-foreground">
          {portal} workspace &middot; Phase 1
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
                <Menu />
                <span className="sr-only">Open navigation</span>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <SheetHeader>
                  <SheetTitle>NITICSR</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-1 flex-col gap-1 px-4" aria-label={`${portal} navigation`}>
                  <NavLinks navItems={navItems} onNavigate />
                </nav>
              </SheetContent>
            </Sheet>
            <span className="text-sm font-medium text-muted-foreground">{portal} workspace</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <CopilotPanel />
            <UserButton />
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
