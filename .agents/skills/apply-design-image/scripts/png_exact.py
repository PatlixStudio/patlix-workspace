import zlib, struct, sys
sys.path.insert(0,'/tmp/opencode')
from png_colors import decode_png
w,h,ch,rows = decode_png(sys.argv[1])
# precise accent: very bright & saturated pixels
from collections import Counter
acc = Counter()
txt = Counter()
navy = Counter()
for y in range(0,h,2):
    row = rows[y]
    for x in range(0,w,2):
        o=x*ch; r,g,b=row[o],row[o+1],row[o+2]
        mx,mn=max(r,g,b),min(r,g,b)
        if mx>150 and (mx-mn)>60 and mx>=r:  # bright cyan-ish
            acc[(r,g,b)]+=1
        elif mx>200 and (mx-mn)<25:  # near-white text
            txt[(r,g,b)]+=1
print("BRIGHT CYAN ACCENT samples:")
for c,n in acc.most_common(8): print(f'  #{c[0]:02X}{c[1]:02X}{c[2]:02X}  x{n}')
print("WHITE TEXT samples:")
for c,n in txt.most_common(5): print(f'  #{c[0]:02X}{c[1]:02X}{c[2]:02X}  x{n}')
