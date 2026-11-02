import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { isAndroidCapacitorUserAgent } from "@/lib/domain/billing-platform";

type AbonelikPageProps = {
  searchParams: Promise<{ planId?: string; role?: string; openPlay?: string }>;
};

export default async function AbonelikPage({ searchParams }: AbonelikPageProps) {
  const params = await searchParams;
  const reqHeaders = await headers();
  const isAndroidApp = isAndroidCapacitorUserAgent(reqHeaders.get("user-agent"));

  const query = new URLSearchParams();
  if (isAndroidApp) {
    query.set("openPlay", "1");
  }
  if (params.planId) query.set("planId", params.planId);
  if (params.role) query.set("role", params.role);

  const qs = query.toString();
  redirect(qs ? `/pricing?${qs}` : "/pricing");
}
