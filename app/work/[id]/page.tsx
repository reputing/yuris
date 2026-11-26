import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getWork } from "@/lib/catalog";
import { Header } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const w = Number.isInteger(id) ? await getWork(await db(), id) : null;
  if (!w) notFound();
  return (
    <div className="wrap">
      <Header />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(160px,260px) 1fr", gap: 24, alignItems: "start" }}>
        <span className="card"><span className="cover" style={w.cover_url ? { backgroundImage: `url(${w.cover_url})` } : undefined} /></span>
        <div className="stack">
          <h1 style={{ margin: 0 }}>{w.title}</h1>
          <div>{w.yuri ? <span className="badge">yuri</span> : null}<small>{w.creator || w.kind}</small></div>
          {w.description && <p>{w.description}</p>}
          {w.tags.length > 0 && <p>{w.tags.map((t) => <a key={t} href={`/search?q=${encodeURIComponent(t)}`} className="badge" style={{ background: "#2c2234", color: "#f4eef7" }}>{t}</a>)}</p>}
          {w.source_url && <p><a className="btn primary" href={w.source_url} target="_blank" rel="noopener noreferrer nofollow">{w.source_type === "linkout" ? "Read at the source" : "Open"}</a></p>}
          <p className="fine"><a href={`/dmca?work=${w.id}`}>Report or request removal</a></p>
        </div>
      </div>
    </div>
  );
}
