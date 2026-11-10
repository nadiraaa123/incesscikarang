-- Data master contoh untuk sekolah UJI COBA (fiktif). Jalankan setelah schema.sql.
-- Akun pengguna dibuat lewat scripts/buat-akun-demo.mjs (butuh service role key, JANGAN di frontend).
insert into sppg (id, nama, kab, alamat) values
  ('SPPG-DEMO-01', 'SPPG Uji Coba 01', 'Wilayah uji coba', 'Alamat contoh'),
  ('SPPG-DEMO-02', 'SPPG Uji Coba 02', 'Wilayah uji coba', 'Alamat contoh')
on conflict (id) do nothing;
insert into faskes (id, nama, kab) values ('PKM-DEMO-01', 'Puskesmas Uji Coba', 'Wilayah uji coba') on conflict (id) do nothing;
insert into sekolah (id, nama, npsn, jenjang, kab, kec, sppg_id, faskes_id, siswa) values
  ('uji-sd-1', 'SD Uji Coba 1', 'contoh', 'SD', 'Wilayah uji coba', 'Data contoh', 'SPPG-DEMO-01', 'PKM-DEMO-01', 312),
  ('uji-sd-2', 'SD Uji Coba 2', 'contoh', 'SD', 'Wilayah uji coba', 'Data contoh', 'SPPG-DEMO-01', 'PKM-DEMO-01', 280),
  ('uji-smp-1', 'SMP Uji Coba 1', 'contoh', 'SMP', 'Wilayah uji coba', 'Data contoh', 'SPPG-DEMO-02', 'PKM-DEMO-01', 640),
  ('uji-sd-3', 'SD Uji Coba 3', 'contoh', 'SD', 'Wilayah uji coba', 'Data contoh', 'SPPG-DEMO-01', 'PKM-DEMO-01', 254)
on conflict (id) do nothing;
insert into undangan (kode, sekolah_id, kelas, tipe) values
  ('KLS-UJISD1-4A', 'uji-sd-1', '4A', 'kelas'),
  ('KLS-UJISMP1-8B', 'uji-smp-1', '8B', 'kelas'),
  ('STF-UJISD1', 'uji-sd-1', null, 'staf')
on conflict (kode) do nothing;
