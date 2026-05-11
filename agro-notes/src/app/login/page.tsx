// agro-notes/src/app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "../../components/ui/PageContainer";
import { Card } from "../../components/ui/Card";
import { Label } from "../../components/ui/Label";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { user, signIn, signInWithGoogle, resetPassword } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      router.push("/");
    } catch (err: any) {
      let errorMessage = err.message || "Error al iniciar sesión";

      if (err.code === "auth/user-not-found") {
        errorMessage =
          "Usuario no encontrado. Contacta al administrador para obtener acceso.";
      } else if (err.code === "auth/wrong-password") {
        errorMessage = "Contraseña incorrecta.";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Demasiados intentos. Intenta más tarde.";
      } else if (err.message?.includes("no está autorizado")) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión con Google");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Ingresa tu email para recuperar tu contraseña");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(
        "Se ha enviado un enlace a tu email para restablecer tu contraseña."
      );
      setShowForgotPassword(false);
    } catch (err: any) {
      let errorMessage = "Error al enviar el email";

      if (err.code === "auth/user-not-found") {
        errorMessage = "No existe una cuenta con este email.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Email inválido.";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Demasiados intentos. Intenta más tarde.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer maxWidth="420px">
      <header className="grid gap-1 text-center mt-4">
        <h1 className="m-0 text-xl font-semibold tracking-tight text-fg">
          Ingresar
        </h1>
        <p className="m-0 text-sm text-fg-muted leading-snug">
          Accedé con tu email y contraseña.
        </p>
      </header>

      <Card padding={4}>
        <form
          onSubmit={showForgotPassword ? handleForgotPassword : handleSubmit}
          className="grid gap-3"
        >
          {error && <Alert tone="error">{error}</Alert>}
          {success && <Alert tone="success">{success}</Alert>}

          <Label>
            <span>Email</span>
            <Input
              value={email}
              placeholder="tu@email.com"
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              required
              disabled={loading}
            />
          </Label>

          {!showForgotPassword && (
            <>
              <Label>
                <span>Contraseña</span>
                <Input
                  value={password}
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
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
                {loading ? "Cargando…" : "Ingresar"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setError("");
                  setSuccess("");
                }}
                className="
                  bg-transparent border-none p-0
                  text-xs text-accent hover:text-accent-hover
                  underline underline-offset-2
                  cursor-pointer text-center
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded
                "
              >
                ¿Olvidaste tu contraseña?
              </button>
            </>
          )}

          {showForgotPassword && (
            <>
              <p className="m-0 text-sm text-fg-muted leading-snug">
                Te enviaremos un enlace a tu email para restablecer tu
                contraseña.
              </p>

              <Button
                type="submit"
                disabled={loading || !email}
                variant="primary"
                size="md"
                className="w-full"
              >
                {loading ? "Enviando…" : "Enviar enlace"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setError("");
                  setSuccess("");
                }}
                className="
                  bg-transparent border-none p-0
                  text-xs text-fg-muted hover:text-fg
                  cursor-pointer text-center
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded
                "
              >
                ← Volver a iniciar sesión
              </button>
            </>
          )}

          <Divider />

          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            variant="ghost"
            size="md"
            className="w-full bg-fg/95 text-page hover:bg-fg hover:text-page border-transparent"
          >
            <GoogleIcon />
            Continuar con Google
          </Button>
        </form>
      </Card>

      <p className="text-xs text-fg-subtle text-center mt-2">
        ¿Necesitás acceso? Contactá al administrador.
      </p>
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

function Divider() {
  return (
    <div className="flex items-center gap-2 my-1">
      <div className="flex-1 h-px bg-border-subtle" />
      <span className="text-xs text-fg-subtle">o</span>
      <div className="flex-1 h-px bg-border-subtle" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 48 48"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.8 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.2c-2.1 1.4-4.7 2.4-7.3 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.2C42.2 35.4 44 30 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
