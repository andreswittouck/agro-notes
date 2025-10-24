// agro-notes/src/components/ui/Label.tsx
"use client";
import { theme } from "../../theme";

export function Label({
  children,
  htmlFor,
  style,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  style?: React.CSSProperties;
}) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        color: theme.colors.textSecondary,
        fontSize: "0.8rem",
        display: "grid",
        gap: theme.spacing(1),
        fontWeight: 500,
        ...style,
      }}
    >
      {children}
    </label>
  );
}
