// agro-notes/src/components/ui/Button.tsx
"use client";

type Variant = "primary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-accent hover:bg-accent-hover text-fg border border-transparent",
  ghost:
    "bg-transparent hover:bg-card-hover text-fg border border-border-subtle hover:border-border-strong",
  danger:
    "bg-mic-active hover:brightness-110 text-fg border border-transparent",
  success:
    "bg-success hover:brightness-110 text-fg border border-transparent",
};

const SIZE: Record<Size, string> = {
  sm: "text-xs px-3 py-1.5",
  md: "text-sm px-3.5 py-2",
  lg: "text-base px-5 py-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-2",
        "font-medium rounded-lg",
        "transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        "cursor-pointer select-none",
        VARIANT[variant],
        SIZE[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
