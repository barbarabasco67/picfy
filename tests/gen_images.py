# Genera fotos de prueba con hora de captura (EXIF) desordenada respecto al nombre del archivo.
import sys, os, random
from PIL import Image, ImageDraw
out = sys.argv[1] if len(sys.argv) > 1 else 'tests/img'
n = int(sys.argv[2]) if len(sys.argv) > 2 else 12
os.makedirs(out, exist_ok=True)
random.seed(7)
minutes = list(range(n)); random.shuffle(minutes)   # la hora real no sigue el orden del nombre
for i in range(n):
    im = Image.new('RGB', (1000 + 30 * i, 800), (30 + i * 18 % 220, 90 + i * 31 % 150, 160 - i * 9 % 120))
    d = ImageDraw.Draw(im); d.text((40, 40), f'foto {i:02d}', fill=(255, 255, 255))
    d.ellipse((300, 200, 700, 600), outline=(255, 255, 255), width=8)
    ex = im.getexif()
    ex.get_ifd(0x8769)[0x9003] = f'2026:10:10 18:{minutes[i]:02d}:00'
    im.save(f'{out}/p{i:02d}.jpg', quality=88, exif=ex)
    print(f'p{i:02d}.jpg', minutes[i])
