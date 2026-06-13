"use client";

import { useState, useEffect, useCallback } from "react";

const KEY = "master-hub:preferences";

export type TopPreferences = [string | null, string | null, string | null];

const EMPTY: TopPreferences = [null, null, null];

function load(): TopPreferences {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length !== 3) return EMPTY;
    return parsed.map((v) => (typeof v === "string" ? v : null)) as TopPreferences;
  } catch {
    return EMPTY;
  }
}

function save(prefs: TopPreferences) {
  localStorage.setItem(KEY, JSON.stringify(prefs));
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<TopPreferences>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPreferences(load());
    setLoaded(true);
  }, []);

  const setChoice = useCallback((rank: 0 | 1 | 2, schoolId: string | null) => {
    setPreferences((prev) => {
      const next: TopPreferences = [...prev];
      if (schoolId) {
        for (let i = 0; i < 3; i++) {
          if (i !== rank && next[i] === schoolId) next[i] = null;
        }
      }
      next[rank] = schoolId;
      save(next);
      return next;
    });
  }, []);

  const setChoiceBySchool = useCallback(
    (schoolId: string, rank: 0 | 1 | 2 | null) => {
      if (rank === null) {
        setPreferences((prev) => {
          const next = prev.map((id) => (id === schoolId ? null : id)) as TopPreferences;
          save(next);
          return next;
        });
      } else {
        setChoice(rank, schoolId);
      }
    },
    [setChoice]
  );

  return { preferences, loaded, setChoice, setChoiceBySchool };
}

export function getSchoolRank(
  preferences: TopPreferences,
  schoolId: string
): 0 | 1 | 2 | null {
  const idx = preferences.indexOf(schoolId);
  return idx >= 0 ? (idx as 0 | 1 | 2) : null;
}
