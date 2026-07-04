import Link from "next/link";

import { StoreProductCard } from "@/components/store-product-card";
import { StoreVisitTracker } from "@/components/store-visit-tracker";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { getChildProfiles } from "@/lib/domain/children";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getStoreProducts, getUserStoreRedemptions } from "@/lib/domain/store";
import { getServerMessages, type Messages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

type StorePageProps = {
  searchParams: Promise<{ category?: string; q?: string }>;
};

const STORE_CATEGORY_IDS = ["all", "digital_avatar", "book", "question_bank", "experience", "stationery"] as const;
type StoreCategoryFilter = (typeof STORE_CATEGORY_IDS)[number];

const demoProducts = [
  {
    id: "demo-crystal-cap",
    name: "Crystal Cap",
    description: "A profile-ready avatar hat for students who finish verified Micro lessons.",
    category: "digital_avatar",
    price: 80,
    badge: "Avatar",
    accent: "from-crystal to-fuchsia-500",
  },
  {
    id: "demo-book-coupon",
    name: "Book Coupon",
    description: "Parent-approved real-world reward for consistent learning streaks.",
    category: "book",
    price: 220,
    badge: "Parent approval",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    id: "demo-study-owl",
    name: "Study Owl Pet",
    description: "A playful companion for the student profile and learning feed.",
    category: "digital_avatar",
    price: 140,
    badge: "Pet",
    accent: "from-amber-400 to-orange-500",
  },
];

export default async function StorePage({ searchParams }: StorePageProps) {
  const m = await getServerMessages();
  const s = m.store;
  const storeCategories = [
    { id: "all" as const, label: m.common.all },
    { id: "digital_avatar" as const, label: s.avatar },
    { id: "book" as const, label: s.books },
    { id: "question_bank" as const, label: s.questionBank },
    { id: "experience" as const, label: s.experiences },
    { id: "stationery" as const, label: s.stationery },
  ];
  const statusLabels: Record<string, string> = {
    pending_parent_approval: s.waitingApproval,
    approved: s.approved,
    fulfilled: s.fulfilled,
    cancelled: s.cancelled,
  };
  const params = await searchParams;
  const activeCategory = getStoreCategory(params.category);
  const query = params.q?.trim() ?? "";

  if (!hasSupabaseEnv()) {
    return <StorePreview mode="preview" messages={m} />;
  }

  const previewFallback = <StorePreview mode="preview" messages={m} />;

  return withSupabaseFallback(async () => {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    return <StorePreview mode="signed-out" messages={m} />;
  }

  if (profile.role === "teacher") {
    return <StorePreview mode="teacher" messages={m} />;
  }

  const [products, redemptions, childrenProfiles] = await Promise.all([
    getStoreProducts(supabase),
    getUserStoreRedemptions(supabase),
    profile.role === "parent" ? getChildProfiles(supabase) : Promise.resolve([]),
  ]);
  const storeMode = profile.role === "parent" ? "parent" : "student";
  const filteredProducts = filterStoreProducts(products, activeCategory, query);
  const walletPoints =
    profile.role === "student"
      ? profile.total_points
      : childrenProfiles.reduce((total, child) => total + child.total_points, 0);
  const featuredProduct = filteredProducts[0] ?? products[0];

  if (profile.role === "parent" && childrenProfiles.length === 0) {
    return <StorePreview mode="parent-empty" messages={m} />;
  }

  return (
    <div className="space-y-5">
      <StoreVisitTracker />
      <section className="-mx-4 border-b border-pink-100 bg-white px-4 pb-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{s.title}</p>
        <h2 className="mt-1 text-2xl font-black text-night">{s.subtitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Avatar items and parent-approved rewards use the same Zigo points earned from learning.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <StoreStat label={s.avatar} value={products.filter((product) => product.category === "digital_avatar").length} />
          <StoreStat label={s.parent} value={products.filter((product) => product.requires_parent_approval).length} />
          <StoreStat label={s.rewardHistory} value={redemptions.length} />
        </div>
      </section>

      <StoreWalletHero
        approvalCount={products.filter((product) => product.requires_parent_approval).length}
        featuredName={featuredProduct?.name ?? "Crystal Cap"}
        featuredPrice={featuredProduct?.price_points ?? 80}
        messages={m}
        walletPoints={walletPoints}
      />

      {profile.role === "student" ? (
        <section className="-mx-4 bg-gradient-to-r from-crystal via-berry to-aqua px-4 py-4 text-white">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/75">
            {s.studentBalance}
          </p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <h3 className="text-4xl font-black">{profile.total_points}</h3>
            <span className="rounded-lg bg-white px-3 py-2 text-xs font-black text-night">{m.common.points}</span>
          </div>
        </section>
      ) : (
        <section className="grid gap-3">
          {childrenProfiles.map((child) => (
            <div className="-mx-4 bg-gradient-to-r from-violet-50 via-pink-50 to-cyan-50 px-4 py-4" key={child.id}>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-crystal">
                {child.age_group ?? m.common.childProfile}
              </p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <h3 className="text-2xl font-black text-night">{child.display_name}</h3>
                <span className="rounded-lg bg-violet-100 px-4 py-2 text-sm font-black text-crystal">
                  {child.total_points} {m.common.points}
                </span>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="-mx-4 space-y-3 bg-white px-4 py-3">
        <form action="/store" className="relative">
          {activeCategory !== "all" ? <input name="category" type="hidden" value={activeCategory} /> : null}
          <svg aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          <input
            className="w-full rounded-lg bg-slate-100 px-9 py-2.5 text-sm font-bold text-night outline-none focus:bg-white focus:ring-2 focus:ring-violet-100"
            defaultValue={query}
            name="q"
            placeholder={s.searchPlaceholder}
          />
        </form>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {storeCategories.map((category) => (
            <Link
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-black ${
                activeCategory === category.id ? "zigo-tab-active" : "bg-violet-50 text-slate-700"
              }`}
              href={getStoreHref(category.id, query)}
              key={category.id}
            >
              {category.label}
            </Link>
          ))}
        </div>
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-700">
          {s.parentApprovalRequired}
        </p>
      </section>

      <StoreApprovalCheckpoint approvalCount={products.filter((product) => product.requires_parent_approval).length} messages={m} />

      <section className="space-y-3">
        {filteredProducts.length === 0 ? (
          <section className="-mx-4 bg-white px-6 py-12 text-center">
            <p className="text-sm font-black text-night">{s.noRewards}</p>
            <p className="mx-auto mt-1 max-w-64 text-sm font-bold leading-6 text-slate-500">
              {s.earnPoints}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link className="tap-scale rounded-lg bg-slate-100 px-4 py-3 text-sm font-black text-night" href="/store">
                {m.common.clearFilters}
              </Link>
              <Link className="tap-scale zigo-cta tap-scale rounded-lg px-4 py-3 text-sm font-black text-white" href="/learn">
                {s.earnPoints}
              </Link>
            </div>
          </section>
        ) : (
          filteredProducts.map((product) => (
            <StoreProductCard
              childrenProfiles={childrenProfiles}
              key={product.id}
              mode={storeMode}
              product={product}
            />
          ))
        )}
      </section>

      <section className="-mx-4 space-y-3 bg-white px-4 py-4">
        <h3 className="text-xl font-black text-night">{s.rewardHistory}</h3>
        {redemptions.length === 0 ? (
          <div className="rounded-lg bg-slate-50 px-4 py-5 text-center">
            <p className="text-sm font-black text-night">{s.noRedemptions}</p>
            <p className="mx-auto mt-1 max-w-64 text-sm font-bold leading-6 text-slate-500">
              Redeemed avatar items and parent-approved rewards will appear here.
            </p>
          </div>
        ) : (
          redemptions.slice(0, 8).map((redemption) => (
            <div className="rounded-lg bg-slate-50 p-4" key={redemption.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-night">
                    {redemption.product?.name ?? "Reward"}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {statusLabels[redemption.status] ?? redemption.status}
                  </p>
                </div>
                <span className="rounded-lg bg-violet-100 px-3 py-1 text-xs font-black text-crystal">
                  -{redemption.points_spent}
                </span>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
  }, previewFallback);
}

function StoreWalletHero({
  approvalCount,
  featuredName,
  featuredPrice,
  messages,
  walletPoints,
}: {
  approvalCount: number;
  featuredName: string;
  featuredPrice: number;
  messages: Messages;
  walletPoints: number;
}) {
  const s = messages.store;
  return (
    <section className="-mx-4 overflow-hidden border-y border-violet-100 bg-white">
      <div className="bg-gradient-to-br from-night via-violet-900 to-crystal px-4 py-5 text-white">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/65">{s.crystalWallet}</p>
        <h2 className="mt-2 text-3xl font-black leading-tight">
          {s.walletDesc}
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <StoreHeroStat label="wallet" value={walletPoints} />
          <StoreHeroStat label="featured" value={featuredPrice} />
          <StoreHeroStat label="approval" value={approvalCount} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{s.featured}</p>
          <p className="zigo-fit-text mt-1 text-lg font-black text-night">{featuredName}</p>
        </div>
        <Link className="tap-scale zigo-cta tap-scale rounded-lg px-4 py-3 text-xs font-black text-white" href="/learn">
          {s.earnMore}
        </Link>
      </div>
    </section>
  );
}

function StoreHeroStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="zigo-stat-chip rounded-xl bg-white/14 px-2 py-2 backdrop-blur">
      <p className="text-lg font-black">{value}</p>
      <p className="zigo-fit-text mt-0.5 text-[0.65rem] font-black uppercase tracking-[0.08em] text-white/75">{label}</p>
    </div>
  );
}

function StoreApprovalCheckpoint({ approvalCount, messages }: { approvalCount: number; messages: Messages }) {
  const s = messages.store;
  const steps = [s.request, s.parent, s.approve];

  return (
    <section className="-mx-4 border-y border-amber-100 bg-amber-50 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">{s.parentCheckpoint}</p>
          <h2 className="mt-1 text-lg font-black text-night">{approvalCount} {s.pendingApproval}</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-amber-800">
            {s.parentApprovalRequired}
          </p>
        </div>
        <Link className="tap-scale shrink-0 zigo-cta tap-scale rounded-lg px-4 py-3 text-xs font-black text-white" href="/parent">
          {s.parent}
        </Link>
      </div>
      <div className="zigo-action-grid mt-3 text-amber-800">
        {steps.map((step, index) => (
          <div className="zigo-stat-chip rounded-xl bg-white" key={step}>
            <span className="mx-auto flex size-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              {index + 1}
            </span>
            <p className="mt-2 font-black">{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StoreStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-gradient-to-br from-violet-50 to-pink-50 p-3 text-center">
      <p className="text-lg font-black text-crystal">{value}</p>
      <p className="mt-0.5 text-[0.62rem] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
    </div>
  );
}

function filterStoreProducts<T extends { category: string; description: string; name: string }>(
  products: T[],
  category: StoreCategoryFilter,
  query: string,
) {
  const byCategory = category === "all" ? products : products.filter((product) => product.category === category);
  if (!query) return byCategory;
  const normalizedQuery = query.toLowerCase();
  return byCategory.filter((product) =>
    `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(normalizedQuery),
  );
}

function getStoreCategory(value?: string): StoreCategoryFilter {
  return STORE_CATEGORY_IDS.includes(value as StoreCategoryFilter) ? (value as StoreCategoryFilter) : "all";
}

function getStoreHref(category: StoreCategoryFilter, query: string) {
  const search = new URLSearchParams();
  if (category !== "all") search.set("category", category);
  if (query) search.set("q", query);
  const suffix = search.toString();
  return suffix ? `/store?${suffix}` : "/store";
}

async function StorePreview({ mode, messages }: { mode: "preview" | "signed-out" | "teacher" | "parent-empty"; messages: Messages }) {
  const s = messages.store;
  const note = {
    preview: s.walletDesc,
    "signed-out": s.signInRedeem,
    teacher: s.instantDigital,
    "parent-empty": s.createChild,
  }[mode];

  return (
    <div className="space-y-5 pb-3">
      <StoreVisitTracker />
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{s.title}</p>
        <h1 className="mt-1 text-2xl font-black leading-tight text-night">{s.subtitleAvatar}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{note}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-lg font-black">340</p>
            <p className="text-[0.62rem] font-black text-slate-500">{messages.common.points}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-lg font-black">7</p>
            <p className="text-[0.62rem] font-black text-slate-500">streak</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-lg font-black">3</p>
            <p className="text-[0.62rem] font-black text-slate-500">items</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        {demoProducts.map((product) => (
          <article className="-mx-4 border-b border-slate-100 bg-white" key={product.id}>
            <div className={`bg-gradient-to-br ${product.accent} px-4 py-5 text-white`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="rounded-lg bg-white/20 px-3 py-1 text-xs font-black backdrop-blur">
                    {product.badge === "Parent approval" ? messages.store.parentApprovalBadge : product.badge}
                  </span>
                  <h2 className="mt-4 text-2xl font-black">{product.name}</h2>
                </div>
                <span className="rounded-lg bg-black/20 px-4 py-3 text-center text-sm font-black text-white backdrop-blur">
                  {product.price}
                  <span className="block text-[0.58rem] text-white/70">Zigo</span>
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/85">{product.description}</p>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                {product.category.replaceAll("_", " ")}
              </span>
              <Link className="tap-scale zigo-cta tap-scale rounded-lg px-4 py-2 text-xs font-black text-white" href="/micro">
                {s.earnPoints}
              </Link>
            </div>
          </article>
        ))}
      </section>
      {mode === "signed-out" || mode === "parent-empty" ? (
        <Link
          className="tap-scale block zigo-cta tap-scale rounded-lg px-4 py-3 text-center text-sm font-black text-white"
          href={mode === "signed-out" ? "/auth?next=/store" : "/family"}
        >
          {mode === "signed-out" ? s.signInRedeem : s.createChild}
        </Link>
      ) : null}
    </div>
  );
}
