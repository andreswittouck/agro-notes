// agro-notes/src/app/layout.tsx
import Image from "next/image";
import { theme } from "../theme";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
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
