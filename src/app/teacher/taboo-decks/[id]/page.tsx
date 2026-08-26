"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast-system";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TabooDeckCards({ params }: { params: { id: string } }) {
  const [deck, setDeck] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newWord, setNewWord] = useState("");
  const [newForbidden, setNewForbidden] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();
  const toast = useToast();

  useEffect(() => {
    fetchDeckAndCards();
  }, [params.id]);

  const fetchDeckAndCards = async () => {
    const { data, error }: any = await supabase
      .from("taboo_custom_decks" as any)
      .select("*")
      .eq("id", params.id)
      .single();

    if (deckError || !deckData) {
      toast.error("Deste bulunamadı!");
      setLoading(false);
      return;
    }
    setDeck(deckData);

    const { data, error }: any = await supabase
      .from("taboo_custom_cards" as any)
      .select("*")
      .eq("deck_id", params.id)
      .order("created_at", { ascending: false });

    if (!cardsError && cardsData) {
      setCards(cardsData);
    }
    setLoading(false);
  };

  const addCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newForbidden.trim() || !newDesc.trim()) {
      toast.error("Lütfen tüm alanları doldurun.");
      return;
    }

    setIsSubmitting(true);
    
    // Parse forbidden words (comma separated)
    const forbiddenList = newForbidden.split(",").map(w => w.trim().toUpperCase()).filter(w => w);

    const { error } = await supabase
      .from("taboo_custom_cards" as any)
      .insert({
        deck_id: params.id,
        word: newWord.trim().toUpperCase(),
        forbidden_words: forbiddenList,
        ai_descriptions: [newDesc.trim()] // For simplicity, we just use one custom description typed by teacher
      });

    setIsSubmitting(false);

    if (error) {
      toast.error("Kart eklenirken bir hata oluştu.");
      console.error(error);
    } else {
      toast.success("Kart başarıyla eklendi!");
      setNewWord("");
      setNewForbidden("");
      setNewDesc("");
      fetchDeckAndCards();
    }
  };

  const deleteCard = async (id: string) => {
    if (!confirm("Bu kartı silmek istediğinize emin misiniz?")) return;
    
    const { error } = await supabase.from("taboo_custom_cards" as any).delete().eq("id", id);
    if (error) {
      toast.error("Silme işlemi başarısız.");
    } else {
      toast.success("Kart silindi.");
      setCards(prev => prev.filter(c => c.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <h2 className="text-2xl font-black text-slate-800">Deste bulunamadı veya yetkiniz yok.</h2>
        <Link href="/teacher/taboo-decks" className="text-violet-600 font-bold mt-4 inline-block hover:underline">
          Geri Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/teacher/taboo-decks" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[0.65rem] font-black uppercase tracking-wider text-violet-600 bg-violet-100 px-2 py-1 rounded-md">
                {deck.category}
              </span>
              <span className="text-xs font-black text-slate-500">Kod: <strong className="text-slate-800">{deck.code}</strong></span>
            </div>
            <h1 className="text-2xl font-black text-slate-800">{deck.title}</h1>
          </div>
        </div>
        <div className="bg-emerald-50 text-emerald-600 font-black text-sm px-4 py-2 rounded-xl border border-emerald-200">
          {cards.length} Kart
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Yeni Kart Formu */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-violet-100 sticky top-8">
            <h2 className="text-xl font-black text-slate-800 mb-4">Yeni Kelime Ekle</h2>
            <form onSubmit={addCard} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Hedef Kelime</label>
                <input 
                  type="text" 
                  value={newWord}
                  onChange={e => setNewWord(e.target.value)}
                  placeholder="Örn: FOTOSENTEZ"
                  className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold focus:outline-none focus:border-violet-500 uppercase"
                  maxLength={30}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Yasaklı Kelimeler (Virgülle ayırın)</label>
                <textarea 
                  value={newForbidden}
                  onChange={e => setNewForbidden(e.target.value)}
                  placeholder="Güneş, Bitki, Işık, Besin, Oksijen"
                  className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold focus:outline-none focus:border-violet-500 min-h-[100px] resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Yapay Zeka (AI) İçin Tanım Cümlesi</label>
                <textarea 
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Yeşil yapraklı canlıların kendi enerjilerini üretmek için yaptığı yaşamsal işlemdir."
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-violet-500 min-h-[100px] resize-none text-slate-700"
                />
                <p className="text-[0.65rem] font-bold text-slate-400 mt-1">Öğrenci oyunu oynarken Zigo AI kelimeyi bu cümle ile tarif edecek.</p>
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-violet-600 text-white font-black py-3 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Kartı Ekle"}
              </button>
            </form>
          </div>
        </div>

        {/* Kart Listesi */}
        <div className="md:col-span-2">
          {cards.length === 0 ? (
             <div className="bg-slate-50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 h-full flex flex-col items-center justify-center">
                <span className="text-4xl mb-4 block">📭</span>
                <h3 className="text-lg font-black text-slate-700 mb-2">Deste şu an boş</h3>
                <p className="text-slate-500 font-bold text-sm">Soldaki formu kullanarak kelime eklemeye başlayın.</p>
             </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {cards.map(card => (
                <div key={card.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 relative group">
                  <button 
                    onClick={() => deleteCard(card.id)}
                    className="absolute top-3 right-3 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Sil"
                  >
                    ✖
                  </button>
                  <h3 className="text-xl font-black text-violet-700 mb-3 border-b border-slate-100 pb-2">{card.word}</h3>
                  <div className="mb-4">
                    <p className="text-[0.6rem] font-black text-amber-500 uppercase mb-1">Yasaklı Kelimeler</p>
                    <div className="flex flex-wrap gap-1">
                      {card.forbidden_words.map((fw: string, i: number) => (
                        <span key={i} className="text-[0.65rem] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {fw}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[0.6rem] font-black text-slate-400 uppercase mb-1">Zigo AI Tanımı</p>
                    <p className="text-xs font-bold text-slate-600 line-clamp-3 italic">
                      "{card.ai_descriptions?.[0]}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
