"use client";

import { useEffect, useState } from "react";

/**
 * Lee el nivel de audio del micrófono en tiempo real mientras `active`
 * es true. Devuelve un número en [0, 1] que se actualiza ~60 veces por
 * segundo, ideal para animar visualmente un anillo o un pulso.
 *
 * Cuando `active` pasa a false (o el componente se desmonta), libera el
 * stream del mic, cancela el rAF y cierra el AudioContext.
 *
 * Notas:
 *  - Usa `getUserMedia` para obtener un stream propio. La Web Speech API
 *    pide su propio stream por separado; los dos conviven en la mayoría
 *    de los navegadores. En iOS Safari standalone (PWA) puede no andar,
 *    pero ahí tampoco anda el speech, así que no es regresión.
 *  - Si el usuario rechaza el permiso, el hook simplemente devuelve 0
 *    (no rompe). El feedback visual cae al fallback CSS del MicButton.
 *  - El cálculo es RMS sobre la onda en el dominio del tiempo, con un
 *    piso de ruido restado y suavizado con EMA.
 */
export function useMicLevel(active: boolean): number {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let raf = 0;

    const stop = () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (ctx) ctx.close().catch(() => {});
      setLevel(0);
    };

    const start = async () => {
      try {
        if (
          typeof navigator === "undefined" ||
          !navigator.mediaDevices?.getUserMedia
        ) {
          return;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          stream = null;
          return;
        }

        const Ctx: typeof AudioContext | undefined =
          (window as any).AudioContext ||
          (window as any).webkitAudioContext;
        if (!Ctx) return;

        ctx = new Ctx();
        // Algunos browsers crean el ctx en estado "suspended" hasta que
        // hay un user gesture. Como `active` se setea a true desde un
        // onPointerDown / onTouchStart, resume() debería funcionar.
        try {
          await ctx.resume();
        } catch {
          /* ignore */
        }

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser);

        const buf = new Uint8Array(analyser.fftSize);
        let smoothed = 0;
        // Piso de ruido: lo que el mic capta cuando no hay voz. Lo
        // restamos para que el "0" visual coincida con silencio real.
        const noiseFloor = 0.02;
        // Ganancia: cuánto amplificamos por encima del piso.
        const span = 0.4;

        const tick = () => {
          if (cancelled) return;
          analyser.getByteTimeDomainData(buf);
          // RMS sobre la onda centrada en 128 (rango [0..255]).
          let sumSq = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sumSq += v * v;
          }
          const rms = Math.sqrt(sumSq / buf.length);
          const norm = Math.max(0, Math.min(1, (rms - noiseFloor) / span));
          // EMA: 0.6 vieja + 0.4 nueva. Suaviza saltos sin perder reactividad.
          smoothed = smoothed * 0.6 + norm * 0.4;
          setLevel(smoothed);
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        // permiso denegado, mic ocupado, etc. — quedamos en 0.
      }
    };

    start();
    return stop;
  }, [active]);

  return level;
}
