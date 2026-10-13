import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title") || "Zigo MEB Quiz Arenası";
    const author = searchParams.get("author") || "Zigo Öğretmen Topluluğu";
    const count = searchParams.get("count") || "5 Soru";
    const grade = searchParams.get("grade") || "MEB Kazanım Odaklı";

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
            background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)",
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
                  background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
                  fontSize: "30px",
                  fontWeight: "900",
                }}
              >
                Z
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "28px", fontWeight: "900", letterSpacing: "1px" }}>ZIGO</span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#a855f7", textTransform: "uppercase" }}>
                  Eğitim & Quiz Arenası
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255, 255, 255, 0.12)",
                padding: "10px 20px",
                borderRadius: "999px",
                fontSize: "16px",
                fontWeight: "800",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <span>⚡ Canlı Meydan Okuma</span>
            </div>
          </div>

          {/* Central Title */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "1000px" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <span
                style={{
                  background: "#8b5cf6",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "800",
                  padding: "6px 14px",
                  borderRadius: "8px",
                }}
              >
                {grade}
              </span>
              <span
                style={{
                  background: "rgba(236, 72, 153, 0.25)",
                  color: "#f472b6",
                  fontSize: "16px",
                  fontWeight: "800",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(236, 72, 153, 0.5)",
                }}
              >
                {count}
              </span>
            </div>

            <h1
              style={{
                fontSize: "52px",
                fontWeight: "900",
                lineHeight: "1.15",
                margin: "0",
                color: "#ffffff",
                textShadow: "0 4px 20px rgba(0,0,0,0.5)",
              }}
            >
              {title.length > 70 ? title.slice(0, 67) + "..." : title}
            </h1>

            <p style={{ fontSize: "22px", color: "#94a3b8", margin: "0", fontWeight: "600" }}>
              Hazırlayan: <span style={{ color: "#e2e8f0", fontWeight: "700" }}>{author}</span>
            </p>
          </div>

          {/* Bottom Call to Action */}
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
            <span style={{ fontSize: "18px", color: "#cbd5e1", fontWeight: "700" }}>
              🎯 Linke tıkla, hemen çöz, skorunu karşılaştır!
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "linear-gradient(90deg, #ec4899, #8b5cf6)",
                padding: "12px 28px",
                borderRadius: "14px",
                fontSize: "18px",
                fontWeight: "900",
              }}
            >
              Quiz&apos;i Başlat →
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        },
      }
    );
  } catch {
    return new Response("OG image failed to generate", { status: 500 });
  }
}
