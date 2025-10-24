// agro-notes/src/app/login/page.tsx
"use client";

import { useState } from "react";
import { PageContainer } from "../../components/ui/PageContainer";
import { Card } from "../../components/ui/Card";
import { Label } from "../../components/ui/Label";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { theme } from "../../theme";

export default function LoginPage() {
  const [email, setEmail] = useState("");

  const sendMagicLink = async () => {
    alert("Revisá tu email para el link de acceso.");
  };

  return (
    <PageContainer maxWidth="400px">
      <header>
        <h1
          style={{
            fontSize: "1.25rem",
            margin: 0,
            fontWeight: 600,
            color: theme.colors.textPrimary,
          }}
        >
          Ingresar
        </h1>
        <p
          style={{
            marginTop: theme.spacing(1),
            fontSize: "0.9rem",
            color: theme.colors.textSecondary,
          }}
        >
          Te mandamos un link mágico al correo. Sin contraseña.
        </p>
      </header>

      <Card padding={4}>
        <div style={{ display: "grid", gap: theme.spacing(3) }}>
          <Label>
            Email
            <Input
              full
              value={email}
              placeholder="tu@email"
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
          </Label>

          <Button
            onClick={sendMagicLink}
            style={{ width: "100%", justifyContent: "center" }}
          >
            Enviar link
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
}
