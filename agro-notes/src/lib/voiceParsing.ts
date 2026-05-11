// agro-notes/src/lib/voiceParsing.ts
//
// Parser de comandos de voz orientados al agro.
// Pipeline:
//   raw → normalize → fixAsrCommonErrors → fixAgroTerms → match keywords
//                                                       → split listas
//
// La idea es que el ASR no siempre devuelve la palabra exacta:
// "explotación Juan Carlos" puede llegar como "ex plotacion juan carlos".
// Acá hacemos varios reemplazos antes de buscar keywords, y aceptamos
// más sinónimos del dominio.

// ----------------------------------------------------------------------
// Normalización base
// ----------------------------------------------------------------------

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    // saca diacríticos (acentos, tildes), rango U+0300–U+036F
    .replace(/[̀-ͯ]/g, "")
    .replace(/[.;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ----------------------------------------------------------------------
// Fixes para errores comunes del reconocimiento de voz en español
// ----------------------------------------------------------------------
// El ASR a veces parte palabras o las junta mal. Estas regex pegan los
// pares más frecuentes que vimos en pruebas.
function fixAsrCommonErrors(t: string): string {
  return (
    t
      // "lo te" -> "lote"
      .replace(/\blo te\b/g, "lote")
      // "ex plotacion(es)" -> "explotacion(es)"
      .replace(/\bex plotacion(es)?\b/g, "explotacion$1")
      // "a plicacion(es)" -> "aplicacion(es)"
      .replace(/\ba plicacion(es)?\b/g, "aplicacion$1")
      // "ma leza(s)" -> "maleza(s)"
      .replace(/\bma leza(s)?\b/g, "maleza$1")
      // "establece miento(s)" -> "establecimiento(s)"
      .replace(/\bestablece miento(s)?\b/g, "establecimiento$1")
      // "observ acion(es)" -> "observacion(es)"
      .replace(/\bobserv acion(es)?\b/g, "observacion$1")
      // "coment ario(s)" -> "comentario(s)"
      .replace(/\bcoment ario(s)?\b/g, "comentario$1")
      // "po trero(s)" -> "potrero(s)"
      .replace(/\bpo trero(s)?\b/g, "potrero$1")
      // "par cela(s)" -> "parcela(s)"
      .replace(/\bpar cela(s)?\b/g, "parcela$1")
      // colapsar dobles espacios que pudieron quedar
      .replace(/\s+/g, " ")
      .trim()
  );
}

// ----------------------------------------------------------------------
// Diccionario de términos del agro (auto-corrección de productos / malezas)
// ----------------------------------------------------------------------
// El ASR a veces inventa "lifosato" en vez de "glifosato" o entiende
// "dos cuatro de" en vez de "2,4-D". Acá normalizamos esos términos a
// su forma canónica.
const AGRO_TERMS: Array<[RegExp, string]> = [
  // Glifosato
  [
    /\b(li ?fosato|gli ?fosato|glif ?osato|glifos ?ato|glifosfato)\b/g,
    "glifosato",
  ],
  // 2,4-D — varias formas de pronunciar
  [/\b(dos coma cuatro de|dos cuatro de|2 ?4 ?d|24 ?d)\b/gi, "2,4-D"],
  // Dicamba
  [/\b(di ?camba|dicamba)\b/g, "dicamba"],
  // Atrazina
  [/\b(a ?trazina|atrasina)\b/g, "atrazina"],
  // Paraquat
  [/\b(para ?cuat|paracuat|paraquat)\b/g, "paraquat"],
  // Metsulfurón
  [/\b(metsulf?uron|met sulfuron)\b/g, "metsulfuron"],
  // Yuyo colorado
  [/\b(yuyo color ?ado|yuyos colorados?)\b/g, "yuyo colorado"],
  // Gramilla
  [/\b(gra milla|gram illa)\b/g, "gramilla"],
  // Rama negra
  [/\b(ra ma negra|rama negras)\b/g, "rama negra"],
  // Sorgo de Alepo
  [/\b(sorgo de aleppo|sorgo de halepo|sorgo de alepo)\b/g, "sorgo de alepo"],
];

function fixAgroTerms(t: string): string {
  let out = t;
  for (const [re, repl] of AGRO_TERMS) {
    out = out.replace(re, repl);
  }
  return out;
}

// ----------------------------------------------------------------------
// Pipeline de pre-procesado
// ----------------------------------------------------------------------
function preprocess(s: string): string {
  let t = normalize(s);
  t = fixAsrCommonErrors(t);
  t = fixAgroTerms(t);
  return t.replace(/\s+/g, " ").trim();
}

// ----------------------------------------------------------------------
// Keywords del dominio (con sinónimos)
// ----------------------------------------------------------------------
const KEYWORDS: Record<string, string[]> = {
  explotacion: [
    "explotacion",
    "explotaciones",
    "campo",
    "campos",
    "establecimiento",
    "establecimientos",
    "estancia",
    "estancias",
  ],
  lote: ["lote", "lotes", "potrero", "potreros", "parcela", "parcelas"],
  malezas: ["maleza", "malezas", "yuyo", "yuyos"],
  aplicaciones: [
    "aplicacion",
    "aplicaciones",
    "herbicida",
    "herbicidas",
    "producto",
    "productos",
    "fitosanitario",
    "fitosanitarios",
  ],
  nota: [
    "nota",
    "notas",
    "observacion",
    "observaciones",
    "comentario",
    "comentarios",
  ],
};

// ----------------------------------------------------------------------
// Parser principal
// ----------------------------------------------------------------------
export type ParsedSpeech = {
  /** Forma canónica española usada en la UI. */
  explotacion: string;
  lote: string;
  malezas: string[];
  aplicaciones: string[];
  nota: string;

  /** Aliases en inglés para encajar con `Preset` del NoteForm. */
  farm: string;
  lot: string;
  weeds: string[];
  applications: string[];
  note: string;
};

export function parseSpeech(raw: string): Partial<ParsedSpeech> {
  if (!raw) return {};

  const t = preprocess(raw);

  // 1) Encontrar TODAS las ocurrencias de keywords con su posición.
  type Match = { key: string; idx: number; matched: string };
  const matches: Match[] = [];

  for (const canonical in KEYWORDS) {
    for (const kw of KEYWORDS[canonical]) {
      // \bpalabra\b — flag global para juntar todas las apariciones.
      const re = new RegExp(`\\b${kw}\\b`, "gi");
      let m: RegExpExecArray | null;
      while ((m = re.exec(t)) !== null) {
        matches.push({ key: canonical, idx: m.index, matched: kw });
      }
    }
  }

  if (!matches.length) return {};

  // 2) Ordenar por posición.
  matches.sort((a, b) => a.idx - b.idx);

  // 3) Cortar el texto entre cada keyword y la siguiente.
  const segs: Record<string, string> = {};
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const next = matches[i + 1];
    const start = cur.idx + cur.matched.length;
    const end = next ? next.idx : t.length;

    // Si la key ya apareció, mantenemos el primer fragmento (el más
    // probable de ser el "valor"). Los siguientes los ignoramos.
    if (segs[cur.key] === undefined) {
      segs[cur.key] = t.slice(start, end).trim();
    }
  }

  // helper: dividir lista por coma, " y ", " e ", " con ", " mas ".
  const splitList = (s?: string): string[] =>
    (s ?? "")
      .replace(/:/g, " ")
      .split(/,| y | e | con | mas /g)
      .map((x) => x.trim())
      .filter(Boolean);

  const explotacion = (segs["explotacion"] ?? "").trim();
  // Para lote, agarramos la primera palabra (ej. "24 norte" → "24").
  const lote = (segs["lote"] ?? "").trim().split(/\s+/)[0] ?? "";
  const malezas = splitList(segs["malezas"]);
  const aplicaciones = splitList(segs["aplicaciones"]);
  const nota = (segs["nota"] ?? "").trim();

  const out: Partial<ParsedSpeech> = {
    explotacion,
    lote,
    malezas,
    aplicaciones,
    nota,
    // aliases ingleses para integración con el form
    farm: explotacion,
    lot: lote,
    weeds: malezas,
    applications: aplicaciones,
    note: nota,
  };
  return out;
}

// ----------------------------------------------------------------------
// Re-ranking de alternativas del ASR
// ----------------------------------------------------------------------
//
// El reconocimiento de voz devuelve hasta N candidatos para cada frase.
// Por default usamos `result[0]` (el de mayor confianza del modelo), pero
// muchas veces el modelo prefiere palabras genéricas sobre términos del
// dominio agro. Por ejemplo: dice "lifosato" cuando lo mejor era
// "glifosato", o "yo te" en vez de "lote".
//
// `scoreAlternative` puntúa una alternativa según cuántas señales del
// dominio aparecen, y `pickBestAlternative` elige la de mejor score.
// La elegida sigue siendo siempre una de las que el ASR propuso.

// Productos comunes en aplicaciones (en su forma canónica, ya
// normalizada por `fixAgroTerms`).
const AGRO_PRODUCTS = [
  "glifosato",
  "2,4-d",
  "dicamba",
  "atrazina",
  "paraquat",
  "metsulfuron",
];

// Malezas frecuentes (también en forma canónica).
const AGRO_WEEDS = [
  "yuyo colorado",
  "gramilla",
  "rama negra",
  "sorgo de alepo",
];

// Palabras "ruido" que el ASR a veces deja al cortar mal una frase.
// Las penalizamos suavemente para que pierdan en empates.
const ASR_NOISE_PATTERNS: RegExp[] = [
  /\bex plotacion/,
  /\ba plicacion/,
  /\bma leza/,
  /\blo te\b/,
  /\bli ?fosato\b/,
];

/**
 * Puntúa una alternativa del ASR según cuántas señales del dominio
 * agro contiene. Pasamos antes por `preprocess` para que las variantes
 * cuenten en su forma canónica.
 */
export function scoreAlternative(text: string): number {
  if (!text) return -Infinity;

  const t = preprocess(text);
  let score = 0;

  // Cada keyword del dominio (explotacion, lote, malezas, aplicaciones,
  // nota y sus sinónimos) suma 2 puntos.
  for (const list of Object.values(KEYWORDS)) {
    for (const kw of list) {
      const re = new RegExp(`\\b${kw}\\b`);
      if (re.test(t)) {
        score += 2;
        break; // un único hit por categoría es suficiente
      }
    }
  }

  // Productos canónicos suman 3 puntos (más confianza que un sinónimo).
  for (const p of AGRO_PRODUCTS) {
    if (t.includes(p)) score += 3;
  }
  // Malezas canónicas también suman 3.
  for (const w of AGRO_WEEDS) {
    if (t.includes(w)) score += 3;
  }

  // Penalizamos patrones de ASR roto. Notar que `preprocess` ya intenta
  // arreglar muchos, pero los miramos sobre el texto crudo para detectar
  // alternativas que vinieron rotas.
  const rawNorm = normalize(text);
  for (const re of ASR_NOISE_PATTERNS) {
    if (re.test(rawNorm)) score -= 1;
  }

  // Pequeño bonus por longitud razonable (evita preferir respuestas
  // de una sola palabra cuando hay otra más completa).
  const words = t.split(/\s+/).filter(Boolean).length;
  score += Math.min(words / 5, 2);

  return score;
}

/**
 * Elige la mejor alternativa de una lista usando `scoreAlternative`.
 * Si hay empate, gana la primera (mayor confianza del modelo).
 */
export function pickBestAlternative(alts: string[]): string {
  if (!alts || !alts.length) return "";
  if (alts.length === 1) return alts[0];

  let bestIdx = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < alts.length; i++) {
    const s = scoreAlternative(alts[i]);
    if (s > bestScore) {
      bestScore = s;
      bestIdx = i;
    }
  }
  return alts[bestIdx];
}

// Exports auxiliares útiles para tests / debug
export const __internal = {
  normalize,
  fixAsrCommonErrors,
  fixAgroTerms,
  preprocess,
  KEYWORDS,
  AGRO_PRODUCTS,
  AGRO_WEEDS,
};
