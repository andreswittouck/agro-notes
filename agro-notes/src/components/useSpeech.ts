"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Hook de reconocimiento de voz para AgroNotes.
 *
 * Mejoras vs versión previa:
 *  - Mantiene un buffer "committed" con todo lo final acumulado entre
 *    sesiones del recognizer (Safari/Chrome cortan cada cierto tiempo,
 *    antes se perdía lo dicho cada vez que reiniciaba).
 *  - Diferencia interim vs final (interimTranscript / finalTranscript).
 *  - Restart con un pequeño delay para evitar `InvalidStateError` en Chrome.
 *  - Pide `maxAlternatives = 3` (la mejor alternativa la usamos para el
 *    transcript; las otras quedan disponibles via `lastAlternatives`).
 *  - Detecta iOS en modo PWA standalone (donde la API no anda) y lo
 *    expone como `iosStandaloneIssue` para que la UI avise.
 *  - Maneja errores de permisos y `no-speech` sin romper el flujo.
 */

export type UseSpeechResult = {
  supported: boolean;
  /** Está actualmente escuchando (botón mantenido apretado). */
  listening: boolean;
  /** Texto consolidado, no parpadea entre eventos. */
  finalTranscript: string;
  /** Lo que el ASR está ofreciendo provisionalmente. Parpadea. */
  interimTranscript: string;
  /** Atajo: final + interim, para usos simples. */
  transcript: string;
  /** Últimas alternativas devueltas por el ASR para el último resultado final. */
  lastAlternatives: string[];
  /** El navegador NO expone Web Speech API. */
  notSupported: boolean;
  /** iOS en modo PWA standalone — la API no funciona ahí. */
  iosStandaloneIssue: boolean;
  /** El usuario denegó el permiso del micrófono. */
  permissionDenied: boolean;
  begin: () => void;
  end: () => void;
  setTranscript: (t: string) => void;
  clear: () => void;
};

/**
 * Opciones del hook.
 *  - `rerank`: si se pasa, recibe las alternativas que el ASR ofreció
 *    para cada chunk final y debe devolver la mejor (la que se usa para
 *    armar el transcript). El uso típico es enchufar
 *    `pickBestAlternative` de `voiceParsing` para preferir términos del
 *    dominio agro.
 */
export type UseSpeechOptions = {
  lang?: string;
  rerank?: (alternatives: string[]) => string;
};

export function useSpeech(
  langOrOptions: string | UseSpeechOptions = "es-AR"
): UseSpeechResult {
  const opts: UseSpeechOptions =
    typeof langOrOptions === "string"
      ? { lang: langOrOptions }
      : langOrOptions;
  const lang = opts.lang ?? "es-AR";
  const rerank = opts.rerank;
  const rerankRef = useRef(rerank);
  // mantenemos el rerank actual en un ref para no tener que recrear
  // la instancia del recognizer cuando cambia.
  rerankRef.current = rerank;
  // SpeechRecognition no está tipado uniformemente entre navegadores;
  // usamos `any` para evitar pelear con la lib DOM y manejamos la API
  // a mano (que es estable en runtime).
  const recognitionRef = useRef<any>(null);

  // El usuario sigue manteniendo apretado.
  const holdingRef = useRef(false);

  // Buffer de FINALES acumulados entre sesiones del recognizer.
  // (cuando Safari/Chrome cortan y reiniciamos en onend, los `event.results`
  //  vienen desde 0 y antes perdíamos todo.)
  const committedRef = useRef<string>("");

  // Espejo del interim para acceso síncrono en `onend`.
  const interimRef = useRef<string>("");

  // Timer de reinicio (lo cancelamos si el usuario suelta antes).
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Estados expuestos.
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [lastAlternatives, setLastAlternatives] = useState<string[]>([]);
  const [iosStandaloneIssue, setIosStandaloneIssue] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const startRecognition = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.start();
      setListening(true);
    } catch {
      // Chrome a veces tira "start called twice" -> ignoramos.
    }
  }, []);

  const stopRecognition = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {
      // ya estaba parado
    }
    setListening(false);
  }, []);

  // Inicialización (una sola vez por valor de `lang`).
  useEffect(() => {
    if (typeof window === "undefined") return;

    // ------- Detección de iOS PWA standalone -------
    const ua = window.navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const standalone =
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      // resto: media query
      (typeof window.matchMedia === "function" &&
        window.matchMedia("(display-mode: standalone)").matches);
    if (isIOS && standalone) {
      setIosStandaloneIssue(true);
    }

    const SR: any =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const rec: any = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    // Pedimos 3 candidatos: la UI usa el primero, pero los exponemos
    // por si después queremos re-rankear con un diccionario del agro.
    try {
      rec.maxAlternatives = 3;
    } catch {
      /* noop */
    }

    rec.onresult = (event: any) => {
      let newFinal = "";
      let newInterim = "";
      let lastAlts: string[] = [];

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          // Recolectamos todas las alternativas del modelo y le pedimos
          // al rerank que elija la mejor (si hay rerank).
          const alts: string[] = [];
          for (let j = 0; j < result.length; j++) {
            const t = result[j]?.transcript;
            if (t) alts.push(t);
          }
          const chosen = rerankRef.current
            ? rerankRef.current(alts)
            : alts[0] ?? "";
          newFinal += chosen + " ";
          lastAlts = alts;
        } else {
          // Para interim siempre tomamos el top-1 (parpadea, no vale la
          // pena re-rankear cada frame).
          const top = result[0]?.transcript ?? "";
          newInterim += top + " ";
        }
      }

      if (newFinal) {
        const merged = (committedRef.current + " " + newFinal)
          .replace(/\s+/g, " ")
          .trim();
        committedRef.current = merged;
        setFinalTranscript(merged);
        if (lastAlts.length) {
          setLastAlternatives(lastAlts);
        }
      }

      // Interim NO se acumula entre eventos; cada evento trae el interim
      // actual completo desde resultIndex.
      const interim = newInterim.trim();
      interimRef.current = interim;
      setInterimTranscript(interim);
    };

    rec.onend = () => {
      // Si quedó interim sin marcar como final (Safari corta sin avisar),
      // lo "comprometemos" para no perderlo.
      if (interimRef.current) {
        const merged = (committedRef.current + " " + interimRef.current)
          .replace(/\s+/g, " ")
          .trim();
        committedRef.current = merged;
        setFinalTranscript(merged);
        interimRef.current = "";
        setInterimTranscript("");
      }

      if (holdingRef.current) {
        // pequeño delay para evitar InvalidStateError en Chrome.
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
          if (holdingRef.current) startRecognition();
        }, 150);
      } else {
        setListening(false);
      }
    };

    rec.onerror = (err: any) => {
      setListening(false);
      const code = err?.error;

      if (code === "not-allowed" || code === "service-not-allowed") {
        // permiso denegado o bloqueado por el navegador
        holdingRef.current = false;
        setPermissionDenied(true);
        return;
      }

      if (code === "no-speech" || code === "audio-capture") {
        // no se oyó nada / mic ocupado: si seguimos manteniendo,
        // dejamos que onend re-arranque con su delay.
        return;
      }

      // Para otros errores tampoco rompemos el flujo: onend va a decidir
      // si re-arrancar (si holdingRef sigue true) o quedarse parado.
    };

    recognitionRef.current = rec;

    return () => {
      // cleanup
      try {
        rec.stop();
      } catch {
        /* noop */
      }
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      recognitionRef.current = null;
    };
  }, [lang, startRecognition]);

  // Usuario APRETA
  const begin = useCallback(() => {
    if (!recognitionRef.current) return;
    if (permissionDenied) return; // no insistimos
    holdingRef.current = true;
    startRecognition();
  }, [startRecognition, permissionDenied]);

  // Usuario SUELTA
  const end = useCallback(() => {
    holdingRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    stopRecognition();
  }, [stopRecognition]);

  const clear = useCallback(() => {
    committedRef.current = "";
    interimRef.current = "";
    setFinalTranscript("");
    setInterimTranscript("");
    setLastAlternatives([]);
  }, []);

  // Setter manual del transcript (usado por el "Limpiar" del UI).
  const setTranscript = useCallback((t: string) => {
    committedRef.current = t;
    interimRef.current = "";
    setFinalTranscript(t);
    setInterimTranscript("");
  }, []);

  const transcript = (finalTranscript + " " + interimTranscript)
    .replace(/\s+/g, " ")
    .trim();

  return {
    supported,
    listening,
    finalTranscript,
    interimTranscript,
    transcript,
    lastAlternatives,
    notSupported: !supported,
    iosStandaloneIssue,
    permissionDenied,
    begin,
    end,
    setTranscript,
    clear,
  };
}
