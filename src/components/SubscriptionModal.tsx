"use client";

import { type Product } from "@capgo/native-purchases";
import { Loader2,X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { BillingService } from "@/services/billingService";

type SubscriptionModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  async function loadProducts() {
    setFetching(true);
    try {
      const fetchedProducts = await BillingService.fetchProducts();
      setProducts(fetchedProducts || []);
      if (fetchedProducts?.length > 0) {
        setSelectedProductId(fetchedProducts[0].identifier);
      }
    } catch (error: any) {
      toast.error(error.message || "Paketler yüklenemedi.");
    } finally {
      setFetching(false);
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
          // Reload page to reflect subscription status changes
          window.location.reload();
        } else {
          toast.error("Doğrulama başarısız. Lütfen destek ile iletişime geçin.", { id: "verify" });
        }
      } else {
        toast.error("Satın alma işlemi başarısız oldu (token bulunamadı).");
      }
    } catch (error: any) {
      toast.error(error.message || "Satın alma işlemi sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
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
              <Loader2 className="h-10 w-10 animate-spin text-[#1f4e9a]" />
              <p className="mt-4 text-sm text-slate-500">Paketler yükleniyor...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-3">
                {products.map((product) => (
                  <button
                    key={product.identifier}
                    onClick={() => setSelectedProductId(product.identifier)}
                    className={`flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all ${
                      selectedProductId === product.identifier
                        ? "border-[#1f4e9a] bg-blue-50/50"
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
                    <div className="text-lg font-black text-[#1f4e9a]">
                      {product.priceString}
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSubscribe}
                  disabled={loading || !selectedProductId}
                  className="flex w-full items-center justify-center rounded-xl bg-[#1f4e9a] py-4 font-bold text-white shadow-md transition-all hover:bg-[#173f80] disabled:opacity-50 disabled:cursor-not-allowed"
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
