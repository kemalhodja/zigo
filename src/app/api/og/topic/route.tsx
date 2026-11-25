import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "LGS & YKS Konu Rehberi 2026";
  const subject = searchParams.get("subject") || "Zigo Eğitim";
  const exam = searchParams.get("exam") || "2026 Müfredat";
  const questions = searchParams.get("questions") || "Özet & Mini Test";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #2e1065 100%)",
          padding: "56px 72px",
          fontFamily: "system-ui, sans-serif",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #7c3aed, #f59e0b)",
                fontSize: "30px",
                fontWeight: 900,
              }}
            >
              Z
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "26px", fontWeight: 900, letterSpacing: "0.04em" }}>
                ZİGO
              </span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#c4b5fd" }}>
                Konu Anlatımı &amp; Pratik Rehberi
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "999px",
              padding: "10px 22px",
              fontSize: "18px",
              fontWeight: 800,
              color: "#fde68a",
            }}
          >
            {exam}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1020px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <span
              style={{
                background: "#7c3aed",
                color: "#ffffff",
                borderRadius: "10px",
                padding: "8px 16px",
                fontSize: "18px",
                fontWeight: 800,
              }}
            >
              {subject}
            </span>
            <span
              style={{
                background: "rgba(16, 185, 129, 0.2)",
                color: "#6ee7b7",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                borderRadius: "10px",
                padding: "8px 16px",
                fontSize: "18px",
                fontWeight: 800,
              }}
            >
              {questions}
            </span>
          </div>

          <div
            style={{
              fontSize: title.length > 42 ? "44px" : "54px",
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid rgba(255,255,255,0.14)",
            paddingTop: "24px",
            fontSize: "18px",
            color: "#cbd5e1",
            fontWeight: 700,
          }}
        >
          <span>Temel Kurallar · Sık Yapılan Hatalar · Çözümlü Mini Test</span>
          <span style={{ color: "#fbbf24" }}>zigo.com.tr/konular</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
