import { db } from "@/lib/db";
import { addWork } from "@/lib/catalog";

// A creator's submission. It lands as 'pending' and is invisible until a reviewer publishes it;
// the content policy runs first, so anything it blocks is turned away here and never stored.
export async function POST(req: Request) {
  const f = await req.formData().catch(() => null);
  const get = (k: string) => String(f?.get(k) ?? "").trim();
  const url = get("url");
  const back = (q: string) => new Response(null, { status: 303, headers: { location: new URL(`/submit?${q}`, req.url).toString() } });
  if (!f || !get("title") || !/^https:\/\//i.test(url) || !get("contact") || get("adults") !== "yes") return back("err=invalid");
  const cover = get("cover");
  const r = await addWork(await db(), {
    title: get("title"), creator: get("creator"), description: get("description"), sourceType: "creator", sourceUrl: url,
    coverUrl: /^https:\/\//i.test(cover) ? cover : null, tags: get("tags").split(","), contact: get("contact"),
  });
  return back(r.status === "rejected" ? "err=blocked" : "sent=1");
}
