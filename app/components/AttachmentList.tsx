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

// ── Row「檢視」按鈕（必繳文件列） ─────────────────────────────────────────────

export function AttachmentViewButton({ files }: { files: Attachment[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const images = files.filter((f) => isImage(f.type, f.name));

  if (!files.length) return null;

  function viewFile(file: Attachment) {
    setMenuOpen(false);
    if (isImage(file.type, file.name)) {
      setLightboxIndex(images.indexOf(file));
    } else {
      window.open(file.url, "_blank", "noopener,noreferrer");
    }
  }

  function handleClick() {
    if (files.length === 1) {
      viewFile(files[0]);
    } else {
      setMenuOpen((v) => !v);
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={handleClick}
        className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 bg-blue-50 rounded-full px-2 py-0.5 transition-colors"
      >
        檢視{files.length > 1 ? ` (${files.length})` : ""}
      </button>
      {menuOpen && files.length > 1 && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
          <ul className="absolute right-0 top-full mt-1 z-40 min-w-[160px] max-w-[220px] rounded-lg border border-zinc-200 bg-white shadow-lg py-1">
            {files.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => viewFile(f)}
                  className="w-full text-left px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 truncate"
                  title={f.name}
                >
                  {f.name}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {lightboxIndex !== null && (
        <AttachmentLightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNav={setLightboxIndex}
        />
      )}
    </div>
  );
}
