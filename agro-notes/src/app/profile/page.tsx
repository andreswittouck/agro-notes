// agro-notes/src/app/profile/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";

import { PageContainer } from "../../components/ui/PageContainer";
import { Card } from "../../components/ui/Card";
import { Label } from "../../components/ui/Label";
import { Input } from "../../components/ui/Input";
import Link from "next/link";

import { Button } from "../../components/ui/Button";
import { BackButton } from "../../components/ui/BackButton";
import { useAuth } from "../../contexts/AuthContext";
import { useMe } from "../../contexts/MeContext";
import { AuthGuard } from "../../components/AuthGuard";
import { auth } from "../../lib/firebase";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { me } = useMe();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendPasswordReset = async () => {
    if (!user?.email) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, user.email);
      setSuccess(
        "Te enviamos un enlace a tu email para cambiar la contraseña. Revisá tu bandeja de entrada."
      );
      setShowChangePassword(false);
    } catch (err: any) {
      let errorMessage = "Error al enviar el email";
      if (err.code === "auth/user-not-found") {
        errorMessage = "Usuario no encontrado";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Demasiados intentos. Probá más tarde.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <AuthGuard>
      <PageContainer maxWidth="480px">
        <BackButton href="/" label="Volver" />

        <header className="grid gap-1">
          <h1 className="m-0 text-xl font-semibold tracking-tight text-fg">
            Mi Perfil
          </h1>
          <p className="m-0 text-sm text-fg-muted leading-snug">
            Tu cuenta y preferencias.
          </p>
        </header>

        <Card padding={4}>
          <div className="grid gap-4">
            {/* ----- Email ----- */}
            <Label>
              <span>Email</span>
              <Input
                value={user?.email || ""}
                disabled
                className="cursor-not-allowed"
              />
            </Label>

            <div className="flex flex-wrap gap-1.5 -mt-2">
              <div
                className={[
                  "inline-flex items-center gap-1.5",
                  "text-xs px-2 py-0.5 rounded-full",
                  user?.emailVerified
                    ? "bg-success/15 text-success"
                    : "bg-warning-bg text-warning-fg",
                ].join(" ")}
              >
                <span
                  className={[
                    "w-1.5 h-1.5 rounded-full",
                    user?.emailVerified ? "bg-success" : "bg-warning-fg",
                  ].join(" ")}
                />
                {user?.emailVerified ? "Email verificado" : "Email no verificado"}
              </div>
              {me?.isAdmin && (
                <div className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Admin
                </div>
              )}
            </div>

            <Link
              href="/farms"
              className="
                inline-flex items-center justify-center gap-2
                w-full
                rounded-lg px-3.5 py-2
                text-sm font-medium text-fg
                bg-transparent hover:bg-card-hover
                border border-border-subtle hover:border-accent
                transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card
              "
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 21h18" />
                <path d="M5 21V7l7-4 7 4v14" />
                <path d="M9 21V12h6v9" />
              </svg>
              Explotaciones
            </Link>

            {/* ----- Cambiar contraseña ----- */}
            {!showChangePassword ? (
              <Button
                onClick={() => setShowChangePassword(true)}
                variant="ghost"
                className="w-full"
              >
                Cambiar contraseña
              </Button>
            ) : (
              <div className="grid gap-3">
                <p className="m-0 text-sm text-fg-muted leading-snug">
                  Te enviamos un enlace a tu email para cambiar tu contraseña.
                </p>

                {error && <Alert tone="error">{error}</Alert>}
                {success && <Alert tone="success">{success}</Alert>}

                <div className="flex gap-2">
                  <Button
                    onClick={handleSendPasswordReset}
                    disabled={loading}
                    variant="primary"
                    className="flex-1"
                  >
                    {loading ? "Enviando…" : "Enviar enlace"}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowChangePassword(false);
                      setError("");
                      setSuccess("");
                    }}
                    disabled={loading}
                    variant="ghost"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {success && !showChangePassword && (
              <Alert tone="success">{success}</Alert>
            )}

            {/* ----- Cerrar sesión ----- */}
            <div className="border-t border-border-subtle pt-3 mt-1">
              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="w-full text-mic-active hover:bg-mic-active/10 hover:border-mic-active hover:text-mic-active"
              >
                Cerrar sesión
              </Button>
            </div>
          </div>
        </Card>
      </PageContainer>
    </AuthGuard>
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
