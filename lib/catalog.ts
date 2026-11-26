import type { Db } from "./db";
import { classify, isYuri } from "./policy";

export interface Work {
  id: number; title: string; kind: string; creator: string; description: string; cover_url: string | null;
  source_type: string; source_url: string | null; status: string; yuri: number; created_at: number;
}
export const PAGE = 24;

const tagsOf = (db: Db, id: number) =>
  db.prepare("select t.name from work_tags wt join tags t on t.id = wt.tag_id where wt.work_id = ? order by t.name").bind(id).all<{ name: string }>();

/** Published works. Yuri / girls'-love work is listed first, then everything else, newest first in each group. */
export async function searchWorks(db: Db, q = "", page = 1): Promise<Work[]> {
  const term = q.trim().slice(0, 80).replace(/[%_]/g, "");
  const like = `%${term}%`;
  const { results } = await db
    .prepare(
      `select w.id, w.title, w.kind, w.creator, w.description, w.cover_url, w.source_type, w.source_url, w.status, w.yuri, w.created_at
         from works w
        where w.status = 'published'
          and (?1 = '' or w.title like ?2 or w.creator like ?2
               or exists (select 1 from work_tags wt join tags t on t.id = wt.tag_id where wt.work_id = w.id and t.name like ?2))
        order by w.yuri desc, w.created_at desc, w.id desc
        limit ?3 offset ?4`,
    )
    .bind(term, like, PAGE, (Math.max(1, page) - 1) * PAGE)
    .all<Work>();
  return results;
}

export async function getWork(db: Db, id: number): Promise<(Work & { tags: string[] }) | null> {
  const w = await db.prepare("select * from works where id = ? and status = 'published'").bind(id).first<Work>();
  if (!w) return null;
  return { ...w, tags: (await tagsOf(db, id)).results.map((t) => t.name) };
}

export interface NewWork {
  title: string; kind?: string; creator?: string; description?: string; coverUrl?: string | null;
  sourceType: "creator" | "linkout" | "licensed"; sourceId?: string | null; sourceUrl?: string | null;
  rating?: string | null; tags?: string[]; contact?: string | null;
}

/** Add a work. The policy runs here, so no route or script can skip it:
 *  blocked -> not stored at all; review -> stored as pending; ok -> pending for creator uploads, published otherwise. */
export async function addWork(db: Db, w: NewWork): Promise<{ id?: number; status: "published" | "pending" | "rejected"; reasons: string[] }> {
  const tags = [...new Set((w.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 40);
  const verdict = classify({ title: w.title, description: w.description, tags });
  if (verdict.action === "block") return { status: "rejected", reasons: verdict.reasons };
  const status = verdict.action === "review" || w.sourceType === "creator" ? "pending" : "published";
  const note = verdict.action === "review" ? `held for review: ${verdict.reasons.join(", ")}` : null;
  const inserted = await db
    .prepare(
      `insert or ignore into works (title, kind, creator, description, cover_url, source_type, source_id, source_url, rating, status, yuri, note, contact)
       values (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13) returning id`,
    )
    .bind(w.title.slice(0, 200), w.kind ?? "manga", (w.creator ?? "").slice(0, 120), (w.description ?? "").slice(0, 2000), w.coverUrl ?? null, w.sourceType, w.sourceId ?? null, w.sourceUrl ?? null, w.rating ?? null, status, isYuri(tags, w.title) ? 1 : 0, note, w.contact ?? null)
    .first<{ id: number }>();
  if (!inserted) {
    // already ingested from this source: leave it (and whatever a reviewer decided) exactly as it is
    const old = w.sourceId ? await db.prepare("select id, status from works where source_type = ? and source_id = ?").bind(w.sourceType, w.sourceId).first<{ id: number; status: "published" | "pending" | "rejected" }>() : null;
    return { id: old?.id, status: old?.status ?? status, reasons: [] };
  }
  const id = inserted.id;
  for (const t of tags) {
    await db.prepare("insert or ignore into tags (name) values (?)").bind(t).run();
    await db.prepare("insert or ignore into work_tags (work_id, tag_id) select ?, id from tags where name = ?").bind(id, t).run();
  }
  return { id, status, reasons: verdict.reasons };
}

export async function review(db: Db, id: number, action: "publish" | "reject", note = ""): Promise<boolean> {
  const row = await db.prepare("select title, description from works where id = ?").bind(id).first<{ title: string; description: string }>();
  if (!row) return false;
  if (action === "publish") {
    // a reviewer cannot publish something the blocklist stops: re-check, so one click can't override it
    const tags = (await tagsOf(db, id)).results.map((t) => t.name);
    if (classify({ title: row.title, description: row.description, tags }).action === "block") return false;
  }
  await db.prepare("update works set status = ?, note = ?, updated_at = unixepoch() where id = ?").bind(action === "publish" ? "published" : "rejected", note.slice(0, 500) || null, id).run();
  return true;
}

/** A report. One that says the work depicts a minor takes it down at once, before anyone has read it. */
export async function report(db: Db, r: { workId?: number | null; kind: "dmca" | "minor" | "other"; email?: string; details?: string }): Promise<void> {
  await db.prepare("insert into reports (work_id, kind, email, details) values (?, ?, ?, ?)").bind(r.workId ?? null, r.kind, (r.email ?? "").slice(0, 200) || null, (r.details ?? "").slice(0, 3000)).run();
  if (r.workId && r.kind === "minor") await db.prepare("update works set status = 'pending', note = 'taken down by a report: minor', updated_at = unixepoch() where id = ?").bind(r.workId).run();
}
