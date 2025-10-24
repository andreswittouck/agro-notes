"use client";

import { useRouter } from "next/navigation";
import { theme } from "../../theme";

export function BackButton({
  href,
  label = "Volver",
}: {
  href?: string;
  label?: string;
}) {
  const router = useRouter();

  const go = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      type="button"
      onClick={go}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        backgroundColor: "transparent",
        border: `1px solid ${theme.colors.border}`,
        color: theme.colors.textPrimary,
        fontSize: "0.8rem",
        borderRadius: theme.radius.sm,
        padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
        cursor: "pointer",
      }}
    >
      {/* Flecha izquierda simple en SVG */}
      <svg
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 24 24"
        style={{ display: "block" }}
      >
        <path d="M14 7l-5 5 5 5V7z" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
