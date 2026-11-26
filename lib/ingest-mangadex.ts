// Link-out indexing from MangaDex's documented public API (https://api.mangadex.org/docs/):
// metadata and a link back, nothing hosted. Girls' Love ("yuri") works with an adult content rating are
// listed, each page links to the title on MangaDex, and MangaDex's own cover art is credited by link.
// Every work goes through addWork(), so the content policy (lib/policy.ts) applies exactly as it does
// to a creator's upload.
import { addWork } from "./catalog";
import type { Db } from "./db";

const API = "https://api.mangadex.org";
export const GIRLS_LOVE_TAG = "a3c67850-4684-404e-9b7f-c69850ee5da6";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function toWork(m: any) {
  const a = m?.attributes ?? {};
  const pick = (o: any) => (o && (o.en || o["en-us"] || o.ja_ro || o.ja || Object.values(o)[0])) || "";
  const title = pick(a.title) || pick((a.altTitles ?? []).find((t: any) => t.en));
  const cover = (m.relationships ?? []).find((r: any) => r.type === "cover_art")?.attributes?.fileName;
  const author = (m.relationships ?? []).find((r: any) => r.type === "author")?.attributes?.name ?? "";
  const tags: string[] = (a.tags ?? []).map((t: any) => pick(t?.attributes?.name)).filter(Boolean);
  return {
    title: String(title), creator: String(author), description: String(pick(a.description)),
    coverUrl: cover ? `https://uploads.mangadex.org/covers/${m.id}/${cover}.256.jpg` : null,
    sourceType: "linkout" as const, sourceId: String(m.id), sourceUrl: `https://mangadex.org/title/${m.id}`,
    rating: a.contentRating ?? null, kind: "manga", tags: ["yuri", ...tags],
  };
}

export interface IngestStats { seen: number; published: number; held: number; blocked: number }

/** One batch: `limit` works starting at `offset` (MangaDex pages are capped at 100). Small batches keep a single
 *  Worker request inside D1's per-request query budget. `next` is null when the list has run out. */
export async function ingestPage(db: Db, f: typeof fetch = fetch, offset = 0, limit = 20): Promise<{ stats: IngestStats; next: number | null; error?: string }> {
  const stats: IngestStats = { seen: 0, published: 0, held: 0, blocked: 0 };
  const url = `${API}/manga?includedTags[]=${GIRLS_LOVE_TAG}&contentRating[]=erotica&contentRating[]=pornographic&includes[]=cover_art&includes[]=author&order[followedCount]=desc&limit=${Math.min(100, limit)}&offset=${offset}`;
  const res = await f(url, { headers: { "user-agent": "yuri.xxx-indexer/1.0", accept: "application/json" } });
  if (!res.ok) return { stats, next: null, error: `MangaDex answered ${res.status}` };
  const data = ((await res.json()) as { data?: any[] }).data ?? [];
  for (const m of data) {
    stats.seen++;
    const r = await addWork(db, toWork(m));
    if (r.status === "published") stats.published++; else if (r.status === "pending") stats.held++; else stats.blocked++;
  }
  return { stats, next: data.length < Math.min(100, limit) || offset + data.length >= 10000 ? null : offset + data.length };
}

export async function ingestMangaDex(db: Db, f: typeof fetch = fetch, opts: { pages?: number; log?: (s: string) => void } = {}) {
  const total: IngestStats = { seen: 0, published: 0, held: 0, blocked: 0 };
  let offset: number | null = 0;
  for (let p = 0; p < (opts.pages ?? 5) && offset !== null; p++) {
    const r = await ingestPage(db, f, offset, 100);
    if (r.error) { opts.log?.(r.error + ", stopping"); break; }
    for (const k of Object.keys(total) as (keyof IngestStats)[]) total[k] += r.stats[k];
    opts.log?.(`page ${p + 1}: ${r.stats.seen} works`);
    offset = r.next;
    if (offset !== null) await new Promise((res) => setTimeout(res, 400)); // be gentle with their API
  }
  return total;
}
