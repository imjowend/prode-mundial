# Prode Mundial 2026

Prode del Mundial 2026 para un grupo cerrado de amigos: cada uno carga sus pronósticos
de marcadores y compite en una tabla de posiciones según la puntería (marcador exacto
vs. acertar solo el resultado).

## Stack

- **Backend:** Go (stdlib `net/http`) + SQLite
- **Frontend:** Vite + React 19 + TypeScript + Tailwind CSS v4
- **Deploy:** VPS propio (Traefik) + Vercel

## Estructura del repo

Cada subcarpeta tiene su propio README con el detalle técnico:

- [`backend/`](./backend/README.md) — API REST en Go con persistencia en SQLite
- [`frontend/`](./frontend/README.md) — SPA en Vite/React

## Deploy

- **Backend:** VPS propio, enrutado vía Traefik en `prode-api.joaquinvasquez.com`
- **Frontend:** Vercel en `prode-mundial-gules.vercel.app`

## Estado

**Shipped.** En uso durante el Mundial 2026, admin activo para cargar resultados.