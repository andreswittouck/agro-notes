// agro-notes/src/components/AuthGuard.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PageContainer } from "./ui/PageContainer";
import { Card } from "./ui/Card";
import { theme } from "@/theme";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <PageContainer maxWidth="480px">
        <Card padding={4}>
          <p style={{ textAlign: "center", color: theme.colors.textSecondary }}>
            Cargando...
          </p>
        </Card>
      </PageContainer>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
