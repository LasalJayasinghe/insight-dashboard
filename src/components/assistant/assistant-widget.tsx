import { useEffect, useState } from "react";
import { Maximize2, Minimize2, Minus, X } from "lucide-react";
import { useAssistant } from "@/hooks/use-assistant";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AssistantMark } from "./assistant-mark";
import { ChatInput } from "./chat-input";
import { Conversation } from "./conversation";

type Mode = "closed" | "compact" | "minimized" | "expanded";

function HeaderButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-7 cursor-pointer place-items-center border border-transparent text-muted-foreground transition-colors hover:border-hairline hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}

export function AssistantWidget() {
  const [mode, setMode] = useState<Mode>("closed");
  const isMobile = useIsMobile();
  const { messages, isThinking, error, send } = useAssistant();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mode === "expanded") setMode("compact");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  const open = mode !== "closed";
  const expanded = mode === "expanded";
  const minimized = mode === "minimized";

  return (
    <>
      {/* Launcher */}
      {!open && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Ask AlertMe AI"
                onClick={() => setMode("compact")}
                className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex cursor-pointer items-center gap-2 border border-hairline bg-primary px-3.5 py-3 text-primary-foreground shadow-card transition-transform duration-200 hover:-translate-y-0.5 md:bottom-6 md:right-6"
              >
                <AssistantMark className="size-4" />
                <span className="label-caps hidden text-primary-foreground/80 sm:inline">
                  Ask AI
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">Ask AlertMe AI</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Expanded backdrop */}
      {open && expanded && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px]"
          onClick={() => setMode("compact")}
          aria-hidden
        />
      )}

      {open && (
        <section
          role="dialog"
          aria-label="AlertMe AI assistant"
          className={cn(
            "fixed z-50 flex flex-col border border-hairline bg-card shadow-card",
            expanded
              ? "inset-3 md:inset-x-[max(2rem,calc(50%-32rem))] md:inset-y-10"
              : minimized
                ? "bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 w-[min(22rem,calc(100vw-2rem))] md:bottom-6 md:right-6"
                : "inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] top-16 md:inset-auto md:bottom-6 md:right-6 md:top-auto md:h-[600px] md:w-[400px]",
          )}
        >
          {/* Header */}
          <header className="flex items-center gap-2.5 border-b border-hairline bg-card px-3 py-2.5">
            <div className="grid size-7 shrink-0 place-items-center border border-hairline bg-background text-foreground">
              <AssistantMark className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-semibold leading-tight text-foreground">
                AlertMe AI
              </p>
              <p className="flex items-center gap-1.5 text-[11px] leading-tight text-muted-foreground">
                <span className="size-1.5 rounded-full bg-success" aria-hidden />
                Online
              </p>
            </div>

            <HeaderButton
              label={minimized ? "Restore" : "Minimize"}
              onClick={() => setMode(minimized ? "compact" : "minimized")}
            >
              <Minus className="size-3.5" />
            </HeaderButton>
            {!isMobile && (
              <HeaderButton
                label={expanded ? "Exit full screen" : "Expand"}
                onClick={() => setMode(expanded ? "compact" : "expanded")}
              >
                {expanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
              </HeaderButton>
            )}
            <HeaderButton label="Close assistant" onClick={() => setMode("closed")}>
              <X className="size-3.5" />
            </HeaderButton>
          </header>

          {!minimized && (
            <>
              <Conversation
                messages={messages}
                isThinking={isThinking}
                error={error}
                onSend={send}
                expanded={expanded}
              />
              <div className={cn(expanded && "mx-auto w-full max-w-2xl")}>
                <ChatInput onSend={send} disabled={isThinking} autoFocusKey={mode} />
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}
