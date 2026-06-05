import type { ScrapeResult } from "./scraper";

export type UpdateField =
  | "brochureDate"
  | "registrationDeadline"
  | "documentDeadline"
  | "examDate";

export type ProposedUpdate = {
  schoolId: string;
  field: UpdateField;
  value: string;        // the extracted date string (ROC format)
  snippet: string;      // raw snippet it came from
  scrapedAt: string;
};

// Keyword → field mapping
const FIELD_RULES: { pattern: RegExp; field: UpdateField }[] = [
  { pattern: /簡章|公告招生|招生公告/,              field: "brochureDate" },
  { pattern: /報名.{0,10}(截止|至|時間|開始)/,      field: "registrationDeadline" },
  { pattern: /備審|繳交資料|上傳資料|審查資料.*截止/, field: "documentDeadline" },
  { pattern: /面試|口試/,                           field: "examDate" },
];

// Extract the LAST ROC date in a string (for deadlines: use the end of a range)
function extractLastROCDate(str: string): string | null {
  const matches = [...str.matchAll(/\d{3}\/\d{1,2}\/\d{1,2}/g)];
  return matches.length ? matches[matches.length - 1][0] : null;
}

export function parseSnippets(results: ScrapeResult[]): ProposedUpdate[] {
  const updates: ProposedUpdate[] = [];

  for (const result of results) {
    if (result.status !== "found") continue;

    for (const snippet of result.snippets) {
      // Determine which field this snippet describes
      let field: UpdateField | null = null;
      for (const rule of FIELD_RULES) {
        if (rule.pattern.test(snippet)) { field = rule.field; break; }
      }
      if (!field) continue;

      const dateStr = extractLastROCDate(snippet);
      if (!dateStr) continue;

      // Apply to all school IDs covered by this scrape target
      for (const schoolId of result.ids) {
        updates.push({
          schoolId,
          field,
          value: dateStr,
          snippet: snippet.slice(0, 120),
          scrapedAt: result.scrapedAt,
        });
      }
    }
  }

  // Deduplicate: keep the last proposal per (schoolId, field)
  const seen = new Map<string, ProposedUpdate>();
  for (const u of updates) {
    seen.set(`${u.schoolId}::${u.field}`, u);
  }
  return Array.from(seen.values());
}
