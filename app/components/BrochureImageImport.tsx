"use client";

import { useRef, useState } from "react";
import {
  parseBrochureText,
  parsedToFormPatch,
  type BrochureFormPatch,
  type ParsedBrochure,
} from "../lib/brochureParser";

type Props = {
  onApply: (patch: BrochureFormPatch) => void;
};

const MAX_SIZE = 12 * 1024 * 1024;

export default function BrochureImageImport({ onApply }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "reading" | "done" | "error">("idle");
  const [parsed, setParsed] = useState<ParsedBrochure | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("請上傳圖片檔（JPG、PNG、WebP 等）");
      setStatus("error");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("圖片大小請在 12MB 以內");
      setStatus("error");
      return;
    }

    setError(null);
    setParsed(null);
    setShowRaw(false);
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
    setStatus("reading");
    setProgress(0);

    try {
      const Tesseract = (await import("tesseract.js")).default;
      const { data } = await Tesseract.recognize(file, "chi_tra+eng", {
        logger: (m) => {
          if (m.status === "recognizing text" && typeof m.progress === "number") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const result = parseBrochureText(data.text);
      if (!result.fields.length) {
        setError("無法從圖片讀取有效資料，請確認圖片清晰或改用手動輸入。");
        setStatus("error");
        return;
      }

      setParsed(result);
      setStatus("done");
    } catch {
      setError("讀取圖片失敗，請換一張較清晰的招簡截圖再試。");
      setStatus("error");
    }
  }

  function handleApply() {
    if (!parsed) return;
    onApply(parsedToFormPatch(parsed));
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileName(null);
    setParsed(null);
    setProgress(0);
    setStatus("idle");
    setError(null);
    setShowRaw(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/50 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-700">從招簡圖片讀取資料</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            上傳招生簡章截圖，自動辨識學校、日期、配分等欄位（本機 OCR，不上傳至雲端）
          </p>
        </div>
        {(status === "done" || status === "error") && (
          <button
            type="button"
            onClick={reset}
            className="text-xs text-zinc-500 hover:text-zinc-700"
          >
            清除
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={status === "reading"}
          className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50 transition-colors"
        >
          {status === "reading" ? `辨識中… ${progress}%` : "選擇招簡圖片"}
        </button>
        {fileName && (
          <span className="text-xs text-zinc-500 truncate max-w-[12rem]">{fileName}</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="招簡預覽"
          className="max-h-40 rounded-lg border border-zinc-200 object-contain bg-white"
        />
      )}

      {error && (
        <p className="text-xs text-red-600 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
          {error}
        </p>
      )}

      {parsed && status === "done" && (
        <div className="space-y-3 rounded-lg border border-green-200 bg-white p-3">
          <p className="text-xs font-semibold text-green-700">
            讀取到 {parsed.fields.length} 項資料
          </p>
          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
            {parsed.fields.map((f) => (
              <li key={f.key} className="text-xs text-zinc-600">
                <span className="font-medium text-zinc-700">{f.label}：</span>
                {f.value}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleApply}
              className="rounded-lg px-3 py-1.5 text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              套用至表單
            </button>
            <button
              type="button"
              onClick={() => setShowRaw((v) => !v)}
              className="text-xs text-zinc-500 hover:text-zinc-700"
            >
              {showRaw ? "隱藏原文" : "查看 OCR 原文"}
            </button>
          </div>
          {showRaw && (
            <pre className="text-[10px] leading-relaxed text-zinc-500 whitespace-pre-wrap max-h-40 overflow-y-auto rounded bg-zinc-50 p-2 border border-zinc-100">
              {parsed.rawText || "（無文字）"}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
