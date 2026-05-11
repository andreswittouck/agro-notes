// agro-notes/src/components/ui/MicButton.tsx
"use client";

import React from "react";

type MicButtonProps = {
  listening: boolean;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  /** size del botón en px. Default 64. */
  size?: number;
  /**
   * Nivel de audio en [0, 1]. Si se pasa, el anillo del mic pulsa
   * proporcional a la voz real. Si no se pasa, queda la animación CSS
   * estándar (`animate-mic-pulse`).
   */
  level?: number;
  /** Texto accesible. Default "Hablar". */
  ariaLabel?: string;
};

export function MicButton({
  listening,
  onHoldStart,
  onHoldEnd,
  size = 64,
  level,
  ariaLabel = "Hablar",
}: MicButtonProps) {
  // En iOS preventDefault en touchstart/end ayuda a evitar que el
  // sistema dispare un click sintético después.
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    onHoldStart();
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    onHoldEnd();
  };

  const hasLevel = level !== undefined;
  const safeLevel = Math.max(0, Math.min(1, level ?? 0));

  // Glow proporcional al nivel de audio. Mientras `listening` está
  // activo, garantizamos un mínimo (8/4) para que el botón siempre
  // luzca "vivo" aun en silencio absoluto.
  const dynamicStyle: React.CSSProperties =
    hasLevel && listening
      ? {
          boxShadow: `0 0 ${8 + safeLevel * 32}px ${
            4 + safeLevel * 16
          }px rgba(220, 38, 38, ${0.25 + safeLevel * 0.6})`,
          transform: `scale(${1 + safeLevel * 0.06})`,
        }
      : {};

  // Solo usamos la animación CSS de pulso cuando NO tenemos `level`
  // (porque entonces el glow inline no está dando feedback).
  const useCssPulse = listening && !hasLevel;

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={listening}
      onMouseDown={onHoldStart}
      onMouseUp={onHoldEnd}
      onMouseLeave={onHoldEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={onHoldEnd}
      style={{
        width: size,
        height: size,
        touchAction: "none",
        // transition rápida para que el glow siga la voz sin verse "saltón"
        transition: "transform 60ms linear, box-shadow 60ms linear",
        ...dynamicStyle,
      }}
      className={[
        "rounded-full inline-flex items-center justify-center",
        "transition-colors duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page",
        "select-none cursor-pointer",
        listening
          ? [
              "bg-mic-active text-fg border-2 border-transparent",
              useCssPulse
                ? "shadow-[var(--shadow-mic-active)] animate-mic-pulse"
                : "",
            ].join(" ")
          : "bg-card text-fg border-2 border-border-strong hover:border-accent hover:bg-card-hover shadow-md",
      ].join(" ")}
    >
      <svg
        width={Math.round(size * 0.4)}
        height={Math.round(size * 0.4)}
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ pointerEvents: "none" }}
      >
        <path d="M12 14c1.66 0 3-1.31 3-2.91V6.91C15 5.31 13.66 4 12 4s-3 1.31-3 2.91v4.18C9 12.69 10.34 14 12 14Zm5.5-2.91c0 2.53-2.24 4.59-5 4.59s-5-2.06-5-4.59H6c0 3.03 2.31 5.53 5.25 5.96V19H9v1h6v-1h-2.25v-2.95C15.69 16.62 18 14.12 18 11.09h-1.5Z" />
      </svg>
    </button>
  );
}
