"use client";

import { theme } from "../../theme";
import React from "react";

type MicButtonProps = {
  listening: boolean;
  onHoldStart: () => void; // empezar a grabar
  onHoldEnd: () => void; // soltar / terminar
};

export function MicButton({
  listening,
  onHoldStart,
  onHoldEnd,
}: MicButtonProps) {
  // manejamos mouse y touch para que funcione en celu
  const handleMouseDown = () => {
    onHoldStart();
  };

  const handleMouseUp = () => {
    onHoldEnd();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    onHoldStart();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    onHoldEnd();
  };

  return (
    <button
      type="button"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        width: 64,
        height: 64,
        borderRadius: theme.radius.round,
        border: `2px solid ${
          listening ? "transparent" : theme.colors.micIdleBorder
        }`,
        backgroundColor: listening
          ? theme.colors.micActiveBg
          : theme.colors.micIdleBg,
        color: listening
          ? theme.colors.micActiveText
          : theme.colors.textPrimary,
        fontSize: "1rem",
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
        boxShadow: listening
          ? "0 0 12px rgba(220,38,38,0.8)"
          : "0 4px 10px rgba(0,0,0,0.6)",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {/* ícono micrófono simple en SVG inline para no depender de librerías */}
      <svg
        width="24"
        height="24"
        fill="currentColor"
        viewBox="0 0 24 24"
        style={{ pointerEvents: "none" }}
      >
        <path d="M12 14c1.66 0 3-1.31 3-2.91V6.91C15 5.31 13.66 4 12 4s-3 1.31-3 2.91v4.18C9 12.69 10.34 14 12 14Zm5.5-2.91c0 2.53-2.24 4.59-5 4.59s-5-2.06-5-4.59H6c0 3.03 2.31 5.53 5.25 5.96V19H9v1h6v-1h-2.25v-2.95C15.69 16.62 18 14.12 18 11.09h-1.5Z" />
      </svg>
    </button>
  );
}
