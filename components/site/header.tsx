"use client";

import Link from "next/link";
import { Menu, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MegaMenu } from "@/components/design-system/mega-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/site/theme-toggle";

const solutionsColumns = [
  {
    heading: "Solutions",
    items: [
      { href: "/solutions/corporate", label: "Corporate CSR", description: "Discover, verify, and fund NGO partners." },
      { href: "/solutions/ngos", label: "NGOs", description: "Get discovered by verified CSR budgets." },
      { href: "/solutions/auditors", label: "Auditors", description: "Independent verification tooling." },
    ],
  },
  {
    heading: "Capabilities",
    items: [
      { href: "/esg", label: "ESG & Sustainability", description: "SDG alignment grounded in project data." },
      { href: "/compliance-automation", label: "Compliance Automation", description: "Records structured for CSR-2." },
      { href: "/grant-management", label: "Grant Management", description: "Proposal to renewal, one system of record." },
      { href: "/financial-operations", label: "Financial Operations", description: "Budget, utilization, and unspent-fund transfers." },
      { href: "/project-execution", label: "Project Execution", description: "Programs, milestones, risks, and change requests." },
      { href: "/field-intelligence", label: "Field Intelligence", description: "GPS check-ins, asset register, and surveys." },
      { href: "/risk-assurance", label: "Risk, Audit & Assurance", description: "Continuous controls, risk register, and CAPA." },
      { href: "/platform-services", label: "Platform Services", description: "Feature flags, jobs, logging, tenant isolation." },
      { href: "/ai", label: "AI Capabilities", icon: Sparkles, description: "What's live, in progress, and roadmap." },
      { href: "/security", label: "Security & Trust", icon: ShieldCheck, description: "Auth, RBAC, and data handling." },
    ],
  },
];

const flatSolutionsLinks = solutionsColumns.flatMap((c) => c.items);

const primaryLinks = [
  { href: "/platform", label: "Platform" },
  { href: "/resources", label: "Resources" },
  { href: "/developers", label: "Developers" },
  { href: "/pricing", label: "Pricing" },
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

          <MegaMenu label="Solutions" columns={solutionsColumns} />

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
          <ThemeToggle />
          <Button variant="ghost" size="sm" render={<Link href="/corporate" />}>
            Corporate login
          </Button>
          <Button variant="ghost" size="sm" render={<Link href="/ngo" />}>
            NGO login
          </Button>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button size="sm" render={<Link href="/request-demo" />}>
            Request demo
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
                Solutions &amp; capabilities
              </p>
              {flatSolutionsLinks.map((item) => (
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
              <Button render={<Link href="/request-demo" />}>Request demo</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
