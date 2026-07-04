import { describe, expect, it } from "vitest";

import {
  buildWhatsAppSupportUrl,
  formatSupportPhoneDisplay,
  isWhatsAppSupportVisible,
  normalizeWhatsAppPhone,
} from "@/lib/domain/support-contact";

describe("support-contact", () => {
  it("normalizes Turkish mobile numbers", () => {
    expect(normalizeWhatsAppPhone("5365647631")).toBe("905365647631");
    expect(normalizeWhatsAppPhone("05365647631")).toBe("905365647631");
    expect(normalizeWhatsAppPhone("+90 536 564 7631")).toBe("905365647631");
  });

  it("formats display phone", () => {
    expect(formatSupportPhoneDisplay("905365647631")).toBe("+90 536 564 7631");
  });

  it("builds wa.me links", () => {
    const url = buildWhatsAppSupportUrl("Merhaba");
    expect(url).toContain("https://wa.me/905365647631");
    expect(url).toContain(encodeURIComponent("Merhaba"));
  });

  it("hides support for students except setup context", () => {
    expect(isWhatsAppSupportVisible("student", "billing")).toBe(false);
    expect(isWhatsAppSupportVisible("parent", "billing")).toBe(true);
    expect(isWhatsAppSupportVisible("student", "setup")).toBe(true);
  });
});
