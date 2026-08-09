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

