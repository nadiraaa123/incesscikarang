import json, re
V=[
(0.6,4.8,"Halo! Kami Incess Cikarang dari President University."),
(5.4,10.6,"Ada Helen Stephanis Simarmata, Business Analyst kami,"),
(11.4,16.6,"Dian Theresia Girsang sebagai Project Manager,"),
(17.4,22.6,"dan Nadira Khumaira Putri di bagian Frontend dan Backend."),
(23.8,29.4,"Bersama, kami membangun Rantang Terang."),
(30.4,36.8,"Rantang Terang adalah aplikasi web untuk memantau layanan Makan Bergizi Gratis."),
(37.4,42.0,"Orang tua ingin tahu makanan anaknya, dan tempat melapor yang jelas."),
(42.4,46.8,"Laporan perlu ditindaklanjuti, dan bisa dipantau publik."),
(47.2,55.0,"Laporan diverifikasi petugas, lalu ditindaklanjuti SPPG, Satuan Pelayanan Pemenuhan Gizi."),
(55.4,59.8,"Setiap laporan tercatat, ditindaklanjuti, dan dapat dipantau."),
(60.3,64.2,"Mari ikuti satu laporan sampai selesai."),
(64.4,68.4,"Raka, seorang orang tua, melihat menu anaknya hari ini,"),
(68.8,73.2,"lengkap dengan perjalanan makanan dari dapur ke sekolah."),
(73.7,76.1,"Hari ini, porsinya kurang."),
(76.3,79.6,"Kolom penting tidak boleh terlewat."),
(81.9,86.8,"Raka memilih kategori porsi dan menceritakan yang terjadi,"),
(87.2,91.8,"lalu menambahkan foto sebagai bukti, bila ada."),
(92.3,95.0,"Sistem memeriksa laporan serupa."),
(95.5,100.6,"Ini hanya pengingat, bukan penolakan. Raka tetap bisa mengirim."),
(101.3,104.8,"Laporan tercatat dengan nomor unik."),
(105.3,108.9,"Laporan kini masuk antrean petugas."),
(109.3,112.3,"Petugas memeriksa isinya."),
(112.6,115.4,"Laporan dinyatakan valid,"),
(115.9,120.9,"diberi tingkat urgensi, lalu diteruskan ke SPPG."),
(121.4,123.9,"Setiap langkah tercatat."),
(124.4,129.8,"Laporan yang kurang jelas bisa ditolak, disertai alasan untuk pelapor."),
(130.4,134.4,"SPPG menerima laporan tanpa identitas pelapor."),
(135.0,137.6,"SPPG mulai menanganinya,"),
(138.0,143.8,"lalu memberi tanggapan. Laporan asli tetap utuh."),
(147.2,151.6,"Setelah perbaikan dipastikan, petugas menutup laporan,"),
(151.9,155.6,"dengan catatan hasil untuk pelapor."),
(158.1,161.5,"Kasus serius masuk Monitoring Eskalasi."),
(161.7,167.6,"Contoh ini berurgensi tinggi, dan diteruskan ke pihak kesehatan terkait."),
(167.9,171.8,"Aplikasi mencatat penanganan, bukan memberi diagnosis."),
(172.4,175.4,"Kembali ke Raka."),
(175.8,181.8,"Dari riwayat laporannya, ia tahu masalahnya sudah selesai,"),
(182.2,185.4,"membaca tanggapan SPPG,"),
(185.8,189.9,"dan melihat siapa menangani, kapan, dan apa tindakannya."),
(190.4,194.6,"Masyarakat pun bisa memantau, tanpa login."),
(195.0,201.8,"Terlihat berapa laporan masuk, terverifikasi, dan selesai,"),
(202.6,207.8,"juga sebaran kategori dan tren enam bulan."),
(208.6,214.6,"Semuanya data agregat, tanpa identitas siapa pun."),
(215.6,220.4,"Informasi makanan membantu orang tua memahami layanan."),
(221.1,225.8,"Laporan terstruktur lebih mudah diperiksa."),
(226.6,231.3,"Setiap laporan diverifikasi sebelum diteruskan."),
(232.1,236.8,"Laporan serius diprioritaskan, dengan penanggung jawab jelas."),
(237.6,242.3,"Pelapor bisa memantau sampai selesai."),
(243.1,247.8,"Dan publik melihat perkembangannya, tanpa data pribadi."),
(248.8,254.4,"Semua nyaman dipakai di HP, tablet, maupun desktop."),
(255.5,257.3,"Ke depan,"),
(257.8,263.6,"kami ingin menguji coba Rantang Terang bersama sekolah dan pengguna,"),
(264.3,270.2,"menjajaki integrasi dengan layanan resmi melalui kerja sama,"),
(270.8,277.6,"dan memperluas akses lewat bahasa daerah serta mode hemat kuota."),
(279.2,285.2,"Rantang Terang: setiap laporan tercatat, ditindaklanjuti, dan dapat dipantau."),
(285.7,289.4,"Terima kasih."),
]
SPELL={'SPPG':'es pe pe ge','MBG':'em be ge','HP':'ha pe'}
def syl(t):
    for k,v in SPELL.items(): t=t.replace(k,v)
    return len(re.findall(r'[aiueoAIUEO]+',t.replace('ai','a i')))
bad=0
for a,b,x in V:
    r=syl(x)/(b-a)
    if r>5.0: print(f'CEPAT {r:.1f} suku/dtk {a}: {x}'); bad+=1
for p,q in zip(V,V[1:]): assert q[0]>=p[1], p
print('baris',len(V),'kata',sum(len(x.split()) for *_,x in V),'terlalu cepat',bad)
json.dump([{'t0':a,'t1':b,'x':x} for a,b,x in V],open('vo.json','w'),ensure_ascii=False,indent=0)
