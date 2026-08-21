import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatInput({
  onSend,
  disabled,
  autoFocusKey,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  autoFocusKey?: string | number;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [autoFocusKey]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    requestAnimationFrame(() => ref.current?.focus());
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-end gap-2 border-t border-hairline bg-card p-2.5"
    >
      <label htmlFor="alertme-ai-input" className="sr-only">
        Ask about your portfolio
      </label>
      <textarea
        id="alertme-ai-input"
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Ask about your portfolio..."
        className="min-h-9 flex-1 resize-none bg-transparent px-1.5 py-2 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground scrollbar-thin"
      />
      <button
        type="submit"
        aria-label="Send message"
        disabled={!value.trim() || disabled}
        className={cn(
          "grid size-9 shrink-0 place-items-center border border-hairline transition-colors",
          !value.trim() || disabled
            ? "cursor-not-allowed bg-muted text-muted-foreground"
            : "cursor-pointer bg-primary text-primary-foreground hover:bg-primary-glow",
        )}
      >
        <ArrowUp className="size-4" />
      </button>
    </form>
  );
}
