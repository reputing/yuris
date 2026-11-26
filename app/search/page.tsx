import { db } from "@/lib/db";
import { searchWorks, PAGE } from "@/lib/catalog";
import { Grid, Header, Pager } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search" };

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 80);
  const page = Math.max(1, Number(sp.page) || 1);
  const works = await searchWorks(await db(), q, page);
  return (
    <div className="wrap">
      <Header q={q} />
      <h2 style={{ margin: "0 0 14px" }}>{q ? `Results for “${q}”` : "Everything"}</h2>
      <Grid works={works} />
      <Pager base="/search" page={page} more={works.length === PAGE} q={q} />
    </div>
  );
}
