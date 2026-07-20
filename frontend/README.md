# Prode Mundial 2026 — Frontend

SPA en Vite + React que muestra los partidos del Mundial 2026, permite a cada usuario
cargar sus pronósticos de marcador, ver la tabla de posiciones y administrar los
partidos desde una pestaña de admin. Consume la API del backend en Go.

## Requisitos

- **Node.js 20.19+ o 22.12+** (requerido por Vite 8). La imagen Docker buildea con
  `node:23-alpine`.
  <!-- TODO: confirmar versión exacta; no hay campo `engines` en package.json -->
- **pnpm** (hay `pnpm-lock.yaml` en el repo)

## Variables de entorno

| Variable       | Requerida | Propósito                                                       |
|----------------|-----------|-----------------------------------------------------------------|
| `VITE_API_URL` | sí        | URL base del backend. El cliente arma las llamadas como `${VITE_API_URL}/api/...` |

```bash
cp .env.example .env    # VITE_API_URL=http://localhost:8080
```

Si `VITE_API_URL` queda vacío, las llamadas usan rutas relativas (`/api/...`), pensadas
para que un proxy externo las redirija al backend.

## Correr en local

```bash
pnpm install
pnpm dev        # servidor de desarrollo (Vite, HMR)
```

| Comando        | Descripción                     |
|----------------|---------------------------------|
| `pnpm dev`     | Servidor de desarrollo          |
| `pnpm build`   | Build de producción a `/dist`   |
| `pnpm preview` | Previsualizar el build          |
| `pnpm lint`    | Linter (ESLint)                 |

## Cómo pega al backend

Este proyecto **no usa** rewrites de Next.js. El destino del backend se resuelve por
`VITE_API_URL`. Hay dos escenarios de deploy soportados:

- **Vercel:** `vercel.json` define un rewrite de `/api/:path*` →
  `https://prode-api.joaquinvasquez.com/api/:path*` (más un fallback SPA a `/`).
- **Docker + nginx:** el `Dockerfile` buildea con `VITE_API_URL=""` (URLs relativas) y
  `nginx.conf` proxea `location /api/` → `http://backend:8080`, sirviendo la SPA para
  el resto de las rutas.

La pestaña de admin pide un código que el usuario tipea en el login (`AdminLogin`,
sin persistir entre refreshes) y que se envía en cada mutación; el backend es la
única fuente de verdad que lo valida (`ADMIN_CODE` en su `.env`), respondiendo `401`
si es incorrecto.

## Deploy

Deployado en **Vercel** (`prode-mundial-gules.vercel.app`). Configurar `VITE_API_URL`
como variable de entorno de build en Vercel apuntando al backend, o dejar que el
rewrite de `vercel.json` resuelva `/api`.

## Estructura

```
src/
  api.ts                 → cliente HTTP del backend
  types.ts               → tipos + constante de usuarios
  App.tsx                → estado raíz, fetch, tabs, modal de usuario
  index.css              → tema Tailwind v4 (CSS-first)
  lib/                   → utils (cn) + scoring (espejo del cálculo del backend)
  components/
    Header, TabBar, UserSelectModal, SkeletonCards
    tabs/                → PrediccionesTab, TablaTab, AdminTab
    ui/                  → componentes shadcn/ui
```
