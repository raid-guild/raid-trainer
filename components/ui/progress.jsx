import { cn } from "../../lib/utils";

function Progress({ className, value = 0, ...props }) {
  return (
    <div
      className={cn("h-3 w-full overflow-hidden rounded-full bg-[color:var(--panel-strong)]", className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--primary-strong))] transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export { Progress };
