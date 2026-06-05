"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  useAttachments,
  isImage,
  formatSize,
  type Attachment,
} from "../lib/attachmentStore";

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({
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
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white/70 hover:text-white text-2xl leading-none z-10"
        >
          ✕
        </button>

        {/* Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.name}
          className="max-w-full max-h-[82vh] object-contain rounded shadow-2xl"
        />

        {/* Caption */}
        <p className="mt-3 text-white/70 text-sm text-center">
          {current.name}
          <span className="ml-2 text-white/40">{formatSize(current.size)}</span>
        </p>

        {/* Navigation */}
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

// ── Upload zone ───────────────────────────────────────────────────────────────

function UploadZone({
  onFiles,
  uploading,
}: {
  onFiles: (files: FileList) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 cursor-pointer transition-colors text-xs
        ${dragging
          ? "border-blue-400 bg-blue-50 text-blue-600"
          : uploading
          ? "border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed"
          : "border-zinc-200 text-zinc-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/40"
        }`}
    >
      <span className="text-base">{uploading ? "⏳" : "＋"}</span>
      <span>{uploading ? "上傳中..." : "上傳附件（圖片 / PDF）"}</span>
      <span className="text-zinc-300">或拖放至此</span>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf"
        className="hidden"
        disabled={uploading}
        onChange={(e) => e.target.files && onFiles(e.target.files)}
      />
    </div>
  );
}

// ── File card ─────────────────────────────────────────────────────────────────

function FileCard({
  attachment,
  onView,
  onDelete,
}: {
  attachment: Attachment;
  onView?: () => void;
  onDelete: () => void;
}) {
  const img = isImage(attachment.type, attachment.name);
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <div className="group relative rounded-lg border border-zinc-200 overflow-hidden bg-white">
      {img ? (
        // Image thumbnail
        <button
          onClick={onView}
          className="block w-full aspect-[4/3] overflow-hidden bg-zinc-100 hover:opacity-90 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachment.url}
            alt={attachment.name}
            className="w-full h-full object-cover"
          />
        </button>
      ) : (
        // PDF / other file
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center w-full aspect-[4/3] bg-red-50 hover:bg-red-100 transition-colors"
        >
          <span className="text-3xl mb-1">📄</span>
          <span className="text-xs text-zinc-500 text-center px-2 line-clamp-2">
            {attachment.name}
          </span>
        </a>
      )}

      {/* Footer */}
      <div className="px-2 py-1.5">
        <p className="text-xs text-zinc-500 truncate" title={attachment.name}>
          {attachment.name}
        </p>
        <p className="text-xs text-zinc-300">{formatSize(attachment.size)}</p>
      </div>

      {/* Delete overlay */}
      {confirmDel ? (
        <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center gap-2 text-xs">
          <p className="text-zinc-700 font-medium">確定刪除？</p>
          <div className="flex gap-2">
            <button
              onClick={onDelete}
              className="rounded px-2 py-1 bg-red-500 text-white hover:bg-red-600"
            >
              刪除
            </button>
            <button
              onClick={() => setConfirmDel(false)}
              className="rounded px-2 py-1 bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDel(true)}
          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white text-xs items-center justify-center hidden group-hover:flex hover:bg-red-500 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FileAttachments({ schoolId }: { schoolId: string }) {
  const { attachments, add, remove } = useAttachments(schoolId);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const imageAttachments = attachments.filter((a) =>
    isImage(a.type, a.name)
  );

  const handleUpload = useCallback(
    async (files: FileList) => {
      setUploading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("schoolId", schoolId);
        for (const file of Array.from(files)) {
          formData.append("files", file);
        }
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "上傳失敗");
          return;
        }
        add(
          (data.files as { name: string; url: string; storageKey?: string; type: string; size: number }[]).map(
            (f) => ({
              id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: f.name,
              url: f.url,
              storageKey: f.storageKey,
              type: f.type,
              size: f.size,
              uploadedAt: new Date().toISOString(),
            })
          )
        );
      } catch {
        setError("網路錯誤，請重試");
      } finally {
        setUploading(false);
      }
    },
    [schoolId, add]
  );

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        附件 {attachments.length > 0 && `(${attachments.length})`}
      </p>

      {attachments.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {attachments.map((a) => {
            const imgIdx = imageAttachments.indexOf(a);
            return (
              <FileCard
                key={a.id}
                attachment={a}
                onView={imgIdx >= 0 ? () => setLightboxIndex(imgIdx) : undefined}
                onDelete={() => remove(a.id, a.url, a.storageKey)}
              />
            );
          })}
        </div>
      )}

      <UploadZone onFiles={handleUpload} uploading={uploading} />

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          images={imageAttachments}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNav={setLightboxIndex}
        />
      )}
    </div>
  );
}
