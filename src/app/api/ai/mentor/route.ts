import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mockAdvices = [
      "Matematikte harika gidiyorsun! Dün 45 dakika odaklandın. Bugün Tarih dersindeki eksiklerini kapatmak için küçük bir Pomodoro yapmaya ne dersin?",
      "Geometri quizlerinde başarı oranın artıyor! Bu ivmeyi kaybetme, bugün 15 dakikalık bir tekrar harika olur.",
      "Son 3 gündür Zigo'da çok aktifsin, tebrikler! Bugün kendine biraz zaman ayır, dinlenmek de öğrenmenin bir parçasıdır.",
    ];

    const randomAdvice = mockAdvices[Math.floor(Math.random() * mockAdvices.length)];

    return NextResponse.json({ advice: randomAdvice });
  } catch (error) {
    console.error("AI Mentor error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { topic?: string };
    const topic = body.topic?.trim() || "";

    const topicAdvices: Record<string, string> = {
      pomodoro: "⏱️ Pomodoro İpucu: 25 dakika kesintisiz odaklan, 5 dakika mola ver. 4 set tamamladıktan sonra 20 dakikalık uzun mola ile zihnini tazele!",
      stress: "🧠 Sınav Stresi Yönetimi: Derin nefes al. Zihnini 'yapamadıklarına' değil, şu ana kadar kattığın emeklere odakla. Küçük adımlar büyük sonuçlar getirir!",
      schedule: "📊 Ders Programı Önerisi: En çok zorlandığın dersi günün ilk saatlerine yerleştir. Zihnin tazeyken zor konuları öğrenmek 2 kat daha hızlıdır!",
      motivation: "🎯 Günlük Motivasyon: Başarı bir günde gelmez; her gün atılan kararlı küçük adımların toplamıdır. Bugün de kendine bir hedef seç ve ona ulaş!",
    };

    const advice = topicAdvices[topic] || `Zigo AI Koçu: ${topic} konusunda disiplinli çalışma ve düzenli tekrarlar başarıyı getirir!`;

    return NextResponse.json({ advice });
  } catch (error) {
    console.error("AI Mentor POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
