import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { matchAreaBySlug, slugifyEducationArea } from "@/lib/domain/education-area-slug";
import { getEducationAreas } from "@/lib/domain/profiles";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

type AreaLandingPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: AreaLandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const area = await resolveArea(slug);
  if (!area) {
    return { title: "Eğitim alanı · Zigo" };
  }
  return {
    title: `${area.area_name} · Zigo`,
    description: `${area.area_name} için doğrulanmış öğretmen içerikleri, kısa dersler ve quizler.`,
    openGraph: {
      title: `${area.area_name} · Zigo`,
      description: `${area.area_name} Match-Feed eğitim alanı.`,
    },
  };
}

export default async function AreaLandingPage({ params }: AreaLandingPageProps) {
  const { slug } = await params;
  const m = await getServerMessages();
  const area = await resolveArea(slug);
  if (!area) notFound();

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-crystal">Eğitim alanı</p>
      <h1 className="zigo-display font-black text-night">{area.area_name}</h1>
      <p className="text-sm font-semibold leading-6 text-slate-600">
        {area.age_group ? `${area.age_group} · ` : ""}
        Doğrulanmış öğretmen içerikleri, Match-Feed ve mikro öğrenme.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link className="tap-scale zigo-cta rounded-xl px-4 py-3 text-sm font-black text-white" href="/auth">
          {m.common.signIn}
        </Link>
        <Link className="tap-scale rounded-xl bg-slate-100 px-4 py-3 text-sm font-black text-night" href={`/explore?q=${encodeURIComponent(area.area_name)}`}>
          Keşfet
        </Link>
        <Link className="tap-scale rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-night" href="/onboarding">
          Alan seç
        </Link>
      </div>
    </main>
  );
}

async function resolveArea(slug: string) {
  if (!hasSupabaseEnv()) {
    const demo = [
      { id: 1, area_name: "LGS Matematik", age_group: "5-8. Sınıf" },
      { id: 2, area_name: "YKS Fizik", age_group: "9-12. Sınıf" },
    ];
    return matchAreaBySlug(demo, slug);
  }

  return withSupabaseFallback(async () => {
    const supabase = await createClient();
    const areas = await getEducationAreas(supabase);
    return matchAreaBySlug(areas, slug);
  }, null);
}

export async function generateStaticParams() {
  if (!hasSupabaseEnv()) {
    return [{ slug: "lgs-matematik" }, { slug: "yks-fizik" }];
  }
  try {
    const supabase = await createClient();
    const areas = await getEducationAreas(supabase);
    return areas.slice(0, 80).map((area) => ({ slug: slugifyEducationArea(area.area_name) }));
  } catch {
    return [];
  }
}
