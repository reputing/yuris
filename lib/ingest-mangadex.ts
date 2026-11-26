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

export async function ingestMangaDex(db: Db, f: typeof fetch = fetch, opts: { pages?: number; log?: (s: string) => void } = {}) {
  const stats = { seen: 0, published: 0, held: 0, blocked: 0 };
  const pages = opts.pages ?? 5;
  for (let p = 0; p < pages; p++) {
    const url = `${API}/manga?includedTags[]=${GIRLS_LOVE_TAG}&contentRating[]=erotica&contentRating[]=pornographic&includes[]=cover_art&includes[]=author&order[followedCount]=desc&limit=100&offset=${p * 100}`;
    const res = await f(url, { headers: { "user-agent": "yuri.xxx-indexer/1.0", accept: "application/json" } });
    if (!res.ok) { opts.log?.(`MangaDex answered ${res.status}, stopping`); break; }
    const body = (await res.json()) as { data?: any[] };
    const data = body.data ?? [];
    for (const m of data) {
      stats.seen++;
      const r = await addWork(db, toWork(m));
      if (r.status === "published") stats.published++; else if (r.status === "pending") stats.held++; else stats.blocked++;
    }
    opts.log?.(`page ${p + 1}: ${data.length} works`);
    if (data.length < 100) break;
    await new Promise((r) => setTimeout(r, 400)); // be gentle with their API
  }
  return stats;
}
