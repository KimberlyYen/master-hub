"use client";

import { useSchools } from "../lib/schoolStore";
import type { School } from "../applications/data";
import Link from "next/link";
import PendingUpdates from "../components/PendingUpdates";

// ── Date utilities ─────────────────────────────────────────────────────────────

// Extract the LAST ROC date found in a string (e.g. for registration deadline)
function parseLastROCDate(str?: string): Date | null {
  if (!str) return null;
  if (/待公告|未找到|無（|純書審/.test(str)) return null;
  const all = [...str.matchAll(/(\d{3})\/(\d{1,2})\/(\d{1,2})/g)];
  if (!all.length) return null;
  const m = all[all.length - 1];
  return new Date(+m[1] + 1911, +m[2] - 1, +m[3]);
}

// Convert a date to % position along a relative Oct–Apr timeline.
// baseYear = year that October falls in (2025 for 115, 2026 for 116).
function dateToPct(d: Date, baseYear: number): number | null {
  const y = d.getFullYear(), mo = d.getMonth();
  let monthIdx: number; // 0=Oct … 6=Apr
  if (y === baseYear && mo >= 9)       monthIdx = mo - 9;          // Oct=0,Nov=1,Dec=2
  else if (y === baseYear + 1 && mo <= 3) monthIdx = mo + 3;       // Jan=3,Feb=4,Mar=5,Apr=6
  else return null;
  const daysInMo = new Date(y, mo + 1, 0).getDate();
  return ((monthIdx + (d.getDate() - 1) / daysInMo) / 7) * 100;
}

function addOneYear(d: Date): Date {
  return new Date(d.getFullYear() + 1, d.getMonth(), d.getDate());
}

// ── Milestone extraction ───────────────────────────────────────────────────────

type MilestoneKind = "brochure" | "registration" | "document" | "exam";

type Milestone = {
  kind: MilestoneKind;
  pct: number;
  label: string;
  estimated?: boolean; // for 116 estimated from 115
};

const KIND_STYLE: Record<MilestoneKind, { dot: string; ring: string; short: string }> = {
  brochure:     { dot: "bg-purple-500", ring: "ring-purple-300", short: "公" },
  registration: { dot: "bg-blue-500",   ring: "ring-blue-300",   short: "報" },
  document:     { dot: "bg-amber-500",  ring: "ring-amber-300",  short: "審" },
  exam:         { dot: "bg-green-500",  ring: "ring-green-300",  short: "試" },
};

function getMilestones(
  school: School,
  yearBase: number,
  useRef: boolean
): Milestone[] {
  const src = useRef
    ? {
        brochure:     school.ref115?.brochureDate,
        registration: school.ref115?.registrationDeadline,
        document:     school.ref115?.documentDeadline,
        exam:         school.ref115?.examDate,
      }
    : {
        brochure:     school.brochureDate,
        registration: school.registrationDeadline,
        document:     school.documentDeadline,
        exam:         school.examDate,
      };

  const LABELS: Record<MilestoneKind, string> = {
    brochure:     "公告簡章",
    registration: "報名截止",
    document:     "備審截止",
    exam:         "考試/面試",
  };

  const milestones: Milestone[] = [];
  for (const [k, raw] of Object.entries(src) as [MilestoneKind, string | undefined][]) {
    const d = parseLastROCDate(raw);
    if (!d) continue;
    const pct = dateToPct(d, yearBase);
    if (pct === null) continue;
    milestones.push({ kind: k, pct, label: `${LABELS[k]}：${raw}` });
  }
  return milestones;
}

// Build 116 row: real dates if filled, else estimate from 115 (+1 year)
function get116Milestones(school: School): Milestone[] {
  const real = getMilestones(school, 2026, false);
  if (real.length) return real;

  // Estimate from 115 ref
  const ref115 = getMilestones(school, 2025, true);
  return ref115.flatMap((m) => {
    const d115Pct = m.pct; // already calculated in 2025-based
    // Recalculate in 2026 base from 115 date + 1 year
    const d115Base = dateToPct; // placeholder; we re-derive below
    void d115Base;
    // We need the original date to add 1 year. Re-parse from ref115 labels isn't clean.
    // Instead, just shift the percent by the same position (same relative position in the year)
    return [{
      ...m,
      pct: d115Pct,  // same relative position in the year
      label: m.label + "（預估）",
      estimated: true,
    }];
  });
}

// ── Month grid ─────────────────────────────────────────────────────────────────

const MONTHS = ["10月", "11月", "12月", "1月", "2月", "3月", "4月"];

// ── Components ─────────────────────────────────────────────────────────────────

function MilestoneDot({ m }: { m: Milestone }) {
  const s = KIND_STYLE[m.kind];
  return (
    <div
      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 group"
      style={{ left: `${m.pct}%` }}
      title={m.label}
    >
      <div
        className={`w-3 h-3 rounded-full ring-2 ${s.dot} ${s.ring} ${
          m.estimated ? "opacity-40 ring-dashed" : ""
        } cursor-default`}
      />
      {/* Tooltip */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 hidden group-hover:block z-20 pointer-events-none">
        <div className="rounded-md bg-zinc-800 text-white text-[10px] px-2 py-1 whitespace-nowrap shadow-lg">
          {m.label}
        </div>
      </div>
    </div>
  );
}

function TimelineRow({ milestones, faint }: { milestones: Milestone[]; faint?: boolean }) {
  return (
    <div className={`relative h-6 ${faint ? "opacity-60" : ""}`}>
      {/* Baseline */}
      <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-zinc-100" />
      {milestones.map((m, i) => (
        <MilestoneDot key={i} m={m} />
      ))}
      {milestones.length === 0 && (
        <span className="absolute top-1/2 -translate-y-1/2 left-2 text-[10px] text-zinc-300">
          未找到資料
        </span>
      )}
    </div>
  );
}

function SchoolBlock({ school }: { school: School }) {
  const m115 = getMilestones(school, 2025, true);
  const m116 = get116Milestones(school);
  const name = school.school.replace("大學", "").replace("科技", "科");

  return (
    <div className="grid grid-cols-[120px_1fr] border-b border-zinc-100 last:border-0">
      {/* Left: school name */}
      <div className="border-r border-zinc-100 py-1 pr-3 flex flex-col justify-center">
        <p className="text-xs font-medium text-zinc-700 truncate leading-tight">{name}</p>
        <p className="text-[10px] text-zinc-400 truncate leading-tight">
          {school.department.replace("碩士在職專班", "").replace("學系", "").trim()}
        </p>
      </div>

      {/* Right: timelines */}
      <div className="pl-2 py-1 space-y-1">
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-zinc-300 w-6 shrink-0">115</span>
          <div className="flex-1"><TimelineRow milestones={m115} /></div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-blue-400 w-6 shrink-0">116</span>
          <div className="flex-1"><TimelineRow milestones={m116} faint={m116.some(m => m.estimated)} /></div>
        </div>
      </div>
    </div>
  );
}

function MonthGrid() {
  return (
    <div className="grid grid-cols-[120px_1fr] border-b border-zinc-200 mb-1">
      <div className="border-r border-zinc-100" />
      <div className="relative h-6 pl-2">
        {MONTHS.map((label, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 flex items-center"
            style={{ left: `calc(${(i / 7) * 100}% + 8px)` }}
          >
            <span className="text-[10px] text-zinc-400 -translate-x-1/2">{label}</span>
            {/* Vertical gridline */}
            <div
              className="absolute top-full h-[calc(100vh)] w-px bg-zinc-100 pointer-events-none"
              style={{ left: "50%" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function GanttPage() {
  const { schools, loaded } = useSchools();
  const visible = schools.filter((s) => !s.hidden);

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-zinc-400">
        載入中...
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-zinc-50">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">申請時程甘特圖</h1>
          <p className="text-sm text-zinc-400 mt-1">
            115 實線（已知）· 116 半透明（依 115 時程預估）· 爬蟲抓到新日期後自動顯示更新通知
          </p>
        </div>

        {/* Pending updates banner */}
        <PendingUpdates />

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs">
          {(Object.entries(KIND_STYLE) as [MilestoneKind, typeof KIND_STYLE[MilestoneKind]][]).map(
            ([kind, s]) => (
              <div key={kind} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ring-2 ${s.dot} ${s.ring}`} />
                <span className="text-zinc-500">
                  {{ brochure: "公告簡章", registration: "報名截止", document: "備審截止", exam: "考試/面試" }[kind]}
                </span>
              </div>
            )
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full ring-2 bg-zinc-400 ring-zinc-200 opacity-40" />
            <span className="text-zinc-400">116 預估（同 115 時程）</span>
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="px-4 pt-3 pb-2">
            <MonthGrid />
            <div className="space-y-0">
              {visible.map((school) => (
                <SchoolBlock key={school.id} school={school} />
              ))}
            </div>
          </div>
        </div>

        {/* Note */}
        <p className="text-xs text-zinc-400">
          · 116 列若無已填日期，將以 115 相同時程位置預估顯示（半透明）。
          實際日期公告後請至學校設定填入，圖表即自動更新。
        </p>
      </div>
    </div>
  );
}
