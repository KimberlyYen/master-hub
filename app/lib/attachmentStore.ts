"use client";

import { useState, useEffect, useCallback } from "react";

export type Attachment = {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  docIndex?: number; // which requiredDocuments[i] this file belongs to
};

type Store = Record<string, Attachment[]>;

const KEY = "master-hub:attachments";

function readStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function useAttachments(schoolId: string) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    setAttachments(readStore()[schoolId] ?? []);
  }, [schoolId]);

  const add = useCallback(
    (items: Attachment[]) => {
      setAttachments((prev) => {
        const next = [...prev, ...items];
        const store = readStore();
        store[schoolId] = next;
        writeStore(store);
        return next;
      });
    },
    [schoolId]
  );

  const remove = useCallback(
    (id: string, url: string) => {
      // Fire-and-forget: delete the physical file
      fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: url }),
      });

      setAttachments((prev) => {
        const next = prev.filter((a) => a.id !== id);
        const store = readStore();
        store[schoolId] = next;
        writeStore(store);
        return next;
      });
    },
    [schoolId]
  );

  return { attachments, add, remove };
}

export function isImage(type: string, name: string): boolean {
  if (type.startsWith("image/")) return true;
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name);
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
