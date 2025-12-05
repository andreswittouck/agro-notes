// agro-notes/src/app/layout.tsx
import "./globals.css";
import Image from "next/image";
import { theme } from "../theme";
import { PWARegister } from "../components/PWARegister"; // 👈 importar

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/agro-notes-logo512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link
          rel="icon"
          href="/icons/agro-notes-logo.png"
          type="image/svg+xml"
        />
        <meta name="theme-color" content={theme.colors.bgPage} />
        <title>Agro Notes</title>
      </head>
      <body
        style={{
          margin: 0,
          backgroundColor: theme.colors.bgPage,
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamily,
        }}
      >
        {/* 👇 Registramos el SW apenas carga el body */}
        <PWARegister />

        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: theme.spacing(4),
            borderBottom: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.bgCard,
          }}
        >
          <Image
            src="/icons/agro-notes-logo.svg"
            alt="Agro Notes logo"
            width={45}
            height={45}
            style={{
              marginRight: theme.spacing(2),
              objectFit: "contain",
            }}
          />
          <h1
            style={{
              margin: 0,
              fontSize: "1.2rem",
              fontWeight: 600,
              color: theme.colors.textPrimary,
            }}
          >
            Agro Notes
          </h1>
        </header>

        <main>{children}</main>
      </body>
    </html>
  );
}
