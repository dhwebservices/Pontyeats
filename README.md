# Ponty Eats

Ponty Eats is a Next.js 16 restaurant ordering platform for Pontypridd, adapted for Cloudflare Workers with OpenNext and backed by Supabase.

## Deploying on Cloudflare

This repository is configured for **Cloudflare Workers**, not a static Cloudflare Pages build.

- Local preview: `npm run preview`
- Deploy from CLI: `npm run deploy`
- Git-based deploys: use **Workers Builds** with the repo connected to a Worker named `ponty-eats`

Cloudflare Pages static build settings like `Build directory: out` will fail for this app because the deploy artifact is the OpenNext worker bundle in `.open-next/`, not a static export.

### Required build/runtime variables

Set these in Cloudflare Workers Builds and in your local environment before previewing authenticated flows:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_BASE_URL`

## Launch notes

- Restaurant asset uploads are scoped by restaurant ID in Supabase Storage policies.
- `middleware.js` stays in place for Cloudflare compatibility even though Next.js 16 warns that the filename is deprecated.
- `/api/health` is intentionally unauthenticated so the worker can answer health checks without booting Supabase auth first.
- Customer checkout and payment still need end-to-end verification against live Supabase and Stripe credentials.
