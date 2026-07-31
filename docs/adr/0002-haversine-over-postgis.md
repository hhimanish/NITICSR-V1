# ADR 0002: Plain-SQL Haversine over PostGIS for geo radius search

**Status:** Accepted (revisit when polygon/heatmap queries are needed)

## Context

Phase 2 needed "find CSR projects/NGOs within a radius" search. PostGIS is
the standard tool for this, but it's a Postgres extension that may not be
enabled on every managed Postgres tier, and adds a `geometry` column/index
type most of the schema doesn't otherwise need.

## Decision

Store plain `latitude`/`longitude` NUMERIC columns and compute distance
in-query with the Haversine formula, using `least`/`greatest` clamping to
guard against floating-point rounding pushing `acos()` input outside
`[-1, 1]` (which would return `NaN`).

## Consequences

- Works on any Postgres instance, no extension or superuser access needed.
- Correct for radius search (see `lib/geo-search.test.ts`, verified against
  real coordinates in CI).
- Doesn't support polygon search, true heatmap aggregation, or spatial
  indexing (a Haversine `WHERE` clause can't use a spatial index, so it's
  a full scan — fine at current NGO/project counts, would need revisiting
  at large scale).
- Revisit: adding a PostGIS `geometry` column alongside the existing
  lat/lng is a small additive migration whenever polygon queries or
  heatmaps are actually needed — no need to migrate preemptively.
