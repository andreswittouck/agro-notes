# agro-notes-api (backend)

API NestJS + TypeORM + PostgreSQL para registrar notas de campo. Autenticación con Firebase Admin, whitelist de emails autorizados, modelo multi-usuario con sharing por explotación y rol admin.

## Stack

- **NestJS 11** con TypeORM
- **PostgreSQL 16**
- **Firebase Admin** para validar tokens del frontend
- **class-validator** + **class-transformer** para DTOs
- **Swagger / OpenAPI** en `/docs`

## Requisitos

- Node.js 20+
- PostgreSQL 13+ (o Docker para usar el `docker-compose.yml` de la raíz)
- Una app de Firebase con Authentication habilitado y un service account JSON

## Configuración

1. `cp .env.example .env`
2. Completar las variables del `.env`. Las críticas:
   - **DB**: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`.
   - **Firebase Admin**: `FIREBASE_ADMIN_KEY_PATH=./firebase-admin-key.json` (descargar el JSON de service account desde Firebase Console → Project settings → Service accounts → "Generate new private key" y guardarlo en esa ruta — está en `.gitignore`).
   - **Whitelist**: `AUTHORIZED_EMAILS=tu@email.com,otro@email.com`. **Sin esto, la API deniega todo** (fail-closed). En producción, además, aborta el arranque.
   - **Admins**: `ADMIN_EMAILS=tu@email.com`. Pueden ver todas las notas con `?scope=all`, modificar/borrar notas de otros y revocar shares ajenos.
3. Levantar Postgres desde la raíz del repo:
   ```bash
   docker compose up -d
   ```
4. Instalar y arrancar:
   ```bash
   npm install
   npm run start:dev
   ```

API en `http://localhost:4000`. Swagger en `http://localhost:4000/docs`.

## Autenticación y autorización

Todos los endpoints requieren `Authorization: Bearer <firebase-id-token>`. El flujo es:

1. El frontend hace login con Firebase Auth y obtiene un ID token.
2. El frontend manda el token en cada request.
3. `AuthGuard` (`src/auth/auth.guard.ts`) verifica el token con `firebase-admin`.
4. `AuthorizedUsersService` chequea que el email del token esté en la whitelist `AUTHORIZED_EMAILS`.
5. Si todo OK, el request sigue; si no, `401` o `403`.

La whitelist se carga desde `AUTHORIZED_EMAILS` al arrancar. Es **fail-closed**: si está vacía no pasa nadie.

### Roles

| Rol | Cómo se define | Qué puede |
|---|---|---|
| Usuario común | Email en `AUTHORIZED_EMAILS` | Crear/editar/borrar **sus propias** notas. Ver las que le **compartieron**. |
| Invitado a una farm | Hay un row en `farm_shares` para su email | Lectura sobre todas las notas no-privadas de esa explotación. |
| Admin | Email en `ADMIN_EMAILS` | Lo anterior + `?scope=all` para ver todo el sistema, modificar/borrar notas de otros, revocar shares ajenos. |

`AdminUsersService` complementa al `AuthorizedUsersService`. Loguea cuántos admins se cargaron. Ser admin no implica estar en la whitelist (aunque típicamente se solapan).

## Modelo de datos

### Notas

```sql
notes (
  id            UUID PK,
  owner_email   VARCHAR(320) NOT NULL DEFAULT 'andreswittouck@gmail.com',
  is_private    BOOLEAN      NOT NULL DEFAULT false,
  farm          TEXT,
  lot           TEXT,
  weeds         TEXT[],
  applications  TEXT[],
  note          TEXT,
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  created_at    TIMESTAMPTZ NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL,
  deleted_at    TIMESTAMPTZ
)
INDEX (owner_email)
INDEX (owner_email, farm)
```

`owner_email` se asigna desde el JWT al crear (no se acepta del body). El default existe para que el backfill al alterar la tabla con `synchronize=true` rellene las filas legacy.

### Shares por explotación

```sql
farm_shares (
  owner_email        VARCHAR(320),
  farm               VARCHAR(255),
  shared_with_email  VARCHAR(320),
  created_at         TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (owner_email, farm, shared_with_email)
)
INDEX (shared_with_email)
```

### Pipeline de visibilidad

```sql
WHERE n.deleted_at IS NULL
  AND (
    n.owner_email = :me
    OR (
      n.is_private = false
      AND EXISTS (
        SELECT 1 FROM farm_shares fs
        WHERE fs.owner_email = n.owner_email
          AND LOWER(fs.farm) = LOWER(n.farm)
          AND fs.shared_with_email = :me
      )
    )
  )
```

Excepción: admin con `?scope=all` no aplica el filtro.

## Endpoints

### Notas

| Método | Path | Descripción |
|---|---|---|
| `POST` | `/notes` | Crear una nota. Acepta `is_private` opcional. `owner_email` se asigna desde el JWT. |
| `GET` | `/notes?farm=&lot=&scope=mine\|all` | Listar notas. `scope=all` solo lo respeta el backend si el caller es admin. |
| `GET` | `/notes/:id` | Obtener por ID. 403 si no la podés ver. |
| `GET` | `/notes/changes?since=ISO_DATE&farm=&lot=&scope=` | Cambios desde una fecha (sync incremental). |
| `PATCH` | `/notes/:id` | Actualizar. Solo el dueño o admin. |
| `DELETE` | `/notes/:id` | Borrado lógico. Solo el dueño o admin. |

### Usuario actual

| Método | Path | Descripción |
|---|---|---|
| `GET` | `/me` | `{ uid, email, emailVerified, isAdmin }`. |

### Sharing por explotación

| Método | Path | Descripción |
|---|---|---|
| `POST` | `/shares/farms` | Crear acceso. Body `{ farm, shared_with_email }`. El owner es siempre el caller. |
| `GET` | `/shares/farms` | `{ granted: [...], received: [...] }`. |
| `DELETE` | `/shares/farms/:owner/:farm/:sharedWith` | Revocar. Solo el owner del share o admin. |

Ver Swagger en `/docs` para los schemas completos.

### Ejemplos

```bash
# Crear (con privacidad)
curl -X POST http://localhost:4000/notes \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "farm":"JUAN CARLOS",
    "lot":"24",
    "weeds":["gramilla"],
    "applications":["2,4-D"],
    "note":"viento ligero",
    "lat":-33.123,
    "lng":-64.345,
    "is_private": false
  }'

# Listar — admin viendo todo
curl 'http://localhost:4000/notes?scope=all' \
  -H 'Authorization: Bearer <token>'

# Saber si el caller es admin
curl http://localhost:4000/me \
  -H 'Authorization: Bearer <token>'

# Compartir una explotación
curl -X POST http://localhost:4000/shares/farms \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{ "farm": "JUAN CARLOS", "shared_with_email": "pedro@x.com" }'

# Listar mis shares
curl http://localhost:4000/shares/farms \
  -H 'Authorization: Bearer <token>'

# Revocar
curl -X DELETE \
  'http://localhost:4000/shares/farms/me%40x.com/JUAN%20CARLOS/pedro%40x.com' \
  -H 'Authorization: Bearer <token>'
```

> Los timestamps `created_at` y `updated_at` se manejan automáticamente. `deleted_at` se setea en el `DELETE` (borrado lógico).

## Estructura

```
src/
├── auth/
│   ├── auth.guard.ts                    # Verifica Firebase token + whitelist
│   ├── auth.module.ts
│   ├── auth.decorator.ts                # @CurrentUser() en controllers
│   ├── firebase-admin.ts                # Init del SDK admin
│   ├── authorized-users.service.ts      # Whitelist (AUTHORIZED_EMAILS, fail-closed)
│   └── admin-users.service.ts           # Admins (ADMIN_EMAILS)
├── notes/
│   ├── application/dto/                 # DTOs de request (class-validator)
│   ├── infrastructure/
│   │   └── persistence/schemas/         # Entidad Note (con owner_email + is_private)
│   ├── interfaces/http/                 # NotesController
│   ├── notes.service.ts                 # CRUD + filtro de visibilidad + scope
│   └── notes.module.ts
├── sharing/
│   ├── application/dto/                 # CreateFarmShareDto
│   ├── infrastructure/persistence/schemas/  # Entidad FarmShare (PK compuesta)
│   ├── interfaces/http/                 # SharingController (/shares/farms)
│   ├── sharing.service.ts               # CRUD + validaciones (no compartir consigo, no duplicados)
│   └── sharing.module.ts
├── users/
│   ├── me.controller.ts                 # GET /me
│   └── users.module.ts
├── config/
│   └── typeorm.config.ts                # Config de la DB
├── app.module.ts                        # Importa Auth, Notes, Sharing, Users
└── main.ts                              # Bootstrap (Swagger + CORS + guard global)
```

## Scripts

```bash
npm run start:dev      # arranca con watch (modo desarrollo)
npm run start          # arranca sin watch
npm run start:debug    # arranca con --inspect
npm run start:prod     # corre `dist/main` (despues de `build`)
npm run build          # compila a dist/

npm run test           # tests unitarios
npm run test:watch     # tests en watch
npm run test:cov       # coverage
npm run test:e2e       # tests end-to-end

npm run lint           # eslint --fix
npm run format         # prettier
```

## Variables de entorno

Ver `.env.example` para la lista completa. Las más relevantes:

| Variable | Descripción | Default dev |
|---|---|---|
| `PORT` | Puerto del servidor | `4000` |
| `CORS_ORIGIN` | Lista CSV de orígenes permitidos | `http://localhost:3000` |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASS` / `DB_NAME` | Conexión Postgres | localhost / 15432 / postgres / postgres / agro |
| `DB_SSL` | Forzar SSL a la DB (Render, Supabase, Neon) | `false` |
| `TYPEORM_SYNC` | `synchronize=true` (OK en dev, **no en prod**) | `true` |
| `TYPEORM_LOGGING` | Loggear queries SQL | `false` |
| `FIREBASE_ADMIN_KEY_PATH` | Ruta al JSON del service account | — |
| `FIREBASE_ADMIN_CREDENTIALS` | Alternativa: el JSON inline (single line) | — |
| `AUTHORIZED_EMAILS` | CSV de emails autorizados (fail-closed) | — |
| `ADMIN_EMAILS` | CSV de emails con privilegios de admin (scope=all, etc.) | — |
| `JWT_SECRET` | Secret para JWT propio (opcional, no usado por default) | — |

> **Nunca** commitees `.env`, `.env.prod`, ni `firebase-admin-key.json`. Están todos en `.gitignore`.

## Notas técnicas

- **Borrado lógico**: el `DELETE /notes/:id` setea `deleted_at` y mantiene la fila. Los listados filtran por `deleted_at IS NULL`. Para sync, `/changes` devuelve también las borradas para que el cliente las marque localmente.
- **Validación**: los DTOs usan `class-validator` con `whitelist: true` + `forbidNonWhitelisted: true` en el `ValidationPipe` global, para no aceptar campos no declarados.
- **Sync incremental**: `/changes?since=<ISO>` devuelve notas con `updated_at > since`. El frontend guarda el último `lastSync` en `localStorage`.
- **`synchronize=true`**: TypeORM auto-actualiza el schema. Cómodo en dev, peligroso en prod. Para producción usar migraciones (ver pendiente en `MEJORAS.md`).
- **Backfill de `owner_email`**: cuando se agregó la columna, las filas existentes obtuvieron el default `'andreswittouck@gmail.com'`. En entornos nuevos el código siempre setea el campo desde el JWT y el default no se usa. Si querés cambiar a quién se asignan las notas legacy, cambiá el default en `note.entity.ts` antes del primer arranque.
- **Comparación de farm en shares**: case-insensitive. Si un usuario crea notas como "Juan Carlos" y comparte "JUAN CARLOS", funciona igual.
- **Sharing es read-only por ahora**: el invitado solo lee. Para colaboración con edición habría que extender el modelo (no está en el roadmap inmediato).

## Roadmap

Ver `MEJORAS.md` en la raíz del repo.
