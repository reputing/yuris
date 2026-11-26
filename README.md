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

## Deploy
**Live:** https://yuri.xxx (also www.yuri.xxx and yuris.matthewsjakael.workers.dev). Worker `yuris`, D1 database `yuris`,
routes on the `yuri.xxx` zone, all in the Cloudflare account that already hosts cupcake.

From any machine with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the environment: `npm run deploy`
(builds and publishes; `npm run db:migrate` applies new migrations). `ADMIN_TOKEN` is already set as a Worker secret
(`npx wrangler secret put ADMIN_TOKEN` to change it).

**Deploy on every push to `main`** is `.github/workflows/deploy.yml` (typecheck, tests, D1 create-if-missing, migrations, build,
publish). It needs the same two values as repository secrets (Settings, Secrets and variables, Actions): `CLOUDFLARE_ACCOUNT_ID`
and `CLOUDFLARE_API_TOKEN` (and optionally `ADMIN_TOKEN`). Until they exist the workflow does nothing and says so.

**Filling the catalogue**: `POST /api/admin/ingest?offset=0&limit=20` (bearer `ADMIN_TOKEN`, after the age cookie) indexes one
batch from MangaDex inside Cloudflare and returns `next`; call again until it is null. Works held by the policy appear in
`GET /api/admin/queue`; `POST /api/admin/review {id, action}` publishes or rejects them.

## Not done yet
- **Real age verification.** The gate is a self-declaration. The UK, the EU and a growing list of US states expect more for a
  site like this. Pick a provider and put it behind the same cookie.
- A review UI (the queue is API-only), creator accounts, video hosting/transcoding, CSAM scanning on uploads (Cloudflare's
  tool is free and the intended route), search beyond `LIKE`, and the Cloudflare Container for heavier ingest jobs.
- The terms text is a placeholder. Have a lawyer review it, the age-check approach and record-keeping duties before launch.
- `middleware.ts` is the deprecated name in Next 16 (`proxy.ts`); it builds and bundles fine on OpenNext today.
