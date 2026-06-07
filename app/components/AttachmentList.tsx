"use client";

import { useState, useEffect } from "react";
import { isImage, formatSize, type Attachment } from "../lib/attachmentStore";

// ── Lightbox ──────────────────────────────────────────────────────────────────

export function AttachmentLightbox({
  images,
  index,
  onClose,
  onNav,
}: {
  images: Attachment[];
  index: number;
  onClose: () => void;
  onNav: (i: number) => void;
}) {
  const current = images[index];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNav(Math.max(0, index - 1));
      if (e.key === "ArrowRight") onNav(Math.min(images.length - 1, index + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onNav]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center max-w-5xl max-h-screen p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white/70 hover:text-white text-2xl leading-none z-10"
        >
          ✕
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.name}
          className="max-w-full max-h-[82vh] object-contain rounded shadow-2xl"
        />
        <p className="mt-3 text-white/70 text-sm text-center">
          {current.name}
          <span className="ml-2 text-white/40">{formatSize(current.size)}</span>
        </p>
        {images.length > 1 && (
          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={() => onNav(Math.max(0, index - 1))}
              disabled={index === 0}
              className="text-white/60 hover:text-white disabled:opacity-20 text-xl px-2"
            >
              ‹
            </button>
            <span className="text-white/50 text-xs">
              {index + 1} / {images.length}
            </span>
            <button
              onClick={() => onNav(Math.min(images.length - 1, index + 1))}
              disabled={index === images.length - 1}
              className="text-white/60 hover:text-white disabled:opacity-20 text-xl px-2"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inline list (doc checklist) ───────────────────────────────────────────────

export function AttachmentInlineList({ files }: { files: Attachment[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const images = files.filter((f) => isImage(f.type, f.name));

  if (!files.length) return null;

  return (
    <>
      <ul className="ml-6 space-y-1.5">
        {files.map((f) => {
          const imgIdx = images.indexOf(f);
          const img = imgIdx >= 0;

          return (
            <li key={f.id} className="flex items-center gap-2 min-w-0">
              {img ? (
                <button
                  type="button"
                  onClick={() => setLightboxIndex(imgIdx)}
                  className="shrink-0 w-9 h-9 rounded border border-zinc-200 overflow-hidden bg-zinc-100 hover:opacity-80 transition-opacity"
                  title="檢視圖片"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url} alt="" className="w-full h-full object-cover" />
                </button>
              ) : (
                <span className="shrink-0 w-9 h-9 flex items-center justify-center rounded border border-zinc-200 bg-red-50 text-base">
                  📄
                </span>
              )}
              <span className="flex-1 min-w-0 text-xs text-zinc-500 truncate" title={f.name}>
                {f.name}
              </span>
              <span className="shrink-0 text-xs text-zinc-300">{formatSize(f.size)}</span>
              {img ? (
                <button
                  type="button"
                  onClick={() => setLightboxIndex(imgIdx)}
                  className="shrink-0 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  檢視
                </button>
              ) : (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  檢視
                </a>
              )}
            </li>
          );
        })}
      </ul>
      {lightboxIndex !== null && (
        <AttachmentLightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNav={setLightboxIndex}
        />
      )}
    </>
  );
}
