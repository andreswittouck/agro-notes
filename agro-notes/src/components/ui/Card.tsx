// agro-notes/src/components/ui/Card.tsx
"use client";
import { theme } from "../../theme";

export function Card({
  children,
  padding = 3, // 12px
  full,
}: {
  children: React.ReactNode;
  padding?: number;
  full?: boolean;
}) {
  return (
    <section
      style={{
        backgroundColor: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing(padding),
        width: full ? "100%" : undefined,
      }}
    >
      {children}
    </section>
  );
}
