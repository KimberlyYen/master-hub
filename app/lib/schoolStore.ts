"use client";

import { useState, useEffect, useCallback } from "react";
import { schools as defaultSchools, type School } from "../applications/data";

const KEY = "master-hub:schools";

// Deep-merge new fields from defaults into a stored school.
// - New top-level fields (e.g. brochureDate) are back-filled from defaults if absent.
// - ref115 is deep-merged so any new sub-field (e.g. brochureDate) from defaults
//   is picked up even when ref115 already existed in localStorage.
// - Values the user has already set in localStorage always win.
function mergeWithDefault(stored: School, defaults: School[]): School {
  const def = defaults.find((d) => d.id === stored.id);
  if (!def) return stored;
  return {
    ...stored,
    // One-time name correction: 台北科技大學 → 台灣科技大學
    school: stored.school === '台北科技大學' ? '台灣科技大學' : stored.school,
    brochureDate: stored.brochureDate ?? def.brochureDate,
    ref115: stored.ref115
      ? { ...def.ref115, ...stored.ref115 }
      : def.ref115,
  };
}

export function useSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed: School[] = JSON.parse(raw);
        // Migrate: back-fill ref115 for any school that doesn't have it yet
        const migrated = parsed.map((s) => mergeWithDefault(s, defaultSchools));
        setSchools(migrated);
        // Persist migration result
        localStorage.setItem(KEY, JSON.stringify(migrated));
      } else {
        localStorage.setItem(KEY, JSON.stringify(defaultSchools));
        setSchools(defaultSchools);
      }
    } catch {
      setSchools(defaultSchools);
    }
    setLoaded(true);
  }, []);

  const add = useCallback((data: Omit<School, "id">): School => {
    const school: School = { ...data, id: `s-${Date.now()}-${Math.random().toString(36).slice(2)}` };
    setSchools((prev) => {
      const next = [...prev, school];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
    return school;
  }, []);

  const update = useCallback((id: string, data: Omit<School, "id">) => {
    setSchools((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...data, id } : s));
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setSchools((prev) => {
      const next = prev.filter((s) => s.id !== id);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    localStorage.setItem(KEY, JSON.stringify(defaultSchools));
    setSchools(defaultSchools);
  }, []);

  return { schools, loaded, add, update, remove, reset };
}
