"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function TeacherTabooDecks() {
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Fen Bilimleri");
  
  const supabase = createClient();

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("taboo_custom_decks")
      .select("*")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Desteler yüklenemedi.");
    } else {
      setDecks(data || []);
    }
    setLoading(false);
  };

  const createDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Generate random short code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error } = await supabase
      .from("taboo_custom_decks")
      .insert({
        teacher_id: user.id,
        title: newTitle,
        category: newCategory,
        code
      });

    if (error) {
      toast.error("Deste oluşturulurken bir hata oluştu.");
    } else {
      toast.success("Deste başarıyla oluşturuldu!");
      setNewTitle("");
      fetchDecks();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Özel Tabu Desteleri</h1>
          <p className="text-slate-500 font-bold mt-1">Sınıfınız için kendi kelime destelerinizi oluşturun.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Yeni Deste Formu */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-violet-100">
            <h2 className="text-xl font-black text-slate-800 mb-4">Yeni Deste Oluştur</h2>
            <form onSubmit={createDeck} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Deste Başlığı</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Örn: 5. Sınıf Fotosentez"
                  className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Kategori</label>
                <select 
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold focus:outline-none focus:border-violet-500 bg-white"
                >
                  <option value="Fen Bilimleri">Fen Bilimleri</option>
                  <option value="Sosyal Bilgiler">Sosyal Bilgiler</option>
                  <option value="Matematik">Matematik</option>
                  <option value="Türkçe">Türkçe</option>
                  <option value="Genel Kültür">Genel Kültür</option>
                </select>
              </div>
              <button 
                type="submit"
                disabled={!newTitle.trim()}
                className="w-full bg-violet-600 text-white font-black py-3 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50"
              >
                Oluştur
              </button>
            </form>
          </div>
        </div>

        {/* Deste Listesi */}
        <div className="md:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
          ) : decks.length === 0 ? (
            <div className="bg-slate-50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
              <span className="text-4xl mb-4 block">🃏</span>
              <h3 className="text-lg font-black text-slate-700 mb-2">Henüz desteniz yok</h3>
              <p className="text-slate-500 font-bold text-sm">Soldaki formu kullanarak ilk Tabu destenizi oluşturun.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {decks.map(deck => (
                <div key={deck.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-violet-300 transition-colors">
                  <div>
                    <span className="text-[0.65rem] font-black uppercase tracking-wider text-violet-600 bg-violet-100 px-2 py-1 rounded-md mb-2 inline-block">
                      {deck.category}
                    </span>
                    <h3 className="text-lg font-black text-slate-800">{deck.title}</h3>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center px-4 border-r border-slate-100">
                      <span className="block text-[0.65rem] font-black text-slate-400 uppercase">Öğrenci Kodu</span>
                      <span className="font-mono font-black text-lg text-slate-700">{deck.code}</span>
                    </div>
                    <button 
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-sm transition-colors"
                      onClick={() => toast.info("Kelime ekleme paneli çok yakında eklenecek!")}
                    >
                      Kelimeleri Yönet ➔
                    </button>
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
