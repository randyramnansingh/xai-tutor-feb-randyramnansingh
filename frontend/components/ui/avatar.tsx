import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({ name, className }: { name: string; className?: string }) {
  const letter = (name?.[0] ?? "?").toUpperCase();
  return (
    <div
      className={cn(
        "grid h-6 w-6 place-items-center rounded-full border border-border bg-background text-xs font-medium",
        className
      )}
      aria-label={name}
      title={name}
    >
      {letter}
    </div>
  );
}
