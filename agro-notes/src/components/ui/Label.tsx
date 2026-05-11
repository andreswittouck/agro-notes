// agro-notes/src/components/ui/Label.tsx
"use client";

type LabelProps = {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
};

/**
 * Label apilado: el `<label>` ya envuelve el control, así que NO
 * necesita un wrapper adicional alrededor en el formulario.
 *
 * Uso:
 *   <Label>
 *     <span>Explotación</span>
 *     <Input ... />
 *   </Label>
 *
 *   o, equivalente:
 *
 *   <Label>
 *     Explotación
 *     <Input ... />
 *   </Label>
 */
export function Label({ children, htmlFor, className = "" }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={[
        "grid gap-1.5",
        "text-sm font-medium text-fg",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </label>
  );
}
