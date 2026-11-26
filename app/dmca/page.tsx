export const metadata = { title: "Takedowns & reports" };

export default async function Dmca({ searchParams }: { searchParams: Promise<{ work?: string; sent?: string }> }) {
  const sp = await searchParams;
  const work = Number(sp.work) || "";
  return (
    <div className="wrap">
      <p><a href="/">← yuri.xxx</a></p>
      <div className="panel">
        <h1 style={{ marginTop: 0 }}>Takedowns &amp; reports</h1>
        <p className="fine">Rights holders: tell us what to remove and we will remove it. Anyone: report a work that depicts a minor and it comes down immediately while we look at it.</p>
        {sp.sent && <div className="notice">Received. Thank you.</div>}
        <form method="post" action="/api/report" className="stack">
          <label>Work number (from the page address)<input type="text" name="work" defaultValue={work} inputMode="numeric" /></label>
          <label>What is this?
            <select name="kind"><option value="dmca">Copyright takedown (DMCA)</option><option value="minor">This depicts a minor</option><option value="other">Something else</option></select>
          </label>
          <label>Details (for a takedown: what is yours, and how to confirm it)<textarea name="details" required maxLength={3000} /></label>
          <label>Your email (optional for reports, needed for a takedown)<input type="email" name="email" /></label>
          <button className="btn primary">Send</button>
        </form>
      </div>
    </div>
  );
}
