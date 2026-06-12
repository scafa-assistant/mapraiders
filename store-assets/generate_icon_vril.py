"""MapRaiders app icon — Vril-Violett rebrand (decision 2026-06-12).

Three 1024x1024 candidates on obsidian-dark map background:
  V1 "Vril-Kern":  territory polygon with glowing violet core orb
  V2 "Erdriss":    glowing violet rift cracking through the dark map
  V3 "Fahne":      the chosen flag concept, recolored to vril violet
Plus a side-by-side preview sheet with rounded corners.
"""
from PIL import Image, ImageDraw, ImageFilter

S = 1024

# Palette — obsidian with a violet undertone
BG_TOP = (12, 9, 20)
BG_BOT = (7, 5, 13)
GRID = (32, 24, 52)
GRID_HI = (48, 36, 78)
VRIL = (157, 78, 221)        # neon violet
VRIL_DEEP = (108, 43, 176)
VRIL_HI = (212, 165, 255)    # highlight
AMBER = (255, 179, 0)
WHITE = (240, 236, 248)


def base_canvas():
    img = Image.new("RGB", (S, S))
    d = ImageDraw.Draw(img)
    for y in range(S):
        t = y / S
        d.line([(0, y), (S, y)], fill=tuple(
            int(BG_TOP[i] + (BG_BOT[i] - BG_TOP[i]) * t) for i in range(3)))
    # map grid: irregular street-like lines
    for x in range(0, S, 128):
        off = (x * 7) % 40 - 20
        d.line([(x + off, 0), (x - off, S)], fill=GRID, width=4)
    for y in range(0, S, 128):
        off = (y * 5) % 40 - 20
        d.line([(0, y + off), (S, y - off)], fill=GRID, width=4)
    # a couple of brighter "main streets"
    d.line([(0, 690), (S, 640)], fill=GRID_HI, width=7)
    d.line([(380, 0), (430, S)], fill=GRID_HI, width=7)
    return img


def glow_layer(draw_fn, blur, alpha=255):
    layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(layer))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    if alpha < 255:
        a = layer.getchannel("A").point(lambda v: v * alpha // 255)
        layer.putalpha(a)
    return layer


POLY = [(230, 380), (600, 230), (840, 430), (740, 800), (330, 830), (180, 600)]


def draw_territory(img, color, core=None):
    """Glowing territory polygon, optional core position."""
    img = img.convert("RGBA")
    # outer glow
    img.alpha_composite(glow_layer(
        lambda d: d.polygon(POLY, outline=color + (255,), width=26), 38))
    img.alpha_composite(glow_layer(
        lambda d: d.polygon(POLY, outline=color + (255,), width=14), 12))
    # fill tint
    fill = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(fill).polygon(POLY, fill=color + (38,))
    img.alpha_composite(fill)
    # crisp line
    crisp = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(crisp).polygon(POLY, outline=VRIL_HI + (255,), width=8)
    img.alpha_composite(crisp)
    return img


def v1_core():
    img = draw_territory(base_canvas(), VRIL)
    cx, cy = 505, 540
    # massive bloom — the core is the hero, ~1/3 of the canvas
    for r, blur, a in [(330, 130, 130), (240, 70, 180), (170, 36, 235)]:
        img.alpha_composite(glow_layer(
            lambda d, r=r: d.ellipse([cx - r, cy - r, cx + r, cy + r],
                                     fill=VRIL + (255,)), blur, a))
    # energy ring around the core
    img.alpha_composite(glow_layer(
        lambda d: d.ellipse([cx - 210, cy - 210, cx + 210, cy + 210],
                            outline=VRIL_HI + (255,), width=12), 10, 200))
    d = ImageDraw.Draw(img)
    d.ellipse([cx - 150, cy - 150, cx + 150, cy + 150], fill=VRIL_DEEP)
    d.ellipse([cx - 118, cy - 118, cx + 118, cy + 118], fill=VRIL)
    d.ellipse([cx - 76, cy - 76, cx + 76, cy + 76], fill=VRIL_HI)
    d.ellipse([cx - 44, cy - 44, cx + 44, cy + 44], fill=WHITE)
    d.ellipse([cx - 36, cy - 56, cx + 6, cy - 20], fill=(255, 255, 255))
    return img.convert("RGB")


def v2_rift():
    img = base_canvas().convert("RGBA")
    # wide tapered crack: closed polygon, jagged on both edges, dark interior
    left = [(290, 40), (430, 250), (370, 380), (560, 540),
            (500, 680), (660, 850), (620, 1000)]
    right = [(700, 1000), (740, 840), (580, 670), (650, 520),
             (450, 370), (520, 240), (390, 40)]
    crack = left + right
    inner_l = [(330, 40), (455, 255), (398, 382), (582, 545),
               (524, 682), (682, 855), (648, 1000)]
    inner_r = [(672, 1000), (712, 845), (556, 668), (624, 518),
               (428, 366), (494, 238), (356, 40)]
    inner = inner_l + inner_r

    # huge violet light bleeding out of the crack
    img.alpha_composite(glow_layer(lambda d: d.polygon(crack, fill=VRIL + (255,)), 90, 150))
    img.alpha_composite(glow_layer(lambda d: d.polygon(crack, fill=VRIL + (255,)), 35, 220))
    # crack body: bright violet edges
    body = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    bd = ImageDraw.Draw(body)
    bd.polygon(crack, fill=VRIL_HI + (255,))
    img.alpha_composite(body)
    # molten white-hot center seam
    img.alpha_composite(glow_layer(lambda d: d.polygon(inner, fill=WHITE + (255,)), 6, 240))
    core = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(core).polygon(inner, fill=(255, 252, 255, 255))
    img.alpha_composite(core)
    # small side fissures
    fiss = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    fd = ImageDraw.Draw(fiss)
    for line in [[(430, 250), (300, 290), (240, 380)],
                 [(650, 520), (790, 560), (850, 640)],
                 [(500, 680), (380, 760), (340, 870)]]:
        fd.line(line, fill=VRIL + (255,), width=16, joint="curve")
        fd.line(line, fill=VRIL_HI + (255,), width=7, joint="curve")
    img.alpha_composite(fiss.filter(ImageFilter.GaussianBlur(1)))
    img.alpha_composite(glow_layer(
        lambda d: [d.line(l, fill=VRIL + (255,), width=20, joint="curve") and None
                   for l in [[(430, 250), (300, 290), (240, 380)],
                             [(650, 520), (790, 560), (850, 640)],
                             [(500, 680), (380, 760), (340, 870)]]] and None, 24, 120))
    return img.convert("RGB")


def v3_flag_violet(scale=1.0):
    """scale < 1 shrinks the composition toward center (adaptive-icon safe zone)."""
    c = S / 2

    def sc(v, axis_center=c):
        return int(axis_center + (v - axis_center) * scale)

    global POLY
    poly_orig = POLY
    POLY = [(sc(x), sc(y)) for x, y in poly_orig]
    try:
        img = draw_territory(base_canvas(), VRIL)
    finally:
        POLY = poly_orig
    fx, fy = sc(460), sc(150)
    pole_btm = sc(560)
    fw = scale  # flag size factor
    # vril core at pole base (anchors flag in the lore)
    for r, blur, a in [(int(160 * fw), int(70 * fw) or 1, 130), (int(90 * fw), int(30 * fw) or 1, 200)]:
        img.alpha_composite(glow_layer(
            lambda d, r=r: d.ellipse([fx - r, pole_btm - r, fx + r, pole_btm + r],
                                     fill=VRIL + (255,)), blur, a))
    # pole glow + pole
    img.alpha_composite(glow_layer(
        lambda d: d.line([(fx, fy), (fx, pole_btm)], fill=WHITE + (255,),
                         width=int(26 * fw)), int(18 * fw) or 1, 150))
    d = ImageDraw.Draw(img)
    d.line([(fx, fy), (fx, pole_btm)], fill=WHITE, width=int(20 * fw))
    d.ellipse([fx - 42 * fw, pole_btm - 36 * fw, fx + 42 * fw, pole_btm + 48 * fw], fill=VRIL_DEEP)
    d.ellipse([fx - 28 * fw, pole_btm - 22 * fw, fx + 28 * fw, pole_btm + 34 * fw], fill=VRIL)
    d.ellipse([fx - 14 * fw, pole_btm - 8 * fw, fx + 14 * fw, pole_btm + 20 * fw], fill=VRIL_HI)
    # big amber flag — hero element, high contrast on violet brand
    flag = [(fx + 10 * fw, fy), (fx + 400 * fw, fy + 105 * fw), (fx + 10 * fw, fy + 225 * fw)]
    img.alpha_composite(glow_layer(lambda d: d.polygon(flag, fill=AMBER + (255,)),
                                   int(36 * fw) or 1, 150))
    d = ImageDraw.Draw(img)
    d.polygon(flag, fill=AMBER)
    d.polygon([(fx + 10 * fw, fy + 30 * fw), (fx + 280 * fw, fy + 102 * fw),
               (fx + 10 * fw, fy + 182 * fw)], fill=(255, 214, 96))
    return img.convert("RGB")


def rounded(img, radius=180):
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, img.size[0], img.size[1]],
                                           radius=radius, fill=255)
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def preview(variants, labels):
    pad, cell = 40, 460
    w = pad + len(variants) * (cell + pad)
    sheet = Image.new("RGB", (w, cell + 2 * pad + 70), (24, 22, 32))
    d = ImageDraw.Draw(sheet)
    for i, (img, label) in enumerate(zip(variants, labels)):
        x = pad + i * (cell + pad)
        thumb = rounded(img).resize((cell, cell), Image.LANCZOS)
        sheet.paste(thumb, (x, pad), thumb)
        d.text((x + cell // 2, cell + pad + 28), label,
               fill=(225, 220, 240), anchor="mm")
    return sheet


if __name__ == "__main__":
    v1, v2, v3 = v1_core(), v2_rift(), v3_flag_violet()
    v1.save("icon-vril-v1-kern.png")
    v2.save("icon-vril-v2-riss.png")
    v3.save("icon-vril-v3-fahne.png")
    preview([v1, v2, v3],
            ["V1 Vril-Kern", "V2 Erdriss", "V3 Fahne (violett)"]
            ).save("icon-vril-vorschau.png")
    print("done")
