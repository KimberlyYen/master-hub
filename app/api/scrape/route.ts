import { NextRequest, NextResponse } from "next/server";
import { runScrape } from "../../lib/scraper";

export type { ScrapeResult } from "../../lib/scraper";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const results = await runScrape(body.schoolIds);
  return NextResponse.json({ results, ranAt: new Date().toISOString() });
}
