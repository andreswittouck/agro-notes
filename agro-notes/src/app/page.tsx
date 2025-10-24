// agro-notes/src/app/page.tsx
import { PageContainer } from "../components/ui/PageContainer";
import { Card } from "../components/ui/Card";
import { theme } from "../theme";

export default function Home() {
  return (
    <PageContainer maxWidth="480px">
      <header style={{ display: "grid", gap: theme.spacing(1) }}>
        <h1
          style={{
            margin: 0,
            fontSize: "1.2rem",
            fontWeight: 600,
          }}
        >
          Agro Notes
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: "0.9rem",
            lineHeight: 1.4,
            color: theme.colors.textSecondary,
          }}
        >
          Notas rápidas de lote, malezas y aplicaciones. Funciona offline.
        </p>
      </header>

      <Card padding={4}>
        <nav
          style={{
            display: "grid",
            gap: theme.spacing(3),
            fontSize: "0.95rem",
          }}
        >
          <a
            href="/voice-note"
            style={{
              textDecoration: "none",
              color: theme.colors.bgAccent,
              fontWeight: 500,
            }}
          >
            Nueva nota por voz →
          </a>
          <a
            href="/notes"
            style={{
              textDecoration: "none",
              color: theme.colors.bgAccent,
              fontWeight: 500,
            }}
          >
            Ver notas →
          </a>
        </nav>
      </Card>
    </PageContainer>
  );
}
