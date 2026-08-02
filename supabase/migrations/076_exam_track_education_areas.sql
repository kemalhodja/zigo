-- Exam-track education areas for YKS / TYT / AYT / DGS / ALES / KPSS branch selection.

insert into public.education_areas (area_name, age_group)
values
  ('TYT Türkçe', 'TYT'),
  ('TYT Matematik', 'TYT'),
  ('TYT Fen Bilimleri', 'TYT'),
  ('TYT Sosyal Bilimler', 'TYT'),
  ('AYT Matematik', 'AYT'),
  ('AYT Fizik', 'AYT'),
  ('AYT Kimya', 'AYT'),
  ('AYT Biyoloji', 'AYT'),
  ('AYT Edebiyat', 'AYT'),
  ('AYT Tarih', 'AYT'),
  ('AYT Coğrafya', 'AYT'),
  ('DGS Matematik', 'DGS'),
  ('DGS Türkçe', 'DGS'),
  ('ALES Sayısal', 'ALES'),
  ('ALES Sözel', 'ALES'),
  ('ALES Eşit Ağırlık', 'ALES'),
  ('KPSS Genel Yetenek', 'KPSS'),
  ('KPSS Genel Kültür', 'KPSS'),
  ('KPSS Eğitim Bilimleri', 'KPSS'),
  ('YKS Genel Hazırlık', 'YKS')
on conflict (area_name) do nothing;
