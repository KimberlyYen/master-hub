import { parseSnippets } from "./dateParser";
import type { ScrapeResult } from "./scraper";

const baseResult: ScrapeResult = {
  ids: ["tku-im"],
  status: "found",
  snippets: [],
  scrapedAt: "2026-06-20T00:00:00.000Z",
};

describe("parseSnippets", () => {
  it("從報名截止片段擷取民國日期", () => {
    const results: ScrapeResult[] = [
      {
        ...baseResult,
        snippets: ["網路報名時間 115/1/1–115/1/19 中午12:00 截止"],
      },
    ];

    const updates = parseSnippets(results);

    expect(updates).toEqual([
      expect.objectContaining({
        schoolId: "tku-im",
        field: "registrationDeadline",
        value: "115/1/19",
      }),
    ]);
  });

  it("忽略沒有日期的片段", () => {
    const results: ScrapeResult[] = [
      {
        ...baseResult,
        snippets: ["面試地點待公告"],
      },
    ];

    expect(parseSnippets(results)).toEqual([]);
  });
});
