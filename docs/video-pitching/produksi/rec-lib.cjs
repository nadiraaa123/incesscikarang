const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');
const CURSOR = `
(() => { const add = () => { if (document.getElementById('__cur')) return;
  const s = document.createElement('style'); s.textContent = '#__cur{position:fixed;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;background:rgba(217,154,30,.35);border:3px solid #D99A1E;z-index:2147483647;pointer-events:none;transition:transform .45s cubic-bezier(.4,0,.2,1),opacity .3s;opacity:0}#__cur.on{opacity:1}#__cur.tap{animation:__t .35s ease-out}@keyframes __t{0%{box-shadow:0 0 0 0 rgba(217,154,30,.7)}100%{box-shadow:0 0 0 22px rgba(217,154,30,0)}}';
  document.documentElement.appendChild(s); const c = document.createElement('div'); c.id='__cur'; document.documentElement.appendChild(c); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add); else add(); })();`;
async function newClip(browser, name, opts) {
  const ctx = await browser.newContext(opts.ctx);
  await ctx.addInitScript(CURSOR);
  const page = await ctx.newPage();
  const dir = path.join('frames', name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const cdp = await ctx.newCDPSession(page); const frames = [];
  cdp.on('Page.screencastFrame', async (f) => { const n = frames.length; const fn = path.join(dir, String(n).padStart(5, '0') + '.jpg'); fs.writeFileSync(fn, Buffer.from(f.data, 'base64')); frames.push({ fn, t: f.metadata.timestamp }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  const start = () => cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: opts.w, maxHeight: opts.h, everyNthFrame: 1 });
  let cx = opts.w / opts.dsf / 2, cy = opts.h / opts.dsf / 2;
  const moveTo = async (x, y) => { await page.evaluate(([x, y]) => { const c = document.getElementById('__cur'); if (c) { c.classList.add('on'); c.style.transform = `translate(${x}px,${y}px)`; } }, [x, y]); cx = x; cy = y; await page.waitForTimeout(550); };
  const tap = async (loc, wait = 700) => { await loc.scrollIntoViewIfNeeded(); await page.waitForTimeout(250); const b = await loc.boundingBox(); await moveTo(b.x + b.width / 2, b.y + b.height / 2);
    await page.evaluate(() => { const c = document.getElementById('__cur'); c.classList.remove('tap'); void c.offsetWidth; c.classList.add('tap'); }); await page.waitForTimeout(180); await loc.click(); await page.waitForTimeout(wait);
    await page.evaluate(([x, y]) => { const c = document.getElementById('__cur'); if (c) { c.style.transition = 'none'; c.style.transform = `translate(${x}px,${y}px)`; c.classList.add('on'); void c.offsetWidth; c.style.transition = ''; } }, [cx, cy]); };
  const type = async (loc, text) => { await tap(loc, 200); await loc.pressSequentially(text, { delay: 32 }); await page.waitForTimeout(500); };
  const scrollTo = async (y, wait = 1200) => { await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), y); await page.waitForTimeout(wait); };
  const scrollToEl = async (loc, offset = 80, wait = 1200) => { const y = await loc.evaluate((e, o) => e.getBoundingClientRect().top + window.scrollY - o, offset); await scrollTo(y, wait); };
  const hold = (ms) => page.waitForTimeout(ms);
  const marks = []; const mark = (label) => marks.push({ label, t: Date.now() / 1000 });
  const finish = async (outName) => {
    await page.waitForTimeout(400); const tEnd = Date.now() / 1000; await cdp.send('Page.stopScreencast').catch(() => {});
    const state = await ctx.storageState(); await ctx.close();
    const lines = ['ffconcat version 1.0'];
    for (let i = 0; i < frames.length; i++) { const d = (i + 1 < frames.length ? frames[i + 1].t : tEnd) - frames[i].t; lines.push(`file '${path.resolve(frames[i].fn)}'`, `duration ${Math.max(d, 0.001).toFixed(4)}`); }
    lines.push(`file '${path.resolve(frames[frames.length - 1].fn)}'`);
    fs.writeFileSync(path.join(dir, 'list.txt'), lines.join('\n'));
    fs.mkdirSync('clips', { recursive: true });
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt'), '-vf', `fps=30,scale=${opts.w}:${opts.h}:force_original_aspect_ratio=decrease,pad=${opts.w}:${opts.h}:(ow-iw)/2:(oh-ih)/2:color=0xFAF7F0,format=yuv420p`, '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', `clips/${outName}.mp4`]);
    const t0 = frames[0].t; fs.writeFileSync(`clips/${outName}.marks.json`, JSON.stringify(marks.map((m) => ({ label: m.label, t: +(m.t - t0).toFixed(2) })), null, 1));
    const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `clips/${outName}.mp4`]).toString().trim();
    console.log(`${outName}: ${frames.length} frames, ${dur}s`); return state;
  };
  return { ctx, page, start, tap, type, scrollTo, scrollToEl, hold, moveTo, mark, finish };
}
const MOBILE = (state) => ({ w: 780, h: 1688, dsf: 2, ctx: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, storageState: state, locale: 'id-ID', timezoneId: 'Asia/Jakarta' } });
const DESKTOP = (state) => ({ w: 1920, h: 1080, dsf: 1.5, ctx: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5, storageState: state, locale: 'id-ID', timezoneId: 'Asia/Jakarta' } });
module.exports = { newClip, MOBILE, DESKTOP };
