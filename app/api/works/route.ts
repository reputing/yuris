import { db } from "@/lib/db";
import { searchWorks } from "@/lib/catalog";

// GET /api/works?q=&page=   published works, yuri first, then the rest
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const works = await searchWorks(await db(), sp.get("q") ?? "", Number(sp.get("page")) || 1);
  return Response.json({ works }, { headers: { "cache-control": "private, max-age=60" } });
}
