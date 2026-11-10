-- Uji akses & alur laporan. Jalankan: bash supabase/tests/jalankan.sh
\set ON_ERROR_STOP 1
\set QUIET 1
reset role;
insert into auth.users (id) values
 ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000003'),
 ('00000000-0000-0000-0000-000000000004'),('00000000-0000-0000-0000-000000000005'),('00000000-0000-0000-0000-000000000006'),
 ('00000000-0000-0000-0000-000000000007'),('00000000-0000-0000-0000-000000000008'),('00000000-0000-0000-0000-000000000009');
insert into profil (user_id, nama_tampil, peran, sekolah_id, kelas, sppg_id, faskes_id) values
 ('00000000-0000-0000-0000-000000000001','Ortu A','ortu','uji-sd-1','4A',null,null),
 ('00000000-0000-0000-0000-000000000002','Ortu B','ortu','uji-sd-1','5B',null,null),
 ('00000000-0000-0000-0000-000000000003','Siswa C','siswa','uji-smp-1','8B',null,null),
 ('00000000-0000-0000-0000-000000000004','Petugas SD','petugas','uji-sd-1',null,null,null),
 ('00000000-0000-0000-0000-000000000005','Petugas SMP','petugas','uji-smp-1',null,null,null),
 ('00000000-0000-0000-0000-000000000006','SPPG 01','sppg',null,null,'SPPG-DEMO-01',null),
 ('00000000-0000-0000-0000-000000000007','SPPG 02','sppg',null,null,'SPPG-DEMO-02',null),
 ('00000000-0000-0000-0000-000000000008','Puskesmas','kesehatan',null,null,null,'PKM-DEMO-01');

\echo '1. Publik (anon): hanya agregat'
set role anon; set request.jwt.claim.sub to '';
do $$ begin
  begin perform * from laporan; raise exception 'GAGAL: anon membaca laporan'; exception when insufficient_privilege then null; end;
  begin perform * from laporan_jejak; raise exception 'GAGAL: anon membaca jejak'; exception when insufficient_privilege then null; end;
  begin perform * from undangan; raise exception 'GAGAL: anon membaca undangan'; exception when insufficient_privilege then null; end;
  begin perform * from profil; raise exception 'GAGAL: anon membaca profil'; exception when insufficient_privilege then null; end;
  begin perform * from v_laporan_mitra; raise exception 'GAGAL: anon membaca view mitra'; exception when insufficient_privilege then null; end;
  begin perform ubah_status_laporan(gen_random_uuid(), 'verifikasi'); raise exception 'GAGAL: anon memanggil ubah_status'; exception when insufficient_privilege then null; end;
  assert (select count(*) from sekolah) = 4, 'anon harus bisa membaca master sekolah';
  assert (statistik_publik('30')->>'masuk')::int = 0, 'statistik awal harus 0';
end $$;

\echo '2. Pelapor membuat laporan: kolom sensitif dikunci server'
reset role; set role authenticated; set request.jwt.claim.sub to '00000000-0000-0000-0000-000000000001';
insert into laporan (nomor, pelapor_id, sekolah_id, kategori, deskripsi, tanggal_kejadian, status, urgensi, ke_kesehatan)
values ('PALSU', '00000000-0000-0000-0000-000000000001', 'uji-sd-1', 'kualitas', 'Lauk ayam kecap terasa asam dan berbau tidak sedap di kelas 4A.', hari_ini_wib(), 'selesai', 'tinggi', true);
do $$ declare l laporan; begin
  select * into l from laporan;
  assert l.nomor ~ '^RT-\d{6}-\d{4}$', 'nomor unik harus dibuat server: ' || l.nomor;
  assert l.status = 'menunggu_verifikasi', 'status harus dipaksa Menunggu Verifikasi';
  assert l.urgensi is null and not l.ke_kesehatan, 'urgensi/eskalasi tidak boleh diisi pelapor';
  assert (select count(*) from laporan_jejak where laporan_id = l.id and jenis = 'dibuat') = 1, 'jejak dibuat harus tercatat';
end $$;

\echo '3. Validasi server'
do $$ begin
  begin insert into laporan (nomor, pelapor_id, sekolah_id, kategori, deskripsi, tanggal_kejadian) values ('x','00000000-0000-0000-0000-000000000001','uji-sd-1','porsi','pendek', hari_ini_wib());
    raise exception 'GAGAL: deskripsi pendek diterima'; exception when check_violation then null; end;
  begin insert into laporan (nomor, pelapor_id, sekolah_id, kategori, deskripsi, tanggal_kejadian) values ('x','00000000-0000-0000-0000-000000000001','uji-sd-1','porsi','Deskripsi yang cukup panjang untuk lolos.', hari_ini_wib() + 3);
    raise exception 'GAGAL: tanggal masa depan diterima'; exception when invalid_parameter_value then null; end;
  begin insert into laporan (nomor, pelapor_id, sekolah_id, kategori, deskripsi, tanggal_kejadian) values ('x','00000000-0000-0000-0000-000000000001','uji-sd-1','rasa','Deskripsi yang cukup panjang untuk lolos.', hari_ini_wib());
    raise exception 'GAGAL: kategori tak dikenal diterima'; exception when check_violation then null; end;
  begin insert into laporan (nomor, pelapor_id, sekolah_id, kategori, deskripsi, tanggal_kejadian) values ('x','00000000-0000-0000-0000-000000000002','uji-sd-1','porsi','Melapor atas nama orang lain tidak boleh.', hari_ini_wib());
    raise exception 'GAGAL: melapor atas nama orang lain'; exception when insufficient_privilege then null; end;
  begin insert into laporan (nomor, pelapor_id, sekolah_id, kategori, deskripsi, tanggal_kejadian) values ('x','00000000-0000-0000-0000-000000000001','uji-smp-1','porsi','Melapor untuk sekolah lain tidak boleh.', hari_ini_wib());
    raise exception 'GAGAL: melapor sekolah lain'; exception when insufficient_privilege then null; end;
end $$;

\echo '4. Pelapor tidak bisa mengubah/menghapus laporan, profil, atau status'
do $$ begin
  begin update laporan set deskripsi = 'diubah oleh pelapor sendiri setelah dikirim'; raise exception 'GAGAL: update laporan'; exception when insufficient_privilege then null; end;
  begin delete from laporan; raise exception 'GAGAL: hapus laporan'; exception when insufficient_privilege then null; end;
  begin update profil set peran = 'petugas'; raise exception 'GAGAL: ganti peran sendiri'; exception when insufficient_privilege then null; end;
  begin perform ubah_status_laporan((select id from laporan limit 1), 'verifikasi'); raise exception 'GAGAL: pelapor memverifikasi'; exception when insufficient_privilege then null; end;
  begin perform aktor_id from laporan_jejak; raise exception 'GAGAL: aktor_id terbaca'; exception when insufficient_privilege then null; end;
end $$;

\echo '5. Laporan mirip dari pelapor lain ditandai, tidak ditolak'
set request.jwt.claim.sub to '00000000-0000-0000-0000-000000000002';
insert into laporan (nomor, pelapor_id, sekolah_id, kategori, deskripsi, tanggal_kejadian)
values ('x', '00000000-0000-0000-0000-000000000002', 'uji-sd-1', 'kualitas', 'Ayam kecap hari ini berbau asam dan rasanya tidak sedap di kelas 5B.', hari_ini_wib());
do $$ begin
  assert (select count(*) from laporan) = 1, 'ortu B hanya boleh melihat laporannya sendiri';
  assert (select cardinality(kemungkinan_duplikat) from laporan) = 1, 'laporan B harus ditandai mirip dengan A';
end $$;

\echo '6. Cakupan petugas'
set request.jwt.claim.sub to '00000000-0000-0000-0000-000000000005';
do $$ begin assert (select count(*) from laporan) = 0, 'petugas SMP tidak boleh melihat laporan SD'; end $$;
set request.jwt.claim.sub to '00000000-0000-0000-0000-000000000004';
do $$ declare a uuid; b uuid; begin
  assert (select count(*) from laporan) = 2, 'petugas SD melihat 2 laporan sekolahnya';
  select id into a from laporan where pelapor_id = '00000000-0000-0000-0000-000000000001';
  select id into b from laporan where pelapor_id = '00000000-0000-0000-0000-000000000002';
  assert (select b = any(kemungkinan_duplikat) from laporan where id = a), 'penanda mirip harus dua arah';
end $$;

\echo '7. Verifikasi, penolakan beralasan, urgensi, penerusan SPPG'
do $$ declare a uuid; b uuid; l laporan; begin
  select id into a from laporan where pelapor_id = '00000000-0000-0000-0000-000000000001';
  select id into b from laporan where pelapor_id = '00000000-0000-0000-0000-000000000002';
  begin perform ubah_status_laporan(b, 'tolak', 'singkat'); raise exception 'GAGAL: tolak tanpa alasan cukup'; exception when invalid_parameter_value then null; end;
  perform ubah_status_laporan(b, 'tolak', 'Kejadian yang sama sudah dilaporkan dan sedang diverifikasi.');
  perform ubah_status_laporan(a, 'verifikasi');
  begin perform ubah_status_laporan(a, 'verifikasi'); raise exception 'GAGAL: verifikasi dua kali'; exception when invalid_parameter_value then null; end;
  begin perform ubah_status_laporan(a, 'teruskan_sppg'); raise exception 'GAGAL: teruskan tanpa urgensi'; exception when invalid_parameter_value then null; end;
  begin perform ubah_status_laporan(a, 'selesaikan', 'langsung selesai tanpa penanganan'); raise exception 'GAGAL: lompat ke selesai'; exception when invalid_parameter_value then null; end;
  perform tetapkan_urgensi(a, 'sedang');
  begin perform ubah_status_laporan(a, 'teruskan_kesehatan'); raise exception 'GAGAL: kesehatan sebelum SPPG'; exception when invalid_parameter_value then null; end;
  l := ubah_status_laporan(a, 'teruskan_sppg');
  assert l.sppg_id = 'SPPG-DEMO-01' and l.status = 'diteruskan_sppg', 'harus diteruskan ke SPPG sekolah';
  begin perform ubah_status_laporan(a, 'teruskan_kesehatan'); raise exception 'GAGAL: eskalasi urgensi sedang'; exception when invalid_parameter_value then null; end;
end $$;

\echo '8. SPPG hanya melihat laporan yang ditugaskan, tanpa identitas pelapor'
set request.jwt.claim.sub to '00000000-0000-0000-0000-000000000007';
do $$ begin assert (select count(*) from v_laporan_mitra) = 0, 'SPPG 02 tidak boleh melihat laporan SPPG 01'; end $$;
set request.jwt.claim.sub to '00000000-0000-0000-0000-000000000006';
do $$ begin
  assert (select count(*) from v_laporan_mitra) = 1, 'SPPG 01 melihat 1 laporan yang diteruskan (yang ditolak tidak)';
  assert (select count(*) from laporan) = 0, 'SPPG tidak membaca tabel laporan langsung';
  assert not exists (select 1 from information_schema.columns where table_name = 'v_laporan_mitra' and column_name in ('pelapor_id','petugas_id','alasan_tolak')), 'view mitra tanpa identitas';
  perform tambah_catatan_laporan((select id from v_laporan_mitra), 'Kami cek bahan ayam dari pemasok hari ini.', false);
end $$;

\echo '9. Eskalasi ke pihak kesehatan'
set request.jwt.claim.sub to '00000000-0000-0000-0000-000000000008';
do $$ begin assert (select count(*) from v_laporan_mitra) = 0, 'kesehatan belum melihat sebelum eskalasi'; end $$;
set request.jwt.claim.sub to '00000000-0000-0000-0000-000000000004';
do $$ declare a uuid := (select id from laporan where status = 'diteruskan_sppg'); begin
  perform tetapkan_urgensi(a, 'tinggi');
  perform ubah_status_laporan(a, 'teruskan_kesehatan', 'Menyangkut kondisi penerima manfaat.');
end $$;
set request.jwt.claim.sub to '00000000-0000-0000-0000-000000000008';
do $$ declare a uuid := (select id from v_laporan_mitra); begin
  assert a is not null, 'kesehatan melihat laporan setelah eskalasi';
  perform tambah_catatan_laporan(a, 'Catatan internal puskesmas: sampel diambil.', false);
  perform ubah_status_laporan(a, 'mulai_tangani');
  begin perform ubah_status_laporan(a, 'selesaikan', 'puskesmas menutup kasus sendiri'); raise exception 'GAGAL: kesehatan menutup kasus'; exception when insufficient_privilege then null; end;
end $$;

\echo '10. Visibilitas jejak per peran'
set request.jwt.claim.sub to '00000000-0000-0000-0000-000000000006';
do $$ begin
  assert not exists (select 1 from laporan_jejak where aktor_peran = 'kesehatan' and not untuk_pelapor), 'SPPG tidak melihat catatan internal kesehatan';
  assert exists (select 1 from laporan_jejak where jenis = 'tanggapan' and untuk_pelapor), 'tanggapan SPPG selalu untuk pelapor';
end $$;
set request.jwt.claim.sub to '00000000-0000-0000-0000-000000000004';
do $$ declare a uuid := (select id from laporan where status = 'dalam_penanganan'); begin
  begin perform ubah_status_laporan(a, 'selesaikan', 'pendek'); raise exception 'GAGAL: selesai tanpa hasil'; exception when invalid_parameter_value then null; end;
  perform ubah_status_laporan(a, 'selesaikan', 'SPPG mengganti pemasok ayam; dicek 3 hari tanpa keluhan.');
  begin delete from laporan_jejak; raise exception 'GAGAL: hapus jejak'; exception when insufficient_privilege then null; end;
  begin update laporan_jejak set catatan = 'x'; raise exception 'GAGAL: ubah jejak'; exception when insufficient_privilege then null; end;
end $$;
set request.jwt.claim.sub to '00000000-0000-0000-0000-000000000001';
do $$ declare l laporan; begin
  select * into l from laporan;
  assert l.status = 'selesai' and l.hasil like 'SPPG mengganti%', 'pelapor melihat status & hasil';
  assert l.deskripsi like 'Lauk ayam kecap%', 'isi laporan asli tidak berubah';
  assert not exists (select 1 from laporan_jejak where not untuk_pelapor), 'pelapor tidak melihat catatan internal/urgensi';
  assert (select array_agg(ke order by waktu) from laporan_jejak where jenis = 'status')
    = array['terverifikasi','diteruskan_sppg','diteruskan_kesehatan','dalam_penanganan','selesai']::text[], 'riwayat status lengkap & berurutan';
  assert (select array_agg(dari order by waktu) from laporan_jejak where jenis = 'status')
    = array['menunggu_verifikasi','terverifikasi','diteruskan_sppg','diteruskan_kesehatan','dalam_penanganan']::text[], 'status asal tercatat';
end $$;
set request.jwt.claim.sub to '00000000-0000-0000-0000-000000000002';
do $$ declare l laporan; begin
  select * into l from laporan;
  assert l.status = 'ditolak' and l.alasan_tolak like 'Kejadian yang sama%', 'pelapor melihat alasan penolakan';
end $$;

\echo '11. Statistik publik akurat'
reset role; set role anon; set request.jwt.claim.sub to '';
do $$ declare s json := statistik_publik('30'); begin
  assert (s->>'masuk')::int = 2, 'masuk=2';
  assert (s->>'ditolak')::int = 1, 'ditolak=1';
  assert (s->>'terverifikasi')::int = 1, 'terverifikasi=1';
  assert (s->>'selesai')::int = 1, 'selesai=1';
  assert (s->>'persenSelesai')::int = 100, 'persen=100 (selesai/terverifikasi)';
  assert json_array_length(s->'perKategori') = 5 and json_array_length(s->'perBulan') = 6, 'bentuk data';
  assert position('pelapor' in s::text) = 0 and position('deskripsi' in s::text) = 0, 'tidak ada data pribadi';
end $$;

\echo '12. Storage foto bukti'
reset role;
update laporan set foto_path = '00000000-0000-0000-0000-000000000001/bukti.jpg' where pelapor_id = '00000000-0000-0000-0000-000000000001';
insert into storage.objects (bucket_id, name) values ('bukti-laporan', '00000000-0000-0000-0000-000000000001/bukti.jpg');
set role authenticated;
set request.jwt.claim.sub to '00000000-0000-0000-0000-000000000001';
insert into storage.objects (bucket_id, name) values ('bukti-laporan', '00000000-0000-0000-0000-000000000001/lain.jpg');
do $$ begin
  begin insert into storage.objects (bucket_id, name) values ('bukti-laporan', '00000000-0000-0000-0000-000000000002/curang.jpg');
    raise exception 'GAGAL: unggah ke folder orang lain'; exception when insufficient_privilege then null; end;
end $$;
set request.jwt.claim.sub to '00000000-0000-0000-0000-000000000002';
do $$ begin assert (select count(*) from storage.objects where name like '%bukti.jpg') = 0, 'ortu B tidak melihat foto A'; end $$;
set request.jwt.claim.sub to '00000000-0000-0000-0000-000000000004';
do $$ begin assert (select count(*) from storage.objects where name like '%bukti.jpg') = 1, 'petugas melihat foto bukti laporan sekolahnya'; end $$;
set request.jwt.claim.sub to '00000000-0000-0000-0000-000000000007';
do $$ begin assert (select count(*) from storage.objects) = 0, 'SPPG lain tidak melihat foto'; end $$;

\echo '13. Pendaftaran dengan kode undangan'
set request.jwt.claim.sub to '00000000-0000-0000-0000-000000000009';
do $$ begin
  begin perform daftar_dengan_undangan('KLS-UJISD1-4A', 'Coba', 'petugas'); raise exception 'GAGAL: kode kelas jadi petugas'; exception when invalid_parameter_value then null; end;
  perform daftar_dengan_undangan('kls-ujisd1-4a', 'Ortu Baru', 'ortu');
  assert (select peran from profil) = 'ortu', 'profil dibuat sesuai kode';
end $$;

reset role;
\echo 'SEMUA UJI LULUS'
