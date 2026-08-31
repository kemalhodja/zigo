"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type TrialSubscription = {
  isTrial: boolean;
  trialDaysRemaining: number;
  isLoading: boolean;
};

// SWR-like global cache: 5dk stale, deduped fetch, tüm mount'lar paylaşır
let trialCache: TrialSubscription | null = null;
let trialCacheAt = 0;
let trialInflight: Promise<TrialSubscription> | null = null;
const TRIAL_CACHE_TTL = 5 * 60 * 1000;

async function fetchTrialStatusUncached(): Promise<TrialSubscription> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isTrial: false, trialDaysRemaining: 0, isLoading: false };

  const { data } = await supabase
    .from("user_subscriptions")
    .select("tier, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  const tier = (data?.tier ?? "free") as "free" | "zigo_plus";
  const periodEnd = data?.current_period_end ? new Date(data.current_period_end) : null;
  const isActivePaidPremium = tier === "zigo_plus" && (!periodEnd || periodEnd.getTime() > Date.now());
  if (isActivePaidPremium) return { isTrial: false, trialDaysRemaining: 0, isLoading: false };

  const { data: userData } = await supabase.from("users").select("created_at").eq("id", user.id).maybeSingle();
  if (!userData?.created_at) return { isTrial: false, trialDaysRemaining: 0, isLoading: false };
  const diffDays = Math.floor((Date.now() - new Date(userData.created_at).getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) return { isTrial: true, trialDaysRemaining: Math.max(0, 7 - diffDays), isLoading: false };
  return { isTrial: false, trialDaysRemaining: 0, isLoading: false };
}

function useTrialStatus(): TrialSubscription {
  const [subscription, setSubscription] = useState<TrialSubscription>(() => {
    if (trialCache && Date.now() - trialCacheAt < TRIAL_CACHE_TTL) return trialCache;
    return { isTrial: false, trialDaysRemaining: 0, isLoading: true };
  });
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;
    const isStale = !trialCache || Date.now() - trialCacheAt >= TRIAL_CACHE_TTL;

    async function load() {
      try {
        if (!trialInflight) {
          trialInflight = fetchTrialStatusUncached().finally(() => {
            setTimeout(() => { trialInflight = null; }, 0);
          });
        }
        const fresh = await trialInflight;
        trialCache = fresh;
        trialCacheAt = Date.now();
        if (mounted) setSubscription(fresh);
      } catch {
        if (mounted) setSubscription({ isTrial: false, trialDaysRemaining: 0, isLoading: false });
      }
    }

    if (isStale) void load();
    else if (trialCache) setSubscription(trialCache);

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      trialCache = null;
      trialInflight = null;
      void load();
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  return subscription;
}

export function TrialBanner({ 
  onDismiss, 
  showDismiss = true,
  variant = "top" 
}: { 
  onDismiss?: () => void;
  showDismiss?: boolean;
  variant?: "top" | "inline";
}) {
  const { isTrial, trialDaysRemaining, isLoading } = useTrialStatus();
  const [dismissed, setDismissed] = useState(false);
  const [dismissUntil, setDismissUntil] = useState<Date | null>(null);

  useEffect(() => {
    if (dismissUntil && new Date() < dismissUntil) {
      setDismissed(true);
    }
  }, [dismissUntil]);

  if (isLoading || !isTrial || dismissed) {
    return null;
  }

  if (trialDaysRemaining <= 0) {
    return null;
  }

  const handleDismiss = () => {
    if (onDismiss) onDismiss();
    if (showDismiss) {
      setDismissed(true);
      const until = new Date();
      until.setHours(23, 59, 59, 999);
      setDismissUntil(until);
    }
  };

  if (variant === "inline") {
    return (
      <div className="-mx-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-4 py-3 text-white shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg">⏳</span>
            <div>
              <p className="font-black text-sm">Deneme süreniz: <span className="text-white">{trialDaysRemaining}</span> gün kaldı</p>
              <p className="text-xs font-bold opacity-90">İlk 7 gün içinde abone olursanız %50 indirim (ZIGO50)</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="tap-scale shrink-0 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-black text-white hover:bg-white/30 transition-colors"
          >
            Abone Ol
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-4 py-2.5 text-white shadow-lg animate-in slide-in-from-top-2">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-base">⏳</span>
          <div>
            <p className="font-black text-sm">Deneme süreniz: <span className="text-white">{trialDaysRemaining}</span> gün kaldı</p>
            <p className="text-[0.7rem] font-bold opacity-90">İlk 7 gün içinde abone olursanız %50 indirim (ZIGO50)</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDismiss}
            className="tap-scale shrink-0 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-black text-white hover:bg-white/30 transition-colors"
          >
            Abone Ol
          </button>
          {showDismiss && (
            <button
              onClick={handleDismiss}
              className="tap-scale shrink-0 rounded-lg p-1.5 text-white/80 hover:text-white transition-opacity"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function TrialBadge({ 
  variant = "compact" 
}: { 
  variant?: "compact" | "full";
}) {
  const { isTrial, trialDaysRemaining } = useTrialStatus();
  
  if (!isTrial) return null;
  
  if (trialDaysRemaining <= 0) return null;

  if (variant === "full") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
        <span className="flex h-4 w-4 items-center justify-center">⏳</span>
        <span>Deneme: {trialDaysRemaining} gün</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[0.6rem] font-black text-white">
      <span>⏳</span>
      <span>{trialDaysRemaining} gün</span>
    </span>
  );
}