"use client";

import { useState } from "react";

import { branchAccentForArea, uniqueBranches } from "@/lib/domain/teacher-badges";

type TeacherTrustBadgesProps = {
  branches?: string[];
  maxVisible?: number;
  moreLabel?: string;
  showVerified?: boolean;
  size?: "md" | "sm";
  verified?: boolean;
  verifiedLabel?: string;
};

export function TeacherTrustBadges({
  branches = [],
  maxVisible = 3,
  moreLabel,
  showVerified = true,
  size = "sm",
  verified = false,
  verifiedLabel = "Verified teacher",
}: TeacherTrustBadgesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const normalized = uniqueBranches(branches);
  const visible = normalized.slice(0, maxVisible);
  const hiddenCount = normalized.length - visible.length;

  if (!verified && visible.length === 0) return null;

  const textSize = size === "sm" ? "text-[0.62rem]" : "text-xs";
  const pad = size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1";

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {verified && showVerified ? (
          <button
            className={`tap-scale inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-crystal to-indigo-500 ${pad} ${textSize} font-black text-white`}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsOpen(true);
            }}
            type="button"
          >
            <svg aria-hidden="true" className="size-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path d="m5 12 4 4L19 6" />
            </svg>
            {verifiedLabel}
          </button>
        ) : null}
        {visible.map((branch) => (
          <span
            className={`inline-flex rounded-full ring-1 ring-inset ${pad} ${textSize} font-black ${branchAccentForArea(branch)}`}
            key={branch}
          >
            {branch}
          </span>
        ))}
        {hiddenCount > 0 ? (
          <span className={`rounded-full bg-slate-100 ${pad} ${textSize} font-black text-slate-600`}>
            {moreLabel?.replace("{count}", String(hiddenCount)) ?? `+${hiddenCount}`}
          </span>
        ) : null}
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center text-night shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-gradient-to-tr from-crystal to-indigo-600 text-white shadow-lg">
              <svg aria-hidden="true" className="size-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="m5 12 4 4L19 6" />
              </svg>
            </span>
            <h3 className="mt-4 text-lg font-black">Doğrulanmış Öğretmen Sertifikası</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Bu eğitici hesabı Zigo Akademik Güvenlik ekibi tarafından kimlik ve uzmanlık kontrolünden geçirilmiştir.
            </p>
            <div className="my-4 rounded-xl bg-slate-50 p-3 text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="font-bold text-slate-500">Güvenlik Durumu</span>
                <span className="font-black text-emerald-600">✓ Onaylı Öğretmen</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="font-bold text-slate-500">Pedagojik Denetim</span>
                <span className="font-black text-crystal">A+ Güvenli İçerik Üreticisi</span>
              </div>
              <div>
                <span className="font-bold text-slate-500 block mb-1">Uzmanlık Alanları</span>
                <div className="flex flex-wrap gap-1">
                  {normalized.length > 0 ? (
                    normalized.map((b) => (
                      <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[0.68rem] font-bold text-slate-700" key={b}>
                        {b}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">Genel Müfredat</span>
                  )}
                </div>
              </div>
            </div>
            <button
              className="tap-scale w-full rounded-xl bg-night py-3 text-xs font-black text-white"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              Tamam
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
