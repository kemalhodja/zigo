"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";

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
};

export default function DirectMessagesPage() {
  const searchParams = useSearchParams();
  const peerIdParam = searchParams.get("user");

  const [activePeer, setActivePeer] = useState<PeerUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
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
            });
          }
        })
        .catch(() => {
          setActivePeer({
            id: peerIdParam,
            full_name: "Öğretmen / Kurum",
            role: "teacher",
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

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim() || !activePeer || sending) return;

    const content = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: activePeer.id,
          content,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.data) {
        setMessages((prev) => [...prev, data.data]);
      }
    } catch {
      // Revert if error
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-slate-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher"
            className="flex size-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            ←
          </Link>
          <div>
            <h1 className="text-base font-black text-white">
              {activePeer ? activePeer.full_name : "Zigo Direkt Mesajlar"}
            </h1>
            <p className="text-[0.68rem] font-bold text-amber-300">
              {activePeer ? `🎓 Onaylı ${activePeer.role === "teacher" ? "Öğretmen" : "Kurum"}` : "Güvenli İletişim Kutusu"}
            </p>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {!activePeer ? (
          <div className="my-auto text-center space-y-3 py-16">
            <span className="text-5xl">💬</span>
            <h2 className="text-lg font-black text-white">Güvenli Direkt Mesajlaşma</h2>
            <p className="mx-auto max-w-xs text-xs font-semibold text-slate-400 leading-relaxed">
              Öğretmenleriniz veya Eğitim Kurumlarınızla özel ders ve soru takipleri için güvenle mesajlaşabilirsiniz.
            </p>
          </div>
        ) : loading ? (
          <div className="text-center py-12 text-xs text-slate-500 animate-pulse">Sohbet yükleniyor...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400">
            {activePeer.full_name} ile henüz bir mesajınız yok. İlk mesajı siz gönderin!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id !== activePeer.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-sm ${
                    isMe
                      ? "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 rounded-br-none"
                      : "bg-slate-800 text-white border border-slate-700 rounded-bl-none"
                  }`}
                >
                  <p className="leading-relaxed">{msg.content}</p>
                  <span
                    className={`mt-1 block text-[0.6rem] font-bold ${
                      isMe ? "text-slate-900/70 text-right" : "text-slate-400"
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Footer Input Area */}
      {activePeer ? (
        <form onSubmit={handleSendMessage} className="border-t border-slate-800 bg-slate-900 p-3 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`${activePeer.full_name} için mesajınız...`}
            className="flex-1 rounded-xl bg-slate-800 px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="tap-scale flex items-center justify-center rounded-xl bg-amber-400 px-5 text-xs font-black text-slate-950 disabled:opacity-50"
          >
            {sending ? "..." : "Gönder 🚀"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
