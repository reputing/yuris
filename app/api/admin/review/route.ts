import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { review } from "@/lib/catalog";

// POST { id, action: "publish" | "reject", note? }. Publishing re-runs the content policy: a reviewer's
// click cannot put back something the blocklist stops.
export async function POST(req: Request) {
  if (!(await isAdmin(req))) return Response.json({ error: "no" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { id?: number; action?: string; note?: string };
  if (!Number.isInteger(b.id) || (b.action !== "publish" && b.action !== "reject")) return Response.json({ error: "bad request" }, { status: 400 });
  const ok = await review(await db(), b.id!, b.action, b.note ?? "");
  return Response.json({ ok }, { status: ok ? 200 : 409 });
}
