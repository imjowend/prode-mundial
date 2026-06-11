# Prode Mundial 2026 — Frontend

App de predicciones del Mundial 2026 con tema oscuro. Construido con Vite + React + TypeScript + Tailwind CSS v4 + shadcn/ui.

Tres usuarios (Joaquín, Josué, Michael) cargan sus pronósticos de marcadores. Se otorgan **+4 puntos** por marcador exacto y **+1 punto** por acertar el resultado (G/E/P).

## Stack

- Vite 8 (Rolldown) + plugin `@tailwindcss/vite`
- React 19.2 + TypeScript 5.9 (strict)
- Tailwind CSS v4 (CSS-first, sin `tailwind.config.js` — todo en `src/index.css` vía `@theme`)
- shadcn/ui (estilo new-york)
- Sonner (toasts) + lucide-react (íconos)
- pnpm

## Requisitos

- Node.js 22.12+
- pnpm

## Setup

Este proyecto fue scaffolded con:

```bash
cd frontend
pnpm create vite@latest . -- --template react-ts
pnpm install
pnpm add @tailwindcss/vite
pnpm add sonner lucide-react clsx tw-animate-css tailwind-merge class-variance-authority
pnpm dlx shadcn@latest init   # New York / Zinc / CSS variables
pnpm dlx shadcn@latest add button input badge card tabs separator
```

> Nota: los componentes de `src/components/ui` ya están incluidos en el repo, listos para usar.

## Variables de entorno

Copiá `.env.example` a `.env` y configurá:

| Variable       | Descripción                               | Ejemplo                 |
| -------------- | ----------------------------------------- | ----------------------- |
| `VITE_API_URL` | URL base del backend (Go). **Requerida.** | `http://localhost:8080` |

```bash
cp .env.example .env
```

## Comandos

```bash
pnpm dev      # servidor de desarrollo (HMR)
pnpm build    # build de producción a /dist
pnpm preview  # previsualizar el build
pnpm lint     # eslint
```

Corré todo junto:

```bash
cd frontend && pnpm install && pnpm dev
```

## Estructura

```
src/
  types.ts                  # tipos y constante USERS
  api.ts                    # cliente del backend + ADMIN_CODE
  App.tsx                   # estado raíz, fetch, tabs, modal de usuario
  main.tsx
  index.css                 # tema Tailwind v4
  lib/
    utils.ts                # cn()
    scoring.ts              # lógica de puntaje (exacto / resultado)
  components/
    Header.tsx
    TabBar.tsx
    UserSelectModal.tsx
    SkeletonCards.tsx
    tabs/
      PrediccionesTab.tsx
      TablaTab.tsx
      AdminTab.tsx
    ui/                     # componentes shadcn
```

## Admin

La pestaña **Admin** pide un código (cliente): `mundial26`. El backend valida el mismo código en cada mutación.

## Deploy en Vercel

`vercel.json` incluye un rewrite SPA. Configurá `VITE_API_URL` en las variables de entorno del proyecto en Vercel apuntando al backend desplegado.
