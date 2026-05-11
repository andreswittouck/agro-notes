// agro-notes/src/app/layout.tsx
import "./globals.css";
import { theme } from "../theme";
import { PWARegister } from "../components/PWARegister";
import { AuthProvider } from "../contexts/AuthContext";
import { MeProvider } from "../contexts/MeContext";
import { Header } from "../components/Header";
import { Toaster } from "../components/Toaster";

export const metadata = {
  title: "Agro Notes",
};

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
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <link
          rel="icon"
          href="/icons/agro-notes-logo.png"
          type="image/svg+xml"
        />
        <meta name="theme-color" content={theme.colors.bgPage} />
      </head>
      <body className="bg-page text-fg font-sans antialiased min-h-dvh">
        {/* SW se registra apenas carga el body */}
        <PWARegister />

        <AuthProvider>
          <MeProvider>
            <Header />
            {children}
            <Toaster />
          </MeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
