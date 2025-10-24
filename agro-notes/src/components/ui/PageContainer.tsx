// agro-notes/src/components/ui/PageContainer.tsx
"use client";
import { theme } from "../../theme";

export function PageContainer({
  children,
  maxWidth,
}: {
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <main
      style={{
        minHeight: "100dvh",
        backgroundColor: theme.colors.bgPage,
        color: theme.colors.textPrimary,
        fontFamily: theme.fontFamily,
        padding: theme.spacing(6), // 24px
        maxWidth: maxWidth ?? theme.maxWidthPage,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(4),
      }}
    >
      {children}
    </main>
  );
}
