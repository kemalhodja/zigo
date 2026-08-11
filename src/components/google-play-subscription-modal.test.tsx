import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GooglePlaySubscriptionModal } from "./google-play-subscription-modal";

describe("GooglePlaySubscriptionModal", () => {
  it("renders the Google Play subscription panel with payment choices", () => {
    const html = renderToStaticMarkup(
      <GooglePlaySubscriptionModal
        isOpen
        onClose={() => undefined}
        onConfirm={() => undefined}
        selectedInterval="monthly"
      />,
    );

    expect(html).toContain("Google Play");
    expect(html).toContain("Aylık");
    expect(html).toContain("Yıllık");
    expect(html).toContain("Kod kullan");
    expect(html).toContain("Kart ekle");
    expect(html).toContain("Telefonunuzdan ödeyin");
  });
});
