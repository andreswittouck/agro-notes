"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type UseSpeechResult = {
  supported: boolean;
  listening: boolean;
  transcript: string;
  begin: () => void; // apretó / start press
  end: () => void; // soltó / end press
  setTranscript: (t: string) => void;
};

export function useSpeech(lang: string = "es-AR"): UseSpeechResult {
  // guardamos la instancia de recognition
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // esto trackea si EL USUARIO todavía está apretando el botón
  const holdingRef = useRef(false);

  // estado expuesto
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  // función interna para intentar arrancar grabación
  const startRecognition = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;

    try {
      rec.start();
      setListening(true);
    } catch {
      // chrome: "start called twice" -> ignoramos
    }
  }, []);

  // función interna para frenar grabación
  const stopRecognition = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {
      // ignorar errores si ya está parado
    }
    setListening(false);
  }, []);

  // inicializamos reconocimiento de voz UNA vez
  useEffect(() => {
    // buscar implementación nativa
    const SR:
      | typeof window.SpeechRecognition
      | typeof window.webkitSpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      setSupported(false);
      return;
    }

    setSupported(true);

    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true; // intentá seguir escuchando
    rec.interimResults = true; // texto parcial

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let full = "";
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript + " ";
      }
      setTranscript(full.trim());
    };

    rec.onend = () => {
      // navegador cortó.
      // ¿el usuario sigue apretando?
      if (holdingRef.current) {
        // sí -> volvemos a empezar automáticamente
        startRecognition();
      } else {
        // no -> listo, terminó de escuchar
        setListening(false);
      }
    };

    rec.onerror = (err: any) => {
      // caso tipo "not-allowed" (mic bloqueado)
      // o "no-speech"
      // no frenamos holding, pero marcamos no-listening
      setListening(false);
      // podríamos loguear err.error si querés debug
      // console.log("speech error", err);
    };

    recognitionRef.current = rec;
  }, [lang, startRecognition]);

  // usuario APRETA
  const begin = useCallback(() => {
    holdingRef.current = true;
    startRecognition();
  }, [startRecognition]);

  // usuario SUELTA
  const end = useCallback(() => {
    holdingRef.current = false;
    stopRecognition();
  }, [stopRecognition]);

  return {
    supported,
    listening,
    transcript,
    begin,
    end,
    setTranscript,
  };
}
