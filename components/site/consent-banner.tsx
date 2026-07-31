"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getConsent, setConsent } from "@/lib/analytics";

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === null);
  }, []);

  if (!visible) return null;

  function handle(choice: "accepted" | "rejected") {
    setConsent(choice);
    setVisible(false);
  }

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 p-4 backdrop-blur-md sm:p-6"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use minimal analytics to understand how this site is used. No analytics provider is
          connected yet, so nothing is collected either way — this banner just sets your preference
          for once one is.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => handle("rejected")}>
            Decline
          </Button>
          <Button size="sm" onClick={() => handle("accepted")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
