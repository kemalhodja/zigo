insert into public.education_areas (area_name, age_group)
values
  ('LGS Matematik', '8. Sınıf'),
  ('LGS Fen Bilimleri', '8. Sınıf'),
  ('YKS Fizik', '12. Sınıf'),
  ('YKS Matematik', '12. Sınıf'),
  ('İlkokul Okuma-Yazma', 'İlkokul'),
  ('İngilizce Temel Seviye', 'İlkokul / Ortaokul'),
  ('Kodlama ve Algoritma', 'Ortaokul'),
  ('Ebeveyn Rehberliği', 'Veli')
on conflict (area_name) do nothing;
