# Prode Mundial 2026 — Backend

API REST en Go que persiste partidos y pronósticos en SQLite. Expone los datos de la
app (partidos, pronósticos por usuario y tabla de posiciones calculada), recibe los
pronósticos de un conjunto fijo de usuarios y ofrece endpoints de administración
(alta/edición/borrado de partidos y carga de resultados) protegidos por un código de
admin. El puntaje se calcula server-side: **3 puntos** por marcador exacto y **1 punto**
por acertar el resultado (ganador/empate).

## Requisitos

- **Go 1.22**
- **CGO habilitado** (usa `mattn/go-sqlite3`) — requiere un compilador C (gcc). La
  imagen Docker instala `gcc musl-dev` y compila con `CGO_ENABLED=1`.

## Variables de entorno

Carga un `.env` si existe (vía `godotenv`). Todas tienen valor por defecto:

| Variable     | Requerida | Propósito                                                   |
|--------------|-----------|-------------------------------------------------------------|
| `PORT`       | no        | Puerto HTTP de escucha (default `8080`)                     |
| `DB_PATH`    | no        | Ruta del archivo SQLite (default `./prode.db`)              |
| `ADMIN_CODE` | no        | Código que valida las mutaciones de admin (default vacío)   |

> `.env.example` solo incluye `ADMIN_CODE`. En producción, `PORT` y `DB_PATH` se
> setean vía `environment` en `docker-compose.yml` (`DB_PATH=/data/prode.db` sobre un
> volumen persistente).

## Correr en local

```bash
cd backend
cp .env.example .env   # setear ADMIN_CODE
go run ./cmd/server
# Servidor en http://localhost:8080, DB en ./prode.db
```

La base se crea y migra automáticamente al arrancar (tablas `matches` y `predictions`).

## Buildear / deployar

```bash
docker compose up -d --build   # desde la raíz del repo
```

En producción el enrutamiento (TLS, CORS, rate-limit) lo maneja **Traefik** vía labels
en `docker-compose.yml`; el backend solo expone HTTP plano en el puerto 8080. El
archivo SQLite vive en un volumen Docker (`db_data`).

## Endpoints

| Método | Ruta                             | Descripción                                    |
|--------|----------------------------------|------------------------------------------------|
| GET    | `/api/data`                      | Partidos + pronósticos + tabla de posiciones   |
| POST   | `/api/predictions`               | Cargar/actualizar pronóstico de un usuario     |
| POST   | `/api/admin/matches`             | Crear partido (requiere `adminCode`)           |
| PATCH  | `/api/admin/matches/{matchId}`   | Cargar resultado o bloquear partido (admin)    |
| DELETE | `/api/admin/matches/{matchId}`   | Borrar partido (admin, borra sus pronósticos)  |

Los usuarios válidos son un conjunto fijo definido en el código
(`internal/model/model.go`, `ValidUsers`). Cargar el resultado de un partido lo
bloquea (`locked`), impidiendo nuevos pronósticos.

## Estructura

```
cmd/server/main.go       → entrypoint, middlewares (logging, recover), rutas
internal/
  handler/handler.go     → handlers HTTP y validaciones
  store/store.go         → acceso a SQLite (matches, predictions) + migraciones
  store/seed.go          → datos iniciales (seed si la DB está vacía)
  scoring/scoring.go     → cálculo de puntaje y tabla de posiciones
  model/model.go         → tipos (Match, Prediction, UserStats) + ValidUsers
```
