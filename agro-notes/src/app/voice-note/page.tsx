"use client";

import { useMemo } from "react";
import { PageContainer } from "../../components/ui/PageContainer";
import { Card } from "../../components/ui/Card";
import { Row } from "../../components/ui/Row";
import { MicButton } from "../../components/ui/MicButton";
import NoteForm from "../../components/NoteForm";
import { useSpeech } from "../../components/useSpeech";
import { parseSpeech } from "../../lib/voiceParsing";
import { theme } from "../../theme";
import { BackButton } from "@/components/ui/BackButton";
import { useIsMobile } from "../../hooks/useIsMobile"; // 👈 NUEVO

export default function VoiceNotePage() {
  const { supported, listening, transcript, begin, end, setTranscript } =
    useSpeech("es-AR");

  const isMobile = useIsMobile();

  const preset = useMemo(
    () => (transcript ? parseSpeech(transcript) : {}),
    [transcript]
  );

  return (
    <PageContainer maxWidth={theme.maxWidthForm}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          rowGap: theme.spacing(2),
        }}
      >
        <BackButton href="/notes" label="Volver" />

        <div
          style={{
            textAlign: "right",
            flex: "1 1 auto",
            marginLeft: theme.spacing(3),
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.9rem",
              color: theme.colors.textSecondary,
              lineHeight: 1.4,
            }}
          >
            Decí “explotación… lote… maleza(s)… aplicación(es)… nota…” y lo
            llenamos solo.
          </p>
        </div>
      </div>

      {/* Aviso si el browser no soporta voz */}
      {!supported && (
        <Card padding={3}>
          <div
            style={{
              background: theme.colors.warningBg,
              color: theme.colors.warningText,
              borderRadius: theme.radius.sm,
              padding: theme.spacing(3),
              fontSize: "0.9rem",
              lineHeight: 1.4,
            }}
          >
            Tu navegador no soporta reconocimiento de voz. Cargá manualmente
            abajo.
          </div>
        </Card>
      )}

      {/* --- BLOQUE DE VOZ Y TRANSCRIPCIÓN --- */}
      <Card padding={4}>
        <Row
          style={{
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: theme.spacing(3),
          }}
        >
          {!isMobile && (
            <div
              style={{
                display: "grid",
                gap: theme.spacing(1),
                justifyItems: "center",
              }}
            >
              <MicButton
                listening={listening}
                onHoldStart={begin}
                onHoldEnd={end}
              />
              <div
                style={{
                  fontSize: "0.7rem",
                  color: theme.colors.textSecondary,
                  lineHeight: 1.2,
                  textAlign: "center",
                  maxWidth: 80,
                }}
              >
                {listening ? "Grabando…" : "Mantener apretado para hablar"}
              </div>
            </div>
          )}

          {transcript && (
            <div
              style={{
                flex: "1 1 200px",
                display: "grid",
                gap: theme.spacing(2),
                minWidth: 0,
              }}
            >
              <em
                style={{
                  backgroundColor: theme.colors.bgPage,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.sm,
                  padding: theme.spacing(3),
                  fontSize: "0.9rem",
                  lineHeight: 1.4,
                  color: theme.colors.textSecondary,
                  wordBreak: "break-word",
                }}
              >
                “{transcript}”
              </em>
              <button
                type="button"
                onClick={() => setTranscript("")}
                style={{
                  backgroundColor: "transparent",
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.sm,
                  color: theme.colors.textPrimary,
                  fontSize: "0.8rem",
                  padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
                  cursor: "pointer",
                  width: "fit-content",
                }}
              >
                Limpiar
              </button>
            </div>
          )}
        </Row>
      </Card>

      <Card padding={4}>
        <NoteForm preset={preset} />
      </Card>

      {isMobile && (
        <>
          <div
            style={{
              position: "fixed",
              bottom: theme.spacing(12),
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,

              display: "grid",
              justifyItems: "center",
              rowGap: theme.spacing(1),
            }}
          >
            <div
              style={{
                backgroundColor: theme.colors.textPrimary,
                borderRadius: "9999px",
                padding: theme.spacing(1),
                boxShadow: "0px 6px 16px rgba(0,0,0,0.3)",
                touchAction: "none",
              }}
              onTouchStart={begin}
              onTouchEnd={end}
              onMouseDown={begin}
              onMouseUp={end}
            >
              <MicButton
                listening={listening}
                onHoldStart={begin}
                onHoldEnd={end}
              />
            </div>

            <div
              style={{
                fontSize: "0.75rem",
                color: theme.colors.textSecondary,
                lineHeight: 1.2,
                textAlign: "center",
                backgroundColor: theme.colors.bgPage,
                padding: theme.spacing(1),
                borderRadius: theme.radius.sm,
                boxShadow: "0px 2px 6px rgba(0,0,0,0.15)",
              }}
            >
              {listening ? "Grabando…" : "Mantener apretado"}
            </div>
          </div>

          {/* Guardar flotante abajo-derecha */}
          <div
            style={{
              position: "fixed",
              bottom: theme.spacing(4),
              right: theme.spacing(4),
              zIndex: 1000,
            }}
          >
            <button
              type="button"
              onClick={() => {
                // buscamos el primer form y lo mandamos
                const form = document.querySelector("form");
                if (form) {
                  form.dispatchEvent(
                    new Event("submit", { cancelable: true, bubbles: true })
                  );
                }
              }}
              style={{
                backgroundColor: theme.colors.micIdleBg,
                color: "#fff",
                border: "none",
                borderRadius: "9999px",
                padding: `${theme.spacing(3)} ${theme.spacing(4)}`,
                fontSize: "1.3rem",
                fontWeight: 600,
                boxShadow: "0px 6px 16px rgba(0,0,0,0.3)",
              }}
            >
              💾
            </button>
          </div>
        </>
      )}
    </PageContainer>
  );
}
