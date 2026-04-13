import { cn } from "../../lib/utils";

function Card({ className, ...props }) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] shadow-[0_18px_60px_rgba(15,23,42,0.08)]",
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
        "font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.03em] text-[color:var(--foreground)]",
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }) {
  return <p className={cn("text-sm leading-6 text-[color:var(--muted-foreground)]", className)} {...props} />;
}

function CardContent({ className, ...props }) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardHeader, CardTitle };
