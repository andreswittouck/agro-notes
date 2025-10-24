// agro-notes/src/components/ui/Input.tsx
"use client";
import { theme } from "../../theme";

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & { full?: boolean }
) {
  const { style, full, ...rest } = props;
  return (
    <input
      {...rest}
      style={{
        width: full ? "100%" : undefined,
        backgroundColor: theme.colors.bgPage,
        color: theme.colors.textPrimary,
        borderRadius: theme.radius.sm,
        border: `1px solid ${theme.colors.border}`,
        padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
        fontSize: "0.95rem",
        lineHeight: 1.4,
        minWidth: 0,
        ...style,
      }}
    />
  );
}
