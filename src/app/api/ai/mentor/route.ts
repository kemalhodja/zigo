import { NextResponse } from "next/server";

import { getLearningProgressStats } from "@/lib/domain/learning";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

// Comprehensive AI advice catalog categorized by focus area
const ADVICE_CATALOG: Record<string, string[]> = {
  general: [
    "📌 Zorlandığın dersleri günün ilk 2 saatinde çöz! Zihnin tazeyken öğrenme hızın %50 daha yüksektir.",
    "💡 Çözemediğin her yanlış soru bir hazinedir! Yanlış yaptığın soruları 'Yanlış Defteri'ne ekleyip haftalık tekrar et.",
    "⏱️ 45 dakika yoğun çalışma + 15 dakika zihinsel mola dengesi, uzun maratonlarda odağını zirvede tutar.",
    "🧠 Tekrar etmediğin bilgi 24 saat içinde %70 oranında unutulur. Günün sonunda 10 dakikalık hızlı göz gezdirme yap!",
    "🎯 Büyük hedefleri küçük günlük parçalara böl. Bugün sadece 20 kaliteli soru çözmek bile seni hedefine yaklaştırır.",
    "📚 Soru çözerken takıldığında hemen cevaba bakma; önce 2 dakika kendi çözüm yolunu zorla, sinapsların güçlensin!",
    "🌊 Çalışma masanda dikkatini dağıtan telefon ve bildirimleri başka odaya bırak. Derin odak (Deep Work) başarının anahtarıdır.",
    "🏆 Kendini başkalarıyla kıyaslama; sadece dünkü halinle yarış! İlerleme günlük kararlı adımlarla gelir.",
  ],
  morning: [
    "🌅 Günaydın! Güne en zorlandığın veya en çok odak gerektiren derse başla. Zihnin şu an maksimum kapasitede!",
    "☕ Güne başlarken bugün tamamlayacağın 3 ana hedefi belirle. Küçük hedefler net odak sağlar.",
  ],
  afternoon: [
    "☀️ Gün ortası ivmesini koru! 25 dakikalık bir Pomodoro oturumu ile soru çözüm serini devam ettir.",
    "🚀 Öğleden sonra enerjin düştüğünde kısa bir yürüyüş yap veya su iç. Ardından pratik soru çözümüyle devam et!",
  ],
  evening: [
    "🌙 Akşam saatleri günün özetini yapmak için harikadır. Bugün öğrendiğin ana kavramları zihninden geçir.",
    "📊 Bugün tamamladığın testleri gözden geçir, yanlışlarını analiz et ve yarının çalışma planını şimdiden hazırla.",
  ],
  night: [
    "🌌 Gece çalışmasında zihnini fazla yorma. Kaliteli uyku öğrendiğin bilgilerin hafızaya kazınmasını sağlar!",
    "💤 Yatmadan önce ekran süresini azalt ve yarın sabah çözeceğin ilk dersin kitabını masana hazır bırak.",
  ],
  pomodoro: [
    "⏱️ Pomodoro Taktiği: 25 dakika sıfır bildirimle soru çöz, 5 dakika tam zihinsel mola ver. 4 setten sonra 20 dk mola!",
    "⏱️ Mola Zamanı Taktiği: 5 dakikalık molada ekrana bakma! Gözlerini dinlendir, derin nefes al ve su iç.",
    "⏱️ Blok Çalışma: Eğer soru çözerken akışa (Flow) girdiysen süreyi 45 dakikaya uzat, ardından 15 dakika mola ver.",
  ],
  stress: [
    "🧠 Kaygı Yönetimi: Sınav stresi hissettiğinde 4 saniye nefes al, 4 saniye tut, 4 saniye ver. Zihnin anında sakinleşir.",
    "🌱 Unutma: Stres başarısızlığın değil, önem verdiğin bir işi başarma isteğinin göstergesidir. Bunu enerjiye dönüştür!",
    "💪 Zihnini 'Ya yapamazsam' senaryolarından çıkar; 'Şu an ne yapabilirim' sorusuna odakla. Adım atmak kaygıyı bitirir.",
  ],
  schedule: [
    "📊 Program İpucu: Sayısal ve Sözel dersleri ardı ardına koyarak zihninin farklı bölgelerini dinlendir.",
    "📅 Haftalık Plan: Her Pazar haftalık hedeflerini çiz. Esnek mola süreleri bırakmayı unutma!",
    "🎯 Ders Dağılımı: Güçlü olduğun derslere %30, geliştirmek istediğin zayıf derslere %70 zaman ayır.",
  ],
  motivation: [
    "🎯 Motivasyon Sözü: 'Başarı bir tesadüf değildir; çalışma, azim, öğrenme ve en çok da yaptığın işi sevme sonucudur.'",
    "🚀 Başarılı öğrenciler mükemmel olanlar değil, pes etmeden her gün 1 adım atanlardır. Sen de devam et!",
    "🔥 Her soru, gelecekteki hedefine giden yolda bir basamaktır. Bugün o basamaklardan birini daha tırmanıyorsun!",
  ],
  exam_speed: [
    "⚡ Hız Taktiği: Soruyu okurken önce kökü (ne istendiğini) oku, sonra paragraftaki verileri süz. Zamandan %30 kazanırsın!",
    "📌 Turlama Taktiği: Uzun ve karmaşık soruların yanına işaret koyup geç. Kolay soruları bitirdikten sonra onlara dön!",
  ],
};

function buildRealUserDataAnalysis(userName: string, stats: { reelWatches: number; quizCompletions: number; duelWins: number; focusSessions: number; pointsFromEvents: number }): string {
  const { reelWatches, quizCompletions, duelWins, focusSessions, pointsFromEvents } = stats;

  if (quizCompletions > 0 && reelWatches === 0) {
    return `📊 ${userName ? userName + ", " : ""}Öğrenme Analizin: Toplam ${quizCompletions} quiz tamamladın (${pointsFromEvents} puan). Test pratikliğin harika! Ancak henüz mikro ders izlememişsin; eksik konu analizleri için 'Dersler' sekmesindeki videolara göz atmanı öneririm.`;
  }

  if (reelWatches > 0 && quizCompletions === 0) {
    return `💡 ${userName ? userName + ", " : ""}Öğrenme Analizin: Şu ana kadar ${reelWatches} mikro ders izledin! Konu kavramın çok iyi. Ancak izlediğin bilgiyi kalıcı hafızaya almak için hemen 'Öğren' sekmesinden 1 mini quiz çözmelisin.`;
  }

  if (quizCompletions > 0 && reelWatches > 0) {
    return `🔥 ${userName ? userName + ", " : ""}Üst Düzey Performans: Harika denge! ${reelWatches} kısa ders izledin ve ${quizCompletions} quiz tamamladın (${pointsFromEvents} puan kazandın). ${focusSessions > 0 ? `${focusSessions} Pomodoro seansı ile odağını koruyorsun.` : "Şimdi 25 dakikalık bir Pomodoro ile hızını artır!"}`;
  }

  if (duelWins > 0) {
    return `⚔️ ${userName ? userName + ", " : ""}Düello Analizin: ${duelWins} yarış kazandın! Hızlı düşünme kabiliyetin yüksek. Bu ivmeyle günlük quizlerin tamamını çözmeyi hedefle!`;
  }

  return `🚀 ${userName ? userName + ", " : ""}Öğrenme Rrotan: Henüz kayıtlı ders ve quiz verin az. İlk adımı atmak için bugün 1 mikro ders izle ve ardından 1 mini quiz çözerek kişisel AI analizini başlat!`;
}

export async function GET() {
  try {
    let userName = "";
    let streakDays = 0;
    let realAnalysis = "";

    try {
      const supabase = await createClient();
      const profile = await getCurrentProfile(supabase);
      if (profile) {
        userName = profile.full_name?.split(" ")[0] || "";
        streakDays = (profile as unknown as { streak_days?: number }).streak_days || 0;

        // Fetch real database learning stats (quizzes, reel watches, duels, focus)
        const stats = await getLearningProgressStats(supabase, profile.id).catch(() => null);
        if (stats && (stats.reelWatches > 0 || stats.quizCompletions > 0 || stats.duelWins > 0)) {
          realAnalysis = buildRealUserDataAnalysis(userName, stats);
        }
      }
    } catch {
      // Guest fallback
    }

    if (realAnalysis) {
      return NextResponse.json({ advice: realAnalysis, isPersonalized: true });
    }

    const currentHour = new Date().getHours();
    let timeCategory = "morning";
    if (currentHour >= 12 && currentHour < 18) timeCategory = "afternoon";
    else if (currentHour >= 18 && currentHour < 22) timeCategory = "evening";
    else if (currentHour >= 22 || currentHour < 6) timeCategory = "night";

    const timePool = ADVICE_CATALOG[timeCategory] || [];
    const generalPool = ADVICE_CATALOG.general;
    const combinedPool = [...timePool, ...generalPool];

    let selectedAdvice = combinedPool[Math.floor(Math.random() * combinedPool.length)];

    if (streakDays > 1) {
      selectedAdvice = `🔥 ${streakDays} günlük harika çalışma serin devam ediyor! ${selectedAdvice}`;
    } else if (userName) {
      selectedAdvice = `👋 ${userName}, ${selectedAdvice.toLowerCase()}`;
    }

    return NextResponse.json({ advice: selectedAdvice, timeCategory, isPersonalized: false });
  } catch (error) {
    console.error("AI Mentor GET error:", error);
    return NextResponse.json({
      advice: "📌 Düzenli tekrarlar ve Pomodoro tekniği ile bugün öğrenme hedeflerine ulaşabilirsin!",
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { topic?: string };
    const topic = body.topic?.trim() || "general";

    let userName = "";
    let stats: { reelWatches: number; quizCompletions: number; duelWins: number; focusSessions: number; pointsFromEvents: number } | null = null;

    try {
      const supabase = await createClient();
      const profile = await getCurrentProfile(supabase);
      if (profile) {
        userName = profile.full_name?.split(" ")[0] || "";
        stats = await getLearningProgressStats(supabase, profile.id).catch(() => null);
      }
    } catch {
      // fallback
    }

    if (topic === "analytics" || topic === "solutions") {
      if (stats) {
        const analysis = buildRealUserDataAnalysis(userName, stats);
        return NextResponse.json({ advice: analysis, isPersonalized: true });
      } else {
        return NextResponse.json({
          advice: `💡 ${userName ? userName + ", " : ""}Henüz yeterli quiz ve ders verisi bulunamadı. Bugün 1 mikro ders izleyip 1 quiz tamamladığında detaylı AI performans analizin burada belirecek!`,
          isPersonalized: false,
        });
      }
    }

    const pool = ADVICE_CATALOG[topic] || ADVICE_CATALOG.general;
    const advice = pool[Math.floor(Math.random() * pool.length)];

    return NextResponse.json({ advice, isPersonalized: false });
  } catch (error) {
    console.error("AI Mentor POST error:", error);
    return NextResponse.json({
      advice: "🎯 Kararlı ve düzenli çalışma her zaman başarıyı getirir!",
    });
  }
}


