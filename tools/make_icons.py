"""Draws the app icons in public/: a fretboard with three interval dots."""
from PIL import Image, ImageDraw

BG = (18, 20, 24)
WOOD = (58, 42, 31)
STRING = (217, 211, 199)
COLORS = [(255, 107, 90), (91, 155, 255), (62, 214, 160)]  # root, 3, 5


def icon(size, pad_ratio=0.0):
    img = Image.new("RGB", (size, size), BG)
    d = ImageDraw.Draw(img)
    s = size
    m = int(s * (0.16 + pad_ratio))
    d.rounded_rectangle([m, m, s - m, s - m], radius=int(s * 0.06), fill=WOOD)
    for i in range(1, 4):
        x = m + (s - 2 * m) * i / 4
        d.line([x, m, x, s - m], fill=(150, 140, 125), width=max(2, s // 90))
    for i in range(6):
        y = m + (s - 2 * m) * (i + 0.5) / 6
        d.line([m, y, s - m, y], fill=STRING, width=max(1, s // 140 + (5 - i) // 2))
    r = (s - 2 * m) / 11
    pts = [(1.5, 5.5), (0.5, 3.5), (2.5, 2.5)]  # (fret col, string row)
    for (fx, sy), c in zip(pts, COLORS):
        cx = m + (s - 2 * m) * (fx + 0.5) / 4
        cy = m + (s - 2 * m) * (sy - 0.0) / 6
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c, outline=(0, 0, 0), width=max(1, s // 120))
    return img


if __name__ == "__main__":
    icon(192).save("public/icon-192.png")
    icon(512, 0.04).save("public/icon-512.png")
    icon(180).save("public/apple-touch-icon.png")
    print("icons written")
