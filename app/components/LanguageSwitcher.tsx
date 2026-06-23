"use client";

import { useEffect, useState } from "react";
import {
  PAGE_LANGUAGE,
  TRANSLATE_LANGUAGES,
  getTranslateTarget,
  setTranslateTarget,
  type TranslateLanguageCode,
} from "../lib/googleTranslate";

export default function LanguageSwitcher() {
  const [current, setCurrent] = useState<TranslateLanguageCode>(PAGE_LANGUAGE);

  useEffect(() => {
    setCurrent(getTranslateTarget());
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as TranslateLanguageCode;
    setCurrent(next);
    setTranslateTarget(next);
  }

  return (
    <label className="flex items-center gap-1.5 text-xs text-zinc-500">
      <span className="sr-only">語言</span>
      <span aria-hidden className="text-sm leading-none">
        🌐
      </span>
      <select
        value={current}
        onChange={handleChange}
        aria-label="選擇語言"
        className="rounded-md border border-zinc-200 bg-white py-1 pl-2 pr-7 text-xs text-zinc-700 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100"
      >
        {TRANSLATE_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </label>
  );
}
