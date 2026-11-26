export function GET() {
  // keep search engines out of everything but the gate; the pages are also noindex
  return new Response("User-agent: *\nDisallow: /api/\nDisallow: /work/\nDisallow: /search\n", { headers: { "content-type": "text/plain" } });
}
