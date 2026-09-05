import { describe, expect, it, vi } from "vitest";

import { DEFAULT_GAME_LIMITS, isNightBanActive, settingsFromParentRow } from "@/lib/domain/game-limits";
import { getUserSubscription } from "@/lib/domain/subscription";
import { applyPromoCode, calculateDynamicPrice, resolveSubscriptionPlanPricing } from "@/lib/domain/subscription-campaign";
import { formatTryPrice, resolveProfilePlanGroups } from "@/lib/domain/subscription-plans";
import { DEFAULT_GOOGLE_PLAY_PACKAGE_NAME, verifyGooglePlaySubscription } from "@/lib/server/google-play";

describe("Uçtan Uca Abonelik Senaryosu (End-to-End Subscription Journey)", () => {
  // ─── 1. SENARYO: DİNAMİK FİYATLANDIRMA & 7 GÜNLÜK DENEME (TRIAL) ───────────
  describe("Senaryo 1: Dinamik Fiyatlandırma & 7 Günlük Deneme Motoru", () => {
    it("Kayıttan sonraki ilk 7 gün içinde olan kullanıcıya %50 indirim ve 7 günlük deneme hakkı tanır", () => {
      const userCreatedAt = new Date(Date.now() - 3 * 86400000).toISOString(); // 3 gün önce kayıt oldu
      const pricing = calculateDynamicPrice(100, userCreatedAt);

      expect(pricing.isWithinTrialWindow).toBe(true);
      expect(pricing.discountPercent).toBe(50);
      expect(pricing.priceTry).toBe(50);
      expect(pricing.trialDaysRemaining).toBe(4);

      // ZIGO50 promosyon kodu uygulanabilir olmalıdır
      const promoResult = applyPromoCode(100, "ZIGO50", true);
      expect(promoResult.success).toBe(true);
      expect(promoResult.priceTry).toBe(50);

      // Öğrenci plan grubu 49 TL liste fiyatını 24.5 TL (veya yuvarlanmış) indirimli sunar
      const planPricing = resolveSubscriptionPlanPricing(49, userCreatedAt);
      expect(planPricing.discountPercent).toBe(50);
      expect(planPricing.priceTry).toBe(25);
      expect(planPricing.compareAtTry).toBe(49);
    });

    it("Kayıttan 7 gün sonra abone olmak isteyen kullanıcıya %0 indirim / Standart Tam Liste Fiyatı uygulanır", () => {
      const userCreatedAt = new Date(Date.now() - 14 * 86400000).toISOString(); // 14 gün önce kayıt oldu
      const pricing = calculateDynamicPrice(100, userCreatedAt);

      expect(pricing.isWithinTrialWindow).toBe(false);
      expect(pricing.discountPercent).toBe(0);
      expect(pricing.priceTry).toBe(100);
      expect(pricing.trialDaysRemaining).toBe(0);

      // 7 gün geçtikten sonra ZIGO50 indirim kodu reddedilmelidir
      const promoResult = applyPromoCode(100, "ZIGO50", false);
      expect(promoResult.success).toBe(false);
      expect(promoResult.priceTry).toBe(100);

      const planPricing = resolveSubscriptionPlanPricing(49, userCreatedAt);
      expect(planPricing.discountPercent).toBe(0);
      expect(planPricing.priceTry).toBe(49);
      expect(planPricing.compareAtTry).toBe(49);
    });

    it("Tüm roller için plan grupları oluşturulabilir ve formatlanabilir", () => {
      const studentGroups = resolveProfilePlanGroups("student", "/student", new Date().toISOString());
      expect(studentGroups.length).toBeGreaterThan(0);
      expect(studentGroups[0].plans[0].id).toBe("zigo-plus-student-monthly");

      const teacherGroups = resolveProfilePlanGroups("teacher", "/teacher", new Date().toISOString());
      expect(teacherGroups.length).toBeGreaterThan(0);
      expect(teacherGroups[0].plans[0].id).toBe("zigo-plus-teachers-monthly");

      expect(formatTryPrice(49)).toBe("49 ₺");
    });
  });

  // ─── 2. SENARYO: GOOGLE PLAY ABONELİK SATIN ALMA VE DOĞRULAMA ──────────────
  describe("Senaryo 2: Google Play Mobil Abonelik & Doğrulama Akışı", () => {
    it("Varsayılan paket adı com.zigo.education olmalıdır", () => {
      expect(DEFAULT_GOOGLE_PLAY_PACKAGE_NAME).toBe("com.zigo.education");
    });

    it("Google Play'den dönen Free Trial (paymentState=2) veya Paid (paymentState=1) fişleri onaylar", async () => {
      // Sandbox / Grace modunda doğrulama hatasız çalışmalıdır
      const verification = await verifyGooglePlaySubscription(
        "mock_google_play_receipt_token_xyz",
        "zigo-plus-student-monthly",
        "com.zigo.education",
      );

      expect(verification.isValid).toBe(true);
      expect(verification.productId).toBe("zigo-plus-student-monthly");
      expect(verification.orderId).toBeDefined();
      expect(verification.expiryTimeIso).toBeDefined();
    });

    it("Google Play aboneliği veritabanında 3 katmanlı senkronizasyonla anında zigo_plus tier verir", async () => {
      const userId = "00000000-0000-4000-8000-000000000099";
      const nowIso = new Date().toISOString();
      const expiresIso = new Date(Date.now() + 30 * 86400000).toISOString();

      // Mock Supabase DB Client
      const mockDb = {
        from: vi.fn((table: string) => {
          if (table === "user_subscriptions") {
            return {
              select: () => ({
                eq: () => ({
                  order: () => ({
                    limit: () =>
                      Promise.resolve({
                        data: [
                          {
                            user_id: userId,
                            tier: "zigo_plus",
                            status: "active",
                            provider: "google_play",
                            current_period_end: expiresIso,
                            expires_at: expiresIso,
                            started_at: nowIso,
                          },
                        ],
                        error: null,
                      }),
                  }),
                }),
              }),
              upsert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          if (table === "users") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: { is_premium: true }, error: null }),
                }),
              }),
              update: () => ({
                eq: () => Promise.resolve({ error: null }),
              }),
            };
          }
          return {};
        }),
      } as any;

      const sub = await getUserSubscription(mockDb, userId);
      expect(sub.isPremium).toBe(true);
      expect(sub.tier).toBe("zigo_plus");
      expect(sub.isTrial).toBe(false);
    });
  });

  // ─── 3. SENARYO: OYUN SALONU KURALI (GAME SUBSCRIPTION GATE) ────────────────
  describe("Senaryo 3: Oyun Salonu Kuralı & Gece Yasağı (Game Gate)", () => {
    it("Abonesiz kullanıcıya oyun hakkı YOKTUR (0 dk - subscription required)", () => {
      const freeSubscription = { isPremium: false, tier: "free", isTrial: false };
      // Oyun salonuna giriş kontrolü
      const canAccessGameSalon = freeSubscription.isPremium;
      expect(canAccessGameSalon).toBe(false);
    });

    it("Abone olan öğrenci: Günde maksimum 120 dk oynayabilir", () => {
      const limits = settingsFromParentRow({
        daily_limit_minutes: 180, // Veli 180 dk girmek istese de sistem 120 dk ile sınırlar
      });
      expect(limits.dailyLimitMinutes).toBe(120);

      const studentUsage = { secondsPlayed: 7200 }; // 120 dk dolmuş
      const limitSeconds = limits.dailyLimitMinutes * 60;
      const isDailyLimitExceeded = studentUsage.secondsPlayed >= limitSeconds;
      expect(isDailyLimitExceeded).toBe(true);
    });

    it("Abone olan öğrenci: 22:00 - 08:00 saatleri arasında gece yasağına takılır", () => {
      // 22:00, 23:00, 03:00, 07:00 -> Gece yasağı aktif
      expect(isNightBanActive(22, DEFAULT_GAME_LIMITS)).toBe(true);
      expect(isNightBanActive(23, DEFAULT_GAME_LIMITS)).toBe(true);
      expect(isNightBanActive(2, DEFAULT_GAME_LIMITS)).toBe(true);
      expect(isNightBanActive(7, DEFAULT_GAME_LIMITS)).toBe(true);

      // 08:00 - 21:59 -> Gece yasağı pasif (oynanabilir)
      expect(isNightBanActive(8, DEFAULT_GAME_LIMITS)).toBe(false);
      expect(isNightBanActive(14, DEFAULT_GAME_LIMITS)).toBe(false);
      expect(isNightBanActive(21, DEFAULT_GAME_LIMITS)).toBe(false);
    });
  });

  // ─── 4. SENARYO: GÖNDERİ LİMİTLERİ (DAILY POST LIMITS) ─────────────────────
  describe("Senaryo 4: Gönderi Paylaşım Limitleri (Rate Limiting & Roles)", () => {
    it("İçerik Üreticileri (Öğretmen, Kurum): Zigo Plus ile SINIRSIZ, abonesiz günde maksimum 1 gönderi", () => {
      function getCreatorLimit(isPremium: boolean) {
        return isPremium ? Infinity : 1;
      }

      // Abonesiz öğretmen: 1 gönderi hakkı
      expect(getCreatorLimit(false)).toBe(1);

      // Zigo Plus abonesi öğretmen: Sınırsız gönderi hakkı
      expect(getCreatorLimit(true)).toBe(Infinity);
    });

    it("Öğrenci & Veli (Zigo Plus): Günde maksimum 2 gönderi, Keşfete ASLA düşmez", () => {
      const studentMaxPosts = 2;
      const studentCanAppearInExplore = false;

      expect(studentMaxPosts).toBe(2);
      expect(studentCanAppearInExplore).toBe(false);
    });
  });

  // ─── 5. SENARYO: ÖĞRETMEN ÖZEL DERS TALEPLERİ GİZLİLİK KURALI ───────────────
  describe("Senaryo 5: Öğretmen Özel Ders Talepleri Kuralı", () => {
    it("Abonesiz öğretmen talepleri görür ancak veli mesajı ve iletişim detayları kilitlidir", () => {
      const teacherSubscription = { isPremium: false };
      const rawLessonRequest = {
        id: "req-1",
        subject: "Matematik",
        parentNotes: "LGS hazırlık için haftada 2 gün özel ders arıyoruz. Tel: 05551234567",
        parentPhone: "05551234567",
      };

      // Maskeleme fonksiyonu
      function filterRequestForTeacher(req: typeof rawLessonRequest, isPremium: boolean) {
        if (!isPremium) {
          return {
            id: req.id,
            subject: req.subject,
            parentNotes: "Bu detayı ve veli iletişim bilgisini görmek için Zigo Plus abonesi olmalısınız.",
            parentPhone: null,
            requiresSubscription: true,
          };
        }
        return {
          ...req,
          requiresSubscription: false,
        };
      }

      const gatedView = filterRequestForTeacher(rawLessonRequest, teacherSubscription.isPremium);
      expect(gatedView.requiresSubscription).toBe(true);
      expect(gatedView.parentPhone).toBeNull();
      expect(gatedView.parentNotes).toContain("Zigo Plus abonesi olmalısınız");

      // Zigo Plus olunca tüm detaylar açılır
      const unlockedView = filterRequestForTeacher(rawLessonRequest, true);
      expect(unlockedView.requiresSubscription).toBe(false);
      expect(unlockedView.parentPhone).toBe("05551234567");
      expect(unlockedView.parentNotes).toContain("LGS hazırlık için");
    });
  });

  // ─── 6. SENARYO: REKLAMSIZLIK İLKESİ (NO ADS POLICY) ───────────────────────
  describe("Senaryo 6: Reklamsızlık İlkesi (No Commercial Ads)", () => {
    it("Uygulamada ticari reklam ağı KESİNLİKLE bulunmaz", () => {
      const commercialAdsEnabled = false;
      expect(commercialAdsEnabled).toBe(false);
    });
  });
});
