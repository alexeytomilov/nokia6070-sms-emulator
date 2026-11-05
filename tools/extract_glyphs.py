"""Cut real Nokia 6070 glyphs out of the reference screenshots.
Prints each word as column-separated glyph bitmaps so they can be copied into font.js."""
import sys, json
from PIL import Image

REF = 'references/screens-6070/'

def mask(f, box, dark=True, thr=300):
    im = Image.open(REF + f).convert('RGB')
    x0, y0, x1, y1 = box
    rows = []
    for y in range(y0, y1):
        r = ''
        for x in range(x0, x1):
            s = sum(im.getpixel((x, y)))
            on = s < thr if dark else s > thr
            r += '#' if on else '.'
        rows.append(r)
    return rows

def split(rows, text):
    w = len(rows[0])
    cols = [any(r[x] == '#' for r in rows) for x in range(w)]
    segs, x = [], 0
    while x < w:
        if cols[x]:
            s = x
            while x < w and cols[x]: x += 1
            segs.append((s, x))
        x += 1
    chars = [c for c in text if c != ' ']
    out = {}
    if len(segs) != len(chars):
        print('MISMATCH', text, len(segs), len(chars), file=sys.stderr)
        for r in rows: print(r, file=sys.stderr)
        return out
    for (s, e), c in zip(segs, chars):
        out[c] = [r[s:e] for r in rows]
    return out

jobs = json.loads(sys.argv[1])
res = {}
for j in jobs:
    rows = mask(j['f'], j['box'], j.get('dark', True), j.get('thr', 300))
    for c, g in split(rows, j['t']).items():
        res.setdefault(c, g)
print(json.dumps(res, ensure_ascii=False))
