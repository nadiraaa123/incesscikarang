# Audio: Narasi, Musik Latar, dan Lisensi

## 1. Musik latar yang dipakai

| Judul | Pembuat | Sumber | Lisensi / hak pakai | Atribusi |
|---|---|---|---|---|
| *Rantang Terang — Tema Latar* (4:50, 7 bagian) | Disusun untuk tim Incess Cikarang; disintesis dengan kode `produksi/musik.py` (numpy/scipy) | Dibuat dari nol di sesi produksi ini, file `audio/musik-latar-rantang-terang.mp3` | Tidak memakai sampel, loop, preset rekaman, atau melodi pihak ketiga. Semua bunyi (pad, pluck, bass, kick, hi-hat, clap, reverb) dihasilkan matematis oleh skrip. Tidak ada pemegang hak lain, sehingga tim bebas memakainya di YouTube. | Tidak wajib. Opsional: “Musik latar: komposisi orisinal tim Incess Cikarang.” |

**Bukti asal-usul:** skrip `produksi/musik.py` sudah di-commit ke repositori, dan menjalankannya ulang (`python3 musik.py`) menghasilkan musik yang sama persis (seed tetap). Simpan commit ini sebagai bukti jika ada klaim Content ID.

Saya **tidak** memakai musik dari YouTube Audio Library atau situs “no copyright” mana pun. Lingkungan produksi tidak punya akses ke YouTube Studio, jadi lisensinya tidak bisa diverifikasi.

### Struktur musik (sinkron dengan adegan, crossfade 2,5 dtk antarbagian)

| Waktu | Bagian video | Karakter musik |
|---|---|---|
| 00:00–00:30 | Perkenalan tim | Pembuka modern 104 BPM: arpeggio pluck, kick, hi-hat, bass. Paling menarik perhatian. |
| 00:30–01:00 | Introduction | Tema yang sama, ketukan setengah, lebih ringan |
| 01:00–02:10 | Demo bagian 1 | Ambient tenang 96 BPM: pad + arpeggio lembut, tanpa drum |
| 02:10–03:10 | Demo bagian 2 | Variasi progresi akor, hi-hat & bass tipis |
| 03:10–03:35 | Dashboard publik | Energi mulai naik (kick setengah) |
| 03:35–04:15 | Sorotan fitur | Bagian paling dinamis: drum penuh, clap, arpeggio oktaf tinggi |
| 04:15–04:50 | Rencana & penutup | Positif, resolusi ke akor C, fade-out 4 dtk |

## 2. Mixing (`produksi/mix.py`)

- Narasi: high-pass 80 Hz, reduksi derau ringan, kompresi 3:1, normalisasi **−16 LUFS**.
- Musik: dasar **−23 LUFS**, fade-in 1,5 dtk, fade-out 4 dtk.
- **Ducking sidechain** dipicu narasi: musik turun sekitar 7 dB saat ada suara (attack 250 ms, release 1,2 dtk, knee lebar), sehingga tidak ada lonjakan volume mendadak. Hasil uji: musik sekitar 15 dB di bawah narasi, dan naik lembut di jeda.
- Limiter akhir. Hasil uji: sekitar **−17 LUFS** terintegrasi, puncak −3 dBFS (YouTube menormalkan ke sekitar −14 LUFS dan hanya menurunkan, tidak menaikkan).
- Setiap baris narasi diletakkan tepat di timecode `vo.json`. Baris yang kepanjangan dipercepat maks. 8%; lebih dari itu dilaporkan di `audio/laporan-vo.txt`, tidak dipotong diam-diam.

## 3. Narasi

Naskah v2 (`naskah-vo.txt`, 55 baris, 358 kata) ditulis ulang bergaya storytelling dan diperiksa per suku kata (≤ 5 suku kata/detik). Alasannya: uji timing menunjukkan naskah v1 (538 kata) tidak muat di 28 baris pada tempo natural.

**Status: selesai.** Narasi direkam tim dalam satu file (4:19, suara perempuan; rekaman tidak di-commit). Rekaman dipotong menjadi 55 baris dengan `selaras.py`. Tiga metode independen (DTW terhadap suara acuan naskah, pemrograman dinamis berbasis durasi, dan gabungan keduanya) menghasilkan batas yang sama untuk ke-55 baris.

Setiap baris lalu ditempatkan dengan `tempatkan-vo.py`:
- mulai tepat sesuai rencana;
- dimajukan maks. 0,6 dtk atau diundur maks. 0,53 dtk hanya bila perlu;
- tempo maks. 1,06× (nada tidak berubah).

Subtitle di video dan `subtitle-id.srt` mengikuti waktu suara aktual (`vo-final.json`). Mixing dengan `mix.py --track`. Hasil: sekitar −16,9 LUFS, puncak −3,8 dBFS, durasi 4:50.

Untuk mengulang dengan rekaman baru:
```bash
cd docs/video-pitching/produksi
python3 selaras.py            # baca vo-asli/rekaman.wav -> vo-asli/selaras.json (perlu audio/vo-uji/*.wav dari espeak-ng)
python3 tempatkan-vo.py       # -> audio/vo-track.wav + vo-final.json
python3 compose.py burn       # subtitle mengikuti vo-final.json
python3 mix.py --track RantangTerang_draft_tanpa_narasi.mp4 RantangTerang_final.mp4
```

## 4. Jika ingin mengganti dengan musik YouTube Audio Library

1. Buka **YouTube Studio → Audio Library** dengan akun yang akan mengunggah video.
2. Filter **Genre: Ambient / Cinematic / Corporate**, **Mood: Calm / Bright / Inspirational**, dan **Attribution: Attribution not required**.
3. Pilih 2–3 track: pembuka (bright, ±100–110 BPM), demo (ambient/calm), penutup (inspirational).
4. **Bukti lisensi:** tangkap layar baris track yang memperlihatkan judul, artis, dan ikon lisensi, lalu simpan bersama tanggal unduh. Isi tabel di bawah.
5. Jika memilih track yang **memerlukan atribusi**, salin teks atribusi persis dari Audio Library ke deskripsi YouTube.
6. Jangan memakai lagu yang hanya berlabel “no copyright” dari kanal atau situs pihak ketiga tanpa lisensi tertulis.

| Bagian | Judul track | Artis | Sumber | Lisensi (dari Audio Library) | Tanggal unduh | Bukti (file tangkapan layar) |
|---|---|---|---|---|---|---|
| Pembuka | | | YouTube Audio Library | | | |
| Demo | | | YouTube Audio Library | | | |
| Penutup | | | YouTube Audio Library | | | |
