import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "ui-badge-base",
  {
    variants: {
      variant: {
        default: "ui-badge-default border-transparent",
        outline: "ui-badge-outline",
        success: "ui-badge-success border-transparent",
        warning: "ui-badge-warning border-transparent"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

function Badge({ className, variant, style, ...props }) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={style}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
