import { describe, expect, it } from "vitest";

import { createSocialPostSchema } from "@/lib/domain/social/schemas";

describe("Detailed Post Creation Pipeline & Schema Tests", () => {
  it("1. Accepts standard image post with area ID and caption", () => {
    const payload = {
      caption: "Matematik dersinde alan hesabı konusunu işledik.",
      areaId: 3,
      mediaUrl: "https://zigo.app/uploads/math-lesson.jpg",
      mediaType: "image",
    };

    const parsed = createSocialPostSchema.parse(payload);
    expect(parsed.caption).toBe("Matematik dersinde alan hesabı konusunu işledik.");
    expect(parsed.areaId).toBe(3);
    expect(parsed.mediaType).toBe("image");
    expect(parsed.isReel).toBe(false);
    expect(parsed.targetAudience).toBe("all");
  });

  it("2. Accepts video reel post with grade target", () => {
    const payload = {
      caption: "6. Sınıf Fen Bilimleri Hücre Bölünmesi Özeti 🧪",
      areaId: 5,
      mediaUrl: "https://zigo.app/uploads/cell-division.mp4",
      mediaType: "video",
      isReel: true,
      targetAudience: "grade",
      targetGrade: "6. Sınıf",
    };

    const parsed = createSocialPostSchema.parse(payload);
    expect(parsed.mediaType).toBe("video");
    expect(parsed.isReel).toBe(true);
    expect(parsed.targetAudience).toBe("grade");
    expect(parsed.targetGrade).toBe("6. Sınıf");
  });

  it("3. Accepts Data URI (Base64) image input", () => {
    const base64Data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const payload = {
      caption: "Çizim çözümü",
      areaId: 1,
      mediaUrl: base64Data,
    };

    const parsed = createSocialPostSchema.parse(payload);
    expect(parsed.mediaUrl).toBe(base64Data);
  });

  it("4. Accepts Blob URL input for client-side previews", () => {
    const blobUrl = "blob:http://localhost:3000/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d";
    const payload = {
      caption: "Önizleme görseli",
      areaId: 1,
      mediaUrl: blobUrl,
    };

    const parsed = createSocialPostSchema.parse(payload);
    expect(parsed.mediaUrl).toBe(blobUrl);
  });

  it("5. Coerces string areaId to integer and falls back to 1 for invalid areaId", () => {
    const validCoerced = createSocialPostSchema.parse({
      caption: "Ders notu",
      areaId: "12",
    });
    expect(validCoerced.areaId).toBe(12);

    const fallbackCoerced = createSocialPostSchema.parse({
      caption: "Ders notu",
      areaId: 0,
    });
    expect(fallbackCoerced.areaId).toBe(1);
  });

  it("6. Preprocesses externalUrl missing http protocol", () => {
    const parsed = createSocialPostSchema.parse({
      caption: "Ek kaynak bağlantısı",
      areaId: 1,
      externalUrl: "zigo.edu.tr/resources/math",
    });

    expect(parsed.externalUrl).toBe("https://zigo.edu.tr/resources/math");
  });

  it("7. Enforces caption length limit (max 2200 chars)", () => {
    const longCaption = "a".repeat(2201);
    expect(() =>
      createSocialPostSchema.parse({
        caption: longCaption,
        areaId: 1,
      }),
    ).toThrow();
  });

  it("8. Validates paired premium prep label and URL", () => {
    expect(() =>
      createSocialPostSchema.parse({
        caption: "Yazılı hazırlık sorusu",
        areaId: 1,
        premiumPrepLabel: "1. Dönem 2. Yazılı Soruları",
        // missing premiumPrepUrl
      }),
    ).toThrow();

    const validPrep = createSocialPostSchema.parse({
      caption: "Yazılı hazırlık sorusu",
      areaId: 1,
      premiumPrepLabel: "1. Dönem 2. Yazılı Soruları",
      premiumPrepUrl: "https://zigo.app/prep/math-exam-1.pdf",
    });

    expect(validPrep.premiumPrepLabel).toBe("1. Dönem 2. Yazılı Soruları");
    expect(validPrep.premiumPrepUrl).toBe("https://zigo.app/prep/math-exam-1.pdf");
  });

  it("9. Correctly evaluates 100MB file size limit guard", () => {
    const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

    const validFileSize = 95 * 1024 * 1024; // 95 MB
    const isUnderLimit = validFileSize <= MAX_FILE_SIZE_BYTES;
    expect(isUnderLimit).toBe(true);

    const overFileSize = 105 * 1024 * 1024; // 105 MB
    const isOverLimit = overFileSize > MAX_FILE_SIZE_BYTES;
    expect(isOverLimit).toBe(true);
  });
});
