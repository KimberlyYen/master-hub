"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  useAttachments,
  bulkAddAttachments,
  type Attachment,
} from "../lib/attachmentStore";
import { AttachmentInlineList } from "../components/AttachmentList";
import type { School } from "./data";

// ── Types ──────────────────────────────────────────────────────────────────────

export type MasterDocEntry = {
  label: string;
  matchingSchools: { id: string; school: string; department: string; docIndex: number }[];
};

export function getMasterDocs(schools: School[]): MasterDocEntry[] {
  const map = new Map<string, MasterDocEntry>();
  for (const school of schools) {
    for (let i = 0; i < school.requiredDocuments.length; i++) {
      const doc = school.requiredDocuments[i];
      if (!doc.required) continue;
      if (!map.has(doc.label)) {
        map.set(doc.label, { label: doc.label, matchingSchools: [] });
      }
      map.get(doc.label)!.matchingSchools.push({
        id: school.id,
        school: school.school,
        department: school.department,
        docIndex: i,
      });
    }
  }
  return Array.from(map.values());
}

// ── Checked state (localStorage) ──────────────────────────────────────────────

const CHECKED_KEY = "master-hub:master-checked";

function useMasterChecked() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKED_KEY);
      setChecked(raw ? JSON.parse(raw) : {});
    } catch {}
  }, []);

  const toggle = useCallback((label: string) => {
    setChecked((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      localStorage.setItem(CHECKED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { checked, toggle };
}

// ── Download helper ────────────────────────────────────────────────────────────

async function downloadFiles(files: Attachment[]) {
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
    } catch {}
  }
}

// ── Single master doc row ──────────────────────────────────────────────────────

function MasterDocRow({
  entry,
  checked,
  onToggle,
  masterAttachments,
  onUpload,
  uploading,
}: {
  entry: MasterDocEntry;
  checked: boolean;
  onToggle: () => void;
  masterAttachments: Attachment[];
  onUpload: (files: FileList) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  // files uploaded via master checklist for this label
  const docFiles = masterAttachments.filter((a) => a.docLabel === entry.label);
  const [open, setOpen] = useState(false);

  return (
    <li className="space-y-1">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`master-doc-${entry.label}`}
          checked={checked}
          onChange={onToggle}
          className="mt-0.5 accent-blue-500 cursor-pointer shrink-0"
        />
        <label
          htmlFor={`master-doc-${entry.label}`}
          className={`flex-1 text-sm cursor-pointer leading-snug ${
            checked ? "line-through text-zinc-400" : "text-zinc-700"
          }`}
        >
          {entry.label}
        </label>

        {/* Applicable schools badge */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 text-xs text-zinc-400 hover:text-zinc-600 border border-zinc-200 rounded-full px-2 py-0.5 transition-colors"
          title="點擊查看適用學校"
        >
          適用 {entry.matchingSchools.length} 校
        </button>

        {/* File count badge */}
        {docFiles.length > 0 && (
          <span className="shrink-0 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-1.5 py-0.5">
            📎 {docFiles.length}
          </span>
        )}

        {/* Upload button */}
        <button
          title="上傳此文件"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="shrink-0 w-5 h-5 rounded-full border border-zinc-300 text-zinc-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors text-xs flex items-center justify-center disabled:opacity-40"
        >
          {uploading ? "…" : "+"}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) onUpload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Applicable schools list */}
      {open && (
        <ul className="ml-6 space-y-0.5">
          {entry.matchingSchools.map((s) => (
            <li key={s.id} className="text-xs text-zinc-400">
              · {s.school} {s.department}
            </li>
          ))}
        </ul>
      )}

      <AttachmentInlineList files={docFiles} />
    </li>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function MasterChecklist({
  schools,
  defaultExpanded = false,
}: {
  schools: School[];
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [uploadingLabel, setUploadingLabel] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const { checked, toggle } = useMasterChecked();

  // "_master" is the virtual school key for master checklist uploads
  const { attachments: masterAttachments, add: addMaster } = useAttachments("_master");

  const masterDocs = getMasterDocs(schools);
  const doneCount = masterDocs.filter((d) => checked[d.label]).length;
  const allMasterFiles = masterAttachments.filter((a) => a.docLabel !== undefined);

  const handleUpload = useCallback(
    async (entry: MasterDocEntry, files: FileList) => {
      setUploadingLabel(entry.label);
      try {
        const formData = new FormData();
        formData.append("schoolId", "_master");
        for (const f of Array.from(files)) formData.append("files", f);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!data.files) return;

        const now = new Date().toISOString();
        const newAttachments: Attachment[] = (
          data.files as { name: string; url: string; storageKey?: string; type: string; size: number }[]
        ).map((f) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: f.name,
          url: f.url,
          storageKey: f.storageKey,
          type: f.type,
          size: f.size,
          uploadedAt: now,
          docLabel: entry.label,
        }));

        // 1. Store in master (_master)
        addMaster(newAttachments);

        // 2. Propagate to each matching school with the correct docIndex
        bulkAddAttachments(
          entry.matchingSchools.map(({ id, docIndex }) => ({
            schoolId: id,
            attachments: newAttachments.map((a) => ({ ...a, docIndex })),
          }))
        );
      } finally {
        setUploadingLabel(null);
      }
    },
    [addMaster]
  );

  if (masterDocs.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-zinc-700">📋 文件總覽</span>
          <span className="text-xs text-zinc-400">
            {doneCount}/{masterDocs.length} 項完成
          </span>
          {doneCount > 0 && (
            <div className="h-1.5 w-24 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 rounded-full transition-all"
                style={{ width: `${(doneCount / masterDocs.length) * 100}%` }}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {allMasterFiles.length > 0 && (
            <span className="text-xs text-zinc-400">📎 {allMasterFiles.length} 個檔案</span>
          )}
          <span className="text-xs text-zinc-400">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-zinc-100 px-5 py-4 space-y-4">
          {/* Download all button */}
          {allMasterFiles.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={async () => {
                  setDownloading(true);
                  await downloadFiles(allMasterFiles);
                  setDownloading(false);
                }}
                disabled={downloading}
                className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
              >
                {downloading ? "下載中…" : `⬇ 全部下載（${allMasterFiles.length} 個檔案）`}
              </button>
            </div>
          )}

          <p className="text-xs text-zinc-400">
            共 <span className="font-semibold text-zinc-600">{masterDocs.length}</span> 項不重複必繳文件
            ·
            上傳後自動同步至各校子卡片
          </p>

          <ul className="space-y-3">
            {masterDocs.map((entry) => (
              <MasterDocRow
                key={entry.label}
                entry={entry}
                checked={!!checked[entry.label]}
                onToggle={() => toggle(entry.label)}
                masterAttachments={masterAttachments}
                onUpload={(files) => handleUpload(entry, files)}
                uploading={uploadingLabel === entry.label}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
