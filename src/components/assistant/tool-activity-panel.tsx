import { useState } from "react";
import { Check, ChevronRight, Loader2, X } from "lucide-react";
import type { ToolActivity } from "@/lib/assistant-types";
import { cn } from "@/lib/utils";

function StatusIcon({ status }: { status: ToolActivity["status"] }) {
  if (status === "running")
    return <Loader2 className="size-3 animate-spin text-muted-foreground" />;
  if (status === "failed") return <X className="size-3 text-destructive" />;
  return <Check className="size-3 text-success" />;
}

export function ToolActivityPanel({ activity }: { activity: ToolActivity[] }) {
  const running = activity.some((a) => a.status === "running");
  const [open, setOpen] = useState(running);

  const summary = running
    ? activity.find((a) => a.status === "running")?.description
    : `${activity.length} step${activity.length === 1 ? "" : "s"} completed`;

  return (
    <div className="mb-2 border border-hairline bg-muted/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-muted"
      >
        <ChevronRight
          className={cn(
            "size-3 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
        />
        <span className="label-caps truncate">{summary}</span>
        {running && (
          <Loader2 className="ml-auto size-3 shrink-0 animate-spin text-muted-foreground" />
        )}
      </button>

      {open && (
        <ul className="space-y-1.5 border-t border-hairline px-3 py-2">
          {activity.map((a, i) => (
            <li key={`${a.name}-${i}`} className="flex items-center gap-2 text-xs">
              <StatusIcon status={a.status} />
              <span
                className={cn(
                  "truncate",
                  a.status === "completed" ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {a.description}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
