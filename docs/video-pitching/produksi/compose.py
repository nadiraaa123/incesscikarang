import json, subprocess, os, sys
from PIL import Image, ImageDraw
NO = open('nomor.txt').read().strip()
W,H = 1920,1080
os.makedirs('seg', exist_ok=True)
# ---------- backgrounds ----------
def bg(kind):
    im = Image.new('RGB',(W,H),(250,247,240)); d = ImageDraw.Draw(im)
    d.rectangle((0,940,W,H), fill=(240,235,224))
    if kind=='m':
        x,y,w,h = 330,30,416,900
        d.rounded_rectangle((x-16,y-16,x+w+16,y+h+16), 52, fill=(28,36,32))
    else:
        x,y,w,h = 144,14,1632,918
        d.rounded_rectangle((x-8,y-8,x+w+8,y+h+8), 14, fill=(28,36,32))
    im.save(f'seg/bg-{kind}.png')
bg('m'); bg('d')
# ---------- timeline ----------
# (id, source, kind, in, out, target_dur, role, note)
SEG = [
 ('s1','s1-tim','s',0,30,30,None),
 ('s2','s2-intro','s',0,30,30,None),
 ('A','A-ortu-lapor','m',0,45.97,45,'ORANG TUA'),
 ('B','B-petugas-verifikasi','d',3.6,30.2,19,'PETUGAS SEKOLAH'),
 ('E2','E2-ortu-ditolak','m',0.5,9.03,6,'ORANG TUA'),
 ('C','C-sppg-tanggapan','d',3.5,30.0,17,'MITRA SPPG'),
 ('C2','C2-petugas-selesai','d',3.2,21.2,11,'PETUGAS SEKOLAH'),
 ('D','D-eskalasi','d',0,14.0,14,'PETUGAS SEKOLAH'),
 ('E','E-ortu-pantau','m',2.6,20.17,18,'ORANG TUA'),
 ('F','F-publik','d',0,16.0,25,'PUBLIK (TANPA LOGIN)'),
 ('s3','s3-fitur','s',0,40,40,None),
 ('s4','s4-rencana','s',0,35,35,None),
]
starts={}; t=0
for s in SEG: starts[s[0]]=t; t+=s[5]
TOTAL=t
def build_segments():
    files=[]
    for sid,src,kind,a,b,dur,role in SEG:
        out=f'seg/{sid}.mp4'; speed=(b-a)/dur
        trim=f"trim={a}:{b},setpts=(PTS-STARTPTS)/{speed:.5f},fps=30"
        if kind=='s':
            fc=f"[0:v]{trim},scale={W}:{H},trim=duration={dur},format=yuv420p[v]"; ins=['-i',f'clips/{src}.mp4']
        elif kind=='m':
            fc=f"[0:v]{trim},scale=416:900[c];[1:v][c]overlay=330:30,trim=duration={dur},format=yuv420p[v]"; ins=['-i',f'clips/{src}.mp4','-loop','1','-i','seg/bg-m.png']
        else:
            fc=f"[0:v]{trim},scale=1632:918[c];[1:v][c]overlay=144:14,trim=duration={dur},format=yuv420p[v]"; ins=['-i',f'clips/{src}.mp4','-loop','1','-i','seg/bg-d.png']
        # tpad guards against a clip ending a few frames short
        fc=fc.replace(',trim=duration',f',tpad=stop_mode=clone:stop_duration=2,trim=duration')
        subprocess.run(['ffmpeg','-v','error','-y',*ins,'-filter_complex',fc,'-map','[v]','-r','30','-c:v','libx264','-crf','17','-preset','medium',out],check=True)
        files.append(out)
    with open('seg/list.txt','w') as f:
        for x in files: f.write(f"file '{os.path.abspath(x)}'\n")
    subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i','seg/list.txt','-c','copy','seg/full-noass.mp4'],check=True)
# ---------- narration (abs seconds) ----------
VO = json.load(open('vo.json'))
STEPS = json.load(open('steps.json'))
def ts(x):
    h=int(x//3600); m=int(x%3600//60); s=x%60
    return f"{h}:{m:02d}:{s:05.2f}"
def srt_ts(x):
    ms=int(round(x*1000)); return f"{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}"
def write_ass():
    L=["[Script Info]","ScriptType: v4.00+","PlayResX: 1920","PlayResY: 1080","WrapStyle: 0","",
       "[V4+ Styles]","Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
       "Style: Sub,Plus Jakarta Sans SemiBold,40,&H00FFFFFF,&H00FFFFFF,&H3020241C,&H3020241C,0,0,0,0,100,100,0,0,3,14,0,2,80,80,34,1",
       "Style: SubD,Plus Jakarta Sans SemiBold,38,&H00FFFFFF,&H00FFFFFF,&H3020241C,&H3020241C,0,0,0,0,100,100,0,0,3,12,0,2,470,60,30,1",
       "Style: Role,Plus Jakarta Sans,30,&H00FFFFFF,&H00FFFFFF,&H003B5E1F,&H003B5E1F,1,0,0,0,100,100,1,0,3,12,0,1,40,0,74,1",
       "Style: Note,Plus Jakarta Sans SemiBold,21,&H005E635B,&H005E635B,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,1,40,0,28,1",
       "Style: Step,Plus Jakarta Sans ExtraBold,60,&H0020241C,&H0020241C,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1",
       "Style: StepK,Plus Jakarta Sans,28,&H003B5E1F,&H003B5E1F,&H00000000,&H00000000,1,0,0,0,100,100,3,0,1,0,0,7,0,0,0,1",
       "Style: StepS,Plus Jakarta Sans SemiBold,36,&H005E635B,&H005E635B,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1",
       "","[Events]","Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
    demo = {s[0] for s in SEG if s[2]!='s'}
    for sid,src,kind,a,b,dur,role in SEG:
        if kind=='s': continue
        st=starts[sid]; en=st+dur
        L.append(f"Dialogue: 1,{ts(st)},{ts(en)},Role,,0,0,0,,{{\\fad(250,0)}} {role} ")
        note = 'Rekaman layar aktual · ukuran layar HP disimulasikan di browser · Data demo' if kind=='m' else 'Rekaman layar aktual · tampilan desktop · Data demo'
        L.append(f"Dialogue: 1,{ts(st)},{ts(en)},Note,,0,0,0,,{note}")
    for s in STEPS:
        st,en=s['t0'],s['t1']; fx="{\\fad(300,200)}"
        L.append(f"Dialogue: 2,{ts(st)},{ts(en)},StepK,,0,0,0,,{fx}{{\\pos(860,250)}}{s['k']}")
        L.append(f"Dialogue: 2,{ts(st)},{ts(en)},Step,,0,0,0,,{fx}{{\\pos(860,300)}}{s['h']}")
        if s.get('s'): L.append(f"Dialogue: 2,{ts(st)},{ts(en)},StepS,,0,0,0,,{fx}{{\\pos(860,{390 if chr(92)+'N' not in s['h'] else 460})}}{s['s']}")
    for v in VO:
        seg=[s for s in SEG if starts[s[0]]<=v['t0']<starts[s[0]]+s[5]][0]
        style='Sub' if seg[2]=='s' else 'SubD'
        L.append(f"Dialogue: 3,{ts(v['t0'])},{ts(v['t1'])},{style},,0,0,0,,{v['x']}")
    open('seg/subs.ass','w').write('\n'.join(L)+'\n')
    with open('subtitle-id.srt','w') as f:
        for i,v in enumerate(VO,1): f.write(f"{i}\n{srt_ts(v['t0'])} --> {srt_ts(v['t1'])}\n{v['x'].replace(chr(92)+'N',' ')}\n\n")
if __name__=='__main__':
    print('TOTAL', TOTAL, {k:round(v,2) for k,v in starts.items()})
    if 'seg' in sys.argv: build_segments()
    write_ass()
    if 'burn' in sys.argv:
        subprocess.run(['ffmpeg','-v','error','-y','-i','seg/full-noass.mp4','-f','lavfi','-i','anullsrc=r=48000:cl=stereo','-vf','ass=seg/subs.ass','-shortest','-c:v','libx264','-crf','18','-preset','medium','-pix_fmt','yuv420p','-r','30','-c:a','aac','-b:a','128k','-movflags','+faststart','RantangTerang_draft_tanpa_narasi.mp4'],check=True)
