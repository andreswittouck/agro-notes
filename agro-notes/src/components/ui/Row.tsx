// agro-notes/src/components/ui/Row.tsx
"use client";
import { theme } from "../../theme";

export function Row({
  children,
  wrapOnMobile = true,
  style,
}: {
  children: React.ReactNode;
  wrapOnMobile?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: wrapOnMobile ? "wrap" : "nowrap",
        gap: theme.spacing(2),
        alignItems: "center",
        width: "100%",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
