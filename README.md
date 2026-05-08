# Agro Notes

Sistema de registro de notas de campo agrícolas con entrada por voz, funcionalidad offline y sincronización automática. Diseñado para ser usado en campo donde la conectividad puede ser limitada.

## Descripción

Agro Notes es una aplicación web progresiva (PWA) que permite a los trabajadores agrícolas registrar notas de campo de forma rápida y eficiente mediante entrada por voz o texto. El sistema funciona completamente offline y sincroniza automáticamente cuando hay conexión a internet.

### Características principales

- **Entrada por voz** con reconocimiento en español (es-AR), parser inteligente del dominio agro y re-ranking de alternativas para preferir términos como "glifosato", "yuyo colorado", "2,4-D".
- **PWA** instalable en mobile y desktop.
- **Offline-first**: las notas se guardan en IndexedDB y se sincronizan cuando hay red.
- **Sincronización automática** del cliente al servidor y del servidor al cliente cuando se restaura la conexión.
- **Geolocalización** opcional: cada nota guarda lat/lng del momento del registro.
- **Borrado lógico**: las notas eliminadas se marcan como borradas, no se pierden.
- **Autenticación** con Firebase Auth (email + Google) y whitelist de emails autorizados en el backend (fail-closed).
- **Multi-usuario con sharing por explotación**: cada nota tiene dueño, podés compartir una explotación entera con otro email, y marcar notas como "privadas" para que no se compartan aunque la explotación lo esté.
- **Rol admin** con switch "Mías / Todas" para ver todo el sistema.
- **UI tematizada** con paleta dark consistente (Tailwind v4 + tokens).

## Arquitectura

El proyecto está dividido en dos componentes principales:

### Frontend (`agro-notes/`)
- Next.js 14 con React 18 (App Router).
- Tailwind CSS v4 con paleta del proyecto declarada en `@theme` (ver `src/app/globals.css`).
- Dexie (wrapper de IndexedDB) para persistencia local y cola de operaciones pendientes.
- next-pwa + Workbox para el service worker.
- Web Speech API para el reconocimiento de voz.
- Firebase Auth (cliente) para login.

### Backend (`agro-notes-api/`)
- NestJS 11 con TypeORM.
- PostgreSQL 16 (vía Docker o nativo).
- Firebase Admin para validar tokens emitidos por el front.
- Whitelist de emails autorizados (`AUTHORIZED_EMAILS` en `.env`) — fail-closed.
- Lista de admins (`ADMIN_EMAILS` en `.env`) — pueden ver todas las notas y revocar shares ajenos.
- Tabla `farm_shares` para los accesos delegados.
- Swagger en `/docs`.

## Cómo funciona

### Flujo offline-first

1. **Creación de nota**:
   - El usuario crea una nota (por voz o texto).
   - Se guarda inmediatamente en IndexedDB con `syncStatus: "pending"` y se registra en la cola de operaciones pendientes.
   - Si hay conexión, intenta sincronizarse de inmediato.
   - Si no, queda pendiente para sincronización futura.
2. **Sincronización**:
   - Cuando vuelve la conexión, `syncNotes()` envía las pendientes (create/update/delete) al servidor.
   - Después descarga los cambios del servidor desde la última sincronización.
   - Actualiza el estado local.
3. **Resolución de conflictos**:
   - El servidor es la fuente de verdad.
   - Los cambios locales se sobrescriben con los del servidor si hay conflictos.
   - Se mantiene `lastSync` en `localStorage`.

### Reconocimiento de voz

Usa Web Speech API y un parser que extrae información estructurada de lo dictado.

**Pipeline del parser** (`agro-notes/src/lib/voiceParsing.ts`):

```
raw input
  → normalize (lowercase, sin acentos, sin puntuación rara)
  → fixAsrCommonErrors (regex: "lo te" → "lote", "ex plotacion" → "explotacion", etc.)
  → fixAgroTerms (diccionario de productos / malezas en su forma canónica)
  → match keywords con sinónimos del dominio
  → split listas por coma / "y" / "e" / "con" / "mas"
```

**Re-ranking de alternativas** (`pickBestAlternative`):
El ASR devuelve hasta 3 candidatos por chunk. En lugar de quedarnos con el de mayor confianza del modelo, puntuamos cada uno por cuántas señales del dominio agro contiene y elegimos el de mejor score. Es una de las claves para que palabras técnicas como "glifosato", "atrazina" o "2,4-D" se reconozcan bien aunque el modelo prefiera variantes genéricas.

**Continuidad del transcript**: el hook `useSpeech` mantiene un buffer "committed" con todo lo final acumulado entre sesiones del recognizer. Cuando Safari/Chrome cortan automáticamente y reinicia, **no se pierde lo dicho**. El interim que haya quedado al cortar se "compromete" como final.

**Palabras clave reconocidas** (con sinónimos):

| Campo | Disparadores |
|---|---|
| `farm` (Explotación) | explotación, campo, establecimiento, estancia |
| `lot` (Lote) | lote, potrero, parcela |
| `weeds` (Malezas) | maleza, yuyo |
| `applications` (Aplicaciones) | aplicación, herbicida, producto, fitosanitario |
| `note` (Nota) | nota, observación, comentario |

**Términos del agro auto-corregidos**:
- Productos: `glifosato`, `2,4-D`, `dicamba`, `atrazina`, `paraquat`, `metsulfuron`.
- Malezas: `yuyo colorado`, `gramilla`, `rama negra`, `sorgo de alepo`.

**Ejemplo de entrada por voz**:

```
"Establecimiento Juan Carlos, lote 24, malezas gramilla y yuyo colorado,
 aplicaciones 2,4-D y glifosato, comentario viento ligero"
```

**Resultado parseado**:

```json
{
  "farm": "juan carlos",
  "lot": "24",
  "weeds": ["gramilla", "yuyo colorado"],
  "applications": ["2,4-d", "glifosato"],
  "note": "viento ligero"
}
```

### Compatibilidad de voz por plataforma

| Plataforma | Soporte | Notas |
|---|---|---|
| Chrome desktop / Android | ✅ Bueno | Mejor reconocimiento, soporta sesiones largas. |
| Safari iOS (en navegador) | ⚠️ Parcial | Corta cada ~10s; el hook re-arranca automáticamente sin perder transcript. |
| Safari iOS (PWA standalone) | ❌ No funciona | El hook detecta el caso y muestra un cartel pidiendo abrir desde Safari. |
| Firefox | ⚠️ Variable | Depende de la versión y del SO. |

### Estructura de datos

#### Nota local (IndexedDB)

```typescript
{
  id: string;
  farm: string;
  lot: string;
  weeds: string[];
  applications: string[];
  note?: string;
  lat?: number;
  lng?: number;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  syncStatus: "synced" | "pending" | "error";
  operation?: "create" | "update" | "delete";
}
```

#### Nota API (PostgreSQL)

```typescript
{
  id: string (UUID);
  farm: string;
  lot: string;
  weeds: string[];
  applications: string[];
  note?: string;
  lat?: number;
  lng?: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}
```

## Configuración e instalación

### Requisitos previos

- Node.js 20+
- Docker y Docker Compose (para Postgres)
- Una app de Firebase con Authentication habilitado (Google y/o email)

### Backend

1. `cd agro-notes-api`
2. `cp .env.example .env` y completar:
   - DB (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`)
   - `FIREBASE_ADMIN_KEY_PATH=./firebase-admin-key.json` y guardar el JSON de service account de Firebase en esa ruta (lo genera Firebase Console → Project settings → Service accounts → "Generate new private key"). El archivo está en `.gitignore`.
   - `AUTHORIZED_EMAILS=tu@email.com,otro@email.com` (sin esto, la API deniega todo).
3. Levantar Postgres: desde la raíz del proyecto, `docker compose up -d`.
4. `npm install`
5. `npm run start:dev`

API en `http://localhost:4000`. Swagger en `http://localhost:4000/docs`.

### Frontend

1. `cd agro-notes`
2. `cp .env.local.example .env.local` y completar las variables `NEXT_PUBLIC_FIREBASE_*` con la config de tu app de Firebase (Console → Project settings → Your apps → Web app → SDK setup).
3. `NEXT_PUBLIC_API_BASE=http://localhost:4000`
4. `npm install`
5. `npm run dev`

App en `http://localhost:3000`.

### Producción

Ambos componentes incluyen Dockerfile y configuración de docker-compose:

```bash
docker compose -f docker-compose.prod.yml up --build
```

## Estructura del proyecto

```
agro/
├── agro-notes/                    # Frontend (Next.js 14 + Tailwind v4)
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css        # Tailwind v4 + tokens del theme (@theme)
│   │   │   ├── layout.tsx         # Root layout, header sticky
│   │   │   ├── page.tsx           # Home (atajos)
│   │   │   ├── voice-note/        # Entrada por voz
│   │   │   ├── notes/             # Listado y filtros
│   │   │   ├── login/             # Login (email + Google)
│   │   │   ├── profile/           # Perfil del usuario
│   │   │   └── setup-password/    # Reset de contraseña
│   │   ├── components/
│   │   │   ├── ui/                # Sistema atómico (Card, Button, Input,
│   │   │   │                      #  TextArea, Label, Row, MicButton,
│   │   │   │                      #  BackButton, PageContainer)
│   │   │   ├── Header.tsx
│   │   │   ├── NoteCard.tsx
│   │   │   ├── NoteForm.tsx
│   │   │   ├── AuthGuard.tsx
│   │   │   ├── PWARegister.tsx
│   │   │   └── useSpeech.ts       # Hook de Web Speech con buffer + rerank
│   │   ├── lib/
│   │   │   ├── api.ts             # Cliente HTTP con token de Firebase
│   │   │   ├── firebase.ts        # SDK del cliente
│   │   │   ├── voiceParsing.ts    # Parser + diccionario agro + rerank
│   │   │   └── offline/           # Dexie + cola + sync
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   │   ├── useIsMobile.ts
│   │   │   └── useOfflineNotes.ts
│   │   ├── theme.ts               # Paleta en TS (referenciada en layout)
│   │   └── types/
│   └── public/                    # Assets PWA + manifest + sw
│
├── agro-notes-api/                # Backend (NestJS 11)
│   ├── src/
│   │   ├── auth/
│   │   │   ├── auth.guard.ts      # Verifica token de Firebase
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.decorator.ts
│   │   │   ├── firebase-admin.ts  # Inicialización del SDK admin
│   │   │   └── authorized-users.service.ts  # Whitelist (fail-closed)
│   │   ├── notes/
│   │   │   ├── application/dto/   # DTOs validados con class-validator
│   │   │   ├── infrastructure/    # Entidades TypeORM
│   │   │   ├── interfaces/http/   # Controllers HTTP
│   │   │   ├── notes.service.ts
│   │   │   └── notes.module.ts
│   │   ├── config/typeorm.config.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── docker-compose.yaml        # Postgres standalone (api-local)
│   └── test/
│
└── docker-compose.yml             # Postgres + pgAdmin para desarrollo
```

## Endpoints (API)

Todos requieren `Authorization: Bearer <firebase-id-token>`.

### Notas

- `POST /notes` – Crear una nueva nota. Acepta `is_private` opcional. El backend asigna `owner_email` desde el JWT (no se confía del cliente).
- `GET /notes?farm=&lot=&scope=mine|all` – Listar notas. `scope=all` solo lo respeta el backend si el caller es admin.
- `GET /notes/:id` – Obtener una nota por ID. Devuelve 403 si no la podés ver.
- `GET /notes/changes?since=ISO_DATE&farm=&lot=&scope=mine|all` – Cambios desde una fecha (sync incremental).
- `PATCH /notes/:id` – Actualizar una nota. Solo el dueño o un admin.
- `DELETE /notes/:id` – Borrado lógico. Solo el dueño o un admin.

### Usuario

- `GET /me` – `{ uid, email, emailVerified, isAdmin }`. El frontend lo usa para saber si mostrar el switch admin.

### Sharing por explotación

- `POST /shares/farms` – `{ farm, shared_with_email }`. Otorgar acceso de lectura. El owner del share es siempre el caller.
- `GET /shares/farms` – `{ granted: [...], received: [...] }`. Lo que cediste y lo que te cedieron.
- `DELETE /shares/farms/:owner/:farm/:sharedWith` – Revocar. Solo el owner del share o admin.

### Ejemplo de creación

```bash
curl -X POST http://localhost:4000/notes \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "farm": "JUAN CARLOS",
    "lot": "24",
    "weeds": ["gramilla"],
    "applications": ["2,4-D"],
    "note": "viento ligero",
    "lat": -33.123,
    "lng": -64.345,
    "is_private": false
  }'
```

### Ejemplo de share

```bash
curl -X POST http://localhost:4000/shares/farms \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{ "farm": "JUAN CARLOS", "shared_with_email": "pedro@x.com" }'
```

## Multi-usuario, sharing y privacidad

### Roles

| Rol | Cómo se define | Qué puede |
|---|---|---|
| **Usuario común** | Email en `AUTHORIZED_EMAILS` | Crear y administrar **sus propias** notas. Ver notas de otros si se las **compartieron explícitamente**. |
| **Invitado a una explotación** | Hay un registro en `farm_shares` con su email | Ver todas las notas de esa explotación específica que **no sean privadas**. Sin permisos de edición. |
| **Admin** | Email en `ADMIN_EMAILS` | Todo lo anterior + puede activar `?scope=all` para ver TODAS las notas del sistema. Puede modificar/borrar notas de otros y revocar shares ajenos. |

Las dos listas (`AUTHORIZED_EMAILS`, `ADMIN_EMAILS`) son CSVs en el `.env` del backend. Ser admin no implica estar en la whitelist (aunque típicamente se solapan).

### Modelo de datos

- `notes.owner_email` (NOT NULL) — email del usuario que creó la nota. Se asigna desde el JWT al crear, no se acepta del body.
- `notes.is_private` (BOOLEAN, default `false`) — si es `true`, la nota es estrictamente personal aunque la explotación esté compartida.
- Tabla `farm_shares(owner_email, farm, shared_with_email, created_at)` con PK compuesta. Permiso de lectura sobre **todas** las notas no-privadas de esa explotación.

### Pipeline de visibilidad

Para un caller con email `me`, el filtro que aplica el backend a cualquier listado es:

```sql
WHERE n.deleted_at IS NULL
  AND (
    n.owner_email = :me                              -- mis propias notas
    OR (
      n.is_private = false                           -- las privadas no se comparten
      AND EXISTS (
        SELECT 1 FROM farm_shares fs
        WHERE fs.owner_email = n.owner_email
          AND LOWER(fs.farm) = LOWER(n.farm)         -- match case-insensitive
          AND fs.shared_with_email = :me
      )
    )
  )
```

**Excepción admin**: si el caller es admin Y manda `?scope=all`, el filtro se omite y ve todo.

### UI

- **Checkbox "Solo para mí"** en el form de nota → setea `is_private = true`.
- **Badge "Compartida por <email>"** en notas que no son tuyas.
- **Badge "Privada"** (con candado) cuando `is_private`.
- **Botones Editar / Eliminar** ocultos si no sos dueño ni admin.
- **Switch "Mías / Todas"** en el header, solo visible para admins. Persiste en `localStorage`.
- **Página `/sharing`** para gestionar accesos: lista de "compartí con otros" (con revocar), "te compartieron" (read-only), y un form para crear shares.

### Backfill / migraciones

- Las notas existentes (sin `owner_email`) se backfillean a `andreswittouck@gmail.com` gracias al `default` de la columna en TypeORM. En entornos nuevos, el código siempre setea el campo y el default no aplica.
- TypeORM tiene `synchronize=true` en dev, así que al arrancar el backend se altera el schema solo. En producción usar migraciones (ver `MEJORAS.md`).

## Sistema de UI / paleta

La paleta vive como CSS vars dentro de `@theme` en `agro-notes/src/app/globals.css`. Cualquier cambio acá se propaga a todos los componentes vía utilities de Tailwind v4 (ej. `bg-page`, `text-fg`, `border-border-subtle`).

| Token | Hex | Uso |
|---|---|---|
| `page` | `#0f172a` | Fondo principal de la app. |
| `card` | `#1e2537` | Tarjetas e inputs. |
| `card-hover` | `#2a3247` | Estado hover sobre cards. |
| `accent` | `#3b82f6` | Primario (botones, focus, links). |
| `accent-hover` | `#2563eb` | Hover del primario. |
| `mic-active` | `#dc2626` | Mic grabando, errores destructivos. |
| `success` | `#10b981` | Confirmaciones. |
| `fg` | `#ffffff` | Texto principal. |
| `fg-muted` | `#94a3b8` | Texto secundario. |
| `fg-subtle` | `#64748b` | Texto de menor jerarquía. |
| `border-subtle` | `rgba(255,255,255,0.08)` | Bordes ligeros. |
| `border-strong` | `rgba(255,255,255,0.18)` | Bordes destacados. |
| `warning-bg` | `#fff6bf` | Fondo de avisos. |
| `warning-fg` | `#4a3b00` | Texto sobre warning. |

Componentes atómicos en `src/components/ui/`:
- `Button` con variantes `primary` / `ghost` / `danger` / `success` y tamaños `sm` / `md` / `lg`.
- `Card`, `Input`, `TextArea`, `Label`, `Row`, `BackButton`, `PageContainer`.
- `MicButton` con animación de pulso al grabar.

## Testing

### Backend
```bash
cd agro-notes-api
npm run test          # Tests unitarios
npm run test:e2e      # Tests end-to-end
npm run test:cov      # Coverage
```

### Frontend
```bash
cd agro-notes
npm run lint
```

## Cambios recientes

Ver `MEJORAS.md` para el listado completo de mejoras y pendientes.

**Reciente (esta iteración)**:
- Migración del frontend a Tailwind v4 con paleta declarada en `@theme`.
- Reescritura de los componentes UI atómicos con focus states consistentes.
- Header sticky, alineado al `max-width` del contenido.
- `voice-note` en mobile con FAB de mic (con animación de pulso) y FAB de guardar (icono SVG, ya no emoji).
- `useSpeech` reescrito: ya no se pierde el transcript cuando el ASR re-arranca; diferencia interim vs final; restart con delay; detecta iOS PWA standalone; expone `permissionDenied`.
- `voiceParsing` ampliado con sinónimos (establecimiento, estancia, potrero, parcela, yuyo, herbicida, fitosanitario, comentario), fixes regex para errores comunes del ASR, y un diccionario de productos/malezas frecuentes que se autocorrigen a su forma canónica.
- Re-ranking de alternativas del ASR (`pickBestAlternative`): de los 3 candidatos que devuelve el modelo, elegimos el que más se parece a una nota agro real.
- Anillo del mic con **nivel de audio real** (`useMicLevel` con `getUserMedia` + `AnalyserNode`): el `MicButton` crece y se ilumina al ritmo de la voz mientras hablás, en lugar de usar una animación CSS constante.
- Login / Profile / Setup-password reescritos con la nueva paleta, alerts con tokens, badge de email verificado.
- **Indicadores de sync en el header** (`SyncBadge` + `Toaster`): badge con 4 estados (offline / sincronizando / N pendientes / OK), click para forzar sync manual, toast cuando termina un sync con cambios reales o errores. `useSyncStatus` con `liveQuery` de Dexie para reactividad sin polling, vía `syncEvents.ts` (event bus).
- `syncNotes` ahora también procesa `pendingOps` de tipo `create` (estaba como TODO) y reporta contadores; las notas cuyas ops fallan quedan marcadas con `syncStatus = "error"` y se ven en el badge.
- **Multi-usuario con sharing por explotación**: cada nota tiene `owner_email` (asignado desde el JWT) y `is_private`. Tabla nueva `farm_shares` permite delegar lectura de una explotación entera. Endpoints `/me`, `/shares/farms`. UI: checkbox "Solo para mí" en el form, badges en cards, página `/sharing` para gestionar accesos, toggle "Mías / Todas" en el header (solo admins). `MeContext` centraliza `me`, `isAdmin` y `scope`.

## Seguridad y autenticación

- El frontend obtiene un ID token de Firebase y lo envía en `Authorization: Bearer <token>`.
- El backend valida el token con `firebase-admin` y verifica el email contra la whitelist (`AUTHORIZED_EMAILS`).
- La whitelist es **fail-closed**: si está vacía, deniega todo (en producción, además, aborta el arranque).
- En el frontend, todas las páginas privadas están envueltas en `<AuthGuard>` que redirige a `/login`.

## Uso como PWA

1. Abrir la aplicación en un navegador móvil compatible (Chrome, Safari, Edge).
2. El navegador ofrece "Agregar a la pantalla de inicio".
3. La app queda instalada como nativa, funciona offline y sincroniza cuando hay red.

> **Nota iPhone**: el reconocimiento de voz de Safari no funciona cuando la app corre en modo "standalone" (instalada desde la pantalla de inicio). El hook detecta el caso y muestra un aviso. Mientras tanto, en iPhone se recomienda abrir Agro Notes desde el navegador Safari para usar la voz.

## Licencia

UNLICENSED — uso privado.
