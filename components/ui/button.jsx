import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "ui-btn-default",
        secondary: "ui-btn-secondary border",
        ghost: "ui-btn-ghost"
      },
      size: {
        default: "ui-btn-size-default",
        sm: "ui-btn-size-sm",
        lg: "ui-btn-size-lg"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

function Button({ className, variant, size, asChild = false, style, ...props }) {
  const Comp = asChild ? "span" : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      style={style}
      {...props}
    />
  );
}

export { Button, buttonVariants };
