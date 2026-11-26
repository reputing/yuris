import Link from "next/link";
import { db } from "@/lib/db";
import { searchWorks, PAGE } from "@/lib/catalog";
import { Grid, Header, Pager } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const works = await searchWorks(await db(), "", page);
  return (
    <div className="wrap">
      <Header />
      <Grid works={works} />
      <Pager base="/" page={page} more={works.length === PAGE} />
      <p className="fine" style={{ marginTop: 40 }}><Link href="/terms">Terms</Link> · <Link href="/dmca">Takedowns &amp; reports</Link></p>
    </div>
  );
}
