import { db } from "@/lib/db";
import { report } from "@/lib/catalog";

// Takedowns and reports. Open to everyone (it is reachable without passing the age gate, so a rights holder
// or a reporter is never stopped by it). A "minor" report pulls the work down before anyone reviews it.
export async function POST(req: Request) {
  const f = await req.formData().catch(() => null);
  const kind = String(f?.get("kind") ?? "other");
  const details = String(f?.get("details") ?? "").trim();
  if (!f || !details || !["dmca", "minor", "other"].includes(kind)) return new Response(null, { status: 303, headers: { location: new URL("/dmca", req.url).toString() } });
  const work = Number(f.get("work")) || null;
  await report(await db(), { workId: work, kind: kind as "dmca" | "minor" | "other", email: String(f.get("email") ?? ""), details });
  return new Response(null, { status: 303, headers: { location: new URL("/dmca?sent=1", req.url).toString() } });
}
