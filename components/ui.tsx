import Link from "next/link";
import type { Work } from "@/lib/catalog";

export function Header({ q = "" }: { q?: string }) {
  return (
    <header className="top">
      <Link href="/" className="logo">yuri.xxx</Link>
      <form action="/search" method="get"><input type="text" name="q" defaultValue={q} placeholder="search titles, creators, tags" aria-label="Search" /><button className="btn primary">Search</button></form>
      <Link href="/submit">Submit work</Link>
    </header>
  );
}

export function Grid({ works }: { works: Work[] }) {
  if (!works.length) return <p>Nothing here yet.</p>;
  return (
    <div className="grid">
      {works.map((w) => (
        <Link key={w.id} href={`/work/${w.id}`} className="card">
          <span className="cover" style={w.cover_url ? { backgroundImage: `url(${w.cover_url})` } : undefined} />
          <span className="meta">
            {w.yuri ? <span className="badge">yuri</span> : null}
            <h3>{w.title}</h3>
            <small>{w.creator || w.kind}</small>
          </span>
        </Link>
      ))}
    </div>
  );
}

export function Pager({ base, page, more, q }: { base: string; page: number; more: boolean; q?: string }) {
  const href = (p: number) => `${base}?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;
  return (
    <div className="pager">
      {page > 1 ? <Link href={href(page - 1)}>← newer</Link> : <span />}
      {more ? <Link href={href(page + 1)}>older →</Link> : <span />}
    </div>
  );
}
