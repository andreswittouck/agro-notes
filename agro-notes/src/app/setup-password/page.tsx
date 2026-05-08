// agro-notes/src/app/setup-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";

import { PageContainer } from "../../components/ui/PageContainer";
import { Card } from "../../components/ui/Card";
import { Label } from "../../components/ui/Label";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { auth } from "../../lib/firebase";

export default function SetupPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [oobCode, setOobCode] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("oobCode");
    const mode = searchParams.get("mode");

    if (mode === "resetPassword" && code) {
      setOobCode(code);
      verifyPasswordResetCode(auth, code)
        .then((email: string) => {
          setEmail(email);
        })
        .catch(() => {
          setError("El enlace no es válido o ha expirado.");
        });
    } else if (mode === "verifyEmail") {
      router.push("/login");
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (!oobCode) {
      setError("Código de verificación no válido");
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, password);
      alert("Contraseña establecida correctamente. Ya podés iniciar sesión.");
      router.push("/login");
    } catch (err: any) {
      let errorMessage = "Error al establecer la contraseña";
      if (err.code === "auth/weak-password") {
        errorMessage = "La contraseña es muy débil. Usá al menos 6 caracteres.";
      } else if (err.code === "auth/expired-action-code") {
        errorMessage = "El enlace expiró. Solicitá uno nuevo.";
      } else if (err.code === "auth/invalid-action-code") {
        errorMessage = "El enlace no es válido.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!oobCode && !error) {
    return (
      <PageContainer maxWidth="420px">
        <Card padding={4}>
          <p className="text-center text-fg-muted m-0">Cargando…</p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="420px">
      <header className="grid gap-1 text-center mt-4">
        <h1 className="m-0 text-xl font-semibold tracking-tight text-fg">
          Establecer contraseña
        </h1>
        {email && (
          <p className="m-0 text-sm text-fg-muted leading-snug">
            Para <span className="text-fg font-medium">{email}</span>
          </p>
        )}
      </header>

      <Card padding={4}>
        {error && !oobCode ? (
          <Alert tone="error">{error}</Alert>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-3">
            {error && <Alert tone="error">{error}</Alert>}

            <Label>
              <span>Nueva contraseña</span>
              <Input
                value={password}
                placeholder="Mínimo 6 caracteres"
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                required
                disabled={loading}
                minLength={6}
              />
            </Label>

            <Label>
              <span>Confirmar contraseña</span>
              <Input
                value={confirmPassword}
                placeholder="Repetí la contraseña"
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                required
                disabled={loading}
                minLength={6}
              />
            </Label>

            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              size="md"
              className="w-full"
            >
              {loading ? "Estableciendo…" : "Establecer contraseña"}
            </Button>
          </form>
        )}
      </Card>
    </PageContainer>
  );
}

function Alert({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
}) {
  const cls =
    tone === "error"
      ? "bg-mic-active/15 text-fg border-mic-active/40"
      : "bg-success/15 text-fg border-success/40";
  return (
    <div
      className={[
        "rounded-lg px-3 py-2 text-sm leading-snug border",
        cls,
      ].join(" ")}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
