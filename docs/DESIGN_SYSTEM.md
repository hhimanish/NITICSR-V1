# NITICSR Design System

A single, shared visual language for the marketing site today and the
Corporate/NGO/Auditor portals as they're built out. Everything below lives in
this one Next.js app (`app/globals.css`, `components/ui/`,
`components/design-system/`) — there's no separate design-system package,
since there's exactly one app consuming it. Splitting it out only makes
sense once a second app (e.g. a future standalone docs site or admin tool)
actually needs to import it independently.

## Tokens

Defined as CSS custom properties in `app/globals.css`, consumed via Tailwind
v4's `@theme inline` block — so every token is available as both a CSS
variable (`var(--primary)`) and a Tailwind utility (`bg-primary`).

| Token | Role |
|---|---|
| `--primary` (Navy `#0F172A`) | Primary brand color, headings, dark surfaces |
| `--secondary` (Emerald `#059669`) | Success/verified states, secondary actions |
| `--accent` (Amber `#F59E0B`) | Attention/pending states, highlights |
| `--info` (Sky `#0EA5E9`) | Informational accents, focus rings |
| `--background` / `--card` | Page background vs. elevated surface |
| `--border` / `--muted` | Dividers and low-emphasis fills |
| `--destructive` | Errors, rejected/expired states |
| `--radius` (0.75rem base) | Border radius scale (`--radius-sm` … `--radius-4xl` derive from it) |
| `--font-sans` (Geist) | UI/body text |
| `--font-numeric` (IBM Plex Sans) | Stats, KPIs, scores — tabular figures |
| `--font-mono` (JetBrains Mono) | Code, data snippets |

Both light and dark themes are defined (`:root` / `.dark`); components should
never hardcode a hex color — always a token.

## Motion tokens

`components/motion/`: `FadeIn`, `StaggerGroup`/`StaggerItem`, `AnimatedCounter`.
All respect `prefers-reduced-motion` (see the `@media` block in
`globals.css` and the `useReducedMotion()` checks in each component) — this
is enforced at the component level, not left to each call site to remember.

## Components

### `components/ui/` — shadcn primitives
Button, Card, Accordion, Badge, Input, Textarea, Label, Select, Separator,
Sheet, Tooltip, DropdownMenu, NavigationMenu. Generated via the shadcn CLI
(`npx shadcn add ...`), built on Base UI (`@base-ui/react`) rather than
Radix — note the `render` prop pattern for polymorphism (e.g.
`<Button render={<Link href="/x" />}>`) instead of Radix's `asChild`.

### `components/design-system/` — composed, product-specific
- **`KpiCard`** — labeled stat tile with an animated count-up and optional trend arrow. Used in dashboards and the Executive Analytics preview.
- **`VerificationBadge`** — status pill (verified/pending/expired) for a document or check, used wherever `ngo_documents`/`verification_checks` status is shown.
- **`TrustScoreWidget`** — radial 0–100 gauge with an optional component breakdown, mirroring `ngo_trust_scores`.
- **`Timeline`** — horizontal (desktop) / stacked (mobile) step flow, used for the CSR Lifecycle section.
- **`MegaMenu`** — multi-column dropdown nav, used for the header's "Solutions" menu.
- **`Breadcrumbs`** — visible breadcrumb nav that also emits a `BreadcrumbList` JSON-LD block.

### Documented, not yet built
These come up in the Phase 3 brief but have no concrete page needing them
yet — building them now would be speculative abstraction with no real
usage to validate the API shape against:
- **Command palette (⌘K)** — worth building once there's enough cross-site content (NGOs, projects, docs) to actually search across.
- **Generic data table** — worth building once there's a real tabular dataset to page/sort/filter (e.g. a public verified-NGO directory).

## Content model

Structured content lives as either DB rows (NGO profiles, CSR projects —
see `docs/ARCHITECTURE.md`) or MDX files with typed frontmatter manifests
(blog: `lib/blog-posts.ts` + `app/(marketing)/blog/*/page.mdx`; case studies:
`lib/case-studies.ts` + `app/(marketing)/case-studies/*/page.mdx`). Both
follow the same pattern: a manifest array for listing/metadata, MDX files
for body content, so adding a new article is "add one manifest entry + one
`.mdx` file," not a schema change.
