#!/usr/bin/env python3
"""Generate all app icons by drawing the logo directly with Pillow."""
import os, math
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FONT_THIN = "/usr/share/fonts/truetype/noto/NotoSans-Thin.ttf"

# ── Theme palettes ──────────────────────────────────────────────
THEMES = {
    "light": {"bg": (255, 255, 255, 255), "fg": (0, 0, 0, 255)},
    "dark":  {"bg": (10,  10,  10,  255), "fg": (255, 255, 255, 255)},
    "blue":  {"bg": (11,  17,  24,  255), "fg": (255, 255, 255, 255)},
}

# ── Logo geometry (relative to canvas, 0..1) ───────────────────
# Measured from the original image proportions.
# All values are fractions of the canvas size.

# Horizontal lines
LINE_Y_TOP    = 0.400   # top line y
LINE_Y_BOT    = 0.612   # bottom line y
LINE_X_LEFT   = 0.060   # line left edge
LINE_X_RIGHT  = 0.819   # line right edge (at leftmost bead edge)
LINE_WIDTH    = 0.0038  # stroke width

# Text
TEXT_CENTER_X = 0.440   # horizontal center of "ATTASBIH"
TEXT_CENTER_Y = 0.493   # vertical center of text (between the two lines)
FONT_SIZE_REL = 0.130   # font size as fraction of canvas

# Tasbih cord: cubic bezier control points (fraction of canvas SIZE)
# Arc bulges to x≈0.90 at midpoint — stays within canvas
CORD_P = [
    (0.790, -0.010),   # P0 start (just above canvas)
    (0.940,  0.220),   # P1 control
    (0.940,  0.780),   # P2 control
    (0.775,  1.010),   # P3 end (just below canvas)
]
CORD_WIDTH = 0.0032

# Beads — (cx_rel, cy_rel, r_rel), on the bezier at t≈0.38,0.48,0.58,0.68
# Bead 1 aligns with top line; bead 4 extends below bottom line
BEADS = [
    (0.895, 0.351, 0.050),
    (0.901, 0.474, 0.057),
    (0.897, 0.595, 0.060),
    (0.884, 0.718, 0.066),
]

# ── Drawing helpers ─────────────────────────────────────────────

def bezier_point(t, pts):
    """Evaluate cubic bezier at t."""
    p0, p1, p2, p3 = pts
    mt = 1 - t
    x = mt**3*p0[0] + 3*mt**2*t*p1[0] + 3*mt*t**2*p2[0] + t**3*p3[0]
    y = mt**3*p0[1] + 3*mt**2*t*p1[1] + 3*mt*t**2*p2[1] + t**3*p3[1]
    return x, y

def draw_bezier_cord(draw, pts, size, color, width):
    """Draw a cubic bezier as a polyline of fine steps."""
    prev = None
    steps = max(200, size // 2)
    lw = max(1, round(width * size))
    for i in range(steps + 1):
        t = i / steps
        rx, ry = bezier_point(t, pts)
        px, py = rx * size, ry * size
        if prev:
            draw.line([prev, (px, py)], fill=color, width=lw)
        prev = (px, py)

def make_icon(size: int, bg: tuple, fg: tuple) -> Image.Image:
    img = Image.new("RGBA", (size, size), bg)
    draw = ImageDraw.Draw(img)

    S = size  # shorthand

    # Horizontal lines
    lw = max(1, round(LINE_WIDTH * S))
    y_top = round(LINE_Y_TOP * S)
    y_bot = round(LINE_Y_BOT * S)
    x_l   = round(LINE_X_LEFT * S)
    x_r   = round(LINE_X_RIGHT * S)
    draw.line([(x_l, y_top), (x_r, y_top)], fill=fg, width=lw)
    draw.line([(x_l, y_bot), (x_r, y_bot)], fill=fg, width=lw)

    # Text
    fs = max(8, round(FONT_SIZE_REL * S))
    try:
        font = ImageFont.truetype(FONT_THIN, fs)
    except Exception:
        font = ImageFont.load_default()

    text = "ATTASBIH"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = round(TEXT_CENTER_X * S) - tw // 2 - bbox[0]
    ty = round(TEXT_CENTER_Y * S) - th // 2 - bbox[1]
    draw.text((tx, ty), text, font=font, fill=fg)

    # Cord
    draw_bezier_cord(draw, CORD_P, S, fg, CORD_WIDTH)

    # Beads (draw AFTER cord so they sit on top)
    for rx, ry, rr in BEADS:
        cx = rx * S
        cy = ry * S
        r  = rr * S
        draw.ellipse(
            [(cx - r, cy - r), (cx + r, cy + r)],
            fill=fg,
        )

    return img.convert("RGBA")

def save_png(img: Image.Image, path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.convert("RGB").save(path, "PNG", optimize=True)
    print(f"  {path}")

def save_ico(img_48: Image.Image, path: str):
    buf_img = img_48.convert("RGBA")
    sizes = [16, 32, 48]
    frames = [buf_img.resize((s, s), Image.LANCZOS) for s in sizes]
    frames[0].save(path, format="ICO", sizes=[(s, s) for s in sizes],
                   append_images=frames[1:])
    print(f"  {path}")

# ── Generate all sizes ─────────────────────────────────────────

print("=== PWA icons (public/) ===")
for size, name in [(192, "icon-192.png"), (512, "icon-512.png"), (180, "apple-touch-icon.png")]:
    save_png(make_icon(size, **THEMES["light"]), os.path.join(BASE_DIR, "public", name))

for theme in ["light", "dark", "blue"]:
    for size, prefix in [(192, "icon-192"), (512, "icon-512")]:
        save_png(
            make_icon(size, **THEMES[theme]),
            os.path.join(BASE_DIR, "public", f"{prefix}-{theme}.png")
        )

print("\n=== Favicon ===")
save_ico(
    make_icon(48, **THEMES["light"]),
    os.path.join(BASE_DIR, "app", "favicon.ico")
)

print("\n=== Android icons ===")
ANDROID_SIZES = {
    "mipmap-mdpi":    48,
    "mipmap-hdpi":    72,
    "mipmap-xhdpi":   96,
    "mipmap-xxhdpi":  144,
    "mipmap-xxxhdpi": 192,
}
ANDROID_BASE = os.path.join(BASE_DIR, "android", "app", "src", "main", "res")
for density, size in ANDROID_SIZES.items():
    d = os.path.join(ANDROID_BASE, density)
    save_png(make_icon(size, **THEMES["light"]), os.path.join(d, "ic_launcher.png"))
    save_png(make_icon(size, **THEMES["light"]), os.path.join(d, "ic_launcher_round.png"))
    save_png(make_icon(size, **THEMES["dark"]),  os.path.join(d, "ic_launcher_dark.png"))
    save_png(make_icon(size, **THEMES["blue"]),  os.path.join(d, "ic_launcher_blue.png"))
    # Adaptive foreground: ~108dp at mdpi = size * 108/48
    fg_size = round(size * 108 / 48)
    fg_img = make_icon(fg_size, bg=(0,0,0,0), fg=(0,0,0,255))
    fg_img.save(os.path.join(d, "ic_launcher_foreground.png"))
    print(f"  {d}/ic_launcher_foreground.png")

print("\n=== iOS icons ===")
iOS_BASE = os.path.join(BASE_DIR, "ios", "App", "App", "Assets.xcassets")
save_png(make_icon(1024, **THEMES["light"]),
         os.path.join(iOS_BASE, "AppIcon.appiconset", "AppIcon-512@2x.png"))
save_png(make_icon(1024, **THEMES["blue"]),
         os.path.join(iOS_BASE, "AppIconBlue.imageset", "AppIconBlue.png"))
save_png(make_icon(1024, **THEMES["dark"]),
         os.path.join(iOS_BASE, "AppIconDark.imageset", "AppIconDark.png"))

print("\nDone.")
