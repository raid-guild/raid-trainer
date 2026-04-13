import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)]",
        outline: "border-[color:var(--border)] bg-transparent text-[color:var(--muted-foreground)]",
        success: "border-transparent bg-[color:var(--success-soft)] text-[color:var(--success-strong)]",
        warning: "border-transparent bg-[color:var(--warning-soft)] text-[color:var(--warning-strong)]"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
