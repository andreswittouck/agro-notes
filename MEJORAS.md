# Mejoras de Agro Notes — Roadmap

Este documento mantiene el estado de las mejoras del proyecto. Las que ya se entregaron quedan marcadas con ✅ y arriba de todo. El resto sigue como backlog priorizado.

## ✅ Hecho recientemente

### Frontend / UI
- **Migración a Tailwind v4**. La paleta del proyecto ahora vive en `agro-notes/src/app/globals.css` dentro de `@theme` y se consume vía utilities (`bg-page`, `text-fg`, etc.) en lugar de inline styles.
- **Sistema de componentes UI consolidado** (`Button`, `Card`, `Input`, `TextArea`, `Label`, `Row`, `MicButton`, `BackButton`, `PageContainer`) con focus states consistentes, variantes y tamaños predefinidos.
- **Header** sticky, alineado al `max-width` del contenido, con icono de salir.
- **Home (`/`)** con icons SVG y descripciones en cada link.
- **Notes (`/notes`)** con badge de cantidad, botón "Nueva por voz" como CTA, filtros con "Limpiar" y empty state ilustrado.
- **NoteCard** alineado a la paleta (antes mezclaba clases Tailwind sueltas que no se aplicaban). Incluye badge de estado de sync (pending / error).
- **Login / Profile / Setup-password** reescritos con tokens del theme: alerts coloreadas con `bg-mic-active/15` y `bg-success/15`, botón Google con icono SVG real, badge de email verificado.

### Voz
- **No se pierde el transcript cuando el ASR re-arranca.** El hook `useSpeech` mantiene un buffer "committed" persistido entre sesiones del recognizer.
- **Interim vs final** diferenciados visualmente (final estable en blanco, interim en gris itálico).
- **Restart con delay** para evitar `InvalidStateError` en Chrome.
- **Detección de iOS PWA standalone**: avisa al usuario que abra Safari porque la API no anda ahí.
- **Permiso denegado** se detecta y muestra cartel.
- **Sinónimos del dominio**: `establecimiento, estancia` para campo; `potrero, parcela` para lote; `yuyo` para maleza; `herbicida, producto, fitosanitario` para aplicación; `comentario` para nota.
- **Fixes regex de errores comunes del ASR**: `lo te → lote`, `ex plotacion → explotacion`, etc.
- **Diccionario agro** que normaliza productos a su forma canónica: `glifosato`, `2,4-D`, `dicamba`, `atrazina`, `paraquat`, `metsulfuron`, `yuyo colorado`, `gramilla`, `rama negra`, `sorgo de alepo`.
- **Re-ranking de alternativas** (`pickBestAlternative`): el ASR devuelve 3 candidatos y elegimos el que más se parece a una nota agro real.
- **`maxAlternatives = 3`** y exposición de `lastAlternatives` para futuras integraciones.
- **Pulso del mic con el nivel de audio real** (`useMicLevel`): `getUserMedia` + `AnalyserNode` calculan el RMS de la voz y el anillo del `MicButton` crece y se ilumina al ritmo de lo que decís. Si el permiso del mic se rechaza o no hay Web Audio, cae al fallback CSS.
- Validación visual: el FAB de mic pulsa mientras graba; spinner SVG en "Guardar".

### Sincronización (UI)
- **Badge de sync en el header** con 4 estados: offline, sincronizando, pendientes, OK. Click para forzar sync manual; tooltip con la última fecha. (`SyncBadge`)
- **Toast** efímero arriba a la derecha cuando termina un sync con cambios reales (enviadas / actualizadas) o errores.
- **Hook `useSyncStatus`** centraliza online + syncing + pendingCount + errorCount + lastSyncAt + triggerSync.
- **Event bus** (`syncEvents.ts`) para que `notesOffline` notifique a la UI sin acoplamiento.
- **Marca `syncStatus = "error"`** en notas cuyas pendingOps tiraron error en la última sync.
- **`syncNotes` extendido**: ahora también procesa `pendingOps` de tipo `create` (estaba como TODO en el código viejo) y reporta contadores.

### Multi-usuario y sharing
- **Cada nota tiene `owner_email`** (asignado desde el JWT, no del body) e `is_private` (default false).
- **Tabla `farm_shares`** con PK compuesta `(owner_email, farm, shared_with_email)`. Permiso de lectura sobre todas las notas no-privadas de una explotación.
- **Filtro de visibilidad** en backend: ves tus propias notas + las que están en `farm_shares` para tu email donde la nota no es `is_private`. Comparación de farm case-insensitive.
- **Rol admin** vía `ADMIN_EMAILS` (env, CSV). Admin puede ver todas las notas con `?scope=mine|all`, modificar/borrar notas de otros, y revocar shares ajenos.
- **`AdminUsersService`** complementario a `AuthorizedUsersService`. Loguea cuántos admins se cargaron al arrancar.
- **Endpoint `GET /me`** devuelve `{ uid, email, emailVerified, isAdmin }` para que el frontend sepa si mostrar el switch admin.
- **Endpoints CRUD `/shares/farms`** (POST / GET / DELETE) con validación: no compartir consigo mismo, no duplicados, solo el owner del share o admin pueden revocar.
- **Frontend**: `MeContext` con `me + scope + setScope`, persistencia en localStorage; `AdminScopeToggle` en el header; checkbox "Solo para mí" en `NoteForm`; badges "Privada" y "Compartida por <email>" en `NoteCard`; botones Editar/Eliminar ocultos si no soy dueño ni admin; página `/sharing` con lista de granted/received y form para nuevos accesos; tipos `MeResponse`, `FarmShare`, `Scope`.
- **Cliente API** con `getMe()`, `listFarmShares()`, `createFarmShare()`, `deleteFarmShare()`, y `scope` opcional en `listNotes` / `listNoteChanges`.
- **Backfill automático** vía `default` de la columna `owner_email` (TypeORM en `synchronize=true` lo aplica).
- **Cache local de Dexie subió a v2** con índices nuevos en `owner_email` e `is_private`.

### Configuración
- `.env.example` documentado en backend y frontend.
- `firebase-admin-key.json` agregado al `.gitignore`.
- Puerto de Postgres alineado entre `docker-compose.yml` y `.env` del backend.
- Whitelist de emails autorizados implementada y fail-closed (`AUTHORIZED_EMAILS`).
- `firebase-admin` agregado a `dependencies` del API (estaba en `node_modules` pero no en el manifiesto).
- Vars residuales de Supabase removidas de `.env.local` del frontend (incluían un `service_role` key expuesto al browser — riesgo de seguridad).
- Tipado del request en `auth.guard.ts` para que compile en `strict` mode.

### Modo oscuro
- ✅ La app es dark por default (cumple parcialmente el ítem #20 del roadmap viejo). Si se quiere modo claro, hay que hacer un toggle.

---

## Backlog

### 🎤 Reconocimiento de voz

- **Confirmación visual de lo reconocido antes de guardar**: hoy el form se llena automáticamente y el usuario puede editarlo. Falta una pantalla intermedia "esto entendí, ¿confirmás?" para flujos donde sea crítico (descartado de momento porque agrega fricción).
- **Re-grabación de fragmentos específicos**: tocar un campo + mic para sobreescribir solo ese campo.
- **Fuzzy match** en las keywords (Levenshtein de 1) para tolerar variaciones que la regex no cubre.
- **Vocabulario configurable por usuario** (productos / malezas extra) — guardado en IndexedDB o backend.
- **Fallback a servicio cloud** (Google Speech-to-Text, Whisper) en navegadores sin Web Speech.

### 🔐 Seguridad

- **Refrescar tokens** automáticamente cuando expira (hoy fuerza relogin).
- **Logout en todos los dispositivos** (revoke refresh tokens).
- **Rate limiting** en endpoints públicos del backend.
- **HTTPS obligatorio** en producción + HSTS.
- **Sanitización de inputs** explícita en backend (XSS).
- **Validación de coordenadas GPS** (rangos válidos) y de longitudes de strings.
- **Permisos más finos en sharing**: hoy es read-only. Sumar variantes "lectura + comentarios" o "edición compartida" si surge la necesidad.
- **Auditoría de accesos**: log de `(timestamp, caller_email, note_id, action)` para entender quién leyó qué.

### 🗄️ Base de datos

- **Índices** en `farm`, `lot`, `created_at`, `updated_at`, `deleted_at`. Índices compuestos `(farm, lot)` y `(updated_at, deleted_at)` para `/changes`.
- **Migraciones** TypeORM versionadas (hoy `synchronize=true`, OK para dev pero no para prod).
- **Backups** automáticos de Postgres (`pg_dump` + cron, o servicio gestionado).
- **Soft delete con TTL**: limpiar registros borrados después de N días.

### 🔄 Sincronización y offline

- **Resolución de conflictos** con merge inteligente o UI para resolver manualmente. Hoy el server gana siempre.
- **Sincronización por lotes** con paginación en `/changes` (hoy trae todo desde `since`).
- **Compresión** (gzip / brotli) en respuestas grandes.
- **Sincronización selectiva** por fecha / explotación / lote (reduce datos móviles).
- **Reintentos con backoff** para los `pendingOps` que cayeron en `error`. Hoy reintentamos en cada `syncNotes`, sin backoff.
- **Limpiar cache de Dexie al cambiar `scope`**: hoy el `bulkPut` no borra notas que dejan de pertenecer al scope (si pasás de `all` a `mine` siguen visibles localmente). Hay que filtrar al leer o purgar al cambiar scope.

### 📱 UX

- **Búsqueda full-text** en notas (con índice GIN en Postgres).
- **Filtros avanzados**: por fecha, malezas, aplicaciones, radio GPS.
- **Mapa interactivo** con la ubicación de cada nota (Leaflet / Mapbox).
- **Gráficos**: aplicaciones por lote, malezas más frecuentes (Recharts / Chart.js).
- **Exportación**: CSV / Excel / PDF por explotación.
- **Toggle de tema claro** (hoy solo dark).
- **Notificaciones push** (Web Push API o Firebase Cloud Messaging).
- **Atajo de teclado** "/" para foco en filtros (desktop).

### 🚀 Performance

- **Caché del cliente HTTP** (SWR / React Query) en lugar de hooks ad-hoc.
- **Service Worker** con estrategias de Workbox afinadas (stale-while-revalidate para `/notes`, network-first para `/changes`).
- **Code splitting** por ruta (Next ya hace algo, se puede afinar más).
- **Lazy loading** del SVG de Google Auth y otros assets.
- **Virtual scrolling** en `/notes` cuando haya muchas notas.

### 🧪 Testing y calidad

- **Tests unitarios** del parser de voz y del scoring de alternativas (idealmente con casos reales grabados).
- **Tests del flujo offline** (Playwright + simulación de red).
- **Tests del backend** con Supertest para los endpoints de notas.
- **Sentry** o equivalente para tracking de errores en producción.
- **Logging estructurado** (Pino) en backend.

### 📊 Reportes / analytics

- **Panel admin** con stats de uso (cantidad de notas por explotación, productos más usados).
- **Reportes mensuales** auto-enviados por email (cron + SendGrid / SES).

### 🔧 DevOps

- **CI/CD** con GitHub Actions: lint + test + build + deploy.
- **Multi-stage Dockerfile** con build cacheado.
- **Health checks** en backend y compose.
- **Secret management** (Doppler, AWS Secrets, etc.) en lugar de `.env` planos en producción.

### 🌐 Internacionalización

- **i18n** (next-intl) — relevante si se expande a otros países hispanohablantes con vocabulario distinto.

### 📱 Móvil

- **Cámara**: tomar fotos por nota (síntomas de plaga, daño en cultivo).
- **Geofencing**: alertar al entrar/salir de un lote conocido.
- **Tracking de ruta** durante la jornada.

### 🔗 Integraciones

- **APIs de plataformas agrícolas** existentes (sincronización de explotaciones / lotes).
- **Calendarios**: notas que generen recordatorios para reaplicar producto.
- **Mapas satelitales** (Mapbox, Sentinel) para superponer observaciones.

---

## Priorización sugerida

### Próxima iteración
1. **Refresco automático de tokens** (hoy si expira el ID token, te tira a login).
2. **Limpiar cache local al cambiar scope** (caveat del Hito 3).
3. **Migraciones TypeORM versionadas** + apagar `synchronize=true` (necesario antes de prod).
4. **Búsqueda full-text** en `/notes`.

### Corto plazo
5. Tests unitarios del parser de voz y del scoring de alternativas.
6. Reintentos con backoff exponencial para pendingOps en `error`.

### Mediano plazo
7. Cámara y fotos por nota.
8. Mapa interactivo.
9. Exportación a CSV / PDF.
10. CI/CD con GitHub Actions.

### Largo plazo
11. Dashboard de analytics.
12. Integraciones con plataformas agrícolas.
13. i18n.

---

> Esta lista es viva. Si una mejora se completa, se mueve arriba con ✅. Si se descarta, dejá una nota explicando por qué.
