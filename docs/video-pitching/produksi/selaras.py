import json, re, subprocess, numpy as np, librosa, sys
SR=16000; HOP=0.02
V=json.load(open('vo.json')); N=len(V)
def load(f): return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',f,'-af','highpass=f=80','-ac','1','-ar',str(SR),'-f','f32le','-']),np.float32).copy()
rec=load('vo-asli/rekaman.wav')
# --- sintesis acuan dengan batas baris diketahui
parts=[];bnd=[];t=0
for i in range(N):
    y=load(f'audio/vo-uji/{i+1:02d}.wav'); y=y[np.abs(y)>0][0:] if False else y
    nz=np.where(np.abs(y)>0.01)[0]; y=y[nz[0]:nz[-1]]
    if i: parts.append(np.zeros(int(.6*SR),np.float32)); t+=.6
    bnd.append((t,t+len(y)/SR)); parts.append(y); t+=len(y)/SR
ref=np.concatenate(parts)
def feat(x):
    h=int(HOP*SR); m=librosa.feature.mfcc(y=x,sr=SR,n_mfcc=20,hop_length=h,n_fft=512)[1:]
    m=(m-m.mean(1,keepdims=True))/(m.std(1,keepdims=True)+1e-6)
    e=librosa.feature.rms(y=x,hop_length=h,frame_length=512)[0]; e=20*np.log10(e+1e-5); e=(e-e.mean())/e.std()
    return np.vstack([m,2*e[None,:m.shape[1]]])
A=feat(ref);B=feat(rec)
D,wp=librosa.sequence.dtw(X=A,Y=B,metric='euclidean',band_rad=0.25)
wp=wp[::-1]
def map_t(tr):
    i=int(tr/HOP); k=np.searchsorted(wp[:,0],i); k=min(k,len(wp)-1); return wp[k,1]*HOP
# --- jeda di rekaman
h=int(HOP*SR); fr=len(rec)//h
e=20*np.log10(np.sqrt((rec[:fr*h].reshape(fr,h)**2).mean(1))+1e-9)
thr=max(np.percentile(e,95)-35,np.percentile(e,10)+8); vo=e>thr
idx=np.where(vo)[0]; gaps=[(a,b) for a,b in zip(idx,idx[1:]) if b-a>=8]  # >=160ms
gmid=np.array([(a+b)/2*HOP for a,b in gaps]); glen=np.array([(b-a)*HOP for a,b in gaps])
# batas DTW: titik tengah antara akhir baris i dan awal baris i+1 di acuan
dtwb=[map_t((bnd[i][1]+bnd[i+1][0])/2) for i in range(N-1)]
# --- DP: pilih N-1 jeda; skor = cocok durasi (laju bicara global) + panjang jeda + dekat DTW
def syl(t):
    for k,v in {'SPPG':'es pe pe ge','HP':'ha pe'}.items(): t=t.replace(k,v)
    return len(re.findall(r'[aiueoAIUEO]+',t))
S=np.array([syl(v['x']) for v in V]); start=idx[0]*HOP; end=(idx[-1]+1)*HOP
G=len(gaps); gs=np.array([a*HOP for a,b in gaps]); ge=np.array([b*HOP for a,b in gaps])
speech=vo.sum()*HOP; rate=S.sum()/speech
INF=1e18
cost=np.full((N,G+1),INF); back=np.zeros((N,G+1),int)
def segcost(i,t0,t1,useD=True):
    d=t1-t0; ex=S[i]/rate
    return 4*np.log(max(d,.05)/ex)**2
# state: line i ends at gap g (g index), line N-1 ends at "end" (g=G)
ends=list(range(G))+[G]
def endt(g): return gs[g] if g<G else end
def nxt(g): return ge[g] if g>=0 else start
for g in range(G+1):
    if g==G and N>1: continue
    cost[0,g]=segcost(0,start,endt(g))+(0 if g==G else -1.5*min(glen[g],1.2)+0.8*abs(gmid[g]-dtwb[0]))
for i in range(1,N):
    for g in range(G+1):
        if (g==G)!=(i==N-1): continue
        t1=endt(g); best=INF;bb=-1
        lo=max(0,g-25)
        for p in range(lo,min(g,G)):
            if cost[i-1,p]>=INF: continue
            c=cost[i-1,p]+segcost(i,ge[p],t1)
            if c<best: best=c;bb=p
        if bb<0: continue
        cost[i,g]=best+(0 if g==G else -1.5*min(glen[g],1.2)+0.8*abs(gmid[g]-dtwb[i]))
        back[i,g]=bb
g=G; ch=[]
for i in range(N-1,0,-1): g=back[i,g]; ch.append(g)
ch=ch[::-1]
seg=[]; t0=start
for k,gg in enumerate(ch): seg.append((t0,gs[gg])); t0=ge[gg]
seg.append((t0,end))
# --- pembanding: DP tanpa DTW (murni durasi + jeda) dan DTW mentah
dp_b=[ (seg[i][1]+seg[i+1][0])/2 for i in range(N-1)]
dev=[abs(a-b) for a,b in zip(dp_b,dtwb)]
print('rate %.2f suku/dtk; jeda kandidat %d'%(rate,G))
print('batas DP vs DTW mentah: median selisih %.2fs, >1s: %s'%(np.median(dev),[i+2 for i,d in enumerate(dev) if d>1]))
json.dump({'seg':seg,'dtw':dtwb,'gap_len':[float(glen[g]) for g in ch]},open('vo-asli/selaras.json','w'))
for i,(a,b) in enumerate(seg):
    print(f"{i+1:02d} {a:6.2f}-{b:6.2f} ({b-a:4.1f}s, harap {S[i]/rate:4.1f}s) jeda_sesudah {glen[ch[i]] if i<N-1 else 0:.2f}  {V[i]['x'][:50]}")
