const { chromium } = require('playwright'); const fs = require('fs'); const { newClip, MOBILE } = require('./rec-lib.cjs');
const U = 'http://localhost:4173';
(async () => {
  const b = await chromium.launch();
  const c = await newClip(b, 'A', MOBILE(undefined)); const p = c.page;
  await p.goto(U + '/masuk'); await p.waitForLoadState('networkidle'); await c.start(); await c.hold(1200);
  c.mark('login'); await c.tap(p.getByRole('button', { name: /Orang tua SD/ }), 1800);
  c.mark('beranda'); await c.hold(1500);
  await c.scrollToEl(p.getByText('Menu hari ini').first(), 70, 2600);
  c.mark('perjalanan'); await c.scrollToEl(p.getByText('Perjalanan makanan').first(), 70, 2800);
  await c.scrollTo(0, 1400);
  c.mark('buat'); await c.tap(p.getByRole('link', { name: /Buat laporan/ }).first(), 1500);
  c.mark('validasi'); await c.tap(p.getByRole('button', { name: /Kirim laporan/ }), 2600);
  c.mark('kategori'); await c.tap(p.getByText('Porsi makanan', { exact: true }), 900);
  c.mark('deskripsi'); await c.type(p.locator('textarea').first(), 'Porsi yang diterima hari ini tampak lebih sedikit dibanding menu yang ditampilkan.');
  await c.hold(600);
  c.mark('tanggal'); await c.scrollToEl(p.getByText('3. Tanggal kejadian'), 90, 1500);
  c.mark('foto'); p.once('filechooser', (fc) => fc.setFiles('bukti-contoh.jpg')); await c.tap(p.getByRole('button', { name: /Galeri/ }), 300);
  await c.hold(2000);
  c.mark('kirim'); await c.tap(p.getByRole('button', { name: /Kirim laporan/ }), 2200);
  const dup = p.getByRole('button', { name: /Tetap kirim laporan baru/ });
  if (await dup.isVisible().catch(() => false)) { c.mark('duplikat'); await c.scrollToEl(p.getByText('Kamu sudah pernah mengirim laporan serupa'), 200, 2600); await c.tap(dup, 2000); }
  c.mark('sukses'); await c.hold(3500);
  const nomor = (await p.locator('body').innerText()).match(/RT-\d{6}-\d{4}/g);
  console.log('nomor', nomor);
  const st = await c.finish('A-ortu-lapor'); fs.writeFileSync('state.json', JSON.stringify(st)); fs.writeFileSync('nomor.txt', nomor ? nomor[0] : '');
  await p.screenshot().catch(()=>{}); await b.close();
})();
