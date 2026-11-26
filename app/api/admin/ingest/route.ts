import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { ingestPage } from "@/lib/ingest-mangadex";

// POST ?offset=0&limit=20  index one batch of MangaDex's girls'-love list, through the content policy.
// Returns { stats, next }: call again with offset=next until next is null. Admin only.
export async function POST(req: Request) {
  if (!(await isAdmin(req))) return Response.json({ error: "no" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const r = await ingestPage(await db(), fetch, Math.max(0, Number(sp.get("offset")) || 0), Math.min(100, Math.max(1, Number(sp.get("limit")) || 20)));
  return Response.json(r, { status: r.error ? 502 : 200 });
}
