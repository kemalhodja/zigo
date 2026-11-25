import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const ROLE_LABELS: Record<string, string> = {
  teacher: "Doğrulanmış Öğretmen",
  education_institution: "Eğitim Kurumu",
  education_platform: "Eğitim Platformu",
  publisher: "Yayınevi",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = (searchParams.get("name") || "Zigo Eğitmeni").slice(0, 60);
  const roleKey = searchParams.get("role") || "teacher";
  const roleLabel = ROLE_LABELS[roleKey] || "Doğrulanmış Eğitmen";
  const branches = (searchParams.get("branches") || "LGS · YKS · Ders İçerikleri").slice(0, 80);
  const followers = searchParams.get("followers") || "0";
  const posts = searchParams.get("posts") || "0";
  const initial = name.trim().charAt(0).toUpperCase() || "Z";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #090d1f 0%, #1e1b4b 52%, #4c1d95 100%)",
          padding: "56px 72px",
          fontFamily: "system-ui, sans-serif",
          color: "#ffffff",
        }}
      >
        {/* Top bar */}
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
                width: "54px",
                height: "54px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #7c3aed, #f59e0b)",
                fontSize: "28px",
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
                Güvenli Eğitim Sosyal Ağı
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(251, 191, 36, 0.16)",
              border: "1px solid rgba(251, 191, 36, 0.45)",
              borderRadius: "999px",
              padding: "10px 22px",
              fontSize: "18px",
              fontWeight: 800,
              color: "#fde68a",
            }}
          >
            ✓ {roleLabel}
          </div>
        </div>

        {/* Center profile card */}
        <div style={{ display: "flex", alignItems: "center", gap: "36px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "148px",
              height: "148px",
              borderRadius: "36px",
              background: "linear-gradient(135deg, #8b5cf6, #ec4899, #f59e0b)",
              border: "4px solid rgba(255,255,255,0.28)",
              fontSize: "64px",
              fontWeight: 900,
              color: "#ffffff",
            }}
          >
            {initial}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "820px" }}>
            <div
              style={{
                fontSize: name.length > 26 ? "46px" : "56px",
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              {name}
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#ddd6fe",
              }}
            >
              {branches}
            </div>
            <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
              <span
                style={{
                  background: "rgba(255,255,255,0.12)",
                  borderRadius: "12px",
                  padding: "8px 18px",
                  fontSize: "18px",
                  fontWeight: 800,
                }}
              >
                {followers} Takipçi
              </span>
              <span
                style={{
                  background: "rgba(255,255,255,0.12)",
                  borderRadius: "12px",
                  padding: "8px 18px",
                  fontSize: "18px",
                  fontWeight: 800,
                }}
              >
                {posts} İçerik &amp; Ders
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid rgba(255,255,255,0.16)",
            paddingTop: "24px",
            fontSize: "18px",
            color: "#cbd5e1",
            fontWeight: 700,
          }}
        >
          <span>Soru Çözümü · Kısa Dersler · Özel Ders Talebi</span>
          <span style={{ color: "#fbbf24" }}>www.zigo.com.tr</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
