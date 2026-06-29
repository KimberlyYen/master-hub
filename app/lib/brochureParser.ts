export type ParsedBrochureField = {
  key: string;
  label: string;
  value: string;
};

export type ParsedBrochure = {
  school?: string;
  department?: string;
  code?: string;
  quota?: string;
  workExpRequired?: string;
  applicationFee?: string;
  classSchedule?: string;
  brochureDate?: string;
  registrationDeadline?: string;
  documentDeadline?: string;
  examDate?: string;
  resultDate?: string;
  contact?: string;
  remarks?: string;
  scoring: { label: string; percentage: string }[];
  requiredDocuments: { label: string; required: boolean }[];
  rawText: string;
  fields: ParsedBrochureField[];
};

const DATE_RULES: { pattern: RegExp; key: keyof ParsedBrochure; label: string }[] = [
  { pattern: /簡章|公告招生|招生公告/, key: "brochureDate", label: "公告簡章" },
  { pattern: /報名.{0,12}(截止|至|時間|開始|期間)/, key: "registrationDeadline", label: "報名截止" },
  { pattern: /備審|繳交資料|上傳資料|審查資料.*截止|書面資料/, key: "documentDeadline", label: "備審截止" },
  { pattern: /面試|口試|筆試/, key: "examDate", label: "考試／面試" },
  { pattern: /放榜|榜單|錄取公告/, key: "resultDate", label: "放榜日期" },
];

const DOC_KEYWORDS = [
  "學歷",
  "成績單",
  "自傳",
  "履歷",
  "工作年資",
  "年資證明",
  "推薦函",
  "專業工作",
  "在職證明",
  "身分證",
  "畢業證書",
];

function extractLastROCDate(str: string): string | null {
  const range = str.match(/(\d{3}\/\d{1,2}\/\d{1,2})\s*[–\-~～至]\s*(\d{3}\/\d{1,2}\/\d{1,2}[^，。\s]*)/);
  if (range) return `${range[1]}–${range[2]}`;
  const matches = [...str.matchAll(/\d{3}\/\d{1,2}\/\d{1,2}[^，。\s]*/g)];
  return matches.length ? matches[matches.length - 1][0].trim() : null;
}

function firstMatch(text: string, pattern: RegExp): string | undefined {
  const m = text.match(pattern);
  return m?.[1]?.trim();
}

function pushField(
  fields: ParsedBrochureField[],
  key: string,
  label: string,
  value: string | undefined
) {
  if (!value?.trim()) return;
  fields.push({ key, label, value: value.trim() });
}

export function parseBrochureText(rawText: string): ParsedBrochure {
  const text = rawText.replace(/\r/g, "\n");
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const joined = lines.join("\n");
  const fields: ParsedBrochureField[] = [];

  const school =
    firstMatch(joined, /([\u4e00-\u9fff]{2,12}大學)/) ??
    firstMatch(joined, /([\u4e00-\u9fff]{2,12}科技大學)/);
  const department =
    firstMatch(joined, /([\u4e00-\u9fffA-Za-z0-9（）／\-·\s]{2,40}(?:學系|系所|系))/);
  const code =
    firstMatch(joined, /(?:組別代號|招生代碼|代號)[:：\s]*(\d{4}[A-Z])/i) ??
    firstMatch(joined, /\b(\d{4}[A-Z])\b/);
  const quota =
    firstMatch(joined, /(?:招生|核定|錄取|名額).*?(\d{1,3})\s*名/) ??
    firstMatch(joined, /(\d{1,3})\s*名(?:\s|$)/);
  const workExpRequired =
    firstMatch(joined, /(?:工作經驗|工作年資|年資).*?(\d+\s*年以上?)/) ??
    (/(?:工作經驗|工作年資).{0,8}1\s*年/.test(joined) ? "1年以上" : undefined);
  const applicationFee = firstMatch(
    joined,
    /(?:報名費|手續費|報名手續費).*?(\d{3,5})\s*元/
  );
  const classSchedule = firstMatch(
    joined,
    /(?:上課時間|授課時間)[:：]?\s*([^\n]{4,40})/
  );
  const contact =
    firstMatch(joined, /(\(\d{2,4}\)\s*\d{3,4}[-–]\d{3,4})/) ??
    firstMatch(joined, /(\d{2,4}[-–]\d{3,4}[-–]\d{3,4})/);

  const parsed: ParsedBrochure = {
    school,
    department,
    code,
    quota,
    workExpRequired,
    applicationFee,
    classSchedule,
    contact,
    scoring: [],
    requiredDocuments: [],
    rawText: text,
    fields,
  };

  for (const line of lines) {
    for (const rule of DATE_RULES) {
      if (!rule.pattern.test(line)) continue;
      const dateStr = extractLastROCDate(line);
      if (!dateStr || parsed[rule.key as keyof ParsedBrochure]) continue;
      (parsed as Record<string, unknown>)[rule.key] = dateStr;
      pushField(fields, rule.key, rule.label, dateStr);
    }
  }

  const scoringMatches = [...joined.matchAll(/(.{2,24}?)\s*(\d{1,3})\s*[%％]/g)];
  const scoring = scoringMatches
    .map((m) => ({
      label: m[1].replace(/^[：:\s\d.]+/, "").trim(),
      percentage: m[2],
    }))
    .filter((r) => r.label.length >= 2 && Number(r.percentage) <= 100);

  if (scoring.length) {
    parsed.scoring = scoring.slice(0, 6);
    pushField(
      fields,
      "scoring",
      "考試配分",
      scoring.map((s) => `${s.label} ${s.percentage}%`).join("、")
    );
  }

  const docSet = new Set<string>();
  for (const line of lines) {
    for (const kw of DOC_KEYWORDS) {
      if (!line.includes(kw)) continue;
      const cleaned = line
        .replace(/^[\d.、\s]+/, "")
        .replace(/[（(].*[)）]/g, "")
        .trim()
        .slice(0, 40);
      if (cleaned.length < 2 || docSet.has(cleaned)) continue;
      docSet.add(cleaned);
      parsed.requiredDocuments.push({
        label: cleaned,
        required: !/選繳|選填|非必要/.test(line),
      });
    }
  }

  if (parsed.requiredDocuments.length) {
    pushField(
      fields,
      "requiredDocuments",
      "備審文件",
      parsed.requiredDocuments.map((d) => d.label).join("、")
    );
  }

  const remarkLine = lines.find((l) =>
    /注意|備註|未達|不予錄取|取消報名/.test(l)
  );
  if (remarkLine) {
    parsed.remarks = remarkLine.slice(0, 200);
    pushField(fields, "remarks", "備註", parsed.remarks);
  }

  pushField(fields, "school", "學校名稱", school);
  pushField(fields, "department", "系所名稱", department);
  pushField(fields, "code", "組別代號", code);
  pushField(fields, "quota", "招生名額", quota);
  pushField(fields, "workExpRequired", "工作年資", workExpRequired);
  pushField(fields, "applicationFee", "報名費", applicationFee);
  pushField(fields, "classSchedule", "上課時間", classSchedule);
  pushField(fields, "contact", "聯絡方式", contact);

  parsed.fields = fields.filter(
    (f, i, arr) => arr.findIndex((x) => x.key === f.key) === i
  );

  return parsed;
}

export type BrochureFormPatch = {
  school?: string;
  department?: string;
  code?: string;
  quota?: string;
  workExpRequired?: string;
  applicationFee?: string;
  classSchedule?: string;
  brochureDate?: string;
  registrationDeadline?: string;
  documentDeadline?: string;
  examDate?: string;
  resultDate?: string;
  contact?: string;
  remarks?: string;
  scoring?: { label: string; percentage: string }[];
  requiredDocuments?: { label: string; required: boolean }[];
};

export function parsedToFormPatch(parsed: ParsedBrochure): BrochureFormPatch {
  return {
    school: parsed.school,
    department: parsed.department,
    code: parsed.code,
    quota: parsed.quota,
    workExpRequired: parsed.workExpRequired,
    applicationFee: parsed.applicationFee,
    classSchedule: parsed.classSchedule,
    brochureDate: parsed.brochureDate,
    registrationDeadline: parsed.registrationDeadline,
    documentDeadline: parsed.documentDeadline,
    examDate: parsed.examDate,
    resultDate: parsed.resultDate,
    contact: parsed.contact,
    remarks: parsed.remarks,
    scoring: parsed.scoring.length ? parsed.scoring : undefined,
    requiredDocuments: parsed.requiredDocuments.length
      ? parsed.requiredDocuments
      : undefined,
  };
}
