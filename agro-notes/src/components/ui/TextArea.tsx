// agro-notes/src/components/ui/TextArea.tsx
"use client";
import { theme } from "../../theme";

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { full?: boolean }
) {
  const { style, full, ...rest } = props;
  return (
    <textarea
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
