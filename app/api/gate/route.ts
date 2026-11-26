import { safeNext } from "@/lib/policy";

// The answer to "are you 18 or older?". POST only (a link or a prefetch must never set the cookie).
//   yes -> a cookie for 30 days, then on to where they were going
//   no  -> a session cookie that closes the site to them, and off to a search engine
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const answer = String(form?.get("answer") ?? "");
  const next = safeNext(String(form?.get("next") ?? "/"));
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  // someone who already said no cannot change their answer by posting to this route directly
  if (answer === "yes" && /(?:^|;\s*)y_denied=1/.test(req.headers.get("cookie") ?? "")) return new Response(null, { status: 303, headers: { location: new URL("/denied", req.url).toString() } });
  if (answer === "yes") {
    return new Response(null, { status: 303, headers: { location: new URL(next, req.url).toString(), "set-cookie": `y_age=1; Path=/; Max-Age=${30 * 86400}; HttpOnly; SameSite=Lax${secure}`, "cache-control": "no-store" } });
  }
  const headers = new Headers({ location: "https://www.google.com/", "cache-control": "no-store" });
  headers.append("set-cookie", `y_denied=1; Path=/; HttpOnly; SameSite=Lax${secure}`);   // no Max-Age: lasts until the browser closes
  headers.append("set-cookie", `y_age=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`);
  return new Response(null, { status: 303, headers });
}
