import zlib, struct, sys

def decode_png(path):
    with open(path, 'rb') as f:
        data = f.read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n'
    pos = 8
    idat = b''
    width = height = bit_depth = color_type = None
    while pos < len(data):
        length = struct.unpack('>I', data[pos:pos+4])[0]
        ctype = data[pos+4:pos+8]
        chunk = data[pos+8:pos+8+length]
        if ctype == b'IHDR':
            width, height, bit_depth, color_type = struct.unpack('>IIBB', chunk[:10])
        elif ctype == b'IDAT':
            idat += chunk
        pos += 12 + length
    raw = zlib.decompress(idat)
    channels = {0:1, 2:3, 3:1, 4:2, 6:4}[color_type]
    stride = width * channels
    assert bit_depth == 8
    def paeth(a,b,c):
        p = a+b-c; pa=abs(p-a); pb=abs(p-b); pc=abs(p-c)
        return a if pa<=pb and pa<=pc else (b if pb<=pc else c)
    prev = bytearray(stride)
    out = []
    pos = 0
    for y in range(height):
        f = raw[pos]; pos += 1
        line = bytearray(raw[pos:pos+stride]); pos += stride
        if f==1:
            for i in range(channels, stride): line[i] = (line[i]+line[i-channels]) & 255
        elif f==2:
            for i in range(stride): line[i] = (line[i]+prev[i]) & 255
        elif f==3:
            for i in range(stride):
                a = line[i-channels] if i>=channels else 0
                line[i] = (line[i]+((a+prev[i])//2)) & 255
        elif f==4:
            for i in range(stride):
                a = line[i-channels] if i>=channels else 0
                b = prev[i]; c = prev[i-channels] if i>=channels else 0
                line[i] = (line[i]+paeth(a,b,c)) & 255
        prev = line
        out.append(bytes(line))
    return width, height, channels, out

w, h, ch, rows = decode_png(sys.argv[1])
print(f'decoded {w}x{h} ch={ch}')

from collections import Counter
samples = Counter()
for y in range(0, h, max(1,h//150)):
    row = rows[y]
    for x in range(0, w, max(1,w//200)):
        o = x*ch
        r,g,b = row[o], row[o+1], row[o+2]
        samples[(r//16*16, g//16*16, b//16*16)] += 1
total = sum(samples.values())
print("TOP DOMINANT COLORS:")
for (r,g,b), c in samples.most_common(20):
    print(f'  #{r:02X}{g:02X}{b:02X}   {100*c/total:.1f}%')

# Saturated accent colors: skip near-black/gray, keep colorful pixels
from collections import Counter as C2
sat = C2()
for y in range(0, h, 3):
    row = rows[y]
    for x in range(0, w, 3):
        o = x*ch
        r,g,b = row[o], row[o+1], row[o+2]
        mx, mn = max(r,g,b), min(r,g,b)
        if mx < 40: continue
        if (mx - mn) < 25: continue
        sat[(r//8*8, g//8*8, b//8*8)] += 1
tot = sum(sat.values())
print(f"\nSATURATED ACCENT COLORS ({tot} px):")
for (r,g,b), c in sat.most_common(25):
    print(f'  #{r:02X}{g:02X}{b:02X}   {100*c/tot:.2f}%')
