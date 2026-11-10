"""Memotong SATU rekaman narasi utuh menjadi 55 baris (01.wav … 55.wav) sesuai vo.json.
Syarat rekaman: baca naskah berurutan, beri jeda ±2 detik (tarik napas) di antara nomor baris.
Pemakaian: python3 potong-vo.py rekaman.m4a folder_keluaran [17=ulang17.m4a ...]
(argumen opsional NN=file mengganti baris NN dengan rekaman ulang terpisah)
Cara kerja: cari jeda hening, ambil N-1 jeda TERPANJANG sebagai batas antarbaris (jeda koma di
tengah kalimat lebih pendek, jadi tidak terpilih), lalu cek kewajaran durasi tiap potongan."""
import json, re, subprocess, sys, os
import numpy as np
from scipy.io import wavfile
SR=48000
src,outdir=sys.argv[1:3]; ganti=dict(a.split('=',1) for a in sys.argv[3:]); os.makedirs(outdir,exist_ok=True)
V=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'vo.json'))); N=len(V)
x=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',src,'-af','highpass=f=80','-ac','1','-ar',str(SR),'-f','f32le','-']),np.float32).copy()
hop=int(.02*SR); fr=len(x)//hop
e=20*np.log10(np.sqrt((x[:fr*hop].reshape(fr,hop)**2).mean(1))+1e-9)
voiced=e>max(np.percentile(e,95)-35, np.percentile(e,10)+8)   # ambang adaptif terhadap derau ruangan
# rapatkan potongan suara yang terpisah < 60 ms
idx=np.where(voiced)[0]
if len(idx)==0: sys.exit('Tidak ada suara terdeteksi.')
gaps=[]  # (panjang_detik, akhir_suara_frame, mulai_suara_frame)
for a,b in zip(idx,idx[1:]):
    if b-a>3: gaps.append(((b-a)*hop/SR,a,b))
if len(gaps)<N-1: sys.exit(f'Hanya {len(gaps)+1} potongan suara terdeteksi, butuh {N}. Pastikan ada jeda jelas di antara baris.')
gaps.sort(reverse=True); pilih=sorted(gaps[:N-1],key=lambda g:g[1])
terpendek=gaps[N-2][0]; berikut=gaps[N-1][0] if len(gaps)>=N else 0
batas=[(idx[0],None)]
segs=[]; start=idx[0]
for g in pilih: segs.append((start,g[1]+1)); start=g[2]
segs.append((start,idx[-1]+1))
def syl(t):
    for k,v in {'SPPG':'es pe pe ge','HP':'ha pe'}.items(): t=t.replace(k,v)
    return len(re.findall(r'[aiueoAIUEO]+',t))
dur=np.array([(b-a)*hop/SR for a,b in segs]); s=np.array([syl(v['x']) for v in V])
rate=s/dur; med=np.median(rate); aneh=[i for i in range(N) if not (0.55*med<rate[i]<1.8*med)]
for i,(a,b) in enumerate(segs):
    a0=max(0,a*hop-int(.06*SR)); b0=min(len(x),b*hop+int(.15*SR))
    wavfile.write(os.path.join(outdir,f'{i+1:02d}.wav'),SR,x[a0:b0])
print(f'{N} potongan dibuat di {outdir}. Jeda batas terpendek {terpendek:.2f}s vs jeda dalam-kalimat terpanjang {berikut:.2f}s',
      '(aman)' if terpendek>berikut*1.3 else '(TIPIS: cek hasil!)')
if aneh: print('Periksa baris (durasi tidak wajar, mungkin salah potong):',', '.join(f'{i+1:02d}' for i in aneh))
else: print('Durasi semua baris wajar terhadap panjang teksnya.')
for k,f in ganti.items():
    y=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',f,'-ac','1','-ar',str(SR),'-f','f32le','-']),np.float32)
    wavfile.write(os.path.join(outdir,f'{int(k):02d}.wav'),SR,y); print(f'baris {int(k):02d} diganti dengan {f}')
