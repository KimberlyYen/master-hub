"use client";

import { useEffect, useState, useCallback } from "react";
import { useSchools } from "../lib/schoolStore";
import type { ProposedUpdate } from "../lib/dateParser";

const FIELD_LABELS: Record<string, string> = {
  brochureDate:         "公告簡章",
  registrationDeadline: "報名截止",
  documentDeadline:     "備審截止",
  examDate:             "考試/面試",
};

export default function PendingUpdates() {
  const { schools, update } = useSchools();
  const [updates, setUpdates] = useState<ProposedUpdate[]>([]);
  const [applying, setApplying] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/updates")
      .then((r) => r.json())
      .then((d) => setUpdates(d.updates ?? []));
  }, []);

  const applyAll = useCallback(async () => {
    setApplying(true);
    const applied: string[] = [];

    for (const u of updates) {
      const school = schools.find((s) => s.id === u.schoolId);
      if (!school) continue;
      // Update the school record with the new date value
      update(u.schoolId, { ...school, [u.field]: u.value });
      applied.push(`${u.schoolId}::${u.field}`);
    }

    // Tell server to remove applied updates
    await fetch("/api/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applied }),
    });

    setUpdates([]);
    setApplying(false);
  }, [updates, schools, update]);

  const dismiss = useCallback(async () => {
    const applied = updates.map((u) => `${u.schoolId}::${u.field}`);
    await fetch("/api/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applied }),
    });
    setDismissed(true);
    setUpdates([]);
  }, [updates]);

  if (!updates.length || dismissed) return null;

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-blue-800">
            🔔 爬蟲發現 {updates.length} 筆新日期
          </span>
          <span className="text-xs text-blue-500">套用後甘特圖自動更新</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={applyAll}
            disabled={applying}
            className="text-xs rounded-lg px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {applying ? "套用中..." : "全部套用"}
          </button>
          <button
            onClick={dismiss}
            className="text-xs rounded-lg px-3 py-1.5 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
          >
            忽略
          </button>
        </div>
      </div>

      <div className="space-y-1 max-h-40 overflow-y-auto">
        {updates.map((u, i) => {
          const school = schools.find((s) => s.id === u.schoolId);
          return (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="text-blue-400 shrink-0">·</span>
              <span className="text-blue-800 font-medium shrink-0">
                {school?.school ?? u.schoolId}
              </span>
              <span className="text-blue-600 shrink-0">
                {FIELD_LABELS[u.field] ?? u.field}
              </span>
              <span className="text-blue-900 font-mono shrink-0">{u.value}</span>
              <span className="text-blue-400 truncate hidden sm:block">
                — {u.snippet}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
