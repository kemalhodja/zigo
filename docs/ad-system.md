# Zigo Ad System Dokümantasyonu

## Genel Bakış

Zigo reklam sistemi, kullanıcılara seçimli reklamsız deneyim sunmak için tasarlanmıştır. Kullanıcılar kısa reklamlar izleyerek geçici reklamsız erişim kazanabilir veya Premium abonelik ile kalıcı reklamsız deneyim yaşayabilirler.

## Mimari

### Veritabanı Şeması

#### Users Tablosuna Eklenen Alanlar

```sql
ad_free_until timestamptz  -- Kullanıcının reklamsız erişiminin bitiş zamanı
is_premium boolean         -- Premium abone durumu
```

#### Ad Watch Log Tablosu

```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES users(id)
ad_type varchar(50)        -- 'rewarded', 'optional', 'gate'
hours_granted int          -- Verilen reklamsız saat sayısı
watched_at timestamptz     -- İzleme zamanı
expires_at timestamptz     -- Reklamsız erişimin bitiş zamanı
```

### AdState Manager

**Dosya:** `src/lib/server/ad-state-manager.ts`

Tüm ad state işlemlerini yöneten server-side utility fonksiyonları:

#### Ana Fonksiyonlar

1. **`isUserAdFree(userId)`** - Kullanıcının reklamsız erişim durumunu kontrol eder
2. **`grantAdFreeTime(userId, hoursToAdd)`** - Kullanıcıya reklamsız zaman ekler
3. **`upgradeToPremium(userId)`** - Kullanıcıyı Premium'a yükseltir
4. **`downgradeFromPremium(userId)`** - Kullanıcıyı Premium'dan düşürür
5. **`checkAdGate(userId)`** - Kullanıcının belirli bir işlemi yapıp yapamayacağını kontrol eder
6. **`getAdWatchHistory(userId)`** - Kullanıcının reklam izleme geçmişini getirir
7. **`isUserInTrial(userId)`** - Kullanıcının deneme sürecinde olup olmadığını kontrol eder
8. **`autoDowngradeExpiredTrials()`** - Süresi dolan deneme sürelerini otomatik olarak sonlandırır

### API Endpoints

#### 1. GET /api/ads/state
Kullanıcının reklam durumunu getirir.

**Query Parameters:**
- `userId` (required): Kullanıcı ID'si

**Response:**
```json
{
  "isAdFree": true,
  "reason": "premium", // "premium" | "ad_free_until" | "none"
  "adFreeUntil": null,
  "isPremium": true
}
```

#### 2. GET /api/ads/gate
Kullanıcının belirli bir işlemi yapıp yapamayacağını kontrol eder.

**Query Parameters:**
- `userId` (required): Kullanıcı ID'si

**Response:**
```json
{
  "canProceed": false,
  "requiresAd": true,
  "adState": {
    "isAdFree": false,
    "reason": "none",
    "adFreeUntil": null,
    "isPremium": false
  }
}
```

#### 3. POST /api/ads/watch
Kullanıcının izlediği ödüllü reklamı işler ve reklamsız zaman ekler.

**Request Body:**
```json
{
  "userId": "user-uuid",
  "hoursToAdd": 2
}
```

**Response:**
```json
{
  "success": true,
  "adFreeUntil": "2026-07-04T06:30:00.000Z",
  "hoursGranted": 2
}
```

#### 4. POST /api/ads/upgrade
Kullanıcıyı Premium abonelik yükseltir.

**Request Body:**
```json
{
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully upgraded to premium"
}
```

### Client-Side Hooks

**Dosya:** `src/lib/hooks/use-ad-state.ts`

#### useAdState
Kullanıcının reklam durumunu takip eder.

```typescript
const { adState, loading, error } = useAdState(userId);
```

#### useAdGate
Kullanıcının işlem yapıp yapamayacağını kontrol eder.

```typescript
const { gateResult, loading } = useAdGate(userId);
// gateResult.canProceed - İşleme izni var mı?
// gateResult.requiresAd - Reklam izlemesi gerekiyor mu?
```

#### useWatchAd
Ödüllü reklam izleme işlemini yönetir.

```typescript
const { watchAd, watching, result, resetResult } = useWatchAd(userId);

// Reklam izle
await watchAd(2); // 2 saat reklamsız zaman ekle
```

#### useUpgradePremium
Premium yükseltme işlemini yönetir.

```typescript
const { upgrade, upgrading, result } = useUpgradePremium(userId);

// Premium'a geç
await upgrade();
```

### UI Bileşenleri

#### AdGateModal
Reklam izleme veya Premium yükseltme seçeneklerini gösteren modal.

```typescript
<AdGateModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSuccess={handleSuccess}
  actionName="Reel Paylaş"
/>
```

#### AdGateButton
İşlemleri reklam izleme ile kapılayan buton wrapper'ı.

```typescript
<AdGateButton
  userId={user.id}
  onClick={handleShare}
  actionName="Reel Paylaş"
  className="bg-purple-600 text-white px-6 py-3 rounded-xl"
>
  Reels Paylaş
</AdGateButton>
```

## Kullanım Senaryoları

### Senaryo 1: Reels Paylaşma

```typescript
import { AdGateButton } from "@/components/ad-gate-button";

function ShareReelButton({ userId, onShare }: Props) {
  return (
    <AdGateButton
      userId={userId}
      onClick={onShare}
      actionName="Reel Paylaş"
      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl"
    >
      <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
      </svg>
      Reels Paylaş
    </AdGateButton>
  );
}
```

### Senaryo 2: Akış Gönderisi Oluşturma

```typescript
import { AdGateButton } from "@/components/ad-gate-button";

function CreatePostButton({ userId, onCreatePost }: Props) {
  return (
    <AdGateButton
      userId={userId}
      onClick={onCreatePost}
      actionName="Akış Gönderisi Oluştur"
      className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700"
    >
      <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
      </svg>
      Akış Gönderisi Oluştur
    </AdGateButton>
  );
}
```

### Senaryo 3: Manuel Kontrol

```typescript
import { useAdGate } from "@/lib/hooks/use-ad-state";

function CustomButton({ userId }: Props) {
  const { gateResult, loading } = useAdGate(userId);

  const handleClick = async () => {
    if (gateResult.canProceed) {
      // İşlemi gerçekleştir
      await performAction();
    } else {
      // Modal göster veya başka bir aksiyon al
      showCustomModal();
    }
  };

  return (
    <button 
      onClick={handleClick} 
      disabled={loading || !gateResult.canProceed}
    >
      {loading ? "Kontrol ediliyor..." : "İşlem Yap"}
    </button>
  );
}
```

## Ad-Free Logic

### Reklamsız Erişim Kuralları

1. **Premium Kullanıcılar:** `isPremium = true` ise tamamen reklamsız
2. **Zaman Bazlı:** `ad_free_until > now()` ise reklamsız
3. **Hiçbiri Değil:** Reklam izleme veya Premium'a geçme seçenekleri sunulur

### Ad-Free Süreleri

- **Ödüllü Reklam:** 2 saat reklamsız erişim
- **Premium Abonelik:** Sınırsız reklamsız erişim
- **Deneme Süresi:** 7 günlük Premium deneme (hesap oluşturulduğunda)

## Premium Trigger

### Deneme Süresi Başlatma

Yeni kullanıcılar hesap oluşturduğunda otomatik olarak 7 günlük Premium deneme süresine girer:

```typescript
// Kullanıcı oluşturulduğunda:
// 1. is_premium = true olarak başlar
// 2. created_at timestamp'ı kaydedilir
// 3. 7 gün sonra autoDowngradeExpiredTrials() çalışır
```

### Otomatik Düşürme

Scheduled job/cron ile çalıştırılması gereken fonksiyon:

```typescript
import { autoDowngradeExpiredTrials } from "@/lib/server/ad-state-manager";

// Günlük çalıştırılacak
const result = await autoDowngradeExpiredTrials();
console.log(`Downgraded ${result.downgraded} users`);
```

## Migration Çalıştırma

```bash
# Supabase migration'ı uygula
supabase migration up

# Veya manuel olarak
psql -U postgres -d your_database -f supabase/migrations/066_ad_state_and_premium_system.sql
```

## Güvenlik Notları

1. **RLS Politikaları:** Tüm ad state işlemleri RLS ile korunmaktadır
2. **Yetkilendirme:** Kullanıcılar sadece kendi ad state'lerini değiştirebilir
3. **Server-Side Validation:** Tüm işlemler server-side'da doğrulanır
4. **Audit Log:** Tüm reklam izleme işlemleri `ad_watch_log` tablosunda kaydedilir

## Test Senaryoları

1. **Premium Kullanıcı:** Reklam gösterilmemeli
2. **Ad-Free Kullanıcı:** `ad_free_until` geçerli ise reklam gösterilmemeli
3. **Normal Kullanıcı:** Reklam izleme modal'ı gösterilmeli
4. **Reklam İzledikten Sonra:** `ad_free_until` 2 saat ileri tarihe güncellenmeli
5. **Deneme Süresi:** 7 gün sonra otomatik olarak düşürülmeli

## Gelecek Geliştirmeler

- [ ] Reklam entegrasyonu (Google AdMob, Unity Ads vb.)
- [ ] Farklı ödül seviyeleri (30 dakika, 1 saat, 2 saat)
- [ ] Reklam türüne göre farklı ödüller
- [ ] Aile/çocuk profili desteği
- [ ] Reklam atlama seçeneği (puan karşılığı)
- [ ] Analytics ve raporlama