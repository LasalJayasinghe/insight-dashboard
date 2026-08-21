import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Markdown renderer tuned to the AlertMe editorial tokens.
 * Numbers, deltas and tables read as financial copy, not chat filler.
 */
export function MessageMarkdown({ content }: { content: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="[&:not(:first-child)]:mt-3">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="mt-2 space-y-1.5 [&>li]:relative [&>li]:pl-4">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 marker:font-mono marker:text-xs marker:text-muted-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="before:absolute before:left-0 before:top-[0.55em] before:size-1 before:bg-hairline">
              {children}
            </li>
          ),
          a: ({ children, href }) => (
            <a href={href} className="underline underline-offset-2 hover:text-accent">
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="bg-muted px-1 py-0.5 font-mono text-[0.8em] tabular-nums">
              {children}
            </code>
          ),
          hr: () => <hr className="border-hairline" />,
          table: ({ children }) => (
            <div className="mt-3 overflow-x-auto border border-hairline">
              <table className="w-full border-collapse text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
          th: ({ children, style }) => (
            <th
              style={style}
              className="label-caps border-b border-hairline px-2.5 py-2 text-left"
            >
              {children}
            </th>
          ),
          td: ({ children, style }) => (
            <td
              style={style}
              className={cn(
                "border-b border-hairline px-2.5 py-2 font-mono tabular-nums last:border-0",
              )}
            >
              {children}
            </td>
          ),
          tr: ({ children }) => <tr className="last:[&>td]:border-b-0">{children}</tr>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
