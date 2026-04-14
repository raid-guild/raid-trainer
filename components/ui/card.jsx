import { cn } from "../../lib/utils";

function Card({ className, ...props }) {
  return (
    <section
      className={cn(
        "ui-card-base",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return <header className={cn("flex flex-col gap-3 p-6", className)} {...props} />;
}

function CardTitle({ className, ...props }) {
  return (
    <h2
      className={cn(
        "ui-card-title text-xl font-semibold",
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }) {
  return <p className={cn("ui-text-muted text-sm leading-6", className)} {...props} />;
}

function CardContent({ className, ...props }) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardHeader, CardTitle };
