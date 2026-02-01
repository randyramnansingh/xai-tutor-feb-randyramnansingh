import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-1 text-xs",
  {
    variants: {
      variant: {
        neutral: "bg-secondary text-secondary-foreground",
        success:
          "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100",
        warning:
          "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100",
        destructive:
          "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
