# Cursor Start Prompt

Use the following prompt to start implementation from this blueprint.

```text
Yukarıda belirtilen PostgreSQL şemasını, Supabase Row Level Security kurallarını ve Zigo iş kurallarını temel alarak mobil öncelikli bir eğitim platformu geliştir.

Proje adı: Zigo
Global slogan: The Smart, Verified, and Gamified Social Feed for Education.
Konsept: Eduspire / EduAg tarzı doğrulanmış eğitim medyası.

Teknik varsayımlar:
- Frontend: React/Next.js PWA.
- Backend: Supabase.
- Database: PostgreSQL.
- Yetkilendirme: Supabase RLS ve backend veri erişim katmanı. Frontend-only permission check kullanma.

Ana ürün dinamiği:
- Match-Feed ana mantıktır.
- Üretici öğretmen içerik oluştururken eğitim alanı seçer.
- Veli ve öğrenci kendi ilgi/eğitim alanlarını seçer.
- Feed sadece `posts.area_id` ile kullanıcının `user_interests.area_id` değerleri eşleşen gönderileri gösterir.

Rol kuralları:
- `teacher`: doğrulanmış içerik üreticisi.
- `parent`: çocuk gelişim takibi, analiz, soru sorma ve ödül onayı.
- `student`: mikro öğrenme, quiz, düello, puan, Zigo Kristali ve avatar özelleştirme.

Yetki kuralları:
- Öğretmenler sadece `role = 'teacher'` ve `is_verified = true` ise post oluşturabilir.
- Öğretmenler sadece `user_interests` üzerinden atanmış uzmanlık alanlarında post paylaşabilir.
- Öğretmenler sadece atanmış alanlardaki soruları cevaplayabilir.
- Veliler ve öğrenciler post oluşturamaz; sadece soru sorabilir.
- Veliler ve öğrenciler sadece seçtikleri alanlardaki öğretmen gönderilerini görebilir.
- Öğrenciler arasında DM özelliği oluşturma.
- Öğrenciye gösterilecek yorum/açık metinlerde küfür ve siber zorbalık moderasyonu ekle.

Öğrenci motivasyon sistemi:
- Doğrulanmış 1 dakikalık mikro video izleme: +10 eğitim puanı.
- Mini quiz tamamlama: +10 eğitim puanı.
- Düello kazanma: yapılandırılabilir ödül.
- Puanlar `users.total_points` kolonuna yazılır.
- Avatar ekipmanları `users.avatar_assets` JSONB kolonunda tutulur.
- Kumbara Mağazası içinde şapka, pelerin, kostüm, pet ve veli onaylı gerçek dünya ödülleri desteklenir.

İlk uygulama adımları:
1. Supabase/PostgreSQL bağlantı katmanını oluştur.
2. Database tiplerini ve temel veri erişim fonksiyonlarını ekle.
3. Auth sonrası kullanıcı profilini role-aware şekilde yükle.
4. Match-Feed fonksiyonunu oluştur.
5. Doğrulanmış öğretmen post oluşturma akışını ekle.
6. Veli/öğrenci soru oluşturma ve öğretmen cevaplama akışını ekle.
7. Öğrenci puan kazanma ve avatar özelleştirme komponentlerini oluştur.
8. Mobil öncelikli parent/student/teacher arayüz ayrımını kur.
```
