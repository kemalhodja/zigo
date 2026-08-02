"use client";

import { useState } from "react";
import { AdminBroadcastDialog } from "./admin-broadcast-dialog";

export function AdminBroadcastButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-crystal px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:brightness-95"
      >
        <span>📣</span>
        <span>Toplu Duyuru Yayınla</span>
      </button>

      {open ? <AdminBroadcastDialog onClose={() => setOpen(false)} /> : null}
    </>
  );
}
