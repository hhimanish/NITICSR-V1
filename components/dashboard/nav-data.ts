export type DashboardNavItem = {
  href: string;
  label: string;
};

export const corporateNav: DashboardNavItem[] = [
  { href: "/corporate", label: "Dashboard" },
  { href: "/corporate/discovery", label: "NGO Discovery" },
  { href: "/corporate/portfolio", label: "Portfolio" },
  { href: "/corporate/grants", label: "Grants" },
  { href: "/corporate/financials", label: "Financials" },
  { href: "/corporate/surveys", label: "Field Surveys" },
  { href: "/corporate/governance", label: "Governance" },
  { href: "/corporate/compliance", label: "Compliance" },
  { href: "/corporate/settings", label: "Settings" },
];

export const ngoNav: DashboardNavItem[] = [
  { href: "/ngo", label: "Dashboard" },
  { href: "/ngo/matches", label: "Corporate Matches" },
  { href: "/ngo/verification", label: "Verification" },
  { href: "/ngo/settings", label: "Settings" },
];

export const auditorNav: DashboardNavItem[] = [{ href: "/auditor", label: "Review Queue" }];
