"use client";
import { useEffect, useRef, useState } from "react";

export function useSpeech(lang: string = "es-AR") {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  // este buffer guarda lo que capturó en ESTA pulsación
  const bufferRef = useRef<string>("");

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR: any =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;
    if (!SR) return;
    setSupported(true);

    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e: any) => {
      const text = Array.from(e.results)
        .map((r: any) => r[0]?.transcript ?? "")
        .join(" ")
        .trim();

      // en vez de pushear al transcript global, lo guardo solo en el buffer temporal
      bufferRef.current = text;
    };

    rec.onend = () => {
      // cuando termina de escuchar (soltaste el botón),
      // volcamos lo que quedó en bufferRef al transcript visible
      // OJO: si ya había transcript previo, lo reemplazamos.
      setTranscript(bufferRef.current.trim());
      setListening(false);
    };

    rec.onerror = () => {
      setListening(false);
    };

    recognitionRef.current = rec;
  }, [lang]);

  // begin = apretaste el botón
  const begin = () => {
    if (!supported) return;
    bufferRef.current = ""; // limpiamos buffer para nueva toma
    setListening(true);
    recognitionRef.current.start();
  };

  // end = soltaste el botón
  const end = () => {
    if (!supported) return;
    recognitionRef.current.stop();
    // onend va a copiar bufferRef.current a transcript
  };

  return { supported, listening, transcript, begin, end, setTranscript };
}
