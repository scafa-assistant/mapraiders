# Play Store screenshot framer for MapRaiders.
# Sources are raw 1280x2856 device captures; the device status bar
# (top 160px: clock, battery, call chip) is cropped out so no private
# system UI ends up in the store listing.
from PIL import Image, ImageDraw, ImageFont
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.dirname(os.path.abspath(__file__))

BG = (10, 14, 23)        # #0A0E17
CYAN = (0, 209, 255)     # accent
BORDER = (26, 35, 64)    # #1A2340
STATUS_BAR_CROP = 160    # px at 1280w source

SHOTS = [
    ("test_54_dark_back.png",   "Claim real territory",          "screenshot-01.png"),
    ("test_53_light_map2.png",  "Your city is the board",        "screenshot-02.png"),
    ("lt_09_create.png",        "Create quests, echoes & events", "screenshot-03.png"),
    ("lt_06_feed.png",          "See what's happening nearby",   "screenshot-04.png"),
    ("lt_07_profil_unten.png",  "Keep your streak alive",        "screenshot-05.png"),
    ("lt_02_pet.png",           "Raise your companion",          "screenshot-06.png"),
]

W, H = 1080, 1920
SHOT_H = 1560
RADIUS = 36

def rounded(img, radius):
    mask = Image.new("L", img.size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, img.size[0] - 1, img.size[1] - 1], radius=radius, fill=255)
    out = Image.new("RGBA", img.size)
    out.paste(img, (0, 0), mask)
    return out

for src_name, caption, out_name in SHOTS:
    src = Image.open(os.path.join(ROOT, src_name)).convert("RGB")
    src = src.crop((0, STATUS_BAR_CROP, src.width, src.height))

    canvas = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(canvas)

    font_size = 58 if len(caption) <= 24 else 48
    font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", font_size)
    tw = draw.textlength(caption, font=font)
    tx = (W - tw) / 2
    ty = 96
    draw.text((tx, ty), caption, font=font, fill=(255, 255, 255))

    bar_w = 110
    draw.rounded_rectangle(
        [(W - bar_w) / 2, ty + font_size + 36, (W + bar_w) / 2, ty + font_size + 44],
        radius=4, fill=CYAN)

    scale = SHOT_H / src.height
    shot = src.resize((int(src.width * scale), SHOT_H), Image.LANCZOS)
    shot = rounded(shot.convert("RGB"), RADIUS)
    sx = (W - shot.width) // 2
    sy = H - SHOT_H - 80
    canvas.paste(shot, (sx, sy), shot)
    draw.rounded_rectangle(
        [sx, sy, sx + shot.width - 1, sy + SHOT_H - 1],
        radius=RADIUS, outline=BORDER, width=4)

    canvas.save(os.path.join(OUT, out_name), "PNG")
    print(out_name, "<-", src_name)

print("done")


# --- Tablet variants (7" 1200x1920, 10" 1600x2560) ---
# Generated from the finished phone screenshots: letterboxed/upscaled on the
# same dark background. Run after the phone screenshots exist.
def generate_tablets():
    import glob
    for src_path in sorted(glob.glob(os.path.join(OUT, "screenshot-0*.png"))):
        n = os.path.basename(src_path).split("-")[1].split(".")[0]
        src = Image.open(src_path)
        t7 = Image.new("RGB", (1200, 1920), BG)
        t7.paste(src, ((1200 - 1080) // 2, 0))
        t7.save(os.path.join(OUT, f"tablet7-{n}.png"))
        big = src.resize((1440, 2560), Image.LANCZOS)
        t10 = Image.new("RGB", (1600, 2560), BG)
        t10.paste(big, ((1600 - 1440) // 2, 0))
        t10.save(os.path.join(OUT, f"tablet10-{n}.png"))
