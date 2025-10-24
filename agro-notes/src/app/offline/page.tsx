// agro-notes/src/app/offline/page.tsx
import { PageContainer } from "../../components/ui/PageContainer";
import { theme } from "../../theme";

export default function OfflinePage() {
  return (
    <PageContainer maxWidth="480px">
      <h1
        style={{
          margin: 0,
          fontSize: "1.1rem",
          fontWeight: 600,
        }}
      >
        Estás sin conexión
      </h1>
      <p
        style={{
          margin: 0,
          fontSize: "0.9rem",
          color: theme.colors.textSecondary,
          lineHeight: 1.4,
        }}
      >
        Podés seguir escribiendo y se sincroniza cuando vuelva internet.
      </p>
    </PageContainer>
  );
}
