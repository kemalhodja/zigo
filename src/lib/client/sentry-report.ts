"use client";

type SentryLikeScope = {
  setTag: (key: string, value: string) => void;
  setExtra: (key: string, value: unknown) => void;
};

declare global {
  interface Window {
    __zigoSentryReady?: boolean;
  }
}

function parseDsn(dsn: string) {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\//, "");
    const key = url.username;
    return { ingest: `${url.protocol}//${url.host}/api/${projectId}/store/`, key };
  } catch {
    return null;
  }
}

export function reportClientError(error: unknown, context?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  const target = parseDsn(dsn);
  if (!target) return;

  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  void fetch(target.ingest, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${target.key}`,
    },
    body: JSON.stringify({
      event_id: crypto.randomUUID().replaceAll("-", ""),
      platform: "javascript",
      timestamp: new Date().toISOString(),
      level: "error",
      message,
      exception: stack ? { values: [{ type: "Error", value: message, stacktrace: { frames: [] } }] } : undefined,
      extra: context ?? {},
      tags: { surface: "zigo-web" },
    }),
  }).catch(() => {
    // ignore transport failures
  });
}

export function withErrorScope(scope: SentryLikeScope, error: unknown, context?: Record<string, unknown>) {
  if (context) {
    for (const [key, value] of Object.entries(context)) {
      scope.setExtra(key, value);
    }
  }
  reportClientError(error, context);
}
