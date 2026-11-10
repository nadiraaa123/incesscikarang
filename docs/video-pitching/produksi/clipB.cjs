const { chromium } = require('playwright'); const fs = require('fs'); const { newClip, DESKTOP } = require('./rec-lib.cjs');
const U = 'http://localhost:4173'; const NO = fs.readFileSync('nomor.txt', 'utf8').trim();
(async () => {
  const b = await chromium.launch();
  const c = await newClip(b, 'B', DESKTOP(JSON.parse(fs.readFileSync('state.json')))); const p = c.page;
  await p.goto(U + '/masuk'); await p.waitForLoadState('networkidle'); await c.start(); await c.hold(1000);
  c.mark('login'); await c.tap(p.getByRole('button', { name: /Petugas sekolah SD/ }), 1500);
  await p.goto(U + '/petugas/verifikasi'); await p.waitForLoadState('networkidle');
  c.mark('antrean'); await c.hold(2500);
  c.mark('buka'); await c.tap(p.getByText(NO).first(), 1800);
  c.mark('periksa'); await c.hold(1500); await c.scrollToEl(p.getByText('Periksa sebelum memutuskan'), 120, 2500);
  c.mark('verif'); await c.tap(p.getByRole('button', { name: 'Terverifikasi', exact: true }), 600);
  await c.tap(p.getByRole('button', { name: 'Konfirmasi' }), 2000);
  c.mark('urgensi'); await c.tap(p.getByRole('radio', { name: 'Normal' }), 1500);
  c.mark('teruskan'); await c.tap(p.getByRole('button', { name: 'Teruskan ke SPPG' }), 600);
  await c.tap(p.getByRole('button', { name: 'Konfirmasi' }), 2200);
  c.mark('riwayat'); await c.scrollToEl(p.getByText('Riwayat penanganan'), 100, 3000);
  const st = await c.finish('B-petugas-verifikasi'); fs.writeFileSync('state.json', JSON.stringify(st)); await b.close();
})();
