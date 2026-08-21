import { cn } from "@/lib/utils";

/** Minimal AlertMe AI mark — a spark drawn from market ticks. */
export function AssistantMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="square"
      className={cn("size-4", className)}
      aria-hidden
    >
      <path d="M12 2.5 13.9 9l6.6 1.9-6.6 1.9L12 19.4l-1.9-6.6L3.5 10.9 10.1 9 12 2.5Z" />
      <path d="M18.5 16.5v4M16.5 18.5h4" />
    </svg>
  );
}
