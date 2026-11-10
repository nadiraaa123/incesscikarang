# Membuat gambar bukti CONTOH (bukan foto asli) untuk demo unggah foto.
from PIL import Image, ImageDraw, ImageFont
W,H=1280,960
im=Image.new('RGB',(W,H),(236,229,214)); d=ImageDraw.Draw(im)
d.rounded_rectangle((140,120,1140,820),40,fill=(200,205,208),outline=(150,155,160),width=6)
for (x0,y0,x1,y1,c,k) in [(180,160,620,480,(245,245,240),.45),(660,160,1100,480,(170,110,60),.8),(180,520,500,780,(110,160,80),.8),(540,520,820,780,(230,150,40),.8),(860,520,1100,780,(250,250,250),.8)]:
    d.rounded_rectangle((x0,y0,x1,y1),24,fill=(185,190,193)); d.ellipse((x0+40,y0+40,x0+40+(x1-x0-80)*k,y0+40+(y1-y0-80)*k),fill=c)
f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',44)
d.rectangle((0,860,W,H),fill=(28,36,32)); d.text((40,885),'GAMBAR CONTOH · DATA DEMO (bukan foto asli)',font=f,fill=(255,255,255))
im.save('bukti-contoh.jpg',quality=88)
