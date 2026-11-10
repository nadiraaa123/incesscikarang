const { chromium } = require('playwright'); const fs=require('fs');
(async () => { const b = await chromium.launch(); const st = JSON.parse(fs.readFileSync('state.json')); st.origins.forEach(o=>o.localStorage=o.localStorage.filter(x=>x.name!=='rantang-terang-sesi'));
 for (const [n,w,h,m] of [['hp',390,844,true],['tab',820,1180,true],['desk',1440,900,false]]) { const c = await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:2,isMobile:m,hasTouch:m,storageState:st}); const p=await c.newPage(); await p.goto('http://localhost:4173/sekolah/uji-sd-1'); await p.waitForLoadState('networkidle'); await p.waitForTimeout(1500); await p.screenshot({path:`scenes/img/r-${n}.png`}); await c.close(); }
 await b.close(); })();
