import { redirect } from "next/navigation";

type SubscriptionPageProps = {
  searchParams: Promise<{ planId?: string; role?: string; openPlay?: string }>;
};

export default async function SubscriptionPage({ searchParams }: SubscriptionPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  query.set("openPlay", "1");
  if (params.planId) query.set("planId", params.planId);
  if (params.role) query.set("role", params.role);

  redirect(`/pricing?${query.toString()}`);
}
