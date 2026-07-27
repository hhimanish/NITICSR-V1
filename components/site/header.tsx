"use client";

import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const solutions = [
  {
    href: "/solutions/corporate",
    label: "Corporate CSR",
    description: "Discover, verify, and fund NGO partners with audit-ready compliance.",
  },
  {
    href: "/solutions/ngos",
    label: "NGOs",
    description: "Get discovered by verified corporate CSR budgets aligned to your cause.",
  },
  {
    href: "/solutions/auditors",
    label: "Auditors",
    description: "Independent verification tooling for Schedule VII compliance review.",
  },
];

const primaryLinks = [
  { href: "/platform", label: "Platform" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Knowledge Center" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            N
          </span>
          NITICSR
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          <Link
            href="/platform"
            className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
          >
            Platform
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground data-popup-open:bg-muted data-popup-open:text-foreground">
              Solutions
              <ChevronDown className="size-3.5" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80 p-2">
              {solutions.map((item) => (
                <DropdownMenuItem
                  key={item.href}
                  render={<Link href={item.href} />}
                  className="flex-col items-start gap-0.5 rounded-md p-3"
                >
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {primaryLinks.slice(1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" size="sm" render={<Link href="/corporate" />}>
            Corporate login
          </Button>
          <Button variant="ghost" size="sm" render={<Link href="/ngo" />}>
            NGO login
          </Button>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button size="sm" render={<Link href="/contact" />}>
            Get started
          </Button>
        </div>

        <Sheet>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
            <Menu />
            <span className="sr-only">Open menu</span>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-sm">
            <SheetHeader>
              <SheetTitle>NITICSR</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4" aria-label="Mobile">
              {primaryLinks.map((link) => (
                <SheetClose
                  key={link.href}
                  render={<Link href={link.href} />}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                >
                  {link.label}
                </SheetClose>
              ))}
              <p className="px-3 pt-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Solutions
              </p>
              {solutions.map((item) => (
                <SheetClose
                  key={item.href}
                  render={<Link href={item.href} />}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                >
                  {item.label}
                </SheetClose>
              ))}
            </nav>
            <div className="flex flex-col gap-2 border-t border-border p-4">
              <Button variant="outline" render={<Link href="/corporate" />}>
                Corporate login
              </Button>
              <Button variant="outline" render={<Link href="/ngo" />}>
                NGO login
              </Button>
              <Button render={<Link href="/contact" />}>Get started</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
