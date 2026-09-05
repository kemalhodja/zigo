import { redirect } from "next/navigation";

type BillingPageProps = {
  searchParams: Promise<{ planId?: string; role?: string; openPlay?: string }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.openPlay) query.set("openPlay", params.openPlay);
  if (params.planId) query.set("planId", params.planId);
  if (params.role) query.set("role", params.role);

  const queryString = query.toString();
  redirect(queryString ? `/pricing?${queryString}` : "/pricing");
}
