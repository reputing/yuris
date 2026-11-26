import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

// The review queue: pending works (creator uploads, anything the policy held) and open reports.
export async function GET(req: Request) {
  if (!(await isAdmin(req))) return Response.json({ error: "no" }, { status: 401 });
  const d = await db();
  const pending = await d.prepare("select id, title, creator, source_type, source_url, note, contact, created_at from works where status = 'pending' order by created_at limit 100").bind().all();
  const reports = await d.prepare("select id, work_id, kind, email, details, created_at from reports where status = 'open' order by created_at limit 100").bind().all();
  return Response.json({ pending: pending.results, reports: reports.results });
}
