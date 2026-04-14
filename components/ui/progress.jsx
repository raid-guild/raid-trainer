import { cn } from "../../lib/utils";

function Progress({ className, value = 0, ...props }) {
  return (
    <div
      className={cn("ui-progress-track", className)}
      {...props}
    >
      <div
        className="ui-progress-bar"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export { Progress };
