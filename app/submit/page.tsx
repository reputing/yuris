import { Header } from "@/components/ui";

export const metadata = { title: "Submit your work" };

export default async function Submit({ searchParams }: { searchParams: Promise<{ sent?: string; err?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="wrap">
      <Header />
      <div className="panel">
        <h1 style={{ marginTop: 0 }}>Submit your work</h1>
        <p className="fine">Only work you made, or have the rights to share. Every character shown must be an adult. Submissions are reviewed before they appear.</p>
        {sp.sent && <div className="notice">Thanks, it&apos;s in the review queue.</div>}
        {sp.err && <div className="notice">{sp.err === "blocked" ? "That can't be accepted here." : "Check the form and try again."}</div>}
        <form method="post" action="/api/submit" className="stack">
          <label>Title<input type="text" name="title" required maxLength={200} /></label>
          <label>Your name or handle<input type="text" name="creator" maxLength={120} /></label>
          <label>Where it can be read or seen (a link)<input type="url" name="url" required /></label>
          <label>Cover image link (optional)<input type="url" name="cover" /></label>
          <label>Tags, separated by commas<input type="text" name="tags" placeholder="yuri, romance, ..." /></label>
          <label>Description<textarea name="description" maxLength={2000} /></label>
          <label>Your email (so we can reach you)<input type="email" name="contact" required /></label>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" name="adults" value="yes" required style={{ width: "auto" }} /> Every character and performer is an adult, and I own or control the rights.</label>
          <button className="btn primary">Send for review</button>
        </form>
      </div>
    </div>
  );
}
