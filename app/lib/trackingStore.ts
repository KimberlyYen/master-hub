"use client";

import { useState, useEffect, useCallback } from "react";
import type { ScrapeResult } from "../api/scrape/route";

const CONFIG_KEY = "master-hub:tracking:config";
const HISTORY_KEY = "master-hub:tracking:history";

export type TrackingConfig = {
  intervalDays: number;   // 爬取間隔（天）
  autoRun: boolean;       // 頁面載入時自動爬取
  lastRun?: string;       // ISO date of last scrape
};

export type ScrapeRun = {
  ranAt: string;
  results: ScrapeResult[];
};

const DEFAULT_CONFIG: TrackingConfig = {
  intervalDays: 30,
  autoRun: true,
};

function loadConfig(): TrackingConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
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
  const ms = config.intervalDays * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(config.lastRun).getTime() >= ms;
}

export function nextRunDate(config: TrackingConfig): Date | null {
  if (!config.lastRun) return null;
  const ms = config.intervalDays * 24 * 60 * 60 * 1000;
  return new Date(new Date(config.lastRun).getTime() + ms);
}

export function useTracking() {
  const [config, setConfig] = useState<TrackingConfig>(DEFAULT_CONFIG);
  const [history, setHistory] = useState<ScrapeRun[]>([]);
  const [running, setRunning] = useState(false);
  const [loaded, setLoaded] = useState(false);

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
      try {
        const res = await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(schoolIds ? { schoolIds } : {}),
        });
        const data = await res.json();
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
        return run;
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
