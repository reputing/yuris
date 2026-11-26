// Run: npm run ingest:mangadex [pages]
// Builds the catalogue in a throwaway local SQLite (so the real policy runs), then writes ingest.sql for D1:
//   npx wrangler d1 execute yuris --remote --file ingest.sql
import { DatabaseSync } from "node:sqlite";
import { readFileSync, writeFileSync } from "node:fs";
import { ingestMangaDex } from "../lib/ingest-mangadex";
import type { Db } from "../lib/db";

const raw = new DatabaseSync(":memory:");
raw.exec(readFileSync(new URL("../migrations/0001_init.sql", import.meta.url), "utf8"));
const db = {
  prepare: (sql: string) => ({ bind: (...v: unknown[]) => ({
    all: async () => ({ results: raw.prepare(sql).all(...(v as never[])) }),
    first: async () => (raw.prepare(sql).all(...(v as never[])) as never[])[0] ?? null,
    run: async () => raw.prepare(sql).run(...(v as never[])),
  }) }),
} as unknown as Db;

const q = (v: unknown) => (v === null || v === undefined ? "null" : typeof v === "number" ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const stats = await ingestMangaDex(db, fetch, { pages: Number(process.argv[2]) || 5, log: console.log });
console.log(stats);

const works = raw.prepare("select * from works").all() as Record<string, unknown>[];
const cols = ["title", "kind", "creator", "description", "cover_url", "source_type", "source_id", "source_url", "rating", "status", "yuri", "note"];
const out: string[] = [];
for (const w of works) {
  out.push(`insert or ignore into works (${cols.join(", ")}) values (${cols.map((c) => q(w[c])).join(", ")});`);
  const tags = raw.prepare("select t.name from work_tags wt join tags t on t.id = wt.tag_id where wt.work_id = ?").all(w.id as number) as { name: string }[];
  for (const t of tags) {
    out.push(`insert or ignore into tags (name) values (${q(t.name)});`);
    out.push(`insert or ignore into work_tags (work_id, tag_id) select w.id, t.id from works w, tags t where w.source_type = ${q(w.source_type)} and w.source_id = ${q(w.source_id)} and t.name = ${q(t.name)};`);
  }
}
writeFileSync("ingest.sql", out.join("\n") + "\n");
console.log(`wrote ingest.sql (${works.length} works)`);
