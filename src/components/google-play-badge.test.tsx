import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GOOGLE_PLAY_STORE_URL, GooglePlayBadge } from "./google-play-badge";

describe("GooglePlayBadge component", () => {
  it("renders with correct default link and attributes", () => {
    const html = renderToStaticMarkup(<GooglePlayBadge />);
    expect(html).toContain(GOOGLE_PLAY_STORE_URL);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("Google Play");
  });

  it("renders with custom size and class", () => {
    const html = renderToStaticMarkup(
      <GooglePlayBadge size="lg" className="my-custom-badge" />,
    );
    expect(html).toContain("my-custom-badge");
    expect(html).toContain("Google Play");
    expect(html).toContain(GOOGLE_PLAY_STORE_URL);
  });
});
