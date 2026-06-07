"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSchools } from "../lib/schoolStore";
import FileAttachments from "../components/FileAttachments";
import { AttachmentInlineList } from "../components/AttachmentList";
import { useAttachments, type Attachment } from "../lib/attachmentStore";
import PendingUpdates from "../components/PendingUpdates";
import { usePreferences, getSchoolRank } from "../lib/preferenceStore";
import {
  ALL_STATUSES,
  STATUS_COLORS,
  type Status,
  type School,
} from "./data";

type UserState = {
  status: Status;
  checkedDocs: boolean[];
  notes: string;
};

type AllUserState = Record<string, UserState>;

const APP_STATE_KEY = "master-hub:applications";

function defaultUserState(school: School): UserState {
  return {
    status: "未開始",
    checkedDocs: school.requiredDocuments.map(() => false),
    notes: "",
  };
}

function resolveUserState(school: School, saved?: Partial<UserState>): UserState {
  if (!saved) return defaultUserState(school);
  const len = school.requiredDocuments.length;
  const checkedDocs = Array.from({ length: len }, (_, i) => saved.checkedDocs?.[i] ?? false);
  return { status: saved.status ?? "未開始", checkedDocs, notes: saved.notes ?? "" };
}

function loadAppState(): AllUserState {
  try {
    const raw = localStorage.getItem(APP_STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAppState(state: AllUserState) {
  localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
}

// ── Stats bar ──────────────────────────────────────────────────────────────

function StatsBar({ schools, allState }: { schools: School[]; allState: AllUserState }) {
  const applied = schools.filter((s) => {
    const st = allState[s.id]?.status;
    return st && st !== "未開始" && st !== "放棄";
  }).length;
  const completed = schools.filter((s) => {
    const st = allState[s.id]?.status;
    return st === "錄取" || st === "備取";
  }).length;
  return (
    <div className="flex gap-4 flex-wrap">
      <StatChip label="目標學校" value={schools.length} color="zinc" />
      <StatChip label="已報名" value={applied} color="sky" />
      <StatChip label="錄取/備取" value={completed} color="green" />
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    zinc: "bg-zinc-100 text-zinc-700",
    sky: "bg-sky-50 text-sky-700",
    green: "bg-green-50 text-green-700",
  };
  return (
    <div className={`rounded-lg px-4 py-2 text-sm font-medium ${colors[color]}`}>
      <span className="text-lg font-bold mr-1">{value}</span>
      {label}
    </div>
  );
}

// ── Score bar ───────────────────────────────────────────────────────────────

function ScoreBar({ items }: { items: { label: string; percentage: number }[] }) {
  const colors = ["bg-blue-400", "bg-amber-400", "bg-emerald-400", "bg-purple-400"];
  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-zinc-500">
          <div className={`w-2 h-2 rounded-full shrink-0 ${colors[i % colors.length]}`} />
          <div className="flex-1 bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${colors[i % colors.length]}`}
              style={{ width: `${item.percentage}%` }}
            />
          </div>
          <span className="w-8 text-right shrink-0">{item.percentage}%</span>
          <span className="truncate max-w-[140px]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Document checklist ──────────────────────────────────────────────────────

// ── Per-document upload + download ───────────────────────────────────────────

async function downloadFilesSequentially(files: Attachment[]) {
  for (const att of files) {
    try {
      const res = await fetch(att.url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = att.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      await new Promise((r) => setTimeout(r, 350));
    } catch {
      // skip failed file silently
    }
  }
}

function DocChecklist({
  school,
  checked,
  onChange,
}: {
  school: School;
  checked: boolean[];
  onChange: (i: number, val: boolean) => void;
}) {
  const { attachments, add } = useAttachments(school.id);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  const required = school.requiredDocuments.filter((d) => d.required);
  const optional = school.requiredDocuments.filter((d) => !d.required);
  const reqDone = required.filter((d) => {
    const i = school.requiredDocuments.indexOf(d);
    return checked[i];
  }).length;

  // All attachments linked to required docs
  const requiredDocFiles = attachments.filter(
    (a) => a.docIndex !== undefined && school.requiredDocuments[a.docIndex]?.required
  );

  async function handleDocUpload(docIndex: number, files: FileList) {
    setUploadingIdx(docIndex);
    try {
      const formData = new FormData();
      formData.append("schoolId", school.id);
      for (const f of Array.from(files)) formData.append("files", f);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.files) {
        add(
          (data.files as { name: string; url: string; storageKey?: string; type: string; size: number }[]).map(
            (f) => ({
              id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: f.name,
              url: f.url,
              storageKey: f.storageKey,
              type: f.type,
              size: f.size,
              uploadedAt: new Date().toISOString(),
              docIndex,
            })
          )
        );
      }
    } finally {
      setUploadingIdx(null);
    }
  }

  async function handleDownloadAll() {
    if (!requiredDocFiles.length) return;
    setDownloading(true);
    await downloadFilesSequentially(requiredDocFiles);
    setDownloading(false);
  }

  function DocRow({
    docIdx,
    required: isRequired,
  }: {
    docIdx: number;
    required: boolean;
  }) {
    const doc = school.requiredDocuments[docIdx];
    const docFiles = attachments.filter((a) => a.docIndex === docIdx);
    const isUploading = uploadingIdx === docIdx;

    return (
      <li key={docIdx} className="space-y-1">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`${school.id}-doc-${docIdx}`}
            checked={checked[docIdx] ?? false}
            onChange={(e) => onChange(docIdx, e.target.checked)}
            className={`mt-0.5 cursor-pointer ${isRequired ? "accent-blue-500" : "accent-zinc-400"}`}
          />
          <label
            htmlFor={`${school.id}-doc-${docIdx}`}
            className={`flex-1 text-sm cursor-pointer leading-snug ${
              checked[docIdx]
                ? "line-through text-zinc-400"
                : isRequired
                ? "text-zinc-700"
                : "text-zinc-500"
            }`}
          >
            {doc.label}
          </label>

          {/* File count badge */}
          {docFiles.length > 0 && (
            <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-1.5 py-0.5 shrink-0">
              📎 {docFiles.length}
            </span>
          )}

          {/* Upload "+" button */}
          <button
            title="上傳此文件"
            disabled={isUploading}
            onClick={() => fileInputRefs.current[docIdx]?.click()}
            className="shrink-0 w-5 h-5 rounded-full border border-zinc-300 text-zinc-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors text-xs flex items-center justify-center disabled:opacity-40"
          >
            {isUploading ? "…" : "+"}
          </button>
          <input
            ref={(el) => { fileInputRefs.current[docIdx] = el; }}
            type="file"
            multiple
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleDocUpload(docIdx, e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        <AttachmentInlineList files={docFiles} />
      </li>
    );
  }

  return (
    <div className="space-y-3">
      {/* Required docs header + download button */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          必繳文件 ({reqDone}/{required.length})
        </p>
        {requiredDocFiles.length > 0 && (
          <button
            onClick={handleDownloadAll}
            disabled={downloading}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
          >
            {downloading ? "下載中…" : `⬇ 全部下載 (${requiredDocFiles.length} 個檔案)`}
          </button>
        )}
      </div>

      <ul className="space-y-2">
        {school.requiredDocuments.map((doc, i) =>
          doc.required ? <DocRow key={i} docIdx={i} required /> : null
        )}
      </ul>

      {optional.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
            選繳文件
          </p>
          <ul className="space-y-2">
            {school.requiredDocuments.map((doc, i) =>
              !doc.required ? <DocRow key={i} docIdx={i} required={false} /> : null
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Date compare row ─────────────────────────────────────────────────────────

function DateCompareRow({
  label,
  current,
  ref115,
}: {
  label: string;
  current?: string;
  ref115?: string;
}) {
  const noRef = !ref115 || ref115 === "未找到" || ref115.includes("無法連線");
  return (
    <>
      <span className="text-xs text-zinc-400 whitespace-nowrap">{label}</span>
      <span className="text-xs text-blue-600 font-medium truncate">
        {current || "—"}
      </span>
      <span className={`text-xs truncate ${noRef ? "text-zinc-300 italic" : "text-zinc-500"}`}>
        {ref115 || "—"}
      </span>
    </>
  );
}

// ── Application Card ─────────────────────────────────────────────────────────

const RANK_LABELS = ["第一志願", "第二志願", "第三志願"] as const;

function ApplicationCard({
  school,
  userState,
  onStateChange,
  prefRank,
  onSetPreference,
}: {
  school: School;
  userState: UserState;
  onStateChange: (patch: Partial<UserState>) => void;
  prefRank?: 0 | 1 | 2 | null;
  onSetPreference?: (rank: 0 | 1 | 2 | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { status, checkedDocs, notes } = userState;
  const statusStyle = STATUS_COLORS[status];

  const requiredDocs = school.requiredDocuments.filter((d) => d.required);
  const reqChecked = requiredDocs.filter((d) => {
    const i = school.requiredDocuments.indexOf(d);
    return checkedDocs[i];
  }).length;
  const docPct = requiredDocs.length > 0 ? (reqChecked / requiredDocs.length) * 100 : 0;

  function handleDocChange(i: number, val: boolean) {
    const next = [...checkedDocs];
    next[i] = val;
    onStateChange({ checkedDocs: next });
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <p className="text-xs text-zinc-400 font-medium">{school.school}</p>
            <h3 className="text-sm font-semibold text-zinc-800 leading-snug">
              {school.department}
            </h3>
          </div>
          <select
            value={status}
            onChange={(e) => onStateChange({ status: e.target.value as Status })}
            className={`shrink-0 text-xs font-semibold rounded-full px-2.5 py-1 border cursor-pointer outline-none
              ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400 flex-wrap">
          <span>代碼 {school.code}</span>
          <span>招生 {school.quota} 名</span>
          <span>工作年資 {school.workExpRequired}</span>
          {school.applicationFee && (
            <span className="text-amber-600">報名費 ${school.applicationFee}</span>
          )}
          {onSetPreference && (
            <select
              value={prefRank === null || prefRank === undefined ? "" : String(prefRank)}
              onChange={(e) => {
                const v = e.target.value;
                onSetPreference(v === "" ? null : (Number(v) as 0 | 1 | 2));
              }}
              className={`rounded-full px-2 py-0.5 border cursor-pointer outline-none text-xs font-medium ${
                prefRank != null
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-zinc-50 text-zinc-400 border-zinc-200"
              }`}
            >
              <option value="">志願</option>
              <option value="0">① 第一志願</option>
              <option value="1">② 第二志願</option>
              <option value="2">③ 第三志願</option>
            </select>
          )}
        </div>
      </div>

      {/* Key dates — 116 vs 115 comparison */}
      <div className="px-4 py-2 border-t border-zinc-100">
        <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-1 items-center">
          {/* Header */}
          <span />
          <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide">116（待公告）</span>
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">115參考</span>
          {/* Rows */}
          <DateCompareRow
            label="公告簡章"
            current={school.brochureDate}
            ref115={school.ref115?.brochureDate}
          />
          <DateCompareRow
            label="報名截止"
            current={school.registrationDeadline}
            ref115={school.ref115?.registrationDeadline}
          />
          <DateCompareRow
            label="備審截止"
            current={school.documentDeadline}
            ref115={school.ref115?.documentDeadline}
          />
          <DateCompareRow
            label="考試/面試"
            current={school.examDate}
            ref115={school.ref115?.examDate}
          />
        </div>
        {school.classSchedule && (
          <p className="text-xs text-zinc-400 mt-1">
            <span className="text-zinc-500">上課時間：</span>{school.classSchedule}
          </p>
        )}
        {school.ref115?.source && (
          <p className="text-[10px] text-zinc-300 mt-1">115資料來源：{school.ref115.source}</p>
        )}
      </div>

      {/* Document progress */}
      <div className="px-4 py-2 border-t border-zinc-100">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-zinc-500">必繳文件進度</span>
          <span className="text-xs font-medium text-zinc-600">
            {reqChecked}/{requiredDocs.length}
          </span>
        </div>
        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-400 transition-all"
            style={{ width: `${docPct}%` }}
          />
        </div>
      </div>

      {/* Scoring */}
      <div className="px-4 py-2 border-t border-zinc-100">
        <ScoreBar items={school.scoring} />
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-2 border-t border-zinc-100 text-xs text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 transition-colors text-left flex items-center justify-between"
      >
        <span>{expanded ? "收起詳情" : "展開詳情（文件清單、備注）"}</span>
        <span>{expanded ? "▲" : "▼"}</span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-zinc-100 space-y-4 pt-3">
          <DocChecklist school={school} checked={checkedDocs} onChange={handleDocChange} />

          {school.remarks && (
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
              <p className="text-xs font-semibold text-amber-700 mb-1">招簡備注</p>
              <p className="text-xs text-amber-800 leading-relaxed">{school.remarks}</p>
            </div>
          )}
          {school.contact && (
            <p className="text-xs text-zinc-400">
              <span className="font-medium text-zinc-500">聯絡：</span>
              {school.contact}
            </p>
          )}
          {school.website && (
            <a
              href={school.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs text-blue-500 hover:underline"
            >
              系所官網 →
            </a>
          )}
          <div>
            <p className="text-xs font-semibold text-zinc-500 mb-1">個人備注</p>
            <textarea
              value={notes}
              onChange={(e) => onStateChange({ notes: e.target.value })}
              placeholder="記錄備注、聯絡情況、特別要求..."
              rows={3}
              className="w-full text-xs rounded-lg border border-zinc-200 px-3 py-2 resize-none outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100 placeholder:text-zinc-500"
            />
          </div>

          <FileAttachments schoolId={school.id} />
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

type CategoryTab = "全部" | "資管" | "資工" | "前三志願";

function detectCategory(department: string): "資管" | "資工" {
  if (department.includes("資訊管理") || department.includes("資管")) return "資管";
  return "資工";
}

export default function ApplicationsPage() {
  const { schools, loaded } = useSchools();
  const { preferences, loaded: prefsLoaded, setChoiceBySchool } = usePreferences();
  const [allState, setAllState] = useState<AllUserState>({});
  const [categoryTab, setCategoryTab] = useState<CategoryTab>("全部");
  const [filterStatus, setFilterStatus] = useState<Status | "全部">("全部");

  useEffect(() => {
    if (!loaded) return;
    const saved = loadAppState();
    const initialised: AllUserState = {};
    for (const school of schools) {
      initialised[school.id] = resolveUserState(school, saved[school.id]);
    }
    setAllState(initialised);
  }, [loaded, schools]);

  const updateSchoolState = useCallback(
    (id: string, patch: Partial<UserState>) => {
      setAllState((prev) => {
        const next = { ...prev, [id]: { ...prev[id], ...patch } };
        saveAppState(next);
        return next;
      });
    },
    []
  );

  if (!loaded || !prefsLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-zinc-400">
        載入中...
      </div>
    );
  }

  const visible = schools.filter((s) => !s.hidden);
  const imCount = visible.filter((s) => detectCategory(s.department) === "資管").length;
  const csCount = visible.filter((s) => detectCategory(s.department) === "資工").length;
  const prefCount = preferences.filter(Boolean).length;

  const prefSchools = preferences
    .map((id) => (id ? visible.find((s) => s.id === id) : null))
    .filter((s): s is School => s != null);

  const filtered =
    categoryTab === "前三志願"
      ? prefSchools
      : visible.filter((s) => {
          if (categoryTab !== "全部" && detectCategory(s.department) !== categoryTab) return false;
          if (filterStatus === "全部") return true;
          return (allState[s.id]?.status ?? "未開始") === filterStatus;
        });

  const tabs: { label: string; value: CategoryTab; count: number }[] = [
    { label: "全部", value: "全部", count: visible.length },
    { label: "資管", value: "資管", count: imCount },
    { label: "資工", value: "資工", count: csCount },
    { label: "前三志願", value: "前三志願", count: prefCount },
  ];

  const CATEGORY_INFO: Record<"資管" | "資工", {
    description: string;
    courses: string[];
    suitable: string[];
    career: string[];
  }> = {
    資管: {
      description: "資訊管理（MIS）是整合資訊科技與企業管理的跨域學科，著重如何運用 IT 解決商業問題，提升組織決策效率與競爭力。",
      courses: ["資訊系統分析與設計", "資料庫管理", "企業資源規劃（ERP）", "數位轉型策略", "專案管理", "電子商務", "資料分析與商業智慧"],
      suitable: ["具 IT 背景、想往管理或策略面發展者", "PM / BA 想強化系統思維者", "企業內推動數位化的管理人員"],
      career: ["資訊長（CIO）/ IT 主管", "系統分析師 / 顧問", "專案經理（PMP）", "數位轉型推手"],
    },
    資工: {
      description: "資訊工程（CS/CE）深入電腦科學理論與工程實作，涵蓋演算法、系統架構到新興 AI 應用，培養能解決複雜技術問題的高階工程師。",
      courses: ["演算法與資料結構", "軟體工程", "機器學習 / 深度學習", "資訊安全", "雲端運算", "物聯網（IoT）", "自然語言處理（NLP）"],
      suitable: ["軟體工程師想深化技術或轉研究", "有志 AI／資安領域發展者", "技術主管想取得學術背景者"],
      career: ["軟體架構師 / 技術主管", "AI / ML 工程師", "資安工程師", "研發工程師 / 研究員"],
    },
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-zinc-50">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800">研究所在職專班申請追蹤</h1>
          </div>
        </div>

        {/* Pending updates from scraper */}
        <PendingUpdates />

        {/* Category tabs */}
        <div className="flex gap-1 border-b border-zinc-200">
          {tabs.map((tab) => {
            const active = categoryTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setCategoryTab(tab.value)}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  active
                    ? "border-zinc-800 text-zinc-900"
                    : "border-transparent text-zinc-400 hover:text-zinc-600 hover:border-zinc-300"
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 text-xs rounded-full px-1.5 py-0.5 ${
                  active ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-400"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category intro card */}
        {(categoryTab === "資管" || categoryTab === "資工") && (() => {
          const info = CATEGORY_INFO[categoryTab];
          return (
            <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {categoryTab} 課綱介紹
                </span>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed">{info.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-semibold text-zinc-500 mb-1.5">核心課程方向</p>
                  <ul className="space-y-0.5">
                    {info.courses.map((c) => (
                      <li key={c} className="text-xs text-zinc-500 flex items-start gap-1">
                        <span className="text-zinc-300 shrink-0 mt-0.5">·</span>{c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-500 mb-1.5">適合人選</p>
                  <ul className="space-y-0.5">
                    {info.suitable.map((s) => (
                      <li key={s} className="text-xs text-zinc-500 flex items-start gap-1">
                        <span className="text-zinc-300 shrink-0 mt-0.5">·</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-500 mb-1.5">職涯方向</p>
                  <ul className="space-y-0.5">
                    {info.career.map((c) => (
                      <li key={c} className="text-xs text-zinc-500 flex items-start gap-1">
                        <span className="text-zinc-300 shrink-0 mt-0.5">·</span>{c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })()}

        {categoryTab !== "前三志願" && (
          <>
            <StatsBar schools={visible} allState={allState} />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-zinc-400 font-medium">篩選：</span>
              {(["全部", ...ALL_STATUSES] as (Status | "全部")[]).map((s) => {
                const active = filterStatus === s;
                return (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      active
                        ? "bg-zinc-800 text-white border-zinc-800"
                        : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {categoryTab === "前三志願" && prefCount === 0 && (
          <p className="text-sm text-zinc-500">
            在「全部」、「資管」或「資工」分頁的學校卡片上，從「志願」下拉選單設定前三志願。
          </p>
        )}

        {schools.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-zinc-400 text-sm">尚無學校資料。</p>
            <Link
              href="/settings"
              className="inline-block text-sm text-blue-500 hover:underline"
            >
              前往學校設定新增 →
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-zinc-400 py-12 text-center">
            {categoryTab === "前三志願" ? "尚未設定任何志願。" : "沒有符合篩選條件的學校。"}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((school) => {
              const rank = getSchoolRank(preferences, school.id);
              return (
                <div key={school.id} className="space-y-1">
                  {categoryTab === "前三志願" && rank != null && (
                    <p className="text-xs font-semibold text-amber-700 px-1">
                      {RANK_LABELS[rank]}
                    </p>
                  )}
                  <ApplicationCard
                    school={school}
                    userState={allState[school.id] ?? defaultUserState(school)}
                    onStateChange={(patch) => updateSchoolState(school.id, patch)}
                    prefRank={rank}
                    onSetPreference={(r) => setChoiceBySchool(school.id, r)}
                  />
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-zinc-300 text-center pb-4">
          所有進度資料儲存於本機 localStorage，不會上傳至任何伺服器。
        </p>
      </div>
    </div>
  );
}
