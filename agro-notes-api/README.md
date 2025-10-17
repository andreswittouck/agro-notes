# agro-notes-api

API NestJS + TypeORM + PostgreSQL para registrar notas de campo.

## Requisitos

- Node.js 20+
- PostgreSQL 13+

## Configuración

1. `cp .env.example .env`
2. `docker compose up --build`
3. Swagger en: `http://localhost:4000/docs`

## Endpoints

- `POST /notes` – create note (DTO validated)
- `GET /notes?farm&lot` – list notes
- `GET /notes/:id` – get by id

> Los timestamps `createdAt` y `updatedAt` se manejan **automáticamente**.

## Ejemplos curl

```bash
curl -X POST http://localhost:4000/notes \
-H 'Content-Type: application/json' \
-d '{
"farm":"JUAN CARLOS",
"lot":"24",
"weeds":["gramilla"],
"applications":["2,4-D"],
"note":"light wind",
"lat":-33.123,
"lng":-64.345
}'


curl 'http://localhost:4000/notes?farm=JUAN%20CARLOS&lot=24'
```
