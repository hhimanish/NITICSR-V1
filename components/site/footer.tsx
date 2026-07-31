import Link from "next/link";

const columns = [
  {
    title: "Platform",
    links: [
      { href: "/platform", label: "Platform overview" },
      { href: "/pricing", label: "Pricing" },
      { href: "/#matchmaking", label: "AI matchmaking demo" },
      { href: "/#verification-vault", label: "Verification Vault" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { href: "/solutions/corporate", label: "Corporate CSR" },
      { href: "/solutions/ngos", label: "NGOs" },
      { href: "/solutions/auditors", label: "Auditors" },
      { href: "/esg", label: "ESG & Sustainability" },
      { href: "/compliance-automation", label: "Compliance Automation" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/blog", label: "Knowledge Center" },
      { href: "/case-studies", label: "Case Studies" },
      { href: "/resources/product-updates", label: "Product Updates" },
      { href: "/developers/api-docs", label: "API Documentation" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/ai", label: "AI Capabilities" },
      { href: "/security", label: "Security & Trust" },
      { href: "/careers", label: "Careers" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Get started",
    links: [
      { href: "/corporate", label: "Corporate login" },
      { href: "/ngo", label: "NGO login" },
      { href: "/request-demo", label: "Request demo" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-7">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                N
              </span>
              NITICSR
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              India&apos;s enterprise operating system for Corporate CSR — verified NGO
              discovery, AI matchmaking, and Schedule VII compliance in one platform.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="font-heading text-sm font-semibold text-foreground">{column.title}</h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} NITICSR Technologies Pvt. Ltd. All rights reserved.</p>
          <p>Built for India&apos;s CSR compliance era.</p>
        </div>
      </div>
    </footer>
  );
}
