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

export default function VoiceNotePage() {
  const { supported, listening, transcript, begin, end, setTranscript } =
    useSpeech("es-AR");

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

      <Card padding={4}>
        <Row
          style={{
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: theme.spacing(3),
          }}
        >
          {/* Botón mic redondo push-to-talk */}
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

          {/* Texto reconocido + botón limpiar */}
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
    </PageContainer>
  );
}
