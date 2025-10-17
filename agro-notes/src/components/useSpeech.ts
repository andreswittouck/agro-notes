"use client";
import { useEffect, useRef, useState } from "react";

export function useSpeech(lang: string = "es-AR") {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR: any =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;
    if (!SR) return;
    setSupported(true);
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (e: any) => {
      const finalText = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(" ")
        .trim();
      setTranscript(finalText);
      setListening(false);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    recognitionRef.current = rec;
  }, [lang]);

  const start = () => {
    if (!supported) return;
    setTranscript("");
    setListening(true);
    recognitionRef.current.start();
  };
  const stop = () => {
    if (!supported) return;
    recognitionRef.current.stop();
    setListening(false);
  };

  return { supported, listening, transcript, start, stop, setTranscript };
}
