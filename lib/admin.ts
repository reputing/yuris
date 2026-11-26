import { env } from "./db";

/** Bearer-token check for /api/admin/*, constant-time. No ADMIN_TOKEN configured means no admin access at all. */
export async function isAdmin(req: Request): Promise<boolean> {
  const token = (await env()).ADMIN_TOKEN;
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token || got.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ got.charCodeAt(i);
  return diff === 0;
}
