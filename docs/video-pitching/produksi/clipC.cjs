const { chromium } = require('playwright'); const fs = require('fs'); const { newClip, DESKTOP, MOBILE } = require('./rec-lib.cjs');
const U = 'http://localhost:4173'; const NO = fs.readFileSync('nomor.txt', 'utf8').trim();
const S = () => JSON.parse(fs.readFileSync('state.json'));
const which = process.argv[2];
(async () => {
  const b = await chromium.launch(); let c, p;
  if (which === 'C') { // SPPG menanggapi
    c = await newClip(b, 'C', DESKTOP(S())); p = c.page;
    await p.goto(U + '/masuk'); await p.waitForLoadState('networkidle'); await c.start(); await c.hold(800);
    c.mark('login'); await c.tap(p.getByRole('button', { name: /Mitra SPPG/ }), 1500);
    await p.goto(U + '/mitra/sppg'); await p.waitForLoadState('networkidle'); c.mark('kotak'); await c.hold(2200);
    c.mark('buka'); await c.tap(p.getByText(NO).first(), 1800);
    await c.scrollToEl(p.getByText('Tindakan', { exact: true }), 90, 1500);
    c.mark('tangani'); await c.tap(p.getByRole('button', { name: 'Tandai Dalam Penanganan' }), 600);
    await c.tap(p.getByRole('button', { name: 'Konfirmasi' }), 2000);
    c.mark('tanggapan'); await c.type(p.locator('#catatan'), 'Terima kasih atas laporannya. Kami menemukan takaran porsi di jalur pengemasan tidak sesuai. Takaran sudah dikalibrasi ulang dan diperiksa sebelum pengiriman.');
    await c.tap(p.getByRole('button', { name: 'Simpan catatan' }), 2000);
    c.mark('riwayat'); await c.scrollToEl(p.getByText('Riwayat penanganan'), 100, 3000);
    fs.writeFileSync('state.json', JSON.stringify(await c.finish('C-sppg-tanggapan')));
  }
  if (which === 'C2') { // petugas menyelesaikan
    c = await newClip(b, 'C2', DESKTOP(S())); p = c.page;
    await p.goto(U + '/masuk'); await p.waitForLoadState('networkidle'); await c.start(); await c.hold(600);
    c.mark('login'); await c.tap(p.getByRole('button', { name: /Petugas sekolah SD/ }), 1300);
    const id = await p.evaluate((no) => { const d = JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => (localStorage.getItem(k) || '').includes(no)))); const f = (o) => { if (o && typeof o === 'object') { if (o.nomor === no) return o.id; for (const v of Object.values(o)) { const r = f(v); if (r) return r; } } }; return f(d); }, NO);
    await p.goto(U + '/laporan/' + id); await p.waitForLoadState('networkidle'); c.mark('detail'); await c.hold(1500);
    await c.scrollToEl(p.getByText('Tindakan', { exact: true }), 90, 1500);
    c.mark('selesai'); await c.tap(p.getByRole('button', { name: 'Tandai Selesai' }), 600);
    await c.type(p.locator('#teks-selesaikan'), 'Takaran porsi sudah sesuai menu. Petugas sekolah memeriksa tiga hari berikutnya tanpa keluhan baru.');
    await c.tap(p.getByRole('button', { name: 'Konfirmasi' }), 2200);
    c.mark('riwayat'); await c.scrollToEl(p.getByText('Riwayat penanganan'), 100, 3000);
    fs.writeFileSync('state.json', JSON.stringify(await c.finish('C2-petugas-selesai'))); fs.writeFileSync('id.txt', id);
  }
  if (which === 'D') { // eskalasi
    c = await newClip(b, 'D', DESKTOP(S())); p = c.page;
    await p.goto(U + '/petugas/eskalasi'); await p.waitForLoadState('networkidle'); await c.start(); c.mark('monitor'); await c.hold(3500);
    c.mark('buka'); await c.tap(p.getByText(/mual dan pusing/).first(), 2000);
    c.mark('pj'); await c.scrollToEl(p.getByText('Penanggung jawab'), 90, 3000);
    c.mark('riwayat'); await c.scrollToEl(p.getByText('Riwayat penanganan'), 90, 3500);
    fs.writeFileSync('state.json', JSON.stringify(await c.finish('D-eskalasi')));
  }
  if (which === 'E') { // pelapor memantau + cabang ditolak
    c = await newClip(b, 'E', MOBILE(S())); p = c.page;
    await p.goto(U + '/masuk'); await p.waitForLoadState('networkidle'); await c.start(); await c.hold(600);
    c.mark('login'); await c.tap(p.getByRole('button', { name: /Orang tua SD/ }), 1300);
    c.mark('riwayat'); await c.tap(p.getByRole('link', { name: 'Riwayat' }).last(), 2000);
    c.mark('buka'); await c.tap(p.getByText(NO).first(), 2000);
    c.mark('hasil'); await c.scrollToEl(p.getByText('Hasil penyelesaian').first(), 80, 3000);
    c.mark('tanggapan'); await c.scrollToEl(p.getByText('Tanggapan SPPG').first(), 80, 3000);
    c.mark('timeline'); await c.scrollToEl(p.getByText('Riwayat penanganan'), 80, 3500);
    fs.writeFileSync('state.json', JSON.stringify(await c.finish('E-ortu-pantau')));
  }
  if (which === 'E2') { // cabang ditolak (laporan berbeda)
    c = await newClip(b, 'E2', MOBILE(S())); p = c.page;
    await p.goto(U + '/laporan'); await p.waitForLoadState('networkidle'); await c.start(); await c.hold(1200);
    c.mark('buka'); await c.tap(p.locator('a[href^="/laporan/"]', { hasText: 'Ditolak' }).first(), 2000);
    c.mark('alasan'); await c.scrollToEl(p.getByText('Alasan penolakan').first(), 80, 4000);
    fs.writeFileSync('state.json', JSON.stringify(await c.finish('E2-ortu-ditolak')));
  }
  if (which === 'F') { // publik tanpa login
    const st = S(); st.origins.forEach((o) => { o.localStorage = o.localStorage.filter((x) => !/sesi|user|auth|login/i.test(x.name)); });
    console.log(S().origins[0].localStorage.map((x) => x.name));
    c = await newClip(b, 'F', DESKTOP(st)); p = c.page;
    await p.goto(U + '/transparansi'); await p.waitForLoadState('networkidle'); await c.start(); c.mark('atas'); await c.hold(4000);
    c.mark('kategori'); await c.scrollToEl(p.getByText('Laporan per kategori'), 90, 3500);
    c.mark('grafik'); await c.scrollToEl(p.getByText('Perkembangan 6 bulan terakhir'), 90, 3500);
    c.mark('definisi'); await c.scrollToEl(p.getByText('Definisi angka'), 90, 3500);
    await c.finish('F-publik');
  }
  await b.close();
})();
