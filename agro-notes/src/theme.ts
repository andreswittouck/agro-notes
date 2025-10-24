// agro-notes/src/theme.ts
export const theme = {
  colors: {
    bgPage: "#0f172a", // fondo app (azul gris oscuro tipo slate-900)
    bgCard: "#1e2537", // tarjetas / inputs
    bgAccent: "#3b82f6", // botones primarios (azul)
    bgAccentHover: "#2563eb",

    micIdleBg: "#1e2537",
    micIdleBorder: "rgba(255,255,255,0.2)",
    micActiveBg: "#dc2626", // rojo grabando
    micActiveText: "#fff",

    textPrimary: "#fff",
    textSecondary: "#94a3b8", // slate-400
    border: "rgba(255,255,255,0.08)",
    warningBg: "#fff6bf",
    warningText: "#4a3b00",
  },

  radius: {
    sm: "8px",
    md: "12px",
    lg: "20px",
    round: "999px",
  },

  spacing: (n: number) => `${n * 4}px`, // spacing(3) = 12px
  fontFamily:
    "system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif",
  maxWidthPage: "980px",
  maxWidthForm: "820px",
};
