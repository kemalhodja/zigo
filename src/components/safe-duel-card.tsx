"use client";

import { useCallback, useState } from "react";

import { useToast } from "@/components/ui/toast-system";
import { createClient } from "@/lib/supabase/client";

export interface SafeDuelResult {
  duelId: string;
  score: number;
  totalQuestions: number;
  areaId?: number;
}

export function SafeDuelCard({ onComplete }: { onComplete: (result: SafeDuelResult) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(3);
  const [areaId, setAreaId] = useState<number | undefined>(undefined);
  const toast = useToast();
  const supabase = createClient();

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Oturum bulunamadı");
        setIsSubmitting(false);
        return;
      }

      const { data, error } = await supabase.rpc("award_safe_duel_win_points", {
        p_target_user_id: user.id,
        p_duel_id: crypto.randomUUID(), // In real usage, this would be the actual duel ID
        p_score: score,
        p_total_questions: totalQuestions,
        p_area_id: areaId ?? undefined,
      });

      if (error) throw error;

      // The RPC returns the awarded event
      const result = data?.[0];
      if (result && !result.already_awarded) {
        toast.success("Düello kazandın! +25 puan");
      } else if (result?.already_awarded) {
        toast.showToast("Bu düello için zaten ödül almışsın", "info");
      }

      onComplete({ duelId: result?.event_id ?? "", score, totalQuestions, areaId });
    } catch (error) {
      console.error("Safe duel error:", error);
      toast.error("Düello sonucu kaydedilemedi");
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, score, totalQuestions, areaId, onComplete, supabase, toast]);

  return (
    <div className="bg-white border-2 border-violet-100 rounded-[2rem] p-4 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl shrink-0 border border-amber-200">
          ⚔️
        </div>
        <div>
          <h3 className="font-black text-slate-800">Güvenli Düello Sonucu</h3>
          <p className="text-sm text-slate-500">
            Bu kart doğrudan mesaj (direct message) göndermez — sadece oyun sonucunu kaydeder.
            {/** d.noDm: No DM flow; d.topicDesc: Topic description only */}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-black text-violet-700 mb-1">Skor</label>
          <input
            type="number"
            min="0"
            max={totalQuestions}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full bg-white border border-violet-200 rounded-xl p-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-violet-500"
          />
        </div>

        <div>
          <label className="block text-xs font-black text-violet-700 mb-1">Toplam Soru</label>
          <select
            value={totalQuestions}
            onChange={(e) => setTotalQuestions(Number(e.target.value))}
            className="w-full bg-white border border-violet-200 rounded-xl p-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-violet-500"
          >
            {[3, 5, 7, 10].map((n) => (
              <option key={n} value={n}>
                {n} Soru
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-black text-violet-700 mb-1">Eğitim Alanı (Opsiyonel)</label>
          <input
            type="number"
            min="1"
            placeholder="Örn: 1 = Matematik"
            value={areaId ?? ""}
            onChange={(e) => setAreaId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full bg-white border border-violet-200 rounded-xl p-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-violet-500"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="tap-scale w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-lg shadow-lg disabled:opacity-50 transition-all"
        >
          {isSubmitting ? "Kaydediliyor..." : "Sonucu Kaydet ve Puan Kazan"}
        </button>
      </div>
    </div>
  );
}