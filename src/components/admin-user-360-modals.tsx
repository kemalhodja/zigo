"use client";

import React from "react";

type AdminGrantPlusModalProps = {
  isOpen: boolean;
  userName: string;
  grantDays: number;
  grantNote: string;
  isGranting: boolean;
  onChangeDays: (days: number) => void;
  onChangeNote: (note: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function AdminGrantPlusModal({
  isOpen,
  userName,
  grantDays,
  grantNote,
  isGranting,
  onChangeDays,
  onChangeNote,
  onClose,
  onSubmit,
}: AdminGrantPlusModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
        <h3 className="text-base font-black text-slate-900">
          💎 Kullanıcıya Zigo Plus Hediye Et
        </h3>
        <p className="text-xs font-bold text-slate-500">
          {userName} kullanıcısına ücretsiz Zigo Plus tanımlayın.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Süre Seçin
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { days: 7, label: "7 Gün" },
                { days: 30, label: "1 Ay" },
                { days: 90, label: "3 Ay" },
                { days: 365, label: "1 Yıl" },
              ].map((item) => (
                <button
                  key={item.days}
                  type="button"
                  onClick={() => onChangeDays(item.days)}
                  className={`rounded-xl py-2 text-xs font-black transition ${
                    grantDays === item.days
                      ? "bg-amber-400 text-slate-950 shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Açıklama / Hediye Nedeni
            </label>
            <input
              type="text"
              value={grantNote}
              onChange={(e) => onChangeNote(e.target.value)}
              placeholder="Örn: Quiz birinciliği ödülü / Veli desteği"
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-900 focus:border-crystal focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isGranting}
              className="rounded-xl bg-amber-400 px-5 py-2 text-xs font-black text-slate-950 hover:bg-amber-300 transition shadow-sm disabled:opacity-50"
            >
              {isGranting ? "Tanımlanıyor..." : "Zigo Plus Tanımla"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type AdminSendMessageModalProps = {
  isOpen: boolean;
  msgTitle: string;
  msgBody: string;
  isSendingMsg: boolean;
  onChangeTitle: (title: string) => void;
  onChangeBody: (body: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function AdminSendMessageModal({
  isOpen,
  msgTitle,
  msgBody,
  isSendingMsg,
  onChangeTitle,
  onChangeBody,
  onClose,
  onSubmit,
}: AdminSendMessageModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
        <h3 className="text-base font-black text-slate-900">
          ✉️ Kullanıcıya Özel Bildirim Gönder
        </h3>
        <p className="text-xs font-bold text-slate-500">
          Bu mesaj kullanıcının Zigo Gelen Kutusu&apos;na ve telefonuna anında Push bildirimi olarak iletilir.
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Başlık
            </label>
            <input
              type="text"
              value={msgTitle}
              onChange={(e) => onChangeTitle(e.target.value)}
              placeholder="Örn: Öğrenci Belgeniz Onaylandı!"
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-900 focus:border-crystal focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Mesaj Metni
            </label>
            <textarea
              value={msgBody}
              onChange={(e) => onChangeBody(e.target.value)}
              placeholder="Kullanıcıya iletmek istediğiniz detaylı mesaj..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 focus:border-crystal focus:outline-none"
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSendingMsg}
              className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-black text-white hover:bg-slate-800 transition shadow-sm disabled:opacity-50"
            >
              {isSendingMsg ? "Gönderiliyor..." : "Mesajı İlet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
