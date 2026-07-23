/* global console, process, fetch */

/**
 * Probes production origins used by Zigo web + Capacitor.
 * Detects ERR_CONNECTION_CLOSED-style TLS failures on the custom domain.
 */

const CANONICAL = process.env.ZIGO_CANONICAL_DOMAIN?.trim() || "https://zigo.app";
const FALLBACK = process.env.ZIGO_HOSTED_FALLBACK_URL?.trim() || "https://zigo-kohl.vercel.app";
const EXTRA = (process.env.ZIGO_EXTRA_ORIGINS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

async function probe(origin) {
  const url = origin.replace(/\/$/, "");
  const started = Date.now();
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "text/html,*/*" },
    });
    return {
      origin: url,
      ok: response.status > 0,
      status: response.status,
      ms: Date.now() - started,
      error: null,
    };
  } catch (error) {
    return {
      origin: url,
      ok: false,
      status: 0,
      ms: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const targets = [...new Set([CANONICAL, FALLBACK, ...EXTRA, `https://www.${new URL(CANONICAL).hostname}`])];
  const results = [];
  for (const target of targets) {
    results.push(await probe(target));
  }

  let failed = 0;
  for (const result of results) {
    if (result.ok) {
      console.log(`PASS ${result.origin} HTTP ${result.status} (${result.ms}ms)`);
    } else {
      failed += 1;
      console.error(`FAIL ${result.origin}: ${result.error ?? "unreachable"} (${result.ms}ms)`);
    }
  }

  const canonical = results.find((item) => item.origin === CANONICAL.replace(/\/$/, ""));
  const fallback = results.find((item) => item.origin === FALLBACK.replace(/\/$/, ""));

  if (canonical && !canonical.ok && fallback?.ok) {
    console.error("");
    console.error("Custom domain TLS/DNS is down (ERR_CONNECTION_CLOSED).");
    console.error(`Use ${FALLBACK} for CAPACITOR_SERVER_URL / NEXT_PUBLIC_SITE_URL until DNS points at Vercel.`);
    console.error("See docs/domain-dns-fix.md");
  }

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
