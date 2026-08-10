# TempCDN Frontend

Soft, modern frontend for the TempCDN backend — anonymous, self-expiring
file transit. Built with Next.js 14 (App Router), TypeScript, Tailwind CSS,
and shadcn/ui-style primitives.

## Stack

- Next.js 14 (App Router, `src/` layout)
- TypeScript
- Tailwind CSS with a custom soft-modern token system
- Radix UI primitives (`react-slot`, `react-progress`) in a shadcn/ui pattern
- `react-dropzone` for the upload area
- `sonner` for toasts
- `lucide-react` for icons

## Getting started

```bash
cp .env.example .env.local
# point NEXT_PUBLIC_TEMPCDN_API_BASE at your running TempCDN backend

npm install
npm run dev
```

The app expects the backend's `/api/v1` routes (`/upload`, `/files/{id}`)
and `/healthz` to be reachable at `NEXT_PUBLIC_TEMPCDN_API_BASE` (with
`/healthz` derived by stripping the `/api/v1` suffix).

### Multi-server / production node discovery

Instead of hardcoding backend URLs, production deployments can set
`NEXT_PUBLIC_TEMPCDN_DOMAIN` (e.g. `productiondomain.com`) and let the
frontend discover live nodes at runtime via `GET /api/v1/nodes`. Each node
is addressed as `https://{node_id}.{domain}/api/v1`, and only nodes with
`status: "online"` are used for round-robin + failover — a node that goes
offline drops out automatically on the next discovery refresh (cached for
30s, or refreshed immediately after a failover). Discovery itself
bootstraps against a seed node (`NEXT_PUBLIC_TEMPCDN_BOOTSTRAP_NODE`,
default `srv1`), trying a few other well-known ids if the seed is
unreachable. See `.env.example` for details.

Without `NEXT_PUBLIC_TEMPCDN_DOMAIN`, the app falls back to the static
`NEXT_PUBLIC_TEMPCDN_API_BASES` / `NEXT_PUBLIC_TEMPCDN_API_BASE` env vars
as before, which is what local dev uses.

## Structure

```
src/app                    Routes: home (/), file detail (/files/[id])
src/components/ui          Generic primitives: button, card, badge, progress, toaster
src/components/tempcdn     Domain components: upload area, upload panel/row,
                            file card, expiry timer, lookup form, header, status pill
src/lib/api.ts              Backend client (upload, get, delete, health)
src/lib/utils.ts            Formatting helpers (bytes, dates, countdown)
src/types/tempcdn.ts        API and UI types
```

## Design

Soft modern theme: a light, airy mist background, white cards with gentle
shadows and rounded corners, and an indigo (`bloom`) accent for primary
actions. Sage green, amber, and coral cover active, warning, and
danger/expiry states respectively. The signature element is the **expiry
timer** — a breathing countdown ring on each file that shifts from indigo
to amber to coral as expiry approaches, echoing the backend's TTL-driven
deletion model without ever feeling alarming.

