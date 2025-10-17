"use client";
import NoteForm from "../../components/NoteForm";
import { useSpeech } from "../../components/useSpeech";
import { useMemo } from "react";

function parseSpeech(raw: string) {
  const t = raw
    .toLowerCase()
    .replace(/[.;,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const getAfter = (kw: string) => {
    const i = t.indexOf(kw);
    if (i === -1) return "";
    const sub = t.slice(i + kw.length).trim();
    const next = [" farm ", " lot ", " weeds ", " applications ", " note "]
      .map((k) => sub.indexOf(k))
      .filter((i) => i > -1);
    const cut = next.length ? Math.min(...next) : sub.length;
    return sub.slice(0, cut).trim();
  };
  const farm = getAfter("farm ");
  const lot = (getAfter("lot ") || "").split(" ")[0] || "";
  const weeds = (getAfter("weeds ") || "")
    .split(/ y | e |,|\s+/)
    .filter(Boolean);
  const applications = (getAfter("applications ") || "")
    .split(/ y | e |,|\s+/)
    .filter(Boolean);
  const note = getAfter("note ");
  return { farm, lot, weeds, applications, note };
}

export default function VoiceNotePage() {
  const { supported, listening, transcript, start, stop, setTranscript } =
    useSpeech("es-AR");

  const preset = useMemo(
    () => (transcript ? parseSpeech(transcript) : {}),
    [transcript]
  );

  return (
    <main style={{ padding: 24, maxWidth: 820, margin: "0 auto" }}>
      <h1>New note by voice</h1>

      {!supported && (
        <div
          style={{
            background: "#fff6bf",
            padding: 12,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          Tu navegador no soporta reconocimiento de voz. Cargá manualmente
          abajo.
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <button onClick={listening ? stop : start}>
          {listening ? "Detener" : "Hablar"}
        </button>
        {transcript && (
          <>
            <em>“{transcript}”</em>
            <button onClick={() => setTranscript("")}>Limpiar</button>
          </>
        )}
      </div>

      <NoteForm preset={preset} />
    </main>
  );
}
