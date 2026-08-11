import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cwd } from "node:process";

const root = cwd();
const rd = (p) => readFileSync(join(root, p), "utf8");
const cat = [rd("src/lib/i18n/catalog.en.ts"), rd("src/lib/i18n/messages.en.ts")].join("\n");
const hc = (s) => cat.includes(s);

const SOCIAL_FILES = [
  "src/lib/domain/social.ts",
  "src/lib/domain/social/interactions.ts",
  "src/lib/domain/social/feed.ts",
].filter(p => existsSync(join(root, p))).map(rd).join("\n");

console.log("=== SAFE DUELS ===");
const du = rd("src/app/duels/page.tsx");
const dc = rd("src/components/safe-duel-card.tsx");
const sp = rd("src/app/student/page.tsx");
const mi = rd("src/components/daily-missions-card.tsx");
console.log("Compete:", du.includes("Compete without student DMs") || hc("Compete without student DMs"));
console.log("Preset:", du.includes("Preset answers only") || hc("Preset answers only"));
console.log("No student chat:", dc.includes("No student chat, no direct messaging") || dc.includes("d.topicDesc") || hc("No student chat, no direct messaging"));
console.log("/duels student:", sp.includes('href="/duels"'));
console.log("Play a duel:", mi.includes("Play a duel") || mi.includes("playDuel") || hc("Play a duel"));

console.log("\n=== FOLLOW ===");
const fo = rd("src/components/follow-button.tsx");
const pp = rd("src/app/profile/[id]/page.tsx");
console.log("followers_count social:", SOCIAL_FILES.includes("followers_count"));
console.log("following_count social:", SOCIAL_FILES.includes("following_count"));
console.log("initFollowersCount btn:", fo.includes("initialFollowersCount"));
console.log("showCount btn:", fo.includes("showCount"));
console.log("initFollowersCount profile:", pp.includes("initialFollowersCount={stats.followers}"));

console.log("\n=== AVATAR ===");
const ap = rd("src/app/avatar/page.tsx");
const as2 = rd("src/components/avatar-store.tsx");
const pc = rd("src/components/learning-progress-card.tsx");
console.log("equippedAssets:", ap.includes("equippedAssets={profile.avatar_assets}"));
console.log("totalPoints:", ap.includes("totalPoints={profile.total_points}"));
console.log("totalPoints store:", as2.includes("totalPoints"));
console.log("Locked cat:", hc("Locked"));
console.log("quizCompletions:", pc.includes("quizCompletions"));
console.log("duelWins:", pc.includes("duelWins"));

console.log("\n=== STUDENT ===");
console.log("LeaguePathCard:", sp.includes("LeaguePathCard"));
console.log("dayStreak:", sp.includes("dayStreak") || hc("day streak"));
console.log("LEAGUE_PATH:", sp.includes("LEAGUE_PATH"));
console.log("/duels:", sp.includes("/duels"));
console.log("buildStudentGamification:", sp.includes("buildStudentGamification"));
const ma = rd("src/app/api/learning/missions/route.ts");
console.log("/api/learning/missions mi:", mi.includes("/api/learning/missions"));
console.log("getDailyMissionProgress api:", ma.includes("getDailyMissionProgress"));
const ga = rd("src/lib/domain/student-gamification.ts");
console.log("LEAGUE_PATH gamification:", ga.includes("LEAGUE_PATH"));
console.log("Play a duel cat:", hc("Play a duel"));

console.log("\n=== QUICK ACTIONS ===");
const qFiles = ["src/app/page.tsx","src/app/learn/page.tsx","src/app/post/[id]/page.tsx","src/components/learning-progress-card.tsx"];
qFiles.forEach(f => {
  const s = rd(f);
  console.log(f, "  zigo-quick-action-primary:", s.includes("zigo-quick-action-primary"), "  text-white:", s.includes("text-white"));
});
