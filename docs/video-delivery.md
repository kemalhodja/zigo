# Video delivery (Micro lessons)

Zigo Micro lessons use `posts.media_url` for short-form education video. Current MVP stores URLs in PostgreSQL and serves them directly in the feed and `/micro` player.

## Recommended production path

1. **Upload**: Teachers upload via `/create?mode=micro` → Supabase Storage bucket (see migration `009_social_storage.sql`).
2. **Transform**: For scale, front Supabase Storage or a CDN (Cloudflare, Mux, or Cloudinary) with adaptive bitrate HLS.
3. **Playback**: Keep the 60-second minimum watch gate in `reel-learning-points.tsx` before awarding +10 points.
4. **Match-Feed**: Every Micro must set `posts.area_id` so only interested students/parents see it.

## Local development

- Seed content in migration `017_mvp_seed_content.sql` uses placeholder media URLs.
- No CDN is required for local QA; use short MP4/WebM files under 30 MB in Storage.

## Future enhancements (not in MVP)

- Signed URLs with expiry for premium-only Micro catalog (Zigo Plus).
- Offline cache for PWA (limited to approved lesson IDs).
- AI transcript + age-safe caption moderation before publish.
