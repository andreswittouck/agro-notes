// agro-notes/src/components/ui/TextArea.tsx
"use client";

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  full?: boolean;
};

export function TextArea({
  full = true,
  className = "",
  ...rest
}: TextAreaProps) {
  return (
    <textarea
      {...rest}
      className={[
        full ? "w-full" : "",
        "bg-page text-fg placeholder:text-fg-subtle",
        "border border-border-subtle hover:border-border-strong",
        "rounded-lg",
        "px-3 py-2 text-sm leading-relaxed",
        "min-w-0 resize-y",
        "transition-colors duration-150",
        "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/40",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
