import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { addWork, getWork, report, review, searchWorks } from "./catalog";
import type { Db } from "./db";

// The real migration against an in-memory SQLite, behind the same small interface D1 gives the app.
function memDb(): Db {
  const raw = new DatabaseSync(":memory:");
  raw.exec(readFileSync(new URL("../migrations/0001_init.sql", import.meta.url), "utf8"));
  return {
    prepare: (sql: string) => ({
      bind: (...v: unknown[]) => ({
        all: async <T,>() => ({ results: raw.prepare(sql).all(...(v as never[])) as T[] }),
        first: async <T,>() => ((raw.prepare(sql).all(...(v as never[])) as T[])[0] ?? null),
        run: async () => raw.prepare(sql).run(...(v as never[])),
      }),
    }),
  } as Db;
}

test("search lists yuri first, everything else after, and only published works", async () => {
  const db = memDb();
  await addWork(db, { title: "Space Pirates", sourceType: "linkout", sourceId: "a", tags: ["action"] });
  await addWork(db, { title: "Moonlit Hands", sourceType: "linkout", sourceId: "b", tags: ["Girls' Love", "romance"] });
  await addWork(db, { title: "Rainy Office", sourceType: "linkout", sourceId: "c", tags: ["drama"] });
  await addWork(db, { title: "Secret Garden", sourceType: "linkout", sourceId: "d", tags: ["yuri"] });
  const all = await searchWorks(db, "");
  assert.deepEqual(all.map((w) => w.title).slice(0, 2).sort(), ["Moonlit Hands", "Secret Garden"]);   // yuri promoted
  assert.equal(all.length, 4);                                                                       // nothing is filtered out
  assert.ok(all.slice(2).every((w) => w.yuri === 0));
  assert.deepEqual((await searchWorks(db, "garden")).map((w) => w.title), ["Secret Garden"]);
  assert.deepEqual((await searchWorks(db, "romance")).map((w) => w.title), ["Moonlit Hands"]);          // tag search
});

test("blocked works are never stored; school-setting works wait for review; creator uploads wait for review", async () => {
  const db = memDb();
  const blocked = await addWork(db, { title: "x", sourceType: "linkout", sourceId: "z", tags: ["loli"] });
  assert.equal(blocked.status, "rejected");
  assert.equal((await searchWorks(db, "")).length, 0);
  const held = await addWork(db, { title: "After class", sourceType: "linkout", sourceId: "s", tags: ["school uniform", "yuri"] });
  assert.equal(held.status, "pending");
  const upload = await addWork(db, { title: "My comic", sourceType: "creator", tags: ["yuri"], contact: "me@x.com" });
  assert.equal(upload.status, "pending");
  assert.equal((await searchWorks(db, "")).length, 0);   // nothing public yet
  assert.equal(await review(db, upload.id!, "publish"), true);
  assert.deepEqual((await searchWorks(db, "")).map((w) => w.title), ["My comic"]);
});

test("re-ingesting the same source id changes nothing, including a reviewer's decision", async () => {
  const db = memDb();
  const first = await addWork(db, { title: "T", sourceType: "linkout", sourceId: "1", tags: ["school"] });
  await review(db, first.id!, "reject", "no");
  const again = await addWork(db, { title: "T", sourceType: "linkout", sourceId: "1", tags: [] });
  assert.equal(again.id, first.id);
  assert.equal(again.status, "rejected");
});

test("a report that says 'minor' takes the work down at once", async () => {
  const db = memDb();
  const w = await addWork(db, { title: "Fine looking", sourceType: "linkout", sourceId: "9", tags: ["yuri"] });
  assert.equal((await searchWorks(db, "")).length, 1);
  await report(db, { workId: w.id, kind: "minor", details: "looks young" });
  assert.equal((await searchWorks(db, "")).length, 0);
  assert.equal(await getWork(db, w.id!), null);
});

import { toWork, ingestMangaDex } from "./ingest-mangadex";
test("MangaDex link-out: maps the API shape, runs the policy, and tags everything yuri", async () => {
  const db = memDb();
  const page = { data: [
    { id: "aaa", attributes: { title: { en: "Moon Hands" }, description: { en: "two women" }, contentRating: "erotica", tags: [{ attributes: { name: { en: "Romance" } } }] }, relationships: [{ type: "cover_art", attributes: { fileName: "c.jpg" } }, { type: "author", attributes: { name: "Mika" } }] },
    { id: "bbb", attributes: { title: { en: "Bad one" }, contentRating: "pornographic", tags: [{ attributes: { name: { en: "Loli" } } }] }, relationships: [] },
    { id: "ccc", attributes: { title: { en: "After Class" }, contentRating: "erotica", tags: [{ attributes: { name: { en: "School Life" } } }] }, relationships: [] },
  ] };
  const w = toWork(page.data[0]);
  assert.equal(w.sourceUrl, "https://mangadex.org/title/aaa");
  assert.equal(w.coverUrl, "https://uploads.mangadex.org/covers/aaa/c.jpg.256.jpg");
  const fake = (async () => ({ ok: true, status: 200, json: async () => page })) as unknown as typeof fetch;
  const stats = await ingestMangaDex(db, fake, { pages: 1 });
  assert.deepEqual(stats, { seen: 3, published: 1, held: 1, blocked: 1 });
  const listed = await searchWorks(db, "");
  assert.deepEqual(listed.map((x) => x.title), ["Moon Hands"]);
  assert.equal(listed[0].yuri, 1);
});
