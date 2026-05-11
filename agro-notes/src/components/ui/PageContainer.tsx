// agro-notes/src/components/ui/PageContainer.tsx
"use client";

type PageContainerProps = {
  children: React.ReactNode;
  /** maxWidth opcional. Si no se pasa, usa el ancho default (980px). */
  maxWidth?: string;
};

/**
 * Contenedor principal de cada página.
 * Usa <main> y centra el contenido con un maxWidth controlable.
 */
export function PageContainer({ children, maxWidth }: PageContainerProps) {
  return (
    <main
      style={maxWidth ? { maxWidth } : undefined}
      className="
        mx-auto
        flex flex-col gap-4
        px-4 py-6
        sm:px-6 sm:py-8
        max-w-[980px]
        w-full
      "
    >
      {children}
    </main>
  );
}
