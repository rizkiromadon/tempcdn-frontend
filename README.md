<div align="center">

# TempCDN

**Anonymous, self-expiring file transit — no accounts, no clutter, just a link.**

[![CI](https://github.com/rizkiromadon/tempcdn-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/rizkiromadon/tempcdn-frontend/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)

[tempcdn.eu.cc](https://tempcdn.eu.cc)

</div>

---

## About

TempCDN is a drop-a-file, get-a-link file sharing service built around automatic
expiry: every upload has a TTL, and once it's gone, it's gone. This repository
is the frontend — the upload experience, file detail pages, and admin
dashboard that sit in front of the TempCDN backend API.

- **Drop and share** — drag a file in, get a shareable link and QR code back
- **Automatic expiry** — every file carries a countdown; nothing lingers past its TTL
- **No accounts required** — public uploads work anonymously
- **Admin dashboard** — API key management and runtime upload-limit configuration for operators
- **Multi-node aware** — round-robin and failover across backend instances, with live node discovery in production

## Tech stack

| | |
|---|---|
| Framework | [Next.js 14](https://nextjs.org) (App Router, `src/` layout) |
| Language | TypeScript |
| Styling | Tailwind CSS, custom design tokens |
| UI primitives | Radix UI (`react-slot`, `react-progress`) in a shadcn/ui pattern |
| Uploads | `react-dropzone` |
| Notifications | `sonner` |
| Icons | `lucide-react` |
| QR codes | `qrcode` |
| Testing | Vitest |

## Getting started

### Prerequisites

- Node.js 20+
- A running instance of the [TempCDN backend](https://tempcdn.eu.cc)

### Setup

```bash
git clone https://github.com/rizkiromadon/tempcdn-frontend.git
cd tempcdn-frontend

cp .env.example .env.local
# point NEXT_PUBLIC_TEMPCDN_API_BASE at your running TempCDN backend

npm install
npm run dev
```

The app expects the backend's `/api/v1` routes (`/upload`, `/files/{id}`)
and a `/healthz` endpoint to be reachable at `NEXT_PUBLIC_TEMPCDN_API_BASE`
(`/healthz` is derived by stripping the `/api/v1` suffix).

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run the Vitest suite |

## Backend configuration

### Single backend (local dev / small deployments)

```bash
NEXT_PUBLIC_TEMPCDN_API_BASE=http://localhost:8080/api/v1
```

Or a comma-separated list for static round-robin + failover:

```bash
NEXT_PUBLIC_TEMPCDN_API_BASES=https://srv1.example.com/api/v1,https://srv2.example.com/api/v1
```

### Multi-node production deployments

Instead of hardcoding backend URLs, set `NEXT_PUBLIC_TEMPCDN_DOMAIN` and let
the frontend discover live nodes at runtime via `GET /api/v1/nodes`:

```bash
NEXT_PUBLIC_TEMPCDN_DOMAIN=productiondomain.com
```

Each node is addressed as `https://{node_id}.{domain}/api/v1`, and only
nodes reporting `status: "online"` are used for round-robin and failover.
A node that goes offline drops out automatically on the next discovery
refresh (cached for 30s, or refreshed immediately after a failover fires).
Discovery bootstraps against a seed node
(`NEXT_PUBLIC_TEMPCDN_BOOTSTRAP_NODE`, default `srv1`), trying a handful of
other well-known node ids if the seed is unreachable.

See [`.env.example`](.env.example) for the full list of variables.

## Project structure

```
src/
├── app/
│   ├── (site)/           Public routes: home, upload, docs, file detail
│   └── dashboard/         Admin routes: login, overview, API keys, upload settings
├── components/
│   ├── ui/                 Generic primitives: button, card, badge, progress, toaster
│   ├── tempcdn/             Domain components: upload panel, file card, expiry timer,
│   │                        lookup form, header/footer
│   └── admin/               Admin dashboard shell: sidebar, header, guard, login form
├── lib/
│   ├── api.ts               Backend client — upload, file info, delete, health, admin
│   ├── admin-auth.ts         Admin session token handling
│   └── utils.ts              Formatting helpers (bytes, dates, countdown)
└── types/
    └── tempcdn.ts            Shared API and UI types
```

## Design

A light, airy interface: soft mist backgrounds, white cards with gentle
shadows and rounded corners, and an indigo accent for primary actions. Sage
green, amber, and coral mark active, warning, and expiry states
respectively. The signature element is the **expiry timer** — a breathing
countdown ring on each file that shifts from indigo to amber to coral as
its TTL runs down, echoing the backend's expiry model without ever feeling
alarming.

## Contributing

Issues and pull requests are welcome. Please run `npm run lint` and
`npm run test` before submitting a PR.

## License

No license has been published for this repository yet. All rights reserved
unless otherwise stated by the author.
