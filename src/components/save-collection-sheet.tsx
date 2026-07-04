"use client";

import { useEffect, useId } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

export type CollectionFolderId = "lessons" | "reels" | "teachers" | "exam";

type SaveCollectionSheetProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (folderId: CollectionFolderId) => void;
};

export function SaveCollectionSheet({ open, onClose, onSelect }: SaveCollectionSheetProps) {
  const t = useMessages().feedEnhancements;
  const titleId = useId();

  const folders: Array<{ id: CollectionFolderId; label: string }> = [
    { id: "lessons", label: t.collectionLessons },
    { id: "reels", label: t.collectionReels },
    { id: "teachers", label: t.collectionTeachers },
    { id: "exam", label: t.collectionExam },
  ];

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <section className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="safe-bottom mx-auto w-full max-w-md rounded-t-2xl bg-white p-4"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-slate-200" />
        <h3 className="text-sm font-black text-night" id={titleId}>
          {t.saveToCollection}
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {folders.map((folder) => (
            <button
              className="tap-scale rounded-xl border border-violet-100 bg-violet-50 px-3 py-3 text-sm font-black text-crystal"
              key={folder.id}
              onClick={() => onSelect(folder.id)}
              type="button"
            >
              {folder.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function rememberPostCollection(postId: string, folderId: CollectionFolderId) {
  try {
    window.localStorage.setItem(`zigo:collection:${postId}`, folderId);
  } catch {
    // ignore
  }
}
