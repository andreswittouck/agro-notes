// agro-notes/src/components/ui/Input.tsx
"use client";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  full?: boolean;
};

export function Input({
  full = true,
  className = "",
  ...rest
}: InputProps) {
  return (
    <input
      {...rest}
      className={[
        full ? "w-full" : "",
        "bg-page text-fg placeholder:text-fg-subtle",
        "border border-border-subtle hover:border-border-strong",
        "rounded-lg",
        "px-3 py-2 text-sm",
        "leading-relaxed min-w-0",
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
