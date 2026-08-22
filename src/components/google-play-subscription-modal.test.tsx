import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GooglePlaySubscriptionModal } from "./google-play-subscription-modal";

describe("GooglePlaySubscriptionModal", () => {
  it("renders the Google Play subscription panel with payment choices", () => {
    const html = renderToStaticMarkup(
      <GooglePlaySubscriptionModal
        basePriceTry={98}
        isOpen
        onClose={() => undefined}
        onConfirm={() => undefined}
        selectedInterval="monthly"
      />,
    );

    expect(html).toContain("Abonelik Özeti");
    expect(html).toContain("Zigo Plus (Aylık)");
    expect(html).toContain("98");
    expect(html).not.toContain("Promosyon Kodu");
    expect(html).toContain("Başlangıç Tarihi:");
    expect(html).toContain("Bitiş Tarihi:");
  });

  it("applies the trial window discount badge", () => {
    const html = renderToStaticMarkup(
      <GooglePlaySubscriptionModal
        basePriceTry={98}
        isWithinTrialWindow
        isOpen
        onClose={() => undefined}
        onConfirm={() => undefined}
        selectedInterval="monthly"
      />,
    );

    expect(html).toContain("%50 indirim");
    expect(html).toContain("196");
  });
});
