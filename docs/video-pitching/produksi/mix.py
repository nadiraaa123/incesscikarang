"""Mixing akhir: narasi per baris + musik latar + ducking -> video final.
Pemakaian:
  python3 mix.py VO_DIR VIDEO_IN VIDEO_OUT
VO_DIR berisi 01.wav, 02.wav, ... (satu file per baris vo.json, urutan sama; .wav/.mp3/.m4a).
Bila sebuah baris lebih panjang dari jatahnya, dipercepat maks. 8%; lebih dari itu dilaporkan, tidak dipotong."""
import json, subprocess, sys, os, glob
import numpy as np
from scipy.io import wavfile
SR=48000; TOTAL=290.0
vo_dir, vin, vout = sys.argv[1:4]
V=json.load(open('vo.json'))
def dur(f): return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f]))
def load(f, tempo=1.0):
    af=f'highpass=f=80,afftdn=nf=-30,atempo={tempo:.4f}' if tempo!=1 else 'highpass=f=80,afftdn=nf=-30'
    raw=subprocess.check_output(['ffmpeg','-v','error','-i',f,'-af',af,'-ac','1','-ar',str(SR),'-f','f32le','-'])
    x=np.frombuffer(raw,np.float32).copy()
    # buang hening di awal/akhir
    th=np.abs(x).max()*0.02; idx=np.where(np.abs(x)>th)[0]
    return x[max(0,idx[0]-int(.03*SR)):idx[-1]+int(.12*SR)] if len(idx) else x
track=np.zeros(int(TOTAL*SR),np.float32); rep=[]
files=sorted(glob.glob(os.path.join(vo_dir,'*.*')))
assert len(files)==len(V), f'{len(files)} file VO, harus {len(V)} (satu per baris vo.json)'
for i,(v,f) in enumerate(zip(V,files)):
    slot=v['t1']-v['t0']+0.25          # boleh melewati akhir subtitle 0,25 dtk
    nxt=V[i+1]['t0'] if i+1<len(V) else TOTAL
    slot=min(slot+0.15, nxt-v['t0']-0.05)
    x=load(f); d=len(x)/SR; tempo=1.0
    if d>slot:
        tempo=min(1.08,d/slot); x=load(f,tempo); d=len(x)/SR
    status='OK' if d<=slot+0.01 else f'KEPANJANGAN {d-slot:.2f}s'
    rep.append(f'{i+1:02d} {v["t0"]:6.1f}s slot {slot:4.1f}s suara {d:4.1f}s tempo {tempo:.3f} {status}')
    s=int(v['t0']*SR); track[s:s+len(x)]+=x[:len(track)-s]
open('audio/laporan-vo.txt','w').write('\n'.join(rep)+'\n'); print('\n'.join(r for r in rep if 'OK' not in r) or 'semua baris muat')
wavfile.write('audio/vo-track.wav',SR,track)
# 1) normalisasi narasi ke -16 LUFS; 2) musik dasar -23 LUFS, di-duck oleh narasi; 3) gabung, batasi puncak -1,5 dBTP
fc=("[0:a]aformat=sample_rates=48000:channel_layouts=mono,"
    "acompressor=threshold=-24dB:ratio=3:attack=8:release=120:makeup=2,loudnorm=I=-16:TP=-2:LRA=7,"
    "aformat=channel_layouts=stereo,asplit=2[vo][key];"
    "[1:a]loudnorm=I=-23:TP=-6:LRA=11,afade=t=in:d=1.5,afade=t=out:st=286:d=4[mus];"
    "[mus][key]sidechaincompress=threshold=0.06:ratio=2.5:attack=250:release=1200:knee=8:makeup=1[duck];"
    "[vo][duck]amix=inputs=2:normalize=0,alimiter=limit=0.84:level=0[a]")
subprocess.run(['ffmpeg','-v','error','-y','-i','audio/vo-track.wav','-i','audio/musik.wav','-filter_complex',fc,'-map','[a]','-ar','48000','audio/mix.wav'],check=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',vin,'-i','audio/mix.wav','-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',vout],check=True)
print('selesai ->',vout)
