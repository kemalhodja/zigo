/* global console, process */

function getVideoPlaybackUrl(storagePath) {
  const cdnBase = process.env.NEXT_PUBLIC_VIDEO_CDN_BASE?.trim().replace(/\/$/, "");
  if (cdnBase) {
    return `${cdnBase}/${storagePath.replace(/^\//, "")}`;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  if (!supabaseUrl || !storagePath) return storagePath;

  const normalized = storagePath.replace(/^\//, "");
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  return `${supabaseUrl}/storage/v1/object/public/social-media/${normalized}`;
}

function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? `: ${detail}` : ""}`);
  return ok;
}

function withEnv(vars, fn) {
  const previous = {};
  for (const [key, value] of Object.entries(vars)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function main() {
  const checks = [
    check(
      "CDN base prefixes storage path",
      withEnv({ NEXT_PUBLIC_VIDEO_CDN_BASE: "https://cdn.zigo.test", NEXT_PUBLIC_SUPABASE_URL: undefined }, () =>
        getVideoPlaybackUrl("lessons/fractions.mp4") === "https://cdn.zigo.test/lessons/fractions.mp4",
      ),
    ),
    check(
      "Supabase public URL fallback",
      withEnv({ NEXT_PUBLIC_VIDEO_CDN_BASE: undefined, NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co" }, () =>
        getVideoPlaybackUrl("demo/reel.mp4").includes("/storage/v1/object/public/social-media/demo/reel.mp4"),
      ),
    ),
    check("Absolute URLs pass through", getVideoPlaybackUrl("https://example.com/video.mp4") === "https://example.com/video.mp4"),
  ];

  process.exit(checks.every(Boolean) ? 0 : 1);
}

main();
