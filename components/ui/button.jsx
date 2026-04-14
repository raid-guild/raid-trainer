import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "ui-btn-base inline-flex",
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
