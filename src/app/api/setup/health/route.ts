import { getLiveGates } from "@/lib/domain/live-gates";
import { isPushConfigured } from "@/lib/domain/push-notifications";
import { isAdaptiveStreamingEnabled } from "@/lib/domain/video-delivery";

export const APP_VERSION = "1.0.0";
export const MIGRATION_TARGET = 55;

export async function GET() {
  try {
    const report = await getLiveGates();
    const videoCdnConfigured = Boolean(process.env.NEXT_PUBLIC_VIDEO_CDN_BASE?.trim());
    const pushConfigured = isPushConfigured();

    return Response.json({
      data: {
        ...report,
        appVersion: APP_VERSION,
        migrationTarget: MIGRATION_TARGET,
        complianceEnabled: true,
        videoCdnConfigured,
        videoHlsEnabled: isAdaptiveStreamingEnabled(),
        pushConfigured,
        status: report.readyCount === report.totalCount && report.totalCount > 0 ? "healthy" : "degraded",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Live gate probe failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
