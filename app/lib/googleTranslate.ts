export const PAGE_LANGUAGE = "zh-TW";

export const TRANSLATE_LANGUAGES = [
  { code: "zh-TW", label: "繁體中文" },
  { code: "zh-CN", label: "简体中文" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "th", label: "ภาษาไทย" },
] as const;

export type TranslateLanguageCode = (typeof TRANSLATE_LANGUAGES)[number]["code"];

export function getTranslateTarget(): TranslateLanguageCode {
  if (typeof document === "undefined") return PAGE_LANGUAGE;
  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
  if (!match?.[1]) return PAGE_LANGUAGE;
  const target = decodeURIComponent(match[1]).split("/").filter(Boolean)[1];
  const known = TRANSLATE_LANGUAGES.find((l) => l.code === target);
  return known?.code ?? PAGE_LANGUAGE;
}

export function setTranslateTarget(target: TranslateLanguageCode) {
  const value = target === PAGE_LANGUAGE ? "" : `/${PAGE_LANGUAGE}/${target}`;
  const base = `googtrans=${value};path=/`;
  document.cookie = base;
  if (window.location.hostname !== "localhost") {
    document.cookie = `${base};domain=${window.location.hostname}`;
  }
  window.location.reload();
}

export function applySavedTranslation() {
  const target = getTranslateTarget();
  if (target === PAGE_LANGUAGE) return;
  const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
  if (!select) return;
  if (select.value !== target) {
    select.value = target;
    select.dispatchEvent(new Event("change"));
  }
}
