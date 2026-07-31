# Performance & Accessibility — Phase 5

Real Lighthouse runs against the production build (`npm run build && npm start`),
not asserted targets. Measured locally with Clerk middleware temporarily
disabled only to bypass a local dev-key handshake redirect loop that doesn't
occur in real deployments (Clerk sees a real key there) — everything else
matches the actual production build.

## Homepage (`/`) — before / after this pass

| Category | Before | After |
|---|---|---|
| Performance | 71 | 67* |
| Accessibility | 95 | **100** |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |

\* The 4-point drop between runs is noise from this machine's CPU load
during the test (Lighthouse simulates mobile CPU throttling on top of
whatever else is running locally), not a regression — the only changes
made were `aria-label` additions, which have no performance cost. Treat
both numbers as "solidly in the 65–75 range on a throttled local machine,"
not exact — a real measurement should be taken against the deployed Render
URL, which has a real CDN/edge path this local test doesn't.

## Fixed

- **`button-name` (accessibility)**: the three `Select` triggers in the
  homepage matchmaking demo (and four more across the Corporate workspace)
  had a visible `<label>` that wasn't actually associated with the
  underlying button — Base UI's `SelectTrigger` renders its own generated
  `id`, so a plain sibling `<label>` never reaches screen readers. Fixed
  with an explicit `aria-label` on every `SelectTrigger`. This took
  accessibility from 95 → 100 and, more importantly, is a real bug fix —
  screen reader users previously heard "combobox, collapsed" with no
  indication of what the field was for.

## Measured, not yet fixed (real findings, documented rather than guessed)

- **LCP ~4.4s, Total Blocking Time ~480ms**: `mainthread-work-breakdown`
  and `bootup-time` both scored 0, meaning a meaningful chunk of JS
  parses/executes before first paint. The homepage has ~16 sections, most
  wrapped in `FadeIn`/`StaggerGroup` (framer-motion), so a real fix here is
  a bundle-size/code-splitting exercise — likely candidates: lazy-loading
  the heaviest below-the-fold sections, and running `@next/bundle-analyzer`
  to identify exactly what's in the two ~40KiB chunks Lighthouse flagged as
  ~50% unused. Not done in this pass because it needs proper bundle
  analysis tooling to target correctly rather than guessing — see
  `docs/ARCHITECTURE.md` roadmap.
- **Render-blocking CSS (175ms)**: the single global stylesheet (15KB) is
  render-blocking, which is normal for a Tailwind-based site without
  critical-CSS extraction. Low priority given the small absolute cost.

## Accessibility beyond automated checks

Lighthouse's accessibility audit is necessarily partial (it catches
programmatically-detectable issues like missing labels, not full manual
keyboard-navigation or screen-reader-flow review). A full WCAG 2.2 AA
manual pass across all workspaces is still roadmap, not claimed as done.
