"""Finalize chosen icon V3 (vril flag) into all production assets.

Outputs:
  store-assets/icon-512.png                  512x512  Play-Store icon (replaces old)
  store-assets/feature-graphic-1024x500.png  vril-violet rebrand (replaces old)
  mobile/assets/icon.png                     1024x1024 app icon
  mobile/assets/adaptive-icon.png            1024x1024, content scaled 0.70 (safe zone)
  mobile/assets/favicon.png                  48x48
  mobile/assets/notification-icon.png        96x96 white flag silhouette on transparent
"""
from PIL import Image, ImageDraw, ImageFont
import generate_icon_vril as g

MOBILE = "../mobile/assets"

v3 = g.v3_flag_violet()
v3_safe = g.v3_flag_violet(scale=0.70)

# --- store icon + app icons ---
v3.resize((512, 512), Image.LANCZOS).save("icon-512.png")
v3.convert("RGBA").save(f"{MOBILE}/icon.png")
v3_safe.convert("RGBA").save(f"{MOBILE}/adaptive-icon.png")
v3.resize((48, 48), Image.LANCZOS).convert("RGBA").save(f"{MOBILE}/favicon.png")

# --- notification icon: white flag silhouette, transparent bg ---
notif = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
d = ImageDraw.Draw(notif)
fx, fy, btm = 400, 180, 840
d.line([(fx, fy), (fx, btm)], fill=(255, 255, 255, 255), width=70)
d.ellipse([fx - 90, btm - 70, fx + 90, btm + 110], fill=(255, 255, 255, 255))
d.polygon([(fx + 30, fy), (fx + 560, fy + 160), (fx + 30, fy + 330)],
          fill=(255, 255, 255, 255))
notif.resize((96, 96), Image.LANCZOS).save(f"{MOBILE}/notification-icon.png")

# --- feature graphic 1024x500, vril rebrand (layout mirrors old cyan version) ---
W, H = 1024, 500
fg = Image.new("RGB", (W, H))
fd = ImageDraw.Draw(fg)
for y in range(H):
    t = y / H
    fd.line([(0, y), (W, y)], fill=tuple(
        int(g.BG_TOP[i] + (g.BG_BOT[i] - g.BG_TOP[i]) * t) for i in range(3)))
# faint street grid
for x in range(0, W, 140):
    fd.line([(x + 20, 0), (x - 20, H)], fill=g.GRID, width=3)
for y in range(0, H, 120):
    fd.line([(0, y + 10), (W, y - 10)], fill=g.GRID, width=3)
fd.line([(620, 0), (760, H)], fill=g.GRID_HI, width=5)

# icon with rounded corners, left
icon = g.rounded(v3, radius=46).resize((170, 170), Image.LANCZOS)
fg.paste(icon, (64, 72), icon)

bold = "C:/Windows/Fonts/arialbd.ttf"
f_title = ImageFont.truetype(bold, 88)
f_sub = ImageFont.truetype(bold, 40)
f_tag = ImageFont.truetype(bold, 64)
f_small = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 34)

fd.text((270, 86), "MAPRAIDERS", font=f_title, fill=(255, 255, 255))
fd.text((274, 192), "GPS Territory Game", font=f_sub, fill=g.VRIL_HI)
fd.text((64, 300), "Walk. Claim. Conquer.", font=f_tag, fill=(255, 255, 255))
fd.text((64, 396), "Turn the real world into your territory.",
        font=f_small, fill=(150, 142, 170))
fg.save("feature-graphic-1024x500.png")
print("done")
