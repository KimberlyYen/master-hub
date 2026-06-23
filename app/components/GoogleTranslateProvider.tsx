"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  PAGE_LANGUAGE,
  applySavedTranslation,
} from "../lib/googleTranslate";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            autoDisplay?: boolean;
            includedLanguages?: string;
          },
          elementId: string
        ) => void;
      };
    };
  }
}

const SCRIPT_ID = "google-translate-script";

function loadGoogleTranslateScript() {
  if (document.getElementById(SCRIPT_ID)) return;

  window.googleTranslateElementInit = () => {
    if (!window.google?.translate) return;
    new window.google.translate.TranslateElement(
      {
        pageLanguage: PAGE_LANGUAGE,
        autoDisplay: false,
        includedLanguages: "zh-TW,zh-CN,en,ja,ko,vi,th",
      },
      "google_translate_element"
    );
    applySavedTranslation();
  };

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.src =
    "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.body.appendChild(script);
}

export default function GoogleTranslateProvider() {
  const pathname = usePathname();

  useEffect(() => {
    loadGoogleTranslateScript();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(applySavedTranslation, 300);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return <div id="google_translate_element" className="hidden" aria-hidden />;
}
