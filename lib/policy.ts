// What may be listed here. Two jobs, both run on every work before it is shown to anyone:
//
//  1. BLOCK: anything that sexualises minors or minor-coded characters is never ingested, accepted or shown.
//     These are unambiguous words, matched whole-word on the title, description and every tag.
//  2. REVIEW: words that are common in perfectly adult work but can also mean "minor-coded" (school settings,
//     uniforms...). A match does not reject the work, it holds it for a human to look at before it is public.
//
// Keyword lists cannot prove a character is an adult. They are a first filter, not a substitute for the
// review queue and the report button; anything that gets past them is still reportable.

export type Verdict = { action: "block" | "review" | "ok"; reasons: string[] };

export const BLOCKED_TERMS = [
  "loli", "lolicon", "lolita complex", "shota", "shotacon", "toddlercon", "toddler", "underage", "under age",
  "child", "children", "kid", "kids", "preteen", "pre teen", "prepubescent", "kindergarten", "elementary school",
  "middle school", "minor", "minors", "little girl", "little boy", "young girl", "young boy", "baby",
  "pedo", "pedophile", "pedophilia", "cp", "jailbait",
];

export const REVIEW_TERMS = [
  "school", "schoolgirl", "school girl", "school uniform", "high school", "student", "students", "classroom",
  "teen", "teenager", "petite", "flat chest", "innocent", "tiny", "sailor uniform", "gym uniform", "bloomers",
];

// Tags that put a work at the front of every listing and search. Not a filter: everything else is still listed.
export const YURI_TERMS = ["yuri", "girls love", "girls' love", "girls’ love", "gl", "sapphic", "lesbian", "f/f", "ff", "wlw", "shoujo ai"];

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9/'’ ]+/g, " ").replace(/\s+/g, " ").trim();
const words = (texts: string[]) => texts.map(norm).filter(Boolean);
const hits = (haystacks: string[], terms: string[]) => {
  const out = new Set<string>();
  for (const h of haystacks) {
    const padded = ` ${h} `;
    for (const t of terms) if (padded.includes(` ${t} `)) out.add(t);
  }
  return [...out];
};

export function classify(input: { title?: string; description?: string; tags?: string[] }): Verdict {
  const texts = words([input.title ?? "", input.description ?? "", ...(input.tags ?? [])]);
  const blocked = hits(texts, BLOCKED_TERMS);
  if (blocked.length) return { action: "block", reasons: blocked };
  const review = hits(texts, REVIEW_TERMS);
  if (review.length) return { action: "review", reasons: review };
  return { action: "ok", reasons: [] };
}

export const isYuri = (tags: string[], title = "") => hits(words([title, ...tags]), YURI_TERMS).length > 0;

/** only a same-site path: never "//host", "/\host" or an absolute URL (so ?next= can't send people off-site) */
export function safeNext(v: string | null | undefined): string {
  if (!v || !/^\/(?![\/\\])/.test(v)) return "/";
  return v.slice(0, 300);
}
