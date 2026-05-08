// agro-notes/src/app/sharing/page.tsx
//
// La gestión de accesos se movió a /farms (cada explotación tiene su
// propia página con miembros y roles). Esta página queda como atajo
// histórico que redirige.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { PageContainer } from "@/components/ui/PageContainer";
import { AuthGuard } from "@/components/AuthGuard";

export default function SharingRedirect() {
  return (
    <AuthGuard>
      <Redirect />
    </AuthGuard>
  );
}

function Redirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/farms");
  }, [router]);
  return (
    <PageContainer maxWidth="480px">
      <p className="text-sm text-fg-muted text-center mt-6">
        Llevándote a Explotaciones…
      </p>
    </PageContainer>
  );
}
