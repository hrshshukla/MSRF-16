import type { ReactNode, Ref } from "react";

interface MyThoughtQuoteProps {
  children: string;
  className?: string;
  textClassName?: string;
  textRef?: Ref<HTMLParagraphElement>;
  highlightLead?: boolean;
  action?: ReactNode;
}

export function MyThoughtQuote({
  children,
  className = "",
  textClassName = "",
  textRef,
  highlightLead = false,
  action,
}: MyThoughtQuoteProps) {
  const [lead, ...remainingLines] = children.split("\n");
  const rest = remainingLines.join("\n");

  return (
    <blockquote
      className={`relative px-5 py-2 ${className}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-1 -top-2 font-serif text-5xl font-black leading-none text-primary/35"
      >
        “
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-4 -right-1 font-serif text-5xl font-black leading-none text-primary/30"
      >
        ”
      </span>
      <p
        ref={textRef}
        className={`relative whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base ${textClassName}`}
      >
        {highlightLead && rest ? (
          <>
            <strong className="font-semibold text-foreground">{lead}</strong>
            {" "}
            {rest.replace(/\s*\n\s*/g, " ")}
          </>
        ) : (
          children
        )}
        {action}
      </p>
    </blockquote>
  );
}