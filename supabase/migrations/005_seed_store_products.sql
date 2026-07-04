insert into public.store_products (
  name,
  description,
  category,
  price_points,
  image_url,
  stock_count,
  requires_parent_approval
)
values
  (
    'Zigo Kalem Seti',
    'Ders çalışmayı daha eğlenceli hale getiren renkli kalem seti.',
    'stationery',
    120,
    null,
    100,
    true
  ),
  (
    'Okuma Kitabı',
    'Yaş grubuna uygun seçilecek hikaye veya gelişim kitabı.',
    'book',
    250,
    null,
    50,
    true
  ),
  (
    'LGS Matematik Soru Bankası',
    'LGS hazırlık için temel-orta seviye matematik soru bankası.',
    'question_bank',
    600,
    null,
    25,
    true
  ),
  (
    'YKS Fizik Soru Bankası',
    'YKS hazırlık için fizik pratik kitabı.',
    'question_bank',
    750,
    null,
    20,
    true
  ),
  (
    'Kristal Avatar Pelerini',
    'Avatar için özel dijital pelerin.',
    'digital_avatar',
    90,
    null,
    null,
    false
  ),
  (
    'Haftalık Kütüphane Rozeti',
    'Veli onaylı kütüphane/kitap okuma görevi için deneyim ödülü.',
    'experience',
    180,
    null,
    null,
    true
  )
on conflict do nothing;
