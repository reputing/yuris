// Bindings from wrangler.jsonc (+ secrets set with `wrangler secret put`).
interface CloudflareEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  SITE_NAME?: string;
  ADMIN_TOKEN?: string;
}
