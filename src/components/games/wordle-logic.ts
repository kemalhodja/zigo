export type LetterState = "correct" | "present" | "absent" | "empty";

/**
 * İki aşamalı Wordle değerlendirmesi:
 * 1. Tam isabetler (correct) işaretlenir, hedefteki kalan harf stoğu düşülür.
 * 2. Kalan harfler stok tüketildiği kadar "present" olur.
 * Böylece yinelenen harflerde hedefteki adet kadar sarı verilir.
 */
export function evaluateGuess(targetWord: string, guess: string): LetterState[] {
  const states: LetterState[] = Array.from(guess, () => "absent");
  const remaining: Record<string, number> = {};

  for (let i = 0; i < targetWord.length; i++) {
    if (guess[i] === targetWord[i]) {
      states[i] = "correct";
    } else {
      remaining[targetWord[i]] = (remaining[targetWord[i]] ?? 0) + 1;
    }
  }

  for (let i = 0; i < guess.length; i++) {
    if (states[i] === "correct") continue;
    const ch = guess[i];
    if ((remaining[ch] ?? 0) > 0) {
      states[i] = "present";
      remaining[ch] -= 1;
    }
  }

  return states;
}

/** Klavye rengi için en iyi durumu seçer: correct > present > absent. */
export function bestKeyState(states: LetterState[]): LetterState {
  let best: LetterState = "empty";
  const rank: Record<LetterState, number> = { empty: 0, absent: 1, present: 2, correct: 3 };
  for (const s of states) {
    if (rank[s] > rank[best]) best = s;
  }
  return best;
}
