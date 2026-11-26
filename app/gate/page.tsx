import { safeNext } from "@/lib/policy";

export const metadata = { title: "Are you 18 or older?" };

export default async function Gate({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  return (
    <main className="gate">
      <div className="gate-card">
        <h1>yuri.xxx</h1>
        <p className="lead">This site contains adult material.</p>
        <p>Are you 18 years of age or older?</p>
        <form method="post" action="/api/gate" className="gate-actions">
          <input type="hidden" name="next" value={next} />
          <button name="answer" value="yes" className="btn primary">Yes, I&apos;m 18 or older</button>
          <button name="answer" value="no" className="btn">No, take me out</button>
        </form>
        <p className="fine">By entering you confirm you are an adult and that you are allowed to view adult material where you live. <a href="/terms">Terms</a></p>
      </div>
    </main>
  );
}
