"""Musik latar ORISINAL, disintesis dari nol dengan numpy (tanpa sampel/rekaman pihak lain).
Struktur mengikuti timeline video 4:50. Keluaran: audio/musik.wav (48 kHz stereo)."""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile
SR=48000; rng=np.random.default_rng(7)
TOTAL=290.0
def n2f(n): return 440*2**((n-69)/12)
def env_adsr(n,a,d,s,r,sr=SR):
    t=np.arange(n)/sr; e=np.ones(n)*s
    A=int(a*sr);D=int(d*sr);R=int(r*sr)
    e[:A]=np.linspace(0,1,A) if A else e[:A]
    e[A:A+D]=np.linspace(1,s,len(e[A:A+D]))
    if R: e[-R:]*=np.linspace(1,0,R)
    return e
def lp(x,fc,order=2): return sosfilt(butter(order,fc,'low',fs=SR,output='sos'),x)
def hp(x,fc,order=2): return sosfilt(butter(order,fc,'high',fs=SR,output='sos'),x)
def saw(f,n,ph=0):
    t=np.arange(n)/SR; return 2*((f*t+ph)%1)-1
def pad_chord(notes,dur,bright=1800):
    n=int(dur*SR); L=np.zeros(n); R=np.zeros(n)
    for k,m in enumerate(notes):
        for det,side in ((-0.12,0),(0.12,1),(0,2)):
            w=saw(n2f(m+det/1),n,rng.random())
            if side==0: L+=w
            elif side==1: R+=w
            else: L+=w*.5; R+=w*.5
    e=env_adsr(n,1.2,0.5,.85,1.4)
    return np.stack([lp(L,bright)*e,lp(R,bright)*e])/ (len(notes)*2.2)
def pluck(f,dur=0.9,bright=1.0):
    n=int(dur*SR); t=np.arange(n)/SR
    x=sum((0.6**h)*np.sin(2*np.pi*f*(h+1)*t) for h in range(5))
    e=np.exp(-t*(5/bright))*np.minimum(1,t*400)
    return x*e*.35
def kick():
    n=int(.35*SR); t=np.arange(n)/SR; f=48+90*np.exp(-t*28)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*9)*.9
def hat(open_=False):
    n=int((.18 if open_ else .05)*SR); t=np.arange(n)/SR
    return hp(rng.standard_normal(n),7000)*np.exp(-t*(18 if open_ else 70))*.18
def clap():
    n=int(.22*SR); t=np.arange(n)/SR
    x=hp(lp(rng.standard_normal(n),3500),900)
    e=np.exp(-t*22)*(1+0.6*np.sin(2*np.pi*90*t).clip(0))
    return x*e*.35
def bassnote(m,dur):
    n=int(dur*SR); t=np.arange(n)/SR; f=n2f(m)
    x=np.sin(2*np.pi*f*t)+.25*np.sin(2*np.pi*2*f*t)
    return np.tanh(1.4*x)*env_adsr(n,.01,.15,.7,.12)*.45
def place(buf,x,t,pan=0.0,g=1.0):
    i=int(t*SR)
    if i>=buf.shape[1]: return
    if x.ndim==1:
        l=np.sqrt(.5*(1-pan)); r=np.sqrt(.5*(1+pan)); x=np.stack([x*l,x*r])
    j=min(buf.shape[1],i+x.shape[1]); buf[:,i:j]+=g*x[:,:j-i]
def reverb(buf,secs=2.4,mix=.25):
    n=int(secs*SR); t=np.arange(n)/SR
    out=np.zeros_like(buf)
    for c in range(2):
        ir=rng.standard_normal(n)*np.exp(-t*3.2); ir=lp(ir,6000); ir/=np.sqrt((ir**2).sum())
        out[c]=fftconvolve(buf[c],ir)[:buf.shape[1]]
    return buf*(1-mix)+out*mix*1.4

# ---------- satu bagian ----------
def section(dur,bpm,prog,layers,arp_pat=(0,2,1,2),arp_oct=12,bright=1800,seed=0):
    """prog: list akor (nada MIDI) per 1 bar (4 ketuk). layers: dict nama->gain."""
    beat=60/bpm; bar=beat*4; n=int(dur*SR); buf=np.zeros((2,n)); dry=np.zeros((2,n))
    nb=int(np.ceil(dur/bar))
    for b in range(nb):
        ch=prog[b%len(prog)]; t0=b*bar
        if layers.get('pad'): place(buf,pad_chord(ch,bar+1.4,bright),t0,g=layers['pad'])
        if layers.get('arp'):
            step=beat/2
            for s in range(8):
                note=ch[arp_pat[s%len(arp_pat)]%len(ch)]+arp_oct+(12 if s in (3,7) and layers.get('arp_hi') else 0)
                place(buf,pluck(n2f(note),.7),t0+s*step,pan=(-.35 if s%2 else .35),g=layers['arp'])
        if layers.get('bass'):
            root=ch[0]-12
            for s,(off,ln) in enumerate(((0,1.5),(1.5,.5),(2,1.5),(3.5,.5))):
                place(dry,bassnote(root if s!=3 else root+7,ln*beat*.95),t0+off*beat,g=layers['bass'])
        if layers.get('kick'):
            for k in ((0,2) if layers.get('half') else (0,1,2,3)): place(dry,kick(),t0+k*beat,g=layers['kick'])
        if layers.get('hat'):
            for s in range(8): place(dry,hat(s%4==2),t0+s*beat/2+beat/4*0,pan=.25,g=layers['hat']*(1 if s%2 else .55))
        if layers.get('clap'):
            for k in (1,3): place(dry,clap(),t0+k*beat,g=layers['clap'])
    wet=reverb(buf,2.6,.35)
    return wet+reverb(dry,1.2,.12)

def fadewin(n,fi,fo):
    w=np.ones(n); a=int(fi*SR); b=int(fo*SR)
    if a: w[:a]=.5-.5*np.cos(np.linspace(0,np.pi,a))
    if b: w[-b:]=.5+.5*np.cos(np.linspace(0,np.pi,b))
    return w

Am=[57,60,64,67]; F=[53,57,60,64]; C=[48,55,60,64]; G=[55,59,62,67]
Fm7=[53,57,60,64]; Am7=[57,60,64,67]; Cmaj7=[48,52,55,59]; G6=[55,59,62,64]; Dm9=[50,53,57,64]; Em7=[52,55,59,62]
XF=2.5  # crossfade antarbagian (detik)
# (mulai, selesai, parameter) — batas mengikuti adegan video
SEC=[
 (0,30,   dict(bpm=104,prog=[Am,F,C,G],layers=dict(pad=.55,arp=.8,arp_hi=1,kick=.55,hat=.45,bass=.55),bright=2600)),   # pembuka: modern, menarik
 (30,60,  dict(bpm=104,prog=[F,C,G,Am],layers=dict(pad=.6,arp=.7,kick=.35,half=1,hat=.3,bass=.45),bright=2200)),        # intro produk: sedikit lebih ringan
 (60,130, dict(bpm=96,prog=[Fm7,Am7,Cmaj7,G6],layers=dict(pad=.7,arp=.45),arp_pat=(0,2,3,1),bright=1500)),             # demo 1: ambient tenang
 (130,190,dict(bpm=96,prog=[Dm9,Am7,Fm7,Cmaj7],layers=dict(pad=.7,arp=.5,hat=.18,bass=.3),arp_pat=(0,3,1,2),bright=1600)), # demo 2: variasi halus
 (190,215,dict(bpm=96,prog=[Fm7,G6,Em7,Am7],layers=dict(pad=.7,arp=.5,kick=.25,half=1,hat=.2,bass=.35),bright=1700)),  # dashboard: mulai naik
 (215,255,dict(bpm=104,prog=[F,G,Em7,Am],layers=dict(pad=.55,arp=.75,arp_hi=1,kick=.55,hat=.45,clap=.4,bass=.55),bright=2600)), # sorotan fitur: dinamis
 (255,290,dict(bpm=100,prog=[F,G,C,C],layers=dict(pad=.65,arp=.65,kick=.4,half=1,hat=.3,bass=.45),bright=2400)),        # penutup: positif, resolusi ke C
]
out=np.zeros((2,int(TOTAL*SR)))
for k,(s,e,p) in enumerate(SEC):
    a=max(0,s-XF/2); b=min(TOTAL,e+XF/2); d=b-a
    x=section(d+3,**p)[:, :int(d*SR)]
    fi=0 if k==0 else XF; fo=4.0 if k==len(SEC)-1 else XF
    if k==0: fi=1.5
    x*=fadewin(x.shape[1],fi,fo)
    i=int(a*SR); out[:,i:i+x.shape[1]]+=x[:, :out.shape[1]-i]
    print('bagian',k,s,e)
out=hp(out,35)
pk=np.abs(out).max(); out=out/pk*0.89
wavfile.write('audio/musik.wav',SR,(out.T*32767).astype(np.int16))
print('ok peak',pk)
