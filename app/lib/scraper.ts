export type ScrapeTarget = {
  ids: string[];
  name: string;
  url: string;
};

export type ScrapeResult = {
  ids: string[];
  name: string;
  url: string;
  status: "found" | "not_found" | "error";
  snippets: string[];
  error?: string;
  scrapedAt: string;
};

const TARGETS: ScrapeTarget[] = [
  { ids: ["cycu-im", "cycu-cs"], name: "中原大學（資管＋資工）", url: "https://icare.cycu.edu.tw/addition/#/General%20Regulations" },
  { ids: ["fju-im"],             name: "輔仁大學 資管系",        url: "http://www.im.fju.edu.tw" },
  { ids: ["fju-cs"],             name: "輔仁大學 資工系",        url: "https://csie2.fju.edu.tw/" },
  { ids: ["ntust-emrd"],         name: "台灣科技大學 EMRD",      url: "https://emrd.ntust.edu.tw/p/403-1039-1293.php?Lang=zh-tw" },
  { ids: ["ttu-cs"],             name: "大同科技大學 資工系",    url: "https://cse.ttu.edu.tw/" },
  { ids: ["tku-cs"],             name: "淡江大學 資工系",        url: "https://csie.tku.edu.tw/" },
];

function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ").trim();
}

const ROC_DATE = /1\d{2}[\/年]\d{1,2}[\/月]\d{1,2}/;
const KEYWORDS = /報名|招生|簡章|截止|面試|口試|審查|公告|在職|碩士/;

function findSnippets(text: string): string[] {
  const seen = new Set<string>();
  const results: string[] = [];
  for (const chunk of text.split(/[。！？\r\n]+/)) {
    const t = chunk.trim();
    if (t.length < 6 || t.length > 200) continue;
    if (!ROC_DATE.test(t) || !KEYWORDS.test(t)) continue;
    const key = t.replace(/\s/g, "").slice(0, 50);
    if (!seen.has(key)) { seen.add(key); results.push(t.slice(0, 160)); }
    if (results.length >= 10) break;
  }
  return results;
}

async function fetchPage(url: string): Promise<{ text: string; error?: string }> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(9000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.5",
      },
    });
    if (!res.ok) return { text: "", error: `HTTP ${res.status}` };
    return { text: extractText(await res.text()) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("timeout") || msg.includes("TimeoutError")) return { text: "", error: "連線逾時（9秒）" };
    if (msg.includes("ECONNREFUSED")) return { text: "", error: "伺服器拒絕連線" };
    if (msg.includes("ENOTFOUND"))    return { text: "", error: "找不到主機" };
    return { text: "", error: msg.slice(0, 80) };
  }
}

export async function runScrape(schoolIds?: string[]): Promise<ScrapeResult[]> {
  const targets = schoolIds
    ? TARGETS.filter((t) => t.ids.some((id) => schoolIds.includes(id)))
    : TARGETS;

  return Promise.all(targets.map(async (target): Promise<ScrapeResult> => {
    const { text, error } = await fetchPage(target.url);
    const snippets = text ? findSnippets(text) : [];
    return {
      ids: target.ids,
      name: target.name,
      url: target.url,
      status: error ? "error" : snippets.length > 0 ? "found" : "not_found",
      snippets,
      error,
      scrapedAt: new Date().toISOString(),
    };
  }));
}
