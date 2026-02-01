import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({ name, src, className }: { name: string; src?: string; className?: string }) {
  const letter = (name?.[0] ?? "?").toUpperCase();
  return (
    <div
      className={cn(
        "relative grid h-6 w-6 place-items-center overflow-hidden rounded-full border border-border bg-background text-xs font-medium",
        className
      )}
      aria-label={name}
      title={name}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        letter
      )}
    </div>
  );
}

export function AvatarGroup({
  people,
  max = 3,
  className,
}: {
  people: Array<{ name: string; src?: string }>;
  max?: number;
  className?: string;
}) {
  const shown = people.slice(0, max);
  const remaining = Math.max(people.length - shown.length, 0);
  return (
    <div className={cn("flex -space-x-2 overflow-hidden", className)}>
      {shown.map((p, i) => (
        <Avatar key={`${p.name}-${i}`} name={p.name} src={p.src} className="h-6 w-6" />
      ))}
      {remaining > 0 && (
        <div className="grid h-6 w-6 place-items-center rounded-full border border-border bg-background text-[10px] font-medium">
          +{remaining}
        </div>
      )}
    </div>
  );
}
