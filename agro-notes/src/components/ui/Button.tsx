// agro-notes/src/components/ui/Button.tsx
"use client";
import { theme } from "../../theme";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({ variant = "primary", style, ...props }: ButtonProps) {
  const base: React.CSSProperties = {
    borderRadius: theme.radius.sm,
    padding: `${theme.spacing(2)} ${theme.spacing(3)}`, // 8px 12px
    fontSize: "0.9rem",
    fontWeight: 500,
    border: "none",
    cursor: "pointer",
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: theme.colors.bgAccent,
      color: "#fff",
    },
    ghost: {
      backgroundColor: "transparent",
      color: theme.colors.textPrimary,
      border: `1px solid ${theme.colors.border}`,
    },
  };

  return (
    <button
      {...props}
      style={{
        ...base,
        ...variants[variant],
        ...style,
        opacity: props.disabled ? 0.6 : 1,
      }}
    />
  );
}
