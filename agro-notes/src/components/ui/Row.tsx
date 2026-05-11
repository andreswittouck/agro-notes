// agro-notes/src/components/ui/Row.tsx
"use client";

type RowProps = {
  children: React.ReactNode;
  /** Si querés permitir wrap en pantallas chicas (default: true). */
  wrap?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function Row({
  children,
  wrap = true,
  className = "",
  style,
}: RowProps) {
  return (
    <div
      style={style}
      className={[
        "flex items-center w-full gap-2",
        wrap ? "flex-wrap" : "flex-nowrap",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
