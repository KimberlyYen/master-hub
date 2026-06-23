"use client";

import { useState, useEffect, useCallback } from "react";
import type { ScrapeResult } from "../api/scrape/route";

const CONFIG_KEY = "master-hub:tracking:config";
const HISTORY_KEY = "master-hub:tracking:history";

export type TrackingConfig = {
  intervalDays: number;   // 爬取間隔（天）
  runHour: number;        // 排程執行時刻（0–23，台灣時間）
  autoRun: boolean;       // 頁面載入時自動爬取
  lastRun?: string;       // ISO date of last scrape
};

export type ScrapeRun = {
  ranAt: string;
  results: ScrapeResult[];
};

const DEFAULT_CONFIG: TrackingConfig = {
  intervalDays: 30,
  runHour: 9,
  autoRun: true,
};

function clampRunHour(hour: unknown): number {
  const n = typeof hour === "number" && !Number.isNaN(hour) ? Math.floor(hour) : DEFAULT_CONFIG.runHour;
  return Math.max(0, Math.min(23, n));
}

function loadConfig(): TrackingConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<TrackingConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      runHour: clampRunHour(parsed.runHour),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function loadHistory(): ScrapeRun[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(runs: ScrapeRun[]) {
  // Keep last 10 runs
  localStorage.setItem(HISTORY_KEY, JSON.stringify(runs.slice(-10)));
}

export function isDue(config: TrackingConfig): boolean {
  if (!config.lastRun) return true;
  const next = nextRunDate(config);
  return next ? Date.now() >= next.getTime() : true;
}

export function nextRunDate(config: TrackingConfig): Date | null {
  if (!config.lastRun) return null;
  const hour = clampRunHour(config.runHour);
  const next = new Date(config.lastRun);
  next.setDate(next.getDate() + config.intervalDays);
  next.setHours(hour, 0, 0, 0);
  return next;
}

export function useTracking() {
  const [config, setConfig] = useState<TrackingConfig>(DEFAULT_CONFIG);
  const [history, setHistory] = useState<ScrapeRun[]>([]);
  const [running, setRunning] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [runMessage, setRunMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setConfig(loadConfig());
    setHistory(loadHistory());
    setLoaded(true);
  }, []);

  const saveConfig = useCallback((next: TrackingConfig) => {
    setConfig(next);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
  }, []);

  const runScrape = useCallback(
    async (schoolIds?: string[]): Promise<ScrapeRun | null> => {
      if (running) return null;
      setRunning(true);
      setRunMessage(null);
      try {
        const res = await fetch(
          schoolIds ? "/api/scrape" : "/api/notify",
          schoolIds
            ? {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ schoolIds }),
              }
            : { method: "POST" }
        );
        const data = await res.json();
        if (!res.ok) {
          setRunMessage({ ok: false, text: data.error ?? "爬取失敗" });
          return null;
        }
        const run: ScrapeRun = {
          ranAt: data.ranAt ?? new Date().toISOString(),
          results: data.results,
        };
        setHistory((prev) => {
          const next = [...prev, run];
          saveHistory(next);
          return next;
        });
        const next = { ...config, lastRun: run.ranAt };
        saveConfig(next);
        if (data.errors?.length) {
          setRunMessage({
            ok: false,
            text: `爬取完成，但通知有部分失敗：${data.errors.join("；")}`,
          });
        } else {
          setRunMessage({ ok: true, text: "✓ 爬取完成，已發送通知" });
        }
        return run;
      } catch {
        setRunMessage({ ok: false, text: "爬取失敗，請稍後再試" });
        return null;
      } finally {
        setRunning(false);
      }
    },
    [running, config, saveConfig]
  );

  const latestRun = history[history.length - 1] ?? null;

  return {
    config,
    saveConfig,
    history,
    latestRun,
    running,
    loaded,
    runScrape,
    runMessage,
    isDue: loaded ? isDue(config) : false,
  };
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "剛剛";
  if (mins < 60) return `${mins} 分鐘前`;
  if (hours < 24) return `${hours} 小時前`;
  return `${days} 天前`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
