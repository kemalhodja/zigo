import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Zigo Enerji Sistemi / Skor Kaydı Entegrasyonu
    // İleride burada veritabanına kayıt yapılacak (Supabase).
    // Örn: await db.from("user_scores").insert({...body})
    
    console.log("[Zihin Avcısı] Skor Alındı:", body);

    return NextResponse.json(
      { success: true, message: "Skor başarıyla kaydedildi.", score: body.score },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Zihin Avcısı] API Hatası:", error);
    return NextResponse.json(
      { success: false, message: "Skor kaydedilirken bir hata oluştu." },
      { status: 400 }
    );
  }
}
