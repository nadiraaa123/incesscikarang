-- =====================================================================
-- Rantang Terang — skema Supabase (PostgreSQL 15+)
-- Jalankan sekali di Supabase SQL Editor pada project baru.
-- Diuji pada PostgreSQL 16 lokal dengan tiruan skema auth/storage
-- (lihat supabase/tests/). Belum diuji pada project Supabase sungguhan.
--
-- Prinsip keamanan:
--  * Semua tabel public memakai Row Level Security (RLS).
--  * Klien hanya boleh SELECT/INSERT laporan miliknya; tidak ada UPDATE/DELETE.
--    Perubahan status, urgensi, dan catatan hanya lewat fungsi server
--    (SECURITY DEFINER) yang memeriksa peran, cakupan, dan transisi status.
--  * Jejak penanganan append-only: tidak bisa diubah/dihapus dari klien.
--  * SPPG & pihak kesehatan membaca lewat view tanpa identitas pelapor.
--  * Publik (anon) hanya bisa memanggil statistik_publik() yang berisi agregat.
-- =====================================================================

create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

-- ---------- Master data ----------
create table if not exists sppg (id text primary key, nama text not null, kab text, alamat text);
create table if not exists faskes (id text primary key, nama text not null, kab text);
create table if not exists sekolah (
  id text primary key, nama text not null, npsn text, jenjang text not null,
  kab text, kec text, sppg_id text references sppg(id), faskes_id text references faskes(id),
  siswa int not null default 0
);
create table if not exists undangan (
  kode text primary key, sekolah_id text not null references sekolah(id), kelas text,
  tipe text not null check (tipe in ('kelas','staf'))
);

-- ---------- Profil & peran ----------
create table if not exists profil (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nama_tampil text not null,
  peran text not null check (peran in ('ortu','siswa','guru','petugas','sppg','kesehatan')),
  sekolah_id text references sekolah(id),
  kelas text,
  sppg_id text references sppg(id),
  faskes_id text references faskes(id),
  status_akun text not null default 'aktif' check (status_akun in ('aktif','nonaktif')),
  dibuat timestamptz not null default now(),
  -- cakupan wajib sesuai peran
  constraint cakupan_peran check (
    (peran in ('ortu','siswa','guru','petugas') and sekolah_id is not null) or
    (peran = 'sppg' and sppg_id is not null) or
    (peran = 'kesehatan' and faskes_id is not null)
  )
);

-- Fungsi bantu cakupan pengguna yang sedang login (SECURITY DEFINER agar tidak rekursif dengan RLS profil)
create or replace function peran_saya() returns text language sql stable security definer set search_path = public as
  $$ select peran from profil where user_id = auth.uid() and status_akun = 'aktif' $$;
create or replace function sekolah_saya() returns text language sql stable security definer set search_path = public as
  $$ select sekolah_id from profil where user_id = auth.uid() and status_akun = 'aktif' $$;
create or replace function sppg_saya() returns text language sql stable security definer set search_path = public as
  $$ select sppg_id from profil where user_id = auth.uid() and status_akun = 'aktif' $$;
create or replace function faskes_saya() returns text language sql stable security definer set search_path = public as
  $$ select faskes_id from profil where user_id = auth.uid() and status_akun = 'aktif' $$;
create or replace function hari_ini_wib() returns date language sql stable as
  $$ select (now() at time zone 'Asia/Jakarta')::date $$;

-- ---------- Fitur lama (First Draft) ----------
create table if not exists menu (
  id uuid primary key default gen_random_uuid(), sppg_id text not null references sppg(id), tanggal date not null,
  items jsonb not null, gizi jsonb, proses jsonb, unique (sppg_id, tanggal)
);
create table if not exists laporan_kondisi (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references profil(user_id), sekolah_id text references sekolah(id),
  kelas text, tanggal date not null default current_date, waktu time default localtime,
  kondisi text check (kondisi in ('aman','keluhan')), gejala text[], jumlah int, catatan text check (char_length(catatan) <= 280),
  unique (user_id, tanggal)
);
create table if not exists penilaian (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references profil(user_id), sekolah_id text references sekolah(id),
  tanggal date not null default current_date, bintang int check (bintang between 1 and 5), aspek jsonb, catatan text,
  unique (user_id, tanggal)
);
create table if not exists tanggapan_sppg (
  id uuid primary key default gen_random_uuid(), target_id uuid not null, sppg_id text references sppg(id),
  jenis text check (jenis in ('perbaiki','tidak_sesuai')), isi text not null, waktu timestamptz default now()
);
create table if not exists poin_log (
  id uuid primary key default gen_random_uuid(), user_id uuid references profil(user_id),
  kode text not null, poin int not null, ref uuid, waktu timestamptz default now(), ket text
);
create table if not exists kartu_rujukan (
  token text primary key, user_id uuid references profil(user_id), sekolah_id text references sekolah(id),
  dibuat timestamptz default now(), berlaku_hingga timestamptz not null, gejala text[], dicabut boolean default false
);

-- =====================================================================
-- LAPORAN MASALAH: validasi, moderasi, urgensi, eskalasi
-- =====================================================================
create sequence if not exists laporan_nomor_seq;

create table if not exists laporan (
  id uuid primary key default gen_random_uuid(),
  nomor text not null unique,
  pelapor_id uuid not null references profil(user_id),
  sekolah_id text not null references sekolah(id),
  kategori text not null check (kategori in ('kualitas','kebersihan','porsi','keterlambatan','kondisi')),
  deskripsi text not null check (char_length(btrim(deskripsi)) between 20 and 1000),
  tanggal_kejadian date not null,
  foto_path text,
  dibuat timestamptz not null default now(),
  diperbarui timestamptz not null default now(),
  status text not null default 'menunggu_verifikasi' check (status in (
    'menunggu_verifikasi','terverifikasi','ditolak','diteruskan_sppg','diteruskan_kesehatan','dalam_penanganan','selesai')),
  -- urgensi terpisah dari status; ditetapkan petugas
  urgensi text check (urgensi in ('normal','sedang','tinggi')),
  alasan_tolak text,
  hasil text,
  petugas_id uuid references profil(user_id),
  sppg_id text references sppg(id),
  faskes_id text references faskes(id),
  ke_kesehatan boolean not null default false,
  -- penanda bantu untuk petugas; BUKAN dasar penolakan otomatis
  kemungkinan_duplikat uuid[] not null default '{}',
  constraint tolak_beralasan check (status <> 'ditolak' or char_length(btrim(coalesce(alasan_tolak,''))) >= 10),
  constraint selesai_ada_hasil check (status <> 'selesai' or char_length(btrim(coalesce(hasil,''))) >= 10),
  constraint diteruskan_ada_urgensi check (status in ('menunggu_verifikasi','terverifikasi','ditolak') or urgensi is not null)
);
create index if not exists laporan_sekolah_status on laporan (sekolah_id, status);
create index if not exists laporan_sppg on laporan (sppg_id) where sppg_id is not null;
create index if not exists laporan_pelapor on laporan (pelapor_id);
create index if not exists laporan_deskripsi_trgm on laporan using gin (deskripsi gin_trgm_ops);

create table if not exists laporan_jejak (
  id uuid primary key default gen_random_uuid(),
  laporan_id uuid not null references laporan(id) on delete restrict,
  -- clock_timestamp: beberapa aksi dalam satu transaksi tetap berurutan
  waktu timestamptz not null default clock_timestamp(),
  aktor_id uuid,
  aktor_peran text not null,
  aktor_label text not null,
  jenis text not null check (jenis in ('dibuat','status','urgensi','catatan','tanggapan')),
  dari text,
  ke text,
  urgensi text,
  catatan text,
  untuk_pelapor boolean not null default true
);
create index if not exists jejak_laporan on laporan_jejak (laporan_id, waktu);

-- Siapa yang boleh melihat satu laporan (dipakai RLS jejak & storage)
create or replace function boleh_lihat_laporan(p_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from laporan l where l.id = p_id and (
      l.pelapor_id = auth.uid()
      or (peran_saya() = 'petugas' and l.sekolah_id = sekolah_saya())
      or (peran_saya() = 'sppg' and l.sppg_id = sppg_saya())
      or (peran_saya() = 'kesehatan' and l.ke_kesehatan and l.faskes_id = faskes_saya())
    )
  )
$$;

create or replace function label_aktor() returns text language sql stable security definer set search_path = public as $$
  select case p.peran
    when 'petugas' then 'Petugas ' || coalesce((select nama from sekolah where id = p.sekolah_id), 'sekolah')
    when 'sppg' then coalesce((select nama from sppg where id = p.sppg_id), 'Mitra SPPG')
    when 'kesehatan' then coalesce((select nama from faskes where id = p.faskes_id), 'Pihak kesehatan')
    else 'Pelapor' end
  from profil p where p.user_id = auth.uid()
$$;

-- Sebelum laporan disimpan: kunci kolom yang tidak boleh diisi klien, beri nomor, cari kemiripan
create or replace function laporan_sebelum_tambah() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.tanggal_kejadian > hari_ini_wib() then
    raise exception 'Tanggal kejadian tidak boleh di masa depan' using errcode = '22023';
  end if;
  new.nomor := 'RT-' || to_char(now() at time zone 'Asia/Jakarta', 'YYMMDD') || '-' || lpad(nextval('laporan_nomor_seq')::text, 4, '0');
  new.deskripsi := btrim(new.deskripsi);
  new.status := 'menunggu_verifikasi';
  new.dibuat := now(); new.diperbarui := now();
  new.urgensi := null; new.alasan_tolak := null; new.hasil := null;
  new.petugas_id := null; new.sppg_id := null; new.faskes_id := null; new.ke_kesehatan := false;
  new.kemungkinan_duplikat := coalesce((
    select array_agg(l.id order by l.dibuat) from laporan l
    where l.sekolah_id = new.sekolah_id and l.kategori = new.kategori
      and abs(l.tanggal_kejadian - new.tanggal_kejadian) <= 1
      and (l.pelapor_id = new.pelapor_id or similarity(l.deskripsi, new.deskripsi) >= 0.3)
  ), '{}');
  return new;
end $$;

create or replace function laporan_setelah_tambah() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into laporan_jejak (laporan_id, aktor_id, aktor_peran, aktor_label, jenis, ke, untuk_pelapor)
  values (new.id, new.pelapor_id, coalesce((select peran from profil where user_id = new.pelapor_id), 'ortu'), 'Pelapor', 'dibuat', 'menunggu_verifikasi', true);
  -- tautkan dua arah agar petugas melihat kaitan dari laporan mana pun
  update laporan set kemungkinan_duplikat = array_append(kemungkinan_duplikat, new.id)
  where id = any(new.kemungkinan_duplikat) and not (new.id = any(kemungkinan_duplikat));
  return null;
end $$;

drop trigger if exists t_laporan_sebelum_tambah on laporan;
create trigger t_laporan_sebelum_tambah before insert on laporan for each row execute function laporan_sebelum_tambah();
drop trigger if exists t_laporan_setelah_tambah on laporan;
create trigger t_laporan_setelah_tambah after insert on laporan for each row execute function laporan_setelah_tambah();

-- Transisi status. Harus sama dengan TRANSISI di src/lib/pengaduan.ts
create or replace function ubah_status_laporan(p_id uuid, p_aksi text, p_catatan text default null)
returns laporan language plpgsql security definer set search_path = public as $$
declare
  l laporan;
  v_peran text := peran_saya();
  v_ke text;
  v_dari text[];
  v_boleh text[];
  v_catatan text := nullif(btrim(coalesce(p_catatan, '')), '');
  v_lama text;
begin
  if v_peran is null then raise exception 'Belum masuk atau akun nonaktif' using errcode = '42501'; end if;
  select * into l from laporan where id = p_id for update;
  if not found or not boleh_lihat_laporan(p_id) then
    raise exception 'Laporan tidak ditemukan atau di luar kewenangan' using errcode = '42501';
  end if;

  case p_aksi
    when 'verifikasi' then v_dari := '{menunggu_verifikasi}'; v_ke := 'terverifikasi'; v_boleh := '{petugas}';
    when 'tolak' then v_dari := '{menunggu_verifikasi}'; v_ke := 'ditolak'; v_boleh := '{petugas}';
    when 'teruskan_sppg' then v_dari := '{terverifikasi}'; v_ke := 'diteruskan_sppg'; v_boleh := '{petugas}';
    when 'teruskan_kesehatan' then v_dari := '{diteruskan_sppg,dalam_penanganan}'; v_ke := 'diteruskan_kesehatan'; v_boleh := '{petugas}';
    when 'mulai_tangani' then v_dari := '{diteruskan_sppg,diteruskan_kesehatan}'; v_ke := 'dalam_penanganan'; v_boleh := '{petugas,sppg,kesehatan}';
    when 'selesaikan' then v_dari := '{dalam_penanganan}'; v_ke := 'selesai'; v_boleh := '{petugas}';
    else raise exception 'Aksi tidak dikenal: %', p_aksi using errcode = '22023';
  end case;

  if not (v_peran = any(v_boleh)) then raise exception 'Peran tidak berwenang' using errcode = '42501'; end if;
  if not (l.status = any(v_dari)) then raise exception 'Tindakan tidak tersedia untuk status %', l.status using errcode = '22023'; end if;
  if p_aksi = 'tolak' and char_length(coalesce(v_catatan, '')) < 10 then raise exception 'Alasan penolakan wajib (min. 10 karakter)' using errcode = '22023'; end if;
  if p_aksi = 'selesaikan' and char_length(coalesce(v_catatan, '')) < 10 then raise exception 'Hasil penyelesaian wajib (min. 10 karakter)' using errcode = '22023'; end if;
  if p_aksi = 'teruskan_sppg' and l.urgensi is null then raise exception 'Tetapkan urgensi terlebih dahulu' using errcode = '22023'; end if;
  -- jalur eskalasi = urgensi tinggi (sama dengan URGENSI_ESKALASI di frontend)
  if p_aksi = 'teruskan_kesehatan' and l.urgensi is distinct from 'tinggi' then raise exception 'Hanya untuk laporan urgensi Tinggi' using errcode = '22023'; end if;

  v_lama := l.status;
  update laporan set
    status = v_ke,
    diperbarui = now(),
    petugas_id = case when p_aksi in ('verifikasi','tolak') then auth.uid() else petugas_id end,
    alasan_tolak = case when p_aksi = 'tolak' then v_catatan else alasan_tolak end,
    hasil = case when p_aksi = 'selesaikan' then v_catatan else hasil end,
    sppg_id = case when p_aksi = 'teruskan_sppg' then (select sppg_id from sekolah where id = l.sekolah_id) else sppg_id end,
    ke_kesehatan = ke_kesehatan or p_aksi = 'teruskan_kesehatan',
    faskes_id = case when p_aksi = 'teruskan_kesehatan' then (select faskes_id from sekolah where id = l.sekolah_id) else faskes_id end
  where id = p_id returning * into l;

  if p_aksi = 'teruskan_sppg' and l.sppg_id is null then raise exception 'Sekolah belum terhubung ke SPPG' using errcode = '22023'; end if;
  if p_aksi = 'teruskan_kesehatan' and l.faskes_id is null then raise exception 'Sekolah belum terhubung ke fasilitas kesehatan' using errcode = '22023'; end if;

  insert into laporan_jejak (laporan_id, aktor_id, aktor_peran, aktor_label, jenis, dari, ke, catatan, untuk_pelapor)
  values (p_id, auth.uid(), v_peran, label_aktor(), 'status', v_lama, v_ke, v_catatan, true);
  return l;
end $$;

create or replace function tetapkan_urgensi(p_id uuid, p_urgensi text) returns laporan language plpgsql security definer set search_path = public as $$
declare l laporan;
begin
  if peran_saya() is distinct from 'petugas' then raise exception 'Hanya petugas sekolah' using errcode = '42501'; end if;
  select * into l from laporan where id = p_id and sekolah_id = sekolah_saya() for update;
  if not found then raise exception 'Laporan tidak ditemukan atau di luar kewenangan' using errcode = '42501'; end if;
  if p_urgensi not in ('normal','sedang','tinggi') then raise exception 'Urgensi tidak dikenal' using errcode = '22023'; end if;
  if l.status not in ('terverifikasi','diteruskan_sppg','diteruskan_kesehatan','dalam_penanganan') then
    raise exception 'Urgensi ditetapkan setelah terverifikasi dan sebelum selesai' using errcode = '22023';
  end if;
  if l.urgensi is distinct from p_urgensi then
    update laporan set urgensi = p_urgensi, diperbarui = now() where id = p_id returning * into l;
    insert into laporan_jejak (laporan_id, aktor_id, aktor_peran, aktor_label, jenis, urgensi, untuk_pelapor)
    values (p_id, auth.uid(), 'petugas', label_aktor(), 'urgensi', p_urgensi, false);
  end if;
  return l;
end $$;

create or replace function tambah_catatan_laporan(p_id uuid, p_teks text, p_untuk_pelapor boolean default true)
returns void language plpgsql security definer set search_path = public as $$
declare v_peran text := peran_saya(); v_status text;
begin
  if v_peran not in ('petugas','sppg','kesehatan') or not boleh_lihat_laporan(p_id) then
    raise exception 'Tidak berwenang menambah catatan' using errcode = '42501';
  end if;
  select status into v_status from laporan where id = p_id;
  if v_status not in ('terverifikasi','diteruskan_sppg','diteruskan_kesehatan','dalam_penanganan') then
    raise exception 'Catatan hanya untuk laporan yang sedang ditindaklanjuti' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_teks, ''))) < 10 then raise exception 'Catatan minimal 10 karakter' using errcode = '22023'; end if;
  update laporan set diperbarui = now() where id = p_id;
  -- tanggapan SPPG selalu terlihat pelapor; laporan asli tidak pernah diubah
  insert into laporan_jejak (laporan_id, aktor_id, aktor_peran, aktor_label, jenis, catatan, untuk_pelapor)
  values (p_id, auth.uid(), v_peran, label_aktor(), case when v_peran = 'sppg' then 'tanggapan' else 'catatan' end,
          btrim(p_teks), case when v_peran = 'sppg' then true else coalesce(p_untuk_pelapor, true) end);
end $$;

-- Mitra (SPPG/kesehatan) membaca lewat view: TANPA pelapor_id, petugas_id, alasan_tolak, kemungkinan_duplikat
create or replace view v_laporan_mitra with (security_barrier = true) as
  select l.id, l.nomor, l.sekolah_id, l.kategori, l.deskripsi, l.tanggal_kejadian, l.foto_path, l.dibuat, l.diperbarui,
         l.status, l.urgensi, l.hasil, l.sppg_id, l.faskes_id, l.ke_kesehatan
  from laporan l
  where (peran_saya() = 'sppg' and l.sppg_id = sppg_saya())
     or (peran_saya() = 'kesehatan' and l.ke_kesehatan and l.faskes_id = faskes_saya());

-- Nama petugas penanggung jawab hanya untuk petugas sekolah yang sama
create or replace function nama_profil_sekolah(p_user uuid) returns text language sql stable security definer set search_path = public as $$
  select nama_tampil from profil where user_id = p_user and peran_saya() = 'petugas' and sekolah_id = sekolah_saya()
$$;

-- Statistik publik: hanya angka agregat. Definisi identik dengan hitungStatistik() di frontend.
create or replace function statistik_publik(p_periode text default '30') returns json
language plpgsql stable security definer set search_path = public as $$
declare v_mulai date;
begin
  if p_periode not in ('30','90','semua') then raise exception 'Periode tidak dikenal' using errcode = '22023'; end if;
  v_mulai := case when p_periode = 'semua' then date '0001-01-01' else hari_ini_wib() - (p_periode::int - 1) end;
  return (
    with l as (select status, kategori from laporan where (dibuat at time zone 'Asia/Jakarta')::date >= v_mulai),
    bulan as (
      select to_char(date_trunc('month', hari_ini_wib()) - make_interval(months => g), 'YYYY-MM') as b
      from generate_series(5, 0, -1) g
    )
    select json_build_object(
      'periode', p_periode,
      'masuk', (select count(*) from l),
      'menunggu', (select count(*) from l where status = 'menunggu_verifikasi'),
      'ditolak', (select count(*) from l where status = 'ditolak'),
      'terverifikasi', (select count(*) from l where status not in ('menunggu_verifikasi','ditolak')),
      'dalamPenanganan', (select count(*) from l where status in ('terverifikasi','diteruskan_sppg','diteruskan_kesehatan','dalam_penanganan')),
      'selesai', (select count(*) from l where status = 'selesai'),
      'persenSelesai', (select case when count(*) filter (where status not in ('menunggu_verifikasi','ditolak')) = 0 then null
                          else round(100.0 * count(*) filter (where status = 'selesai') / count(*) filter (where status not in ('menunggu_verifikasi','ditolak')))::int end from l),
      'perKategori', (select json_agg(json_build_object('kategori', k, 'total', (select count(*) from l where kategori = k),
                        'selesai', (select count(*) from l where kategori = k and status = 'selesai')) order by ord)
                      from unnest(array['kualitas','kebersihan','porsi','keterlambatan','kondisi']) with ordinality as t(k, ord)),
      'perBulan', (select json_agg(json_build_object('bulan', b,
                      'masuk', (select count(*) from laporan where to_char(dibuat at time zone 'Asia/Jakarta', 'YYYY-MM') = b),
                      'selesai', (select count(*) from laporan where to_char(dibuat at time zone 'Asia/Jakarta', 'YYYY-MM') = b and status = 'selesai')) order by b)
                   from bulan),
      'adaContoh', false
    )
  );
end $$;

-- Pendaftaran dengan kode undangan (dipanggil setelah supabase.auth.signUp)
create or replace function daftar_dengan_undangan(p_kode text, p_nama text, p_peran text) returns profil
language plpgsql security definer set search_path = public as $$
declare u undangan; s sekolah; p profil;
begin
  if auth.uid() is null then raise exception 'Belum masuk' using errcode = '42501'; end if;
  if exists (select 1 from profil where user_id = auth.uid()) then raise exception 'Profil sudah ada' using errcode = '23505'; end if;
  select * into u from undangan where lower(kode) = lower(btrim(p_kode));
  if not found then raise exception 'Kode undangan tidak dikenali' using errcode = '22023'; end if;
  select * into s from sekolah where id = u.sekolah_id;
  if (u.tipe = 'staf' and p_peran not in ('guru','petugas'))
     or (u.tipe = 'kelas' and s.jenjang in ('PAUD','SD','SLB') and p_peran <> 'ortu')
     or (u.tipe = 'kelas' and s.jenjang not in ('PAUD','SD','SLB') and p_peran <> 'siswa') then
    raise exception 'Peran tidak sesuai kode undangan' using errcode = '22023';
  end if;
  insert into profil (user_id, nama_tampil, peran, sekolah_id, kelas)
  values (auth.uid(), coalesce(nullif(btrim(p_nama), ''), 'Pengguna'), p_peran, u.sekolah_id, u.kelas)
  returning * into p;
  return p;
end $$;

-- =====================================================================
-- Hak akses & Row Level Security
-- =====================================================================
alter table sppg enable row level security;
alter table faskes enable row level security;
alter table sekolah enable row level security;
alter table undangan enable row level security;
alter table profil enable row level security;
alter table menu enable row level security;
alter table laporan_kondisi enable row level security;
alter table penilaian enable row level security;
alter table tanggapan_sppg enable row level security;
alter table poin_log enable row level security;
alter table kartu_rujukan enable row level security;
alter table laporan enable row level security;
alter table laporan_jejak enable row level security;

-- Master data boleh dibaca publik (bukan data pribadi). Undangan TIDAK (hanya lewat fungsi daftar).
drop policy if exists "baca publik" on sppg;     create policy "baca publik" on sppg for select using (true);
drop policy if exists "baca publik" on faskes;   create policy "baca publik" on faskes for select using (true);
drop policy if exists "baca publik" on sekolah;  create policy "baca publik" on sekolah for select using (true);
drop policy if exists "baca publik" on menu;     create policy "baca publik" on menu for select using (true);
drop policy if exists "sppg kelola menu" on menu;
create policy "sppg kelola menu" on menu for all to authenticated using (peran_saya() = 'sppg' and sppg_id = sppg_saya()) with check (peran_saya() = 'sppg' and sppg_id = sppg_saya());

-- Profil: hanya baca milik sendiri. Peran TIDAK bisa diubah dari klien (insert lewat daftar_dengan_undangan / admin).
drop policy if exists "profil milik sendiri" on profil;
drop policy if exists "baca profil sendiri" on profil;
create policy "baca profil sendiri" on profil for select to authenticated using (user_id = auth.uid());

drop policy if exists "lapor sebagai diri sendiri" on laporan_kondisi;
create policy "lapor sebagai diri sendiri" on laporan_kondisi for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "baca laporan sendiri" on laporan_kondisi;
create policy "baca laporan sendiri" on laporan_kondisi for select to authenticated using (auth.uid() = user_id);
drop policy if exists "nilai sebagai diri sendiri" on penilaian;
create policy "nilai sebagai diri sendiri" on penilaian for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "baca penilaian sendiri" on penilaian;
create policy "baca penilaian sendiri" on penilaian for select to authenticated using (auth.uid() = user_id);
drop policy if exists "poin milik sendiri" on poin_log;
create policy "poin milik sendiri" on poin_log for select to authenticated using (auth.uid() = user_id);
drop policy if exists "tanggapan publik" on tanggapan_sppg;
create policy "tanggapan publik" on tanggapan_sppg for select using (true);
drop policy if exists "sppg menanggapi" on tanggapan_sppg;
create policy "sppg menanggapi" on tanggapan_sppg for insert to authenticated with check (peran_saya() = 'sppg' and sppg_id = sppg_saya());
drop policy if exists "rujukan milik sendiri" on kartu_rujukan;
create policy "rujukan milik sendiri" on kartu_rujukan for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Laporan: pelapor membaca miliknya; petugas membaca laporan sekolahnya.
drop policy if exists "pelapor baca milik sendiri" on laporan;
create policy "pelapor baca milik sendiri" on laporan for select to authenticated using (pelapor_id = auth.uid());
drop policy if exists "petugas baca sekolahnya" on laporan;
create policy "petugas baca sekolahnya" on laporan for select to authenticated using (peran_saya() = 'petugas' and sekolah_id = sekolah_saya());
drop policy if exists "pelapor membuat laporan" on laporan;
create policy "pelapor membuat laporan" on laporan for insert to authenticated with check (
  pelapor_id = auth.uid() and peran_saya() in ('ortu','siswa','guru') and sekolah_id = sekolah_saya()
);

-- Jejak: sesuai hak lihat laporan; pelapor hanya entri untuk_pelapor; SPPG tidak melihat catatan internal pihak kesehatan
drop policy if exists "baca jejak sesuai hak" on laporan_jejak;
create policy "baca jejak sesuai hak" on laporan_jejak for select to authenticated using (
  boleh_lihat_laporan(laporan_id) and (
    peran_saya() in ('petugas','kesehatan')
    or (peran_saya() = 'sppg' and (untuk_pelapor or aktor_peran <> 'kesehatan'))
    or (peran_saya() in ('ortu','siswa','guru') and untuk_pelapor)
  )
);

-- Grant eksplisit (Supabase memberi ALL secara default ke anon/authenticated; dipersempit di sini)
revoke all on laporan, laporan_jejak, profil, undangan from anon, authenticated;
grant select, insert on laporan to authenticated;
-- aktor_id tidak diberikan ke klien
grant select (id, laporan_id, waktu, aktor_peran, aktor_label, jenis, dari, ke, urgensi, catatan, untuk_pelapor) on laporan_jejak to authenticated;
grant select on profil to authenticated;
revoke all on v_laporan_mitra from anon;
grant select on v_laporan_mitra to authenticated;
revoke all on sequence laporan_nomor_seq from anon, authenticated;

revoke execute on function ubah_status_laporan(uuid, text, text), tetapkan_urgensi(uuid, text),
  tambah_catatan_laporan(uuid, text, boolean), daftar_dengan_undangan(text, text, text), nama_profil_sekolah(uuid) from public, anon;
grant execute on function ubah_status_laporan(uuid, text, text), tetapkan_urgensi(uuid, text),
  tambah_catatan_laporan(uuid, text, boolean), daftar_dengan_undangan(text, text, text), nama_profil_sekolah(uuid) to authenticated;
revoke execute on function statistik_publik(text) from public;
grant execute on function statistik_publik(text) to anon, authenticated;
-- fungsi trigger & bantu internal tidak dipanggil langsung
revoke execute on function laporan_sebelum_tambah(), laporan_setelah_tambah(), label_aktor() from public, anon, authenticated;

-- =====================================================================
-- Storage: foto bukti (bucket privat)
-- Path: <user_id>/<uuid>.jpg — pelapor hanya mengunggah ke foldernya sendiri.
-- Dibaca dengan signed URL oleh pihak yang berhak melihat laporannya.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bukti-laporan', 'bukti-laporan', false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "unggah bukti ke folder sendiri" on storage.objects;
create policy "unggah bukti ke folder sendiri" on storage.objects for insert to authenticated with check (
  bucket_id = 'bukti-laporan' and (storage.foldername(name))[1] = auth.uid()::text and peran_saya() in ('ortu','siswa','guru')
);
drop policy if exists "baca bukti sesuai hak laporan" on storage.objects;
create policy "baca bukti sesuai hak laporan" on storage.objects for select to authenticated using (
  bucket_id = 'bukti-laporan' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.laporan l where l.foto_path = storage.objects.name and public.boleh_lihat_laporan(l.id))
  )
);
