"use client";

import { useEffect } from "react";

import { useAudio } from "@/hooks/use-audio";
import { triggerConfetti } from "@/lib/client/confetti";
import { triggerHaptic } from "@/lib/client/haptics";

export interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badgeEmoji?: string;
  highlightText?: string;
  pointsEarned?: number;
  actionText?: string;
}

export function CelebrationModal({
  isOpen,
  onClose,
  title,
  subtitle,
  badgeEmoji = "🎉",
  highlightText,
  pointsEarned,
  actionText = "Harika, Devam Et!",
}: CelebrationModalProps) {
  const { playSound } = useAudio();

  useEffect(() => {
    if (isOpen) {
      triggerConfetti();
      triggerHaptic("success");
      playSound("perfect");
    }
  }, [isOpen, playSound]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-night/70 backdrop-blur-sm animate-fade-in">
      <div className="linear-card relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 text-center shadow-2xl animate-scale-up">
        <div className="aurora-glow" />

        {/* 3D-effect Badge Icon */}
        <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 via-orange-400 to-rose-400 text-4xl shadow-lg ring-8 ring-amber-100">
          <span className="animate-bounce">{badgeEmoji}</span>
        </div>

        {/* Title & Subtitle */}
        <div className="relative space-y-1">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs font-bold text-slate-500">{subtitle}</p>
          )}
        </div>

        {/* Highlight Banner / Points */}
        {(highlightText || pointsEarned) && (
          <div className="relative mt-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 p-3 text-center">
            {highlightText && (
              <p className="text-xs font-black text-indigo-700">
                {highlightText}
              </p>
            )}
            {pointsEarned ? (
              <p className="text-lg font-black text-crystal tabular-nums mt-0.5">
                +{pointsEarned} Zigo Puan
              </p>
            ) : null}
          </div>
        )}

        {/* CTA Button */}
        <div className="relative mt-6">
          <button
            type="button"
            onClick={onClose}
            className="tap-scale w-full rounded-2xl bg-gradient-to-r from-crystal to-berry py-3 px-4 text-xs font-black text-white shadow-md hover:brightness-105 transition"
          >
            {actionText}
          </button>
        </div>
      </div>
    </div>
  );
}
