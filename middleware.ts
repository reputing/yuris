import { NextResponse, type NextRequest } from "next/server";

// The 18+ gate. Every page and API call needs the "yes, I'm 18+" cookie, except the gate itself and a few
// legal pages. Someone who answered "no" gets a second cookie and a dead end: the gate will not ask again
// this session. This is a self-declaration, not an age check; see README for what a real one would add.
export const AGE_COOKIE = "y_age";
export const DENIED_COOKIE = "y_denied";
const OPEN = ["/gate", "/api/gate", "/denied", "/terms", "/dmca", "/api/report", "/robots.txt", "/favicon.ico"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const open = OPEN.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // answered "no": nothing on the site opens, except the page that says so
  if (req.cookies.get(DENIED_COOKIE)?.value === "1") {
    if (pathname === "/denied" || pathname === "/api/gate") return NextResponse.next();
    return new NextResponse(null, { status: 307, headers: { location: new URL("/denied", req.url).toString() } });
  }
  if (open || req.cookies.get(AGE_COOKIE)?.value === "1") return NextResponse.next();

  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "age confirmation required" }, { status: 403 });
  const to = new URL("/gate", req.url);
  if (req.method === "GET") to.searchParams.set("next", pathname + search);
  return NextResponse.redirect(to, 307);
}

// not for Next's own assets
export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
