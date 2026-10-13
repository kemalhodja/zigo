import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const opponent = searchParams.get("opponent") || "Bir Öğrenci";
    const subject = searchParams.get("subject") || "MEB LGS / YKS Düellosu";
    const reward = searchParams.get("reward") || "+25 Lig Puanı";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #180324 0%, #3b0764 50%, #831843 100%)",
            padding: "60px 80px",
            fontFamily: "system-ui, sans-serif",
            color: "white",
          }}
        >
          {/* Top Brand Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                  fontSize: "30px",
                  fontWeight: "900",
                }}
              >
                ⚔️
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "28px", fontWeight: "900", letterSpacing: "1px" }}>ZIGO DÜELLO</span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#f59e0b", textTransform: "uppercase" }}>
                  1v1 Canlı Soru Kapışması
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(245, 158, 11, 0.2)",
                padding: "10px 22px",
                borderRadius: "999px",
                fontSize: "18px",
                fontWeight: "900",
                color: "#fde68a",
                border: "1px solid rgba(245, 158, 11, 0.4)",
              }}
            >
              <span>Ödül: {reward}</span>
            </div>
          </div>

          {/* Central Title */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "1000px" }}>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                color: "#fed7aa",
                fontSize: "18px",
                fontWeight: "800",
                padding: "8px 18px",
                borderRadius: "10px",
                alignSelf: "flex-start",
              }}
            >
              🔥 Canlı Meydan Okuma
            </div>

            <h1
              style={{
                fontSize: "56px",
                fontWeight: "900",
                lineHeight: "1.1",
                margin: "0",
                color: "#ffffff",
                textShadow: "0 4px 20px rgba(0,0,0,0.5)",
              }}
            >
              {opponent} sana meydan okudu!
            </h1>

            <p style={{ fontSize: "24px", color: "#cbd5e1", margin: "0", fontWeight: "600" }}>
              Branş: <span style={{ color: "#fbcfe8", fontWeight: "800" }}>{subject}</span> · 5 Soruda Hızını ve Bilgini Göster!
            </p>
          </div>

          {/* Bottom Action */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              borderTop: "1px solid rgba(255, 255, 255, 0.15)",
              paddingTop: "24px",
            }}
          >
            <span style={{ fontSize: "18px", color: "#fed7aa", fontWeight: "700" }}>
              ⚡ Linke tıkla, odaya katıl, düelloyu başlat!
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "linear-gradient(90deg, #f59e0b, #ef4444)",
                padding: "12px 32px",
                borderRadius: "14px",
                fontSize: "20px",
                fontWeight: "900",
              }}
            >
              Meydan Okumayı Kabul Et →
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch {
    return new Response("Duel OG image failed to generate", { status: 500 });
  }
}
