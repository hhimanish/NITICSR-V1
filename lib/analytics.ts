"use client";

/**
 * Analytics abstraction with no live provider wired yet — none has been
 * chosen (Plausible/PostHog/GA4 all need a real account + API key this
 * project doesn't have). This exists so call sites can start tracking
 * events now, and wiring a real provider later is a one-file change here,
 * not a rewrite of every call site.
 *
 * Respects consent: trackEvent() is a no-op until the user has accepted
 * analytics via the consent banner (components/site/consent-banner.tsx).
 */

const CONSENT_KEY = "niticsr-analytics-consent";

export type ConsentState = "accepted" | "rejected" | null;

export function getConsent(): ConsentState {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(CONSENT_KEY);
  return value === "accepted" || value === "rejected" ? value : null;
}

export function setConsent(state: "accepted" | "rejected") {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_KEY, state);
}

export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (getConsent() !== "accepted") return;

  // No provider configured yet — log in development only, so call sites
  // are exercised (and easy to verify) without pretending data is going
  // anywhere in production.
  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics:noop]", name, properties ?? {});
  }

  // Once a provider is chosen, wire it here, e.g.:
  //   window.plausible?.(name, { props: properties });
  // or:
  //   window.posthog?.capture(name, properties);
}
