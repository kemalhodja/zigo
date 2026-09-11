"use client";

/**
 * use-game-feedback.ts
 *
 * Birleşik oyun geri bildirim hook'u.
 * Tüm game componentleri bu tek hook'u kullanarak ses + haptic tetikler.
 * Böylece ses/haptic logic oyun kodundan ayrılmış olur.
 */

import { useCallback } from "react";

import { useAudio } from "@/hooks/use-audio";

export type GameFeedbackEvent =
  | "correct"    // Doğru cevap
  | "wrong"      // Yanlış cevap
  | "streak"     // X doğru üst üste (streak milestone)
  | "level_up"   // Seviye atladı
  | "perfect"    // Bölümü hatasız tamamladı
  | "coin"       // Puan/jeton kazandı
  | "block_done" // Pomodoro bloğu bitti
  | "clear";     // Satır/board temizlendi

export function useGameFeedback() {
  const { playSound } = useAudio();

  /** Doğru cevap: yeşil flash + ses + hafif titreşim */
  const onCorrect = useCallback(() => {
    playSound("success");
  }, [playSound]);

  /** Yanlış cevap: kırmızı shake + ses + sert titreşim */
  const onWrong = useCallback(() => {
    playSound("wrong");
  }, [playSound]);

  /**
   * Seri milestone: 3, 5, 10 doğru üst üste gibi anlarda çağır.
   * @param count - Kaçıncı seri bu? (görsel mesaj için)
   */
  const onStreak = useCallback(
    (_count: number) => {
      playSound("streak");
    },
    [playSound]
  );

  /** Seviye atlandı: fanfare + güçlü titreşim */
  const onLevelUp = useCallback(() => {
    playSound("level_up");
  }, [playSound]);

  /** Mükemmel bitiş: crescendo + tam titreşim paketi */
  const onPerfect = useCallback(() => {
    playSound("perfect");
  }, [playSound]);

  /** Puan/jeton kazanıldı: hafif coin sesi */
  const onCoin = useCallback(() => {
    playSound("coin");
  }, [playSound]);

  /** Satır/alan temizlendi (block-puzzle, 2048 birleşme) */
  const onClear = useCallback(() => {
    playSound("clear");
  }, [playSound]);

  /**
   * Pomodoro blok bitti: success sesi + coin (puan kazanımı)
   * İki ses arka arkaya çalınır (mini delay ile)
   */
  const onBlockDone = useCallback(() => {
    playSound("success");
    setTimeout(() => playSound("coin"), 400);
  }, [playSound]);

  /** Ham tetikleyici — event tipine göre doğru fonksiyonu çağırır */
  const trigger = useCallback(
    (event: GameFeedbackEvent, meta?: { streakCount?: number }) => {
      switch (event) {
        case "correct":   onCorrect(); break;
        case "wrong":     onWrong(); break;
        case "streak":    onStreak(meta?.streakCount ?? 0); break;
        case "level_up":  onLevelUp(); break;
        case "perfect":   onPerfect(); break;
        case "coin":      onCoin(); break;
        case "clear":     onClear(); break;
        case "block_done": onBlockDone(); break;
      }
    },
    [onCorrect, onWrong, onStreak, onLevelUp, onPerfect, onCoin, onClear, onBlockDone]
  );

  return {
    onCorrect,
    onWrong,
    onStreak,
    onLevelUp,
    onPerfect,
    onCoin,
    onClear,
    onBlockDone,
    trigger,
  };
}
