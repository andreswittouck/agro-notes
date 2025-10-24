// agro-notes/src/lib/voiceParsing.ts

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // saco acentos
    .replace(/[.;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// lista de palabras clave aceptadas por campo
const KEYWORDS: Record<string, string[]> = {
  explotacion: ["explotacion", "explotaciones", "campo", "campos"],
  lote: ["lote", "lotes"],
  malezas: ["maleza", "malezas"],
  aplicaciones: ["aplicacion", "aplicaciones"],
  nota: ["nota", "notas", "observacion", "observaciones"],
};

/**
 * Dada una palabra reconocida, decime a qué key lógica pertenece
 * ej: "aplicaciones" -> "aplicaciones"
 */
function canonicalKey(word: string): string | null {
  for (const canonical in KEYWORDS) {
    const list = KEYWORDS[canonical];
    if (list.some((w) => word === w)) {
      return canonical;
    }
  }
  return null;
}

export function parseSpeech(raw: string) {
  if (!raw) return {};
  const t = normalize(raw);

  // vamos a encontrar la posición de cada keyword posible
  type Match = { key: string; idx: number };

  const matches: Match[] = [];

  for (const canonical in KEYWORDS) {
    for (const kw of KEYWORDS[canonical]) {
      // \bpalabra\b para evitar capturar dentro de otra palabra
      const re = new RegExp(`\\b${kw}\\b`, "i");
      const m = t.match(re);
      if (m?.index !== undefined) {
        matches.push({ key: canonical, idx: m.index });
      }
    }
  }

  if (!matches.length) return {};

  // ordenamos las ocurrencias por posición en el texto
  matches.sort((a, b) => a.idx - b.idx);

  // ahora cortamos el texto entre cada keyword y la siguiente
  const segs: Record<string, string> = {};
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const next = matches[i + 1];
    const start = cur.idx + cur.key.length;
    const end = next ? next.idx : t.length;

    // si la key ya apareció, no la piso; me quedo con la primera
    if (segs[cur.key] === undefined) {
      segs[cur.key] = t.slice(start, end).trim();
    }
  }

  // helper: dividir lista por coma, " y ", " e ", " con "
  const splitList = (s?: string) =>
    (s ?? "")
      .replace(/:/g, " ")
      .split(/,| y | e | con /g)
      .map((x) => x.trim())
      .filter(Boolean);

  const explotacion = segs["explotacion"]?.trim() ?? "";
  const lote = segs["lote"]?.trim().split(/\s+/)[0] ?? "";
  const malezas = splitList(segs["malezas"]);
  const aplicaciones = splitList(segs["aplicaciones"]);
  const nota = (segs["nota"] || "").trim();

  return { explotacion, lote, malezas, aplicaciones, nota };
}
