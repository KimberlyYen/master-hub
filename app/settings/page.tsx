"use client";

import { useState, useCallback } from "react";
import { useSchools } from "../lib/schoolStore";
import type { School } from "../applications/data";

// ── Form types ────────────────────────────────────────────────────────────────

type ScoringRow = { label: string; percentage: string };
type DocRow = { label: string; required: boolean };

type FormState = {
  school: string;
  department: string;
  code: string;
  quota: string;
  website: string;
  workExpRequired: string;
  classSchedule: string;
  applicationFee: string;
  brochureDate: string;
  registrationDeadline: string;
  documentDeadline: string;
  examDate: string;
  resultDate: string;
  scoring: ScoringRow[];
  requiredDocuments: DocRow[];
  remarks: string;
  contact: string;
  // 115學年度參考
  ref115_brochure: string;
  ref115_registration: string;
  ref115_document: string;
  ref115_exam: string;
  ref115_source: string;
};

const emptyForm: FormState = {
  school: "",
  department: "",
  code: "",
  quota: "20",
  website: "",
  workExpRequired: "1年以上",
  classSchedule: "",
  applicationFee: "",
  brochureDate: "待公告",
  registrationDeadline: "待公告",
  documentDeadline: "待公告",
  examDate: "待公告",
  resultDate: "",
  scoring: [
    { label: "書面審查", percentage: "50" },
    { label: "面試", percentage: "50" },
  ],
  requiredDocuments: [
    { label: "學歷證明", required: true },
    { label: "工作年資證明", required: true },
    { label: "自傳", required: true },
  ],
  remarks: "",
  contact: "",
  ref115_brochure: "",
  ref115_registration: "",
  ref115_document: "",
  ref115_exam: "",
  ref115_source: "",
};

function schoolToForm(s: School): FormState {
  return {
    school: s.school,
    department: s.department,
    code: s.code,
    quota: String(s.quota),
    website: s.website,
    workExpRequired: s.workExpRequired,
    classSchedule: s.classSchedule ?? "",
    applicationFee: s.applicationFee != null ? String(s.applicationFee) : "",
    brochureDate: s.brochureDate ?? "",
    registrationDeadline: s.registrationDeadline ?? "",
    documentDeadline: s.documentDeadline ?? "",
    examDate: s.examDate ?? "",
    resultDate: s.resultDate ?? "",
    scoring: s.scoring.map((row) => ({
      label: row.label,
      percentage: String(row.percentage),
    })),
    requiredDocuments: s.requiredDocuments.map((d) => ({ ...d })),
    remarks: s.remarks ?? "",
    contact: s.contact ?? "",
    ref115_brochure: s.ref115?.brochureDate ?? "",
    ref115_registration: s.ref115?.registrationDeadline ?? "",
    ref115_document: s.ref115?.documentDeadline ?? "",
    ref115_exam: s.ref115?.examDate ?? "",
    ref115_source: s.ref115?.source ?? "",
  };
}

function formToSchool(f: FormState): Omit<School, "id"> {
  return {
    school: f.school.trim(),
    department: f.department.trim(),
    code: f.code.trim(),
    quota: Number(f.quota) || 0,
    website: f.website.trim(),
    workExpRequired: f.workExpRequired.trim(),
    classSchedule: f.classSchedule.trim() || undefined,
    applicationFee: f.applicationFee.trim() ? Number(f.applicationFee) : undefined,
    brochureDate: f.brochureDate.trim() || undefined,
    registrationDeadline: f.registrationDeadline.trim() || undefined,
    documentDeadline: f.documentDeadline.trim() || undefined,
    examDate: f.examDate.trim() || undefined,
    resultDate: f.resultDate.trim() || undefined,
    scoring: f.scoring
      .filter((r) => r.label.trim())
      .map((r) => ({ label: r.label.trim(), percentage: Number(r.percentage) || 0 })),
    requiredDocuments: f.requiredDocuments.filter((d) => d.label.trim()),
    remarks: f.remarks.trim() || undefined,
    contact: f.contact.trim() || undefined,
    ref115: {
      brochureDate: f.ref115_brochure.trim() || undefined,
      registrationDeadline: f.ref115_registration.trim() || undefined,
      documentDeadline: f.ref115_document.trim() || undefined,
      examDate: f.ref115_exam.trim() || undefined,
      source: f.ref115_source.trim() || undefined,
    },
  };
}

// ── Field helpers ─────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-600">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "rounded-md border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 placeholder:text-zinc-500 bg-white";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-1 mb-3">
      {children}
    </p>
  );
}

// ── SchoolForm ────────────────────────────────────────────────────────────────

function SchoolForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: FormState;
  onSave: (data: FormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);

  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    []
  );

  const scoreTotal = form.scoring.reduce(
    (s, r) => s + (Number(r.percentage) || 0),
    0
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.school.trim() || !form.department.trim()) return;
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本資訊 */}
      <div>
        <SectionTitle>基本資訊</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="學校名稱" required>
            <input
              className={inputCls}
              value={form.school}
              onChange={(e) => set("school", e.target.value)}
              placeholder="例：中原大學"
              required
            />
          </Field>
          <Field label="系所名稱" required>
            <input
              className={inputCls}
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
              placeholder="例：資訊管理學系"
              required
            />
          </Field>
          <Field label="組別代號">
            <input
              className={inputCls}
              value={form.code}
              onChange={(e) => set("code", e.target.value)}
              placeholder="例：5461N"
            />
          </Field>
          <Field label="招生名額">
            <input
              className={inputCls}
              type="number"
              min={1}
              value={form.quota}
              onChange={(e) => set("quota", e.target.value)}
            />
          </Field>
          <Field label="工作年資要求" required>
            <input
              className={inputCls}
              value={form.workExpRequired}
              onChange={(e) => set("workExpRequired", e.target.value)}
              placeholder="例：1年以上"
              required
            />
          </Field>
          <Field label="報名費（元，空白表示免費）">
            <input
              className={inputCls}
              type="number"
              min={0}
              value={form.applicationFee}
              onChange={(e) => set("applicationFee", e.target.value)}
              placeholder="例：2500"
            />
          </Field>
          <Field label="上課時間">
            <input
              className={inputCls}
              value={form.classSchedule}
              onChange={(e) => set("classSchedule", e.target.value)}
              placeholder="例：週一至週五晚上或假日"
            />
          </Field>
          <Field label="系所網址">
            <input
              className={inputCls}
              type="url"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://..."
            />
          </Field>
        </div>
      </div>

      {/* 重要日期 */}
      <div>
        <SectionTitle>重要日期</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(
            [
              ["brochureDate", "公告簡章"],
              ["registrationDeadline", "報名截止"],
              ["documentDeadline", "備審截止"],
              ["examDate", "考試／面試日期"],
              ["resultDate", "放榜日期"],
            ] as [keyof FormState, string][]
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                className={inputCls}
                value={form[key] as string}
                onChange={(e) => set(key, e.target.value)}
                placeholder="待公告"
              />
            </Field>
          ))}
        </div>
      </div>

      {/* 考試配分 */}
      <div>
        <SectionTitle>
          考試配分
          <span
            className={`ml-2 font-normal normal-case ${
              scoreTotal === 100 ? "text-green-500" : "text-red-400"
            }`}
          >
            合計 {scoreTotal}%{scoreTotal !== 100 ? "（應為100%）" : ""}
          </span>
        </SectionTitle>
        <div className="space-y-2">
          {form.scoring.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className={`${inputCls} flex-1`}
                value={row.label}
                onChange={(e) => {
                  const next = [...form.scoring];
                  next[i] = { ...next[i], label: e.target.value };
                  set("scoring", next);
                }}
                placeholder="項目名稱"
              />
              <input
                className={`${inputCls} w-16 text-center`}
                type="number"
                min={0}
                max={100}
                value={row.percentage}
                onChange={(e) => {
                  const next = [...form.scoring];
                  next[i] = { ...next[i], percentage: e.target.value };
                  set("scoring", next);
                }}
              />
              <span className="text-xs text-zinc-400 shrink-0">%</span>
              <button
                type="button"
                onClick={() =>
                  set(
                    "scoring",
                    form.scoring.filter((_, j) => j !== i)
                  )
                }
                className="text-zinc-300 hover:text-red-400 text-sm shrink-0 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              set("scoring", [...form.scoring, { label: "", percentage: "0" }])
            }
            className="text-xs text-blue-500 hover:text-blue-700"
          >
            + 新增配分項目
          </button>
        </div>
      </div>

      {/* 備審文件 */}
      <div>
        <SectionTitle>備審文件清單</SectionTitle>
        <div className="space-y-2">
          {form.requiredDocuments.map((doc, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                title={doc.required ? "必繳（點擊切換為選繳）" : "選繳（點擊切換為必繳）"}
                onClick={() => {
                  const next = [...form.requiredDocuments];
                  next[i] = { ...next[i], required: !next[i].required };
                  set("requiredDocuments", next);
                }}
                className={`shrink-0 text-xs rounded px-1.5 py-0.5 font-bold border transition-colors ${
                  doc.required
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : "bg-zinc-50 text-zinc-400 border-zinc-200"
                }`}
              >
                {doc.required ? "必" : "選"}
              </button>
              <input
                className={`${inputCls} flex-1`}
                value={doc.label}
                onChange={(e) => {
                  const next = [...form.requiredDocuments];
                  next[i] = { ...next[i], label: e.target.value };
                  set("requiredDocuments", next);
                }}
                placeholder="文件名稱"
              />
              <button
                type="button"
                onClick={() =>
                  set(
                    "requiredDocuments",
                    form.requiredDocuments.filter((_, j) => j !== i)
                  )
                }
                className="text-zinc-300 hover:text-red-400 text-sm shrink-0 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              set("requiredDocuments", [
                ...form.requiredDocuments,
                { label: "", required: true },
              ])
            }
            className="text-xs text-blue-500 hover:text-blue-700"
          >
            + 新增文件
          </button>
        </div>
        <p className="text-xs text-zinc-400 mt-2">
          點擊「必」/「選」標籤可切換該文件是否為必繳。
        </p>
      </div>

      {/* 聯絡資訊 */}
      <div>
        <SectionTitle>聯絡資訊與備注</SectionTitle>
        <div className="grid grid-cols-1 gap-3">
          <Field label="聯絡方式">
            <input
              className={inputCls}
              value={form.contact}
              onChange={(e) => set("contact", e.target.value)}
              placeholder="電話 / Email"
            />
          </Field>
          <Field label="招簡備注">
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={form.remarks}
              onChange={(e) => set("remarks", e.target.value)}
              placeholder="注意事項、特殊規定..."
            />
          </Field>
        </div>
      </div>

      {/* 115學年度參考日期 */}
      <div>
        <SectionTitle>
          115學年度參考日期
          <span className="ml-2 font-normal normal-case text-zinc-400">
            用於預判 116 年公告時程，可手動修正
          </span>
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(
            [
              ["ref115_brochure",      "公告簡章（115年）"],
              ["ref115_registration", "報名截止（115年）"],
              ["ref115_document",     "備審截止（115年）"],
              ["ref115_exam",         "考試/面試（115年）"],
              ["ref115_source",       "資料來源"],
            ] as [keyof FormState, string][]
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                className={inputCls}
                value={form[key] as string}
                onChange={(e) => set(key, e.target.value)}
                placeholder="例：115/1/5 或 未找到"
              />
            </Field>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          className="rounded-lg px-4 py-2 text-sm font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
        >
          儲存
        </button>
      </div>
    </form>
  );
}

// ── School row (list mode) ────────────────────────────────────────────────────

function SchoolRow({
  school,
  onEdit,
  onDelete,
  onToggleHidden,
}: {
  school: School;
  onEdit: () => void;
  onDelete: () => void;
  onToggleHidden: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const hidden = !!school.hidden;

  return (
    <div className={`flex items-center gap-3 rounded-lg border bg-white px-4 py-3 transition-opacity ${
      hidden ? "border-zinc-100 opacity-50" : "border-zinc-200"
    }`}>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-400">{school.school}</p>
        <p className={`text-sm font-medium truncate ${hidden ? "line-through text-zinc-400" : "text-zinc-800"}`}>
          {school.department}
        </p>
        <p className="text-xs text-zinc-400 mt-0.5">
          代碼 {school.code} · 招生 {school.quota} 名 · 工作年資 {school.workExpRequired}
          {hidden && <span className="ml-2 text-zinc-300">（已隱藏）</span>}
        </p>
      </div>

      {confirming ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-red-500">確定刪除？</span>
          <button onClick={onDelete}
            className="text-xs rounded px-2 py-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors">
            刪除
          </button>
          <button onClick={() => setConfirming(false)}
            className="text-xs rounded px-2 py-1 bg-zinc-50 text-zinc-500 border border-zinc-200 hover:bg-zinc-100 transition-colors">
            取消
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onToggleHidden}
            title={hidden ? "取消隱藏" : "隱藏此學校"}
            className={`rounded px-3 py-1 text-xs border transition-colors ${
              hidden
                ? "bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200"
                : "text-zinc-400 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-600"
            }`}>
            {hidden ? "顯示" : "隱藏"}
          </button>
          <button onClick={onEdit}
            className="rounded px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-100 border border-zinc-200 transition-colors">
            編輯
          </button>
          <button onClick={() => setConfirming(true)}
            className="rounded px-3 py-1 text-xs text-zinc-400 hover:bg-red-50 hover:text-red-500 border border-zinc-200 hover:border-red-200 transition-colors">
            刪除
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Mode = "list" | "add" | { type: "edit"; id: string };

export default function SettingsPage() {
  const { schools, loaded, add, update, remove, reset } = useSchools();
  const [mode, setMode] = useState<Mode>("list");
  const [resetConfirm, setResetConfirm] = useState(false);

  function handleSave(formData: FormState) {
    const data = formToSchool(formData);
    if (mode === "add") {
      add(data);
    } else if (typeof mode === "object" && mode.type === "edit") {
      update(mode.id, data);
    }
    setMode("list");
  }

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-zinc-400">
        載入中...
      </div>
    );
  }

  const editingSchool =
    typeof mode === "object" && mode.type === "edit"
      ? schools.find((s) => s.id === mode.id)
      : null;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-zinc-50">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800">學校設定</h1>
            <p className="text-sm text-zinc-400 mt-1">
              新增、編輯、刪除申請學校清單
            </p>
          </div>
          {mode === "list" && (
            <button
              onClick={() => setMode("add")}
              className="rounded-lg px-4 py-2 text-sm font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
            >
              + 新增學校
            </button>
          )}
        </div>

        {/* Add form */}
        {mode === "add" && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
            <p className="text-sm font-semibold text-zinc-700 mb-4">新增學校</p>
            <SchoolForm
              initial={emptyForm}
              onSave={handleSave}
              onCancel={() => setMode("list")}
            />
          </div>
        )}

        {/* Edit form */}
        {typeof mode === "object" && mode.type === "edit" && editingSchool && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5">
            <p className="text-sm font-semibold text-zinc-700 mb-4">
              編輯：{editingSchool.school} / {editingSchool.department}
            </p>
            <SchoolForm
              initial={schoolToForm(editingSchool)}
              onSave={handleSave}
              onCancel={() => setMode("list")}
            />
          </div>
        )}

        {/* School list */}
        {mode === "list" && (
          <div className="space-y-2">
            {schools.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-12">
                尚無學校。點擊「+ 新增學校」開始新增。
              </p>
            ) : (
              schools.map((school) => (
                <SchoolRow
                  key={school.id}
                  school={school}
                  onEdit={() => setMode({ type: "edit", id: school.id })}
                  onDelete={() => remove(school.id)}
                  onToggleHidden={() => update(school.id, { ...school, hidden: !school.hidden })}
                />
              ))
            )}
          </div>
        )}

        {/* Reset to defaults */}
        {mode === "list" && (
          <div className="border-t border-zinc-200 pt-4">
            {resetConfirm ? (
              <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <p className="flex-1 text-sm text-red-700">
                  確定要還原為預設學校清單？所有自訂變更將遺失。
                </p>
                <button
                  onClick={() => {
                    reset();
                    setResetConfirm(false);
                  }}
                  className="text-xs rounded px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  確定還原
                </button>
                <button
                  onClick={() => setResetConfirm(false)}
                  className="text-xs rounded px-3 py-1.5 bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 transition-colors"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={() => setResetConfirm(true)}
                className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                還原預設學校清單
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
