// agro-notes/src/components/ui/Card.tsx
"use client";

type CardProps = {
  children: React.ReactNode;
  /**
   * Padding en escala spacing(n) — equivalente a `p-{n}` en Tailwind:
   *   3 → p-3 (12px), 4 → p-4 (16px), etc.
   * Default: 4.
   */
  padding?: 2 | 3 | 4 | 5 | 6;
  full?: boolean;
  className?: string;
};

const PADDING_CLASS: Record<NonNullable<CardProps["padding"]>, string> = {
  2: "p-2",
  3: "p-3",
  4: "p-4",
  5: "p-5",
  6: "p-6",
};

export function Card({
  children,
  padding = 4,
  full,
  className = "",
}: CardProps) {
  return (
    <section
      className={[
        "bg-card",
        "border border-border-subtle",
        "rounded-xl",
        "shadow-[var(--shadow-card)]",
        PADDING_CLASS[padding],
        full ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}
