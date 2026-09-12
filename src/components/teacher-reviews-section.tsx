"use client";

import { Send,Star, X } from "lucide-react";
import { useState } from "react";

import { SocialAvatar } from "@/components/social-primitives";
import type { TeacherReviewItem, TeacherReviewSummary } from "@/lib/domain/teacher-reviews";

type TeacherReviewsSectionProps = {
  teacherId: string;
  teacherName: string;
  summary: TeacherReviewSummary;
  initialReviews: TeacherReviewItem[];
  canReview: boolean;
};

export function TeacherReviewsSection({
  teacherId,
  teacherName,
  summary,
  initialReviews,
  canReview,
}: TeacherReviewsSectionProps) {
  const [reviews] = useState<TeacherReviewItem[]>(initialReviews);
  const [showModal, setShowModal] = useState(false);
  const [clarity, setClarity] = useState(5);
  const [comm, setComm] = useState(5);
  const [pedagogy, setPedagogy] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const hasReviews = summary.total_reviews > 0 || reviews.length > 0;

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/teacher/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          ratingClarity: clarity,
          ratingCommunication: comm,
          ratingPedagogy: pedagogy,
          comment: comment.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Yorum kaydedilemedi");

      setSuccessMsg("Değerlendirmeniz başarıyla yayınlandı! ⭐");
      setTimeout(() => {
        setShowModal(false);
        setSuccessMsg("");
        window.location.reload();
      }, 1500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/50 via-white to-white p-4 shadow-xs">
      {/* Header with Rating Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
            <Star className="size-6 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-slate-900">
                {hasReviews ? summary.avg_rating.toFixed(1) : "5.0"}
              </span>
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`size-3.5 ${
                      i <= Math.round(hasReviews ? summary.avg_rating : 5) ? "fill-amber-400" : "fill-slate-200 text-slate-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-500">
                ({summary.total_reviews} Veli Değerlendirmesi)
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-600">
              Veliler tarafından <span className="font-bold text-emerald-700">%{summary.recommendation_rate} tavsiye ediliyor</span>
            </p>
          </div>
        </div>

        {canReview && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="tap-scale rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-slate-950 shadow-xs hover:bg-amber-400 transition"
          >
            ✍️ Değerlendir
          </button>
        )}
      </div>

      {/* Sub-ratings row */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
          <span className="block text-xs font-black text-slate-900">{summary.avg_clarity.toFixed(1)} / 5</span>
          <span className="text-[10px] font-bold text-slate-500">📖 Anlatım</span>
        </div>
        <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
          <span className="block text-xs font-black text-slate-900">{summary.avg_communication.toFixed(1)} / 5</span>
          <span className="text-[10px] font-bold text-slate-500">💬 İletişim</span>
        </div>
        <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
          <span className="block text-xs font-black text-slate-900">{summary.avg_pedagogy.toFixed(1)} / 5</span>
          <span className="text-[10px] font-bold text-slate-500">🎯 Pedagoji</span>
        </div>
      </div>

      {/* Recent Reviews List */}
      <div className="mt-3 space-y-2.5">
        {reviews.length === 0 ? (
          <p className="py-2 text-center text-xs font-semibold text-slate-400">
            Henüz veli değerlendirmesi bulunmuyor. İlk değerlendirmeyi yapan siz olun!
          </p>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <SocialAvatar className="size-6 text-xs" label={rev.parent_name} imageUrl={rev.parent_avatar_url} />
                  <span className="truncate text-xs font-black text-slate-800">{rev.parent_name}</span>
                  <span className="rounded bg-emerald-50 px-1 py-0.2 text-[9px] font-bold text-emerald-700">✓ Onaylı Veli</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-black text-slate-900">{rev.overall_rating.toFixed(1)}</span>
                </div>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{rev.comment}</p>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-night">Öğretmeni Değerlendir</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
              <p className="text-xs text-slate-500">
                <strong>{teacherName}</strong> ile gerçekleştirdiğiniz ders ve pedagojik deneyimi puanlayın.
              </p>

              {/* Clarity */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Konu Anlatımı & Netlik (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setClarity(val)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition ${
                        clarity >= val ? "bg-amber-400 text-slate-950 font-black" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      ★ {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Communication */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">İletişim & Dakiklik (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setComm(val)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition ${
                        comm >= val ? "bg-amber-400 text-slate-950 font-black" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      ★ {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pedagogy */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Öğrenciye Yaklaşım (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPedagogy(val)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition ${
                        pedagogy >= val ? "bg-amber-400 text-slate-950 font-black" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      ★ {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment text */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Yorumunuz & Tavsiyeniz</label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ders deneyiminiz nasıldı? Diğer velilere tavsiye eder misiniz?"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {errorMsg && <p className="text-xs font-bold text-rose-500">{errorMsg}</p>}
              {successMsg && <p className="text-xs font-bold text-emerald-600">{successMsg}</p>}

              <button
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                className="tap-scale flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500 py-3 text-xs font-black text-slate-950 shadow-xs hover:brightness-105 disabled:opacity-50"
              >
                <Send className="size-3.5" />
                {isSubmitting ? "Kaydediliyor..." : "Yorumu Yayınla"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
