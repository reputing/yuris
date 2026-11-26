# yuri.xxx

Adults only. Free, no ads, its own logins (none yet). Yuri / girls'-love work is promoted to the front of the front page and
of every search; everything else is still listed behind it.

Next.js on Cloudflare Workers (OpenNext) with D1. Metadata and links only: nothing is re-hosted unless it was submitted by
its creator or licensed.

## What works today
- **18+ gate** (`middleware.ts`, `app/gate`, `app/api/gate`). Every page and API call needs the "yes, I'm 18+" cookie.
  *Yes*: a 30-day cookie, then on to the page they asked for (only same-site paths are ever followed). *No*: a session
  cookie that closes the whole site to them (`/denied`) and sends them to a search engine. POST only, so a link or prefetch
  can't set it. The RTA adult label is sent as a header and a meta tag.
- **Yuri first, nothing filtered** (`lib/catalog.ts` `searchWorks`): `order by yuri desc, newest`. The flag is set at ingest from
  the tags/title (`lib/policy.ts` `YURI_TERMS`).
- **Content policy** (`lib/policy.ts`): minor-sexualising terms are blocked outright (never stored); school-setting words
  hold a work for review instead of rejecting it. It runs inside `addWork()`, so no route or script can skip it, and a
  reviewer's "publish" re-runs it. Keyword lists are a first filter, not proof of age: the review queue and the report
  button exist for what they miss.
- **Catalogue**: `works` / `tags` / `work_tags` (`migrations/0001_init.sql`). `source_type` is `creator` (reviewed first),
  `linkout` (metadata + a link to the source) or `licensed`.
- **Link-out indexing** (`lib/ingest-mangadex.ts`, `npm run ingest:mangadex`): MangaDex's documented API, girls'-love tag, adult
  ratings. Writes `ingest.sql` for `wrangler d1 execute`.
- **Submissions and reports**: `/submit` (lands as pending), `/dmca` (takedowns and reports; a "minor" report takes the work
  down immediately), `GET /api/admin/queue` and `POST /api/admin/review` behind `ADMIN_TOKEN`.
- Tests: `npm test` (policy, search order, ingest, reports against the real migration on SQLite).

## Run it
```
npm install
npx wrangler d1 migrations apply yuris --local
npm run dev                         # http://localhost:3000
npm test && npm run typecheck
```

## Deploy (automatic)
Every push to `main` runs `.github/workflows/deploy.yml`: typecheck, tests, create the D1 database if it doesn't exist
(`scripts/ci-d1.sh`), apply migrations, build, publish to Cloudflare Workers. One-time setup: add these repository secrets
(Settings, Secrets and variables, Actions):

| Secret | What |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | your Cloudflare account id |
| `CLOUDFLARE_API_TOKEN` | token with Workers Scripts: Edit and D1: Edit (add Workers Routes: Edit for a custom domain) |
| `ADMIN_TOKEN` (optional) | bearer token for `/api/admin/*`; without it the admin routes stay closed |

It goes live at `yuris.<your-subdomain>.workers.dev`. For yuri.xxx, add the domain to the same Cloudflare account and uncomment
the `routes` line in `wrangler.jsonc`. First catalogue fill, once deployed:
`npm run ingest:mangadex && npx wrangler d1 execute yuris --remote --file ingest.sql`.

## Not done yet
- **Real age verification.** The gate is a self-declaration. The UK, the EU and a growing list of US states expect more for a
  site like this. Pick a provider and put it behind the same cookie.
- A review UI (the queue is API-only), creator accounts, video hosting/transcoding, CSAM scanning on uploads (Cloudflare's
  tool is free and the intended route), search beyond `LIKE`, and the Cloudflare Container for heavier ingest jobs.
- The terms text is a placeholder. Have a lawyer review it, the age-check approach and record-keeping duties before launch.
- `middleware.ts` is the deprecated name in Next 16 (`proxy.ts`); it builds and bundles fine on OpenNext today.
