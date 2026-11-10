"""Menempatkan potongan narasi pada timeline: tiap baris dimulai sedekat mungkin dengan rencana (vo.json),
boleh maju s/d 0,6 dtk atau mundur bila baris sebelumnya belum selesai; bila tetap tidak muat sebelum baris
berikutnya, dipercepat s/d 10% (tanpa ubah nada). Keluaran: audio/vo-track.wav + vo-final.json (waktu subtitle aktual)."""
import json, subprocess, numpy as np, sys
from scipy.io import wavfile
SR=48000; TOTAL=290.0; MAXT=1.10; MAJU=0.6; GAP=0.18
V=json.load(open('vo.json')); seg=json.load(open('vo-asli/selaras.json'))['seg']; N=len(V)
src='vo-asli/rekaman.wav'
def ambil(a,b,tempo=1.0):
    a=max(0,a-0.05); b=b+0.12
    af=f"afade=t=in:d=0.03,afade=t=out:st={b-a-0.06:.3f}:d=0.06"+(f",atempo={tempo:.4f}" if tempo>1.0001 else "")
    return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-ss',f'{a:.3f}','-t',f'{b-a:.3f}','-i',src,'-af',af,'-ac','1','-ar',str(SR),'-f','f32le','-']),np.float32)
track=np.zeros(int(TOTAL*SR),np.float32); out=[]; prev=0.0; rep=[]
for i,(v,(a,b)) in enumerate(zip(V,seg)):
    d=(b-a)+0.17
    nxt=V[i+1]['t0'] if i+1<N else TOTAL-1.2
    lim=nxt+0.35                    # boleh sedikit masuk ke awal slot berikut
    start=max(v['t0'], prev+GAP)
    if start+d>lim and i+1<N:      # tidak muat: majukan seperlunya (maks. MAJU), tidak sebelum baris sebelumnya selesai
        start=max(v['t0']-MAJU, prev+GAP, min(start, lim-d))
    room=lim-start            # boleh sedikit masuk ke awal slot berikut (baris berikut akan bergeser)
    tempo=min(MAXT, max(1.0, d/room)) if room>0 else MAXT
    x=ambil(a,b,tempo); dd=len(x)/SR
    s=int(start*SR); track[s:s+len(x)]+=x[:len(track)-s]
    end=start+dd; prev=end
    geser=start-v['t0']
    out.append({'t0':round(start,2),'t1':round(min(end,TOTAL),2),'x':v['x']})
    flag='' if -MAJU-0.01<=geser<=0.8 else '  <-- GESER BESAR'
    rep.append(f"{i+1:02d} rencana {v['t0']:6.1f}s  mulai {start:6.2f}s ({geser:+.2f})  durasi {dd:4.1f}s  tempo {tempo:.2f}{flag}")
wavfile.write('audio/vo-track.wav',SR,track)
json.dump(out,open('vo-final.json','w'),ensure_ascii=False,indent=0)
open('audio/laporan-vo.txt','w').write('\n'.join(rep)+'\n')
print('\n'.join(rep))
print('akhir narasi terakhir: %.2fs (video 290s)'%prev)
