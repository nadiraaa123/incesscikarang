const { chromium } = require('playwright'); const { newClip } = require('./rec-lib.cjs'); const path=require('path');
const S = [['s1-tim', 30], ['s2-intro', 30], ['s3-fitur', 40], ['s4-rencana', 35]];
(async () => { const b = await chromium.launch(); const only = process.argv[2];
  for (const [n, d] of S) { if (only && only !== n) continue;
    const c = await newClip(b, n, { w: 1920, h: 1080, dsf: 1, ctx: { viewport: { width: 1920, height: 1080 } } });
    await c.page.goto('file://' + path.resolve('scenes', n + '.html')); await c.page.evaluate(() => document.fonts.ready); await c.page.waitForTimeout(800);
    await c.page.evaluate(() => { const e=document.getElementById('__cur'); if(e) e.remove(); });
    await c.start(); await c.page.evaluate(() => window.__start()); await c.page.waitForTimeout(d * 1000 - 400); await c.finish(n); }
  await b.close(); })();
