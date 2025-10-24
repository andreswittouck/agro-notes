// agro-notes/src/components/ui/Card.tsx
"use client";
import { theme } from "../../theme";

export function Card({
  children,
  padding = 3, // 12px
}: {
  children: React.ReactNode;
  padding?: number;
}) {
  return (
    <section
      style={{
        backgroundColor: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing(padding),
        width: "100%",
      }}
    >
      {children}
    </section>
  );
}
