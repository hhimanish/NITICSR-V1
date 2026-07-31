"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type MegaMenuColumn = {
  heading: string;
  items: { href: string; label: string; description?: string; icon?: LucideIcon }[];
};

export function MegaMenu({ label, columns }: { label: string; columns: MegaMenuColumn[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground data-popup-open:bg-muted data-popup-open:text-foreground">
        {label}
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[min(90vw,44rem)] p-4">
        <div
          className="grid gap-x-6 gap-y-4"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        >
          {columns.map((column) => (
            <div key={column.heading}>
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {column.heading}
              </p>
              <ul className="mt-2 space-y-1">
                {column.items.map((item) => (
                  <li key={item.href}>
                    <DropdownMenuItem
                      render={<Link href={item.href} />}
                      className="flex-col items-start gap-0.5 rounded-md p-2"
                    >
                      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        {item.icon && <item.icon className="size-3.5 text-muted-foreground" aria-hidden="true" />}
                        {item.label}
                      </span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      )}
                    </DropdownMenuItem>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
