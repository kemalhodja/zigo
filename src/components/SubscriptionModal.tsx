"use client";

import { type Product } from "@capgo/native-purchases";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { applyPromoCode, calculateDynamicPrice } from "@/lib/domain/subscription-campaign";
import { createClient } from "@/lib/supabase/client";
import { BillingService, PRODUCT_IDS } from "@/services/billingService";

type SubscriptionModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [isWithinTrial, setIsWithinTrial] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUserAndProducts();
    } else {
      setPromoCode("");
      setPromoApplied(false);
    }
  }, [isOpen]);

  async function loadUserAndProducts() {
    setFetching(true);
    try {
      // Get user created_at to determine trial window
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      let trialWindow = false;
      if (user?.created_at) {
        const { isWithinTrialWindow } = calculateDynamicPrice(100, user.created_at);
        trialWindow = isWithinTrialWindow;
        setIsWithinTrial(trialWindow);
      }

      const fetchedProducts = await BillingService.fetchProducts();
      setAllProducts(fetchedProducts || []);
      
      // Default to standard products
      const standardProducts = fetchedProducts.filter(
        p => p.identifier === PRODUCT_IDS.MONTHLY || p.identifier === PRODUCT_IDS.YEARLY
      );
      setDisplayedProducts(standardProducts);
      
      if (standardProducts.length > 0) {
        setSelectedProductId(standardProducts[0].identifier);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Paketler yüklenemedi.";
      toast.error(message);
    } finally {
      setFetching(false);
    }
  }

  function handleApplyPromo() {
    if (!promoCode.trim()) return;

    const result = applyPromoCode(100, promoCode, isWithinTrial);
    
    if (result.success) {
      toast.success(result.message);
      setPromoApplied(true);
      
      // Switch to 50% off products
      const discountProducts = allProducts.filter(
        p => p.identifier === PRODUCT_IDS.MONTHLY_50OFF || p.identifier === PRODUCT_IDS.YEARLY_50OFF
      );
      
      // Fallback to standard if discounted products are not available in the store yet
      if (discountProducts.length > 0) {
        setDisplayedProducts(discountProducts);
        setSelectedProductId(discountProducts[0].identifier);
      } else {
        toast.error("İndirimli paketler mağazada henüz aktif değil.");
        setPromoApplied(false);
      }
    } else {
      toast.error(result.message);
      setPromoApplied(false);
      
      // Revert to standard products
      const standardProducts = allProducts.filter(
        p => p.identifier === PRODUCT_IDS.MONTHLY || p.identifier === PRODUCT_IDS.YEARLY
      );
      setDisplayedProducts(standardProducts);
      if (standardProducts.length > 0) {
        setSelectedProductId(standardProducts[0].identifier);
      }
    }
  }

  async function handleSubscribe() {
    if (!selectedProductId) return;

    setLoading(true);
    try {
      const transaction = await BillingService.purchaseSubscription(selectedProductId);
      
      const purchaseToken = transaction.purchaseToken;
      if (purchaseToken) {
        toast.loading("Abonelik doğrulanıyor...", { id: "verify" });
        const isValid = await BillingService.verifyPurchase(purchaseToken, selectedProductId);
        
        if (isValid) {
          toast.success("Aboneliğiniz başarıyla tamamlandı!", { id: "verify" });
          onClose();
          window.location.reload();
        } else {
          toast.error("Doğrulama başarısız. Lütfen destek ile iletişime geçin.", { id: "verify" });
        }
      } else {
        toast.error("Satın alma işlemi başarısız oldu (token bulunamadı).");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Satın alma işlemi sırasında bir hata oluştu.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-800">Zigo Plus Aboneliği</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {fetching ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-[#1d4ed8]" />
              <p className="mt-4 text-sm text-slate-500">Paketler yükleniyor...</p>
            </div>
          ) : displayedProducts.length > 0 ? (
            <div className="space-y-4">
              
              {/* Promo Code Section */}
              {isWithinTrial && !promoApplied && (
                <div className="flex gap-2 rounded-xl bg-orange-50 p-3">
                  <input
                    type="text"
                    placeholder="Promosyon kodu (Örn: ZIGO50)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="flex-1 rounded-lg border border-orange-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 uppercase"
                  />
                  <button
                    onClick={handleApplyPromo}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-600"
                  >
                    Uygula
                  </button>
                </div>
              )}
              
              {promoApplied && (
                <div className="rounded-xl bg-green-50 p-3 text-center text-sm font-medium text-green-700 border border-green-200">
                  🎉 %50 İndirim kodunuz uygulandı!
                </div>
              )}

              <div className="space-y-3 pt-2">
                {displayedProducts.map((product) => (
                  <button
                    key={product.identifier}
                    onClick={() => setSelectedProductId(product.identifier)}
                    className={`flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all ${
                      selectedProductId === product.identifier
                        ? "border-[#2563eb] bg-blue-50/50 shadow-md"
                        : "border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div className="text-left">
                      <h3 className="font-bold text-slate-800">
                        {product.title || product.identifier.includes("yearly") ? "Yıllık Plan" : "Aylık Plan"}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {product.description || "Tüm Zigo Plus özelliklerine erişim"}
                      </p>
                    </div>
                    <div className="text-lg font-black text-[#1d4ed8]">
                      {product.priceString}
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSubscribe}
                  disabled={loading || !selectedProductId}
                  className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#1d4ed8] to-[#2563eb] py-4 font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      İşleniyor...
                    </>
                  ) : (
                    "Abone Ol"
                  )}
                </button>
                <p className="mt-4 text-center text-xs text-slate-400">
                  Otomatik yenilemeli abonelik. İstediğiniz zaman iptal edebilirsiniz.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500">
              Şu anda uygun abonelik paketi bulunamadı.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
