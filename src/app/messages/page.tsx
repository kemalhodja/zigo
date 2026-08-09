"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { VerifiedBadge } from "@/components/verified-badge";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  media_url?: string | null;
  created_at: string;
};

type PeerUser = {
  id: string;
  full_name: string;
  role: string;
  avatar_url?: string | null;
  is_verified?: boolean;
};

const QUICK_TEMPLATES = [
  "🎓 Özel ders müsaitliğiniz ve detaylar hakkında bilgi alabilir miyim?",
  "📚 Soru çözüm grubunuz hakkında bilgi verebilir misiniz?",
  "⏰ Haftalık ders saatleriniz ve takviminiz nasıl?",
  "💡 YKS/LGS Hazırlık Kampınız aktif mi?",
];

export default function DirectMessagesPage() {
  const searchParams = useSearchParams();
  const peerIdParam = searchParams.get("user");

  const [activePeer, setActivePeer] = useState<PeerUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch peer profile info if URL has ?user=
  useEffect(() => {
    if (peerIdParam) {
      fetch(`/api/profiles/select/${peerIdParam}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setActivePeer({
              id: data.data.id,
              full_name: data.data.full_name || "Öğretmen / Kurum",
              role: data.data.role || "teacher",
              avatar_url: data.data.avatar_url,
              is_verified: true,
            });
          }
        })
        .catch(() => {
          setActivePeer({
            id: peerIdParam,
            full_name: "Öğretmen / Kurum",
            role: "teacher",
            is_verified: true,
          });
        });
    }
  }, [peerIdParam]);

  // Fetch conversation messages
  useEffect(() => {
    if (activePeer?.id) {
      setLoading(true);
      fetch(`/api/messages?peerId=${activePeer.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data && Array.isArray(data.data)) {
            setMessages(data.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [activePeer?.id]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleFileUpload(file: File) {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/profile/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (data.data?.avatarUrl) {
        setMediaUrl(data.data.avatarUrl);
      }
    } catch {
      // Error handling
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSendMessage(e?: React.FormEvent, overrideText?: string) {
    if (e) e.preventDefault();

    const textToSend = overrideText || inputText;
    if ((!textToSend.trim() && !mediaUrl) || !activePeer || sending) return;

    const content = textToSend.trim();
    if (!overrideText) setInputText("");
    const currentMedia = mediaUrl;
    setMediaUrl(null);
    setSending(true);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: activePeer.id,
          content,
          mediaUrl: currentMedia || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.data) {
        setMessages((prev) => [...prev, data.data]);
      }
    } catch {
      // Revert
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-950 text-white overflow-hidden">
      {/* Sidebar - Recent Conversations */}
      <aside className="hidden md:flex w-80 flex-col border-r border-slate-800 bg-slate-900/90">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-black text-white flex items-center gap-2">
            <span>💬 Mesajlar</span>
            <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[0.65rem] font-bold text-amber-300">Güvenli DM</span>
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {activePeer ? (
            <div className="flex items-center gap-3 rounded-2xl bg-slate-800 p-3 border border-amber-400/30">
              <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-slate-700">
                {activePeer.avatar_url ? (
                  <img src={activePeer.avatar_url} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center font-black text-amber-400">
                    {activePeer.full_name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 truncate">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black text-white truncate">{activePeer.full_name}</span>
                  <VerifiedBadge size="sm" />
                </div>
                <p className="text-[0.65rem] text-amber-300 font-medium">Sohbet Aktif</p>
              </div>
            </div>
          ) : (
            <p className="p-4 text-xs text-slate-500 text-center">Aktif bir sohbet bulunmuyor.</p>
          )}
        </div>
      </aside>

      {/* Main Chat Panel */}
      <section className="flex-1 flex flex-col bg-slate-950">
        {/* Chat Header */}
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link
              href="/teacher"
              className="md:hidden flex size-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              ←
            </Link>
            {activePeer ? (
              <div className="flex items-center gap-3">
                <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-slate-800 border border-slate-700">
                  {activePeer.avatar_url ? (
                    <img src={activePeer.avatar_url} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center font-black text-amber-400">
                      {activePeer.full_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-sm font-black text-white">{activePeer.full_name}</h1>
                    <VerifiedBadge size="sm" />
                  </div>
                  <p className="text-[0.65rem] font-bold text-emerald-400 flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Onaylı {activePeer.role === "teacher" ? "Öğretmen" : "Kurum"} · Çevrimiçi</span>
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-sm font-black text-white">Zigo Güvenli İletişim Kutusu</h1>
                <p className="text-[0.65rem] text-slate-400">Öğretmen & Kurum DM Mesajlaşma</p>
              </div>
            )}
          </div>
        </header>

        {/* Chat Messages Flow */}
        <main className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {!activePeer ? (
            <div className="my-auto text-center space-y-4 py-20">
              <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-amber-400/10 text-3xl text-amber-400 border border-amber-400/20">
                💬
              </div>
              <h2 className="text-lg font-black text-white">Güvenli Direkt Mesajlaşma</h2>
              <p className="mx-auto max-w-sm text-xs font-semibold text-slate-400 leading-relaxed">
                Öğretmenleriniz ve Eğitim Kurumlarınızla özel ders, soru çözümü ve rehberlik takipleri için güvenle mesajlaşın.
              </p>
            </div>
          ) : loading ? (
            <div className="text-center py-16 text-xs text-slate-500 animate-pulse">Sohbet verileri yükleniyor...</div>
          ) : messages.length === 0 ? (
            <div className="space-y-4 py-8">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center">
                <p className="text-xs font-bold text-amber-300">👋 {activePeer.full_name} ile Sohbete Başlayın</p>
                <p className="mt-1 text-[0.7rem] text-slate-400">Hızlı şablon mesajlardan birini seçerek anında mesaj gönderebilirsiniz:</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {QUICK_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(undefined, tmpl)}
                    className="tap-scale rounded-xl border border-slate-800 bg-slate-900 p-3 text-left text-xs font-semibold text-slate-300 transition hover:border-amber-400/50 hover:bg-slate-800"
                  >
                    {tmpl}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id !== activePeer.id;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl p-3 text-xs font-semibold shadow-md transition-all ${
                      isMe
                        ? "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 rounded-br-none"
                        : "bg-slate-900 text-white border border-slate-800 rounded-bl-none"
                    }`}
                  >
                    {msg.media_url ? (
                      <div className="mb-2 overflow-hidden rounded-xl bg-slate-950 border border-slate-800">
                        <img src={msg.media_url} alt="Ekli Görsel" className="max-h-48 w-full object-cover" />
                      </div>
                    ) : null}
                    <p className="leading-relaxed">{msg.content}</p>
                    <div className="mt-1 flex items-center justify-end gap-1">
                      <span className={`text-[0.6rem] font-bold ${isMe ? "text-slate-900/70" : "text-slate-400"}`}>
                        {new Date(msg.created_at).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isMe ? <span className="text-[0.65rem] font-black text-slate-900">✓✓</span> : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Footer Input & Attachment Bar */}
        {activePeer ? (
          <form onSubmit={(e) => handleSendMessage(e)} className="border-t border-slate-800 bg-slate-900/90 p-3 space-y-2">
            {mediaUrl ? (
              <div className="flex items-center gap-2 rounded-xl bg-slate-800 p-2 border border-amber-400/40">
                <img src={mediaUrl} alt="" className="size-8 rounded-lg object-cover" />
                <span className="flex-1 text-[0.68rem] font-bold text-amber-300 truncate">Fotoğraf/Soru Eklendi</span>
                <button type="button" onClick={() => setMediaUrl(null)} className="text-xs text-slate-400 hover:text-white px-2">
                  ✕
                </button>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <label className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-slate-800 text-slate-400 transition hover:bg-slate-700 hover:text-white">
                <span className="text-base">📸</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                />
              </label>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`${activePeer.full_name} için mesajınız...`}
                className="flex-1 rounded-xl bg-slate-800 px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-400"
              />

              <button
                type="submit"
                disabled={(!inputText.trim() && !mediaUrl) || sending || isUploading}
                className="tap-scale flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-md disabled:opacity-50"
              >
                {sending ? "..." : "Gönder 🚀"}
              </button>
            </div>
          </form>
        ) : null}
      </section>
    </div>
  );
}
