-- Rantang Terang — skema Supabase (PostgreSQL)
-- Versi First Draft berjalan dengan localStorage + data contoh (src/lib/db.ts).
-- Skema ini adalah target migrasi ke Supabase pada tahap berikutnya.

create table sppg (id text primary key, nama text not null, kab text, alamat text);
create table sekolah (
  id text primary key, nama text not null, npsn text, jenjang text not null,
  kab text, kec text, sppg_id text references sppg(id), siswa int not null default 0
);
create table undangan (kode text primary key, sekolah_id text references sekolah(id), kelas text, tipe text check (tipe in ('kelas','staf')));
create table profil (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nama_tampil text, peran text check (peran in ('ortu','siswa','guru','petugas','sppg')),
  sekolah_id text references sekolah(id), kelas text, sppg_id text references sppg(id),
  status_akun text default 'aktif'
);
create table menu (
  id uuid primary key default gen_random_uuid(), sppg_id text references sppg(id), tanggal date not null,
  items jsonb not null, gizi jsonb, proses jsonb, unique (sppg_id, tanggal)
);
create table laporan_kondisi (
  id uuid primary key default gen_random_uuid(), user_id uuid references profil(user_id), sekolah_id text references sekolah(id),
  kelas text, tanggal date not null default current_date, waktu time default localtime,
  kondisi text check (kondisi in ('aman','keluhan')), gejala text[], jumlah int, catatan text check (char_length(catatan) <= 280),
  unique (user_id, tanggal) -- 1 laporan per hari
);
create table penilaian (
  id uuid primary key default gen_random_uuid(), user_id uuid references profil(user_id), sekolah_id text references sekolah(id),
  tanggal date not null default current_date, bintang int check (bintang between 1 and 5), aspek jsonb, catatan text,
  unique (user_id, tanggal)
);
-- Tanggapan disimpan terpisah: laporan asli tidak pernah diubah oleh SPPG
create table tanggapan_sppg (
  id uuid primary key default gen_random_uuid(), target_id uuid not null, sppg_id text references sppg(id),
  jenis text check (jenis in ('perbaiki','tidak_sesuai')), isi text not null, waktu timestamptz default now()
);
create table foto_sekolah (
  id uuid primary key default gen_random_uuid(), sekolah_id text references sekolah(id), user_id uuid references profil(user_id),
  tanggal date default current_date, jenis text check (jenis in ('penerimaan','makan','siswa')), path text not null, cocok text
);
create table poin_log (
  id uuid primary key default gen_random_uuid(), user_id uuid references profil(user_id),
  kode text not null, poin int not null, ref uuid, waktu timestamptz default now(), ket text
);
create table peringatan (id uuid primary key default gen_random_uuid(), sekolah_id text references sekolah(id), tanggal date, status text default 'menunggu');
create table kartu_rujukan (
  token text primary key, user_id uuid references profil(user_id), sekolah_id text references sekolah(id),
  dibuat timestamptz default now(), berlaku_hingga timestamptz not null, gejala text[], dicabut boolean default false
);

-- Total poin selalu dihitung dari poin_log (tidak ada kolom total yang diubah manual)
create view v_total_poin as select user_id, sum(poin) as total from poin_log group by user_id;
-- Dasbor publik hanya membaca agregat tanpa identitas pelapor
create view v_masukan_publik as
  select p.id, p.sekolah_id, p.tanggal, 'penilaian' as jenis, p.bintang, p.catatan as teks from penilaian p where p.catatan is not null
  union all
  select l.id, l.sekolah_id, l.tanggal, 'keluhan', null, l.catatan from laporan_kondisi l where l.kondisi = 'keluhan' and l.catatan is not null;

-- Row Level Security
alter table profil enable row level security;
alter table laporan_kondisi enable row level security;
alter table penilaian enable row level security;
alter table poin_log enable row level security;
alter table tanggapan_sppg enable row level security;
alter table kartu_rujukan enable row level security;

create policy "profil milik sendiri" on profil for all using (auth.uid() = user_id);
create policy "lapor sebagai diri sendiri" on laporan_kondisi for insert with check (auth.uid() = user_id);
create policy "baca laporan sendiri" on laporan_kondisi for select using (auth.uid() = user_id);
create policy "nilai sebagai diri sendiri" on penilaian for insert with check (auth.uid() = user_id);
create policy "baca penilaian sendiri" on penilaian for select using (auth.uid() = user_id);
create policy "poin milik sendiri" on poin_log for select using (auth.uid() = user_id);
create policy "tanggapan publik" on tanggapan_sppg for select using (true);
create policy "sppg menanggapi" on tanggapan_sppg for insert with check (
  exists (select 1 from profil where user_id = auth.uid() and peran = 'sppg' and sppg_id = tanggapan_sppg.sppg_id)
);
create policy "rujukan milik sendiri" on kartu_rujukan for all using (auth.uid() = user_id);
-- poin_log hanya ditulis oleh fungsi server (service role), tidak dari klien
