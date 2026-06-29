"use client";

import { useState, useEffect, useCallback } from "react";
import { useUserStorage } from "../components/UserStorageProvider";
import {
  loadPreferencesForUser,
  savePreferencesForUser,
  type TopPreferences,
} from "./userStorageKey";

export type { TopPreferences };

const EMPTY: TopPreferences = [null, null, null];

export function usePreferences() {
  const { storageKey } = useUserStorage();
  const [preferences, setPreferences] = useState<TopPreferences>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setPreferences(loadPreferencesForUser(storageKey));
    setLoaded(true);
  }, [storageKey]);

  const setChoice = useCallback(
    (rank: 0 | 1 | 2, schoolId: string | null) => {
      setPreferences((prev) => {
        const next: TopPreferences = [...prev];
        if (schoolId) {
          for (let i = 0; i < 3; i++) {
            if (i !== rank && next[i] === schoolId) next[i] = null;
          }
        }
        next[rank] = schoolId;
        savePreferencesForUser(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  const setChoiceBySchool = useCallback(
    (schoolId: string, rank: 0 | 1 | 2 | null) => {
      if (rank === null) {
        setPreferences((prev) => {
          const next = prev.map((id) => (id === schoolId ? null : id)) as TopPreferences;
          savePreferencesForUser(storageKey, next);
          return next;
        });
      } else {
        setChoice(rank, schoolId);
      }
    },
    [setChoice, storageKey]
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
