export type SocialFeedCursor = {
  createdAt: string;
  id: string;
};

export function encodeFeedCursor(cursor: SocialFeedCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeFeedCursor(raw?: string | null): SocialFeedCursor | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as SocialFeedCursor;
    if (typeof parsed.createdAt !== "string" || typeof parsed.id !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}
