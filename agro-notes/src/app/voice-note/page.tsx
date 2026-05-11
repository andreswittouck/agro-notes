// agro-notes/src/app/voice-note/page.tsx
"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import NoteForm from "../../components/NoteForm";
import { AuthGuard } from "../../components/AuthGuard";
import { useSpeech } from "../../components/useSpeech";
import { parseSpeech, pickBestAlternative } from "../../lib/voiceParsing";
import { BackButton } from "@/components/ui/BackButton";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useMicLevel } from "../../hooks/useMicLevel";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import { MicButton } from "@/components/ui/MicButton";

function VoiceNotePageInner() {
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  // --- Query params para modo edición ---
  const modeParam = searchParams.get("mode");
  const farmQ = searchParams.get("farm") ?? "";
  const lotQ = searchParams.get("lot") ?? "";
  const weedsQ = searchParams.get("weeds") ?? "";
  const appsQ = searchParams.get("applications") ?? "";
  const noteQ = searchParams.get("note") ?? "";
  const isPrivateQ = searchParams.get("is_private") === "1";

  const presetFromQuery = useMemo(
    () => ({
      farm: farmQ,
      lot: lotQ,
      weeds: weedsQ
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      applications: appsQ
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      note: noteQ,
      is_private: isPrivateQ,
    }),
    [farmQ, lotQ, weedsQ, appsQ, noteQ, isPrivateQ]
  );

  // --- Voz ---
  const {
    supported,
    listening,
    finalTranscript,
    interimTranscript,
    transcript,
    iosStandaloneIssue,
    permissionDenied,
    begin,
    end,
    clear,
  } = useSpeech({
    lang: "es-AR",
    // Re-ranking: elegimos entre las 3 alternativas del ASR la que más
    // se parece a una nota agro real (tiene "explotación", "lote",
    // "glifosato", "yuyo colorado", etc.).
    rerank: pickBestAlternative,
  });

  // Nivel de audio real del mic (0..1) mientras está escuchando — alimenta
  // el glow del MicButton para que pulse con la voz en lugar de la
  // animación CSS constante.
  const micLevel = useMicLevel(listening);

  // El parser solo procesa el transcript "estable" (final). El interim se
  // muestra para feedback visual pero no se rebrindca al form mientras está
  // parpadeando — así el form no se llena con basura.
  const preset = useMemo(
    () =>
      finalTranscript ? parseSpeech(finalTranscript) : presetFromQuery,
    [finalTranscript, presetFromQuery]
  );

  const isEditMode = modeParam === "edit";

  const handleSubmitFloating = () => {
    const form = document.querySelector("form");
    if (form) {
      form.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    }
  };

  // Mostramos el bloque de mic en desktop o cuando hay transcript en mobile.
  // En mobile, el botón de mic vive en el FAB inferior.
  const showSupport = supported && !iosStandaloneIssue;

  return (
    <AuthGuard>
      <PageContainer maxWidth="820px">
        {/* ----------- Header de la página ----------- */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <BackButton href="/notes" label="Volver" />
          <div className="text-right flex-1 min-w-[180px]">
            <h2 className="m-0 text-base font-semibold text-fg">
              {isEditMode ? "Editar nota" : "Nueva nota"}
            </h2>
            <p className="m-0 mt-1 text-xs sm:text-sm text-fg-muted leading-snug">
              Decí “explotación… lote… maleza(s)… aplicación(es)… nota…” y lo
              llenamos solo.
            </p>
          </div>
        </div>

        {/* ----------- Avisos ----------- */}
        {iosStandaloneIssue && (
          <div
            className="
              bg-warning-bg text-warning-fg
              rounded-lg px-3 py-2 text-sm leading-snug
              border border-black/5
            "
            role="status"
          >
            En iPhone instalado como app, el reconocimiento de voz no funciona.
            Abrí Agro Notes desde Safari para usar la voz, o cargá la nota
            manualmente abajo.
          </div>
        )}

        {!supported && !iosStandaloneIssue && (
          <div
            className="
              bg-warning-bg text-warning-fg
              rounded-lg px-3 py-2 text-sm leading-snug
              border border-black/5
            "
            role="status"
          >
            Tu navegador no soporta reconocimiento de voz. Cargá manualmente
            abajo.
          </div>
        )}

        {permissionDenied && (
          <div
            className="
              bg-mic-active/15 text-fg
              rounded-lg px-3 py-2 text-sm leading-snug
              border border-mic-active/40
            "
            role="status"
          >
            El navegador bloqueó el micrófono. Habilitalo desde el candado
            🔒 al lado de la URL para volver a usar la voz.
          </div>
        )}

        {/* ----------- Bloque de voz (desktop) ----------- */}
        {!isMobile && showSupport && (
          <Card padding={4}>
            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex flex-col items-center gap-2 shrink-0">
                <MicButton
                  listening={listening}
                  onHoldStart={begin}
                  onHoldEnd={end}
                  level={micLevel}
                />
                <span className="text-xs text-fg-muted text-center max-w-[88px] leading-tight">
                  {listening
                    ? "Grabando…"
                    : "Mantener apretado para hablar"}
                </span>
              </div>

              <TranscriptBox
                finalText={finalTranscript}
                interimText={interimTranscript}
                onClear={clear}
                listening={listening}
              />
            </div>
          </Card>
        )}

        {/* En mobile mostramos solo el transcript en el card,
            el MicButton va flotante abajo */}
        {isMobile && transcript && (
          <Card padding={4}>
            <TranscriptBox
              finalText={finalTranscript}
              interimText={interimTranscript}
              onClear={clear}
              listening={listening}
            />
          </Card>
        )}

        {/* ----------- Formulario ----------- */}
        <Card padding={4}>
          <NoteForm preset={preset} />
        </Card>

        {/* spacer en mobile para que el botón flotante no tape el form */}
        {isMobile && <div aria-hidden className="h-32" />}

        {/* ----------- FAB en mobile ----------- */}
        {isMobile && (
          <>
            {showSupport && (
              <div className="fixed left-1/2 -translate-x-1/2 bottom-20 z-40 flex flex-col items-center gap-1.5 pointer-events-none">
                <div className="pointer-events-auto">
                  <MicButton
                    listening={listening}
                    onHoldStart={begin}
                    onHoldEnd={end}
                    size={72}
                    level={micLevel}
                  />
                </div>
                <span
                  className="
                    pointer-events-none
                    text-xs text-fg
                    bg-card/90 backdrop-blur
                    border border-border-subtle
                    rounded-full px-2.5 py-0.5
                    shadow-md
                  "
                >
                  {listening ? "Grabando…" : "Mantener para hablar"}
                </span>
              </div>
            )}

            {/* Botón flotante de guardar */}
            <button
              type="button"
              onClick={handleSubmitFloating}
              aria-label="Guardar nota"
              className="
                fixed right-4 z-40
                inline-flex items-center justify-center
                w-14 h-14 rounded-full
                bg-accent hover:bg-accent-hover text-fg
                shadow-[var(--shadow-fab)]
                focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page
                transition-colors
                cursor-pointer
              "
              style={{
                bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </>
        )}
      </PageContainer>
    </AuthGuard>
  );
}

/**
 * Caja de transcript con dos secciones: lo final (estable, blanco) y
 * lo interim (parpadea en gris).
 */
function TranscriptBox({
  finalText,
  interimText,
  onClear,
  listening,
}: {
  finalText: string;
  interimText: string;
  onClear: () => void;
  listening: boolean;
}) {
  if (!finalText && !interimText) {
    return (
      <div className="flex-1 min-w-0 text-sm text-fg-subtle italic">
        {listening
          ? "Te escucho…"
          : "Apretá el micrófono y hablá. Lo que diga aparece acá y se carga abajo."}
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 grid gap-2 animate-fade-in-up">
      <div className="text-xs text-fg-muted uppercase tracking-wide">
        Lo que escuché
      </div>
      <div
        className="
          bg-page text-fg
          rounded-lg px-3 py-2
          text-sm leading-relaxed
          border border-border-subtle
          break-words
          min-h-[2.5rem]
        "
      >
        <span>{finalText}</span>
        {interimText && (
          <span className="text-fg-muted italic">
            {finalText ? " " : ""}
            {interimText}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="
          self-start
          inline-flex items-center gap-1.5
          text-xs font-medium
          text-fg-muted hover:text-fg
          bg-transparent hover:bg-card-hover
          border border-border-subtle hover:border-border-strong
          rounded-md px-2.5 py-1
          transition-colors
          focus:outline-none focus-visible:ring-2 focus-visible:ring-accent
          cursor-pointer
        "
      >
        Limpiar
      </button>
    </div>
  );
}

export default function VoiceNotePage() {
  return (
    <Suspense fallback={null}>
      <VoiceNotePageInner />
    </Suspense>
  );
}
