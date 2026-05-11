# agro-notes (frontend)

Frontend de Agro Notes — PWA con Next.js 14, Tailwind v4 y reconocimiento de voz para registrar notas de campo offline.

## Stack

- **Next.js 14** (App Router) + **React 18**
- **TypeScript**
- **Tailwind CSS v4** con tokens declarados en `src/app/globals.css` (`@theme`)
- **Dexie** (wrapper de IndexedDB) para storage local + cola de operaciones pendientes
- **next-pwa** + **Workbox** para el service worker
- **Web Speech API** para entrada por voz
- **Firebase Auth** (cliente)

## Scripts

```bash
npm run dev     # arranca en http://localhost:3000
npm run build   # build de producción
npm run start   # corre el build (puerto 3000)
npm run lint    # next lint
```

## Configuración

`cp .env.local.example .env.local` y completar:

```bash
NEXT_PUBLIC_API_BASE=http://localhost:4000

# Firebase (Console → Project settings → Your apps → SDK setup)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

> Solo las variables `NEXT_PUBLIC_*` viajan al navegador. Nunca pongas secrets de servidor acá.

## Sistema de UI / paleta

La paleta vive como CSS vars en `src/app/globals.css` dentro del bloque `@theme`. Cualquier cambio se propaga a todos los componentes vía utilities de Tailwind v4.

| Token | Uso |
|---|---|
| `bg-page` | Fondo principal |
| `bg-card` / `bg-card-hover` | Tarjetas e inputs |
| `bg-accent` / `bg-accent-hover` | Botones primarios y links |
| `bg-mic-active` | Mic grabando, errores |
| `bg-success` | Confirmaciones |
| `text-fg` / `text-fg-muted` / `text-fg-subtle` | Jerarquía de texto |
| `border-border-subtle` / `border-border-strong` | Bordes |
| `bg-warning-bg` / `text-warning-fg` | Avisos |

Componentes atómicos en `src/components/ui/`:

- `Button` — variantes `primary` / `ghost` / `danger` / `success`, tamaños `sm` / `md` / `lg`, focus-ring consistente.
- `Card`, `Input`, `TextArea`, `Label`, `Row`, `BackButton`, `PageContainer`.
- `MicButton` — animación `mic-pulse` cuando está grabando.

## Estructura

```
src/
├── app/
│   ├── globals.css            # Tailwind v4 + @theme tokens
│   ├── layout.tsx             # Root layout (header sticky, body bg)
│   ├── page.tsx               # Home — atajos a las pantallas
│   ├── voice-note/page.tsx    # Crear/editar nota con voz + form
│   ├── notes/page.tsx         # Listado, filtros, edición y borrado
│   ├── login/page.tsx         # Login (email + Google)
│   ├── profile/page.tsx       # Perfil del usuario
│   ├── sharing/page.tsx       # Gestionar accesos compartidos
│   └── setup-password/page.tsx
├── components/
│   ├── ui/                    # Sistema atómico
│   ├── Header.tsx
│   ├── NoteCard.tsx
│   ├── NoteForm.tsx
│   ├── AuthGuard.tsx
│   ├── PWARegister.tsx
│   ├── SyncBadge.tsx
│   ├── Toaster.tsx
│   ├── AdminScopeToggle.tsx
│   └── useSpeech.ts
├── lib/
│   ├── api.ts                 # Cliente HTTP (inyecta el ID token)
│   ├── firebase.ts            # SDK del cliente
│   ├── voiceParsing.ts        # Parser + diccionario agro + rerank
│   └── offline/
│       ├── offlineDb.ts       # Dexie schema (notes + pending ops)
│       ├── notesOffline.ts    # API offline-first (create/update/delete/sync)
│       └── syncEvents.ts      # Event bus tipado (sync:start/end/error)
├── contexts/
│   ├── AuthContext.tsx        # Provider de Firebase Auth
│   └── MeContext.tsx          # me + isAdmin + scope (con persistencia)
├── hooks/
│   ├── useIsMobile.ts
│   ├── useMicLevel.ts
│   ├── useOfflineNotes.ts
│   └── useSyncStatus.ts
├── theme.ts                   # Paleta como TS (referenciada en layout meta)
└── types/note.type.ts
```

## Flujo offline-first

Cada nota se escribe primero en IndexedDB (Dexie) con `syncStatus: "pending"` y se agrega a una cola de operaciones. Cuando hay red:

1. Se procesa la cola (create/update/delete) contra el backend.
2. Se descargan cambios del servidor desde `lastSync` (guardado en `localStorage`).
3. Las notas locales se actualizan a `synced`.

Si una operación falla, queda como `error` y se reintenta en la próxima sync.

### UI de sync

El usuario ve el estado en tiempo real desde el header:

- **`SyncBadge`** (componente del header) muestra 4 estados: `offline` (rojo), `sincronizando…` (azul con spinner), `N pendientes` o `N con error` (amarillo / rojo, click para forzar sync), `OK` (dot verde discreto). Tooltip con la última fecha de sync.
- **`Toaster`** (montado en el layout) muestra un mensaje arriba a la derecha cuando termina un sync con cambios reales (`✓ Sincronizado · N enviadas, M actualizadas`) o errores.
- **Hook `useSyncStatus`**: API consolidada (online + syncing + pendingCount + errorCount + lastSyncAt + triggerSync). Usa `liveQuery` de Dexie para que `pendingCount` se actualice reactivamente cuando cambian los `syncStatus` en IndexedDB.
- **Event bus** (`lib/offline/syncEvents.ts`): `notesOffline.syncNotes()` emite `sync:start`, `sync:end` con contadores (`pendingProcessed`, `changesPulled`, `failed`) y `sync:error`. La UI escucha sin acoplarse al módulo offline.

## Multi-usuario, sharing y privacidad

### Modelo

Cada nota tiene `owner_email` (asignado desde el JWT) e `is_private`. El backend filtra por owner + tabla `farm_shares` al listar (ver README raíz). El frontend respeta el modelo:

- **`MeContext`** (`src/contexts/MeContext.tsx`): provider montado dentro de `AuthProvider`. Llama `GET /me` cuando hay user logueado, expone `{ me, loading, scope, setScope, refresh }`. El `scope` (`"mine" | "all"`) persiste en `localStorage` con key `agro-notes:scope`. Si el user no es admin, `scope` siempre se reduce a `"mine"`.
- **`AdminScopeToggle`** (`src/components/AdminScopeToggle.tsx`): segmented control en el header, solo visible si `me.isAdmin`. Llama `setScope(...)`.
- **`useOfflineNotes({ scope })`** propaga el scope a `listNotes` y a `syncNotes`. La página `/notes` lo lee del context con `useMe()` y recarga al cambiar.

### UI

- **Form (`NoteForm`)**: checkbox "Solo para mí" debajo de Nota. Persiste como `is_private` en IndexedDB y en el backend.
- **Card (`NoteCard`)**:
  - Badge **"Compartida por &lt;email&gt;"** cuando la nota no es del usuario actual.
  - Badge **"Privada"** con candado cuando `is_private`.
  - Botones Editar/Eliminar ocultos si no soy dueño ni admin.
- **`/sharing`**: form para crear acceso (`farm` + `shared_with_email`), lista de shares "compartí con otros" (con revocar) y "te compartieron" (read-only). Mensajes de error/éxito inline.

### Caveat conocido

Cuando un admin alterna el switch de `all` a `mine`, las notas de otros usuarios que ya estaban en IndexedDB **siguen visibles** localmente porque `getAllLocalNotes()` lee todo. Para limpiar, hay que purgar la cache (DevTools → Application → IndexedDB → AgroNotesDB → notes → clear). Hay un ítem en `MEJORAS.md` para resolverlo (filtrar al leer o purgar al cambiar scope).

## Entrada por voz

### Hook `useSpeech`

```ts
const {
  supported,
  listening,
  finalTranscript,    // estable, lo que ya quedó "fijo"
  interimTranscript,  // provisorio, parpadea
  transcript,         // final + interim
  iosStandaloneIssue, // true si estamos en iOS PWA standalone
  permissionDenied,   // true si el usuario rechazó el mic
  begin,              // mantener apretado
  end,                // soltar
  clear,              // resetear todo el buffer
} = useSpeech({
  lang: "es-AR",
  rerank: pickBestAlternative, // re-ranking con diccionario agro
});
```

Detalles de implementación importantes:

- **Buffer "committed"**: `committedRef` acumula todo lo que llega como `isFinal` entre sesiones del recognizer. Esto evita perder lo dicho cuando Safari/Chrome cortan automáticamente y reinicia.
- **resultIndex**: solo procesamos resultados nuevos (antes re-leíamos `event.results` desde 0 en cada evento, que era ineficiente).
- **Restart con delay** (150ms) para evitar `InvalidStateError` en Chrome.
- **maxAlternatives = 3**: pedimos 3 candidatos al ASR y `rerank` elige el mejor.
- **iOS PWA standalone**: detectado vía `navigator.standalone` y `display-mode: standalone`. El SR no funciona ahí; mostramos un cartel.
- **Cleanup correcto**: `useEffect` cancela timers y para el recognizer al desmontar.

### Parser `voiceParsing`

Pipeline:

```
raw → normalize → fixAsrCommonErrors → fixAgroTerms → match keywords → split listas
```

Sinónimos del dominio:

| Campo | Sinónimos |
|---|---|
| Explotación | explotación, campo, establecimiento, estancia |
| Lote | lote, potrero, parcela |
| Maleza | maleza, yuyo |
| Aplicación | aplicación, herbicida, producto, fitosanitario |
| Nota | nota, observación, comentario |

Productos y malezas auto-corregidas a forma canónica: `glifosato`, `2,4-D`, `dicamba`, `atrazina`, `paraquat`, `metsulfuron`, `yuyo colorado`, `gramilla`, `rama negra`, `sorgo de alepo`.

`pickBestAlternative(alts)` puntúa cada alternativa por cuántas señales del dominio agro contiene y elige la mejor (penaliza patrones de ASR roto como "lo te" o "lifosato").

### Hook `useMicLevel`

Lee el volumen real del mic en tiempo real para que el `MicButton` pulse al ritmo de la voz en lugar de usar una animación CSS constante.

```ts
const micLevel = useMicLevel(listening); // 0..1, ~60fps

<MicButton listening={listening} level={micLevel} ... />
```

Internamente:
- Pide un stream propio con `getUserMedia({ audio: { echoCancellation, noiseSuppression, autoGainControl } })` cuando `active` pasa a `true`.
- Crea un `AudioContext` + `AnalyserNode` (fftSize=256, smoothing=0.7).
- Loop con `requestAnimationFrame` que calcula el RMS del time-domain, resta un piso de ruido (~0.02) y escala con un span (~0.4).
- Suaviza con EMA (0.6 viejo + 0.4 nuevo) para evitar saltos.
- Cuando `active` vuelve a `false` o el componente se desmonta, libera tracks, cancela el rAF y cierra el `AudioContext`.

Si el permiso del mic se rechaza o el browser no expone `AudioContext`, el hook devuelve `0` siempre y el `MicButton` cae al fallback CSS (`animate-mic-pulse`).

## Compatibilidad de voz

| Plataforma | Soporte |
|---|---|
| Chrome desktop / Android | ✅ Bueno |
| Safari iOS (en navegador) | ⚠️ Parcial (corta cada ~10s, el hook re-arranca sin perder transcript) |
| Safari iOS (PWA standalone) | ❌ No funciona — el hook detecta y avisa |
| Firefox | ⚠️ Variable según versión |

## PWA

El service worker se registra automáticamente en `PWARegister.tsx` (solo en producción). Manifest en `public/manifest.json`. Los assets del icono están en `public/icons/`.

Para probar PWA local:

```bash
npm run build && npm run start
```

Y en otra terminal abrir `http://localhost:3000`.

## Roadmap

Ver `MEJORAS.md` en la raíz del repo.
