#!/usr/bin/env python3
"""Generate all app icons by drawing the logo directly with Pillow.
Matches the reference logo: ATTASBIH text between two lines,
tasbih cord with 4 well-spaced beads on the right side.
"""
import os
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── Font detection (cross-platform) ─────────────────────────────
FONT_CANDIDATES = [
    # macOS — Regular or Light weight
    ("/System/Library/Fonts/HelveticaNeue.ttc", 0),
    ("/System/Library/Fonts/Helvetica.ttc", 0),
    ("/System/Library/Fonts/Avenir Next.ttc", 0),
    ("/System/Library/Fonts/GillSans.ttc", 0),
    # Linux
    ("/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf", 0),
    ("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", 0),
    ("/usr/share/fonts/opentype/noto/NotoSans-Regular.ttf", 0),
]

def find_font():
    for path, index in FONT_CANDIDATES:
        if os.path.exists(path):
            return path, index
    return None, 0

FONT_PATH, FONT_INDEX = find_font()
print(f"Font: {FONT_PATH or 'Pillow default'}")

# ── Theme palettes ───────────────────────────────────────────────
THEMES = {
    "light": {"bg": (255, 255, 255, 255), "fg": (0,   0,   0,   255)},
    "dark":  {"bg": (10,  10,  10,  255), "fg": (255, 255, 255, 255)},
    "blue":  {"bg": (11,  17,  24,  255), "fg": (255, 255, 255, 255)},
}

# ── Logo geometry (relative to canvas 0..1) ──────────────────────
# Derived from careful measurement of the reference logo image.

# Horizontal framing lines
LINE_Y_TOP   = 0.468   # top line y
LINE_Y_BOT   = 0.572   # bottom line y
LINE_X_LEFT  = 0.075   # left edge
LINE_X_RIGHT = 0.850   # right edge (where cord emerges)
LINE_WIDTH   = 0.0030  # stroke width fraction

# Text "ATTASBIH"
TEXT_CX      = 0.450   # horizontal center of text
TEXT_CY      = 0.520   # vertical center of text
FONT_SIZE_REL = 0.158  # font size as fraction of canvas

# Tasbih cord — cubic bezier, stays within canvas
# Arc bows gently to the right without clipping
CORD_P = [
    (0.805, 0.085),   # P0  top-right start (visible)
    (0.925, 0.295),   # P1  control — rightward bow
    (0.925, 0.705),   # P2  control — rightward bow
    (0.738, 0.935),   # P3  bottom-right end (visible)
]
CORD_WIDTH = 0.0028   # stroke width fraction

# Beads — (cx_rel, cy_rel, r_rel)
# Same shape/proportions as reference; radii scaled to ~80% so beads
# have ≥ 3.5px clear gap even at 192px. Positions on arc at t≈0.37,0.51,0.65,0.80.
# Bead centers evenly spaced on arc (t≈0.37,0.52,0.66,0.80), span y=0.388→0.799
# Guarantees ≥ 6px clear gap between every pair at 192px (no merge from antialiasing)
BEADS = [
    (0.887, 0.388, 0.040),   # top
    (0.888, 0.525, 0.049),   # second
    (0.867, 0.662, 0.050),   # third
    (0.828, 0.799, 0.055),   # bottom
]

# ── Helpers ──────────────────────────────────────────────────────

def bezier_point(t, pts):
    p0, p1, p2, p3 = pts
    mt = 1 - t
    x = mt**3*p0[0] + 3*mt**2*t*p1[0] + 3*mt*t**2*p2[0] + t**3*p3[0]
    y = mt**3*p0[1] + 3*mt**2*t*p1[1] + 3*mt*t**2*p2[1] + t**3*p3[1]
    return x, y

def draw_bezier_cord(draw, pts, size, color, width):
    steps = max(300, size)
    lw = max(1, round(width * size))
    prev = None
    for i in range(steps + 1):
        rx, ry = bezier_point(i / steps, pts)
        px, py = rx * size, ry * size
        if prev:
            draw.line([prev, (px, py)], fill=color, width=lw)
        prev = (px, py)

def make_font(size, fs):
    if FONT_PATH:
        try:
            return ImageFont.truetype(FONT_PATH, fs, index=FONT_INDEX)
        except Exception:
            pass
    return ImageFont.load_default()

def make_icon(size: int, bg: tuple, fg: tuple) -> Image.Image:
    img = Image.new("RGBA", (size, size), bg)
    draw = ImageDraw.Draw(img)
    S = size

    # Horizontal lines
    lw = max(1, round(LINE_WIDTH * S))
    y_top = round(LINE_Y_TOP * S)
    y_bot = round(LINE_Y_BOT * S)
    x_l   = round(LINE_X_LEFT  * S)
    x_r   = round(LINE_X_RIGHT * S)
    draw.line([(x_l, y_top), (x_r, y_top)], fill=fg, width=lw)
    draw.line([(x_l, y_bot), (x_r, y_bot)], fill=fg, width=lw)

    # Text
    fs   = max(8, round(FONT_SIZE_REL * S))
    font = make_font(S, fs)
    text = "ATTASBIH"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw   = bbox[2] - bbox[0]
    th   = bbox[3] - bbox[1]
    tx   = round(TEXT_CX * S) - tw // 2 - bbox[0]
    ty   = round(TEXT_CY * S) - th // 2 - bbox[1]
    draw.text((tx, ty), text, font=font, fill=fg)

    # Cord (drawn before beads so beads sit on top)
    draw_bezier_cord(draw, CORD_P, S, fg, CORD_WIDTH)

    # Beads
    for rx, ry, rr in BEADS:
        cx = rx * S
        cy = ry * S
        r  = rr * S
        draw.ellipse([(cx - r, cy - r), (cx + r, cy + r)], fill=fg)

    return img.convert("RGBA")

def save_png(img: Image.Image, path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.convert("RGB").save(path, "PNG", optimize=True)
    print(f"  {path}")

def save_ico(img_48: Image.Image, path: str):
    frames = [img_48.resize((s, s), Image.LANCZOS) for s in [16, 32, 48]]
    frames[0].save(path, format="ICO", sizes=[(s, s) for s in [16, 32, 48]],
                   append_images=frames[1:])
    print(f"  {path}")

# ── Generate ─────────────────────────────────────────────────────

print("\n=== PWA icons ===")
for size, name in [(192, "icon-192.png"), (512, "icon-512.png"), (180, "apple-touch-icon.png")]:
    save_png(make_icon(size, **THEMES["light"]), os.path.join(BASE_DIR, "public", name))
for theme in ["light", "dark", "blue"]:
    for size, prefix in [(192, "icon-192"), (512, "icon-512")]:
        save_png(make_icon(size, **THEMES[theme]),
                 os.path.join(BASE_DIR, "public", f"{prefix}-{theme}.png"))

print("\n=== Favicon ===")
save_ico(make_icon(48, **THEMES["light"]), os.path.join(BASE_DIR, "app", "favicon.ico"))

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
    fg_size = round(size * 108 / 48)
    fg_img  = make_icon(fg_size, bg=(0, 0, 0, 0), fg=(0, 0, 0, 255))
    fg_img.save(os.path.join(d, "ic_launcher_foreground.png"))
    print(f"  {d}/ic_launcher_foreground.png")

print("\n=== iOS icons ===")
iOS_BASE = os.path.join(BASE_DIR, "ios", "App", "App", "Assets.xcassets")
save_png(make_icon(1024, **THEMES["light"]),
         os.path.join(iOS_BASE, "AppIcon.appiconset",  "AppIcon-512@2x.png"))
save_png(make_icon(1024, **THEMES["blue"]),
         os.path.join(iOS_BASE, "AppIconBlue.imageset", "AppIconBlue.png"))
save_png(make_icon(1024, **THEMES["dark"]),
         os.path.join(iOS_BASE, "AppIconDark.imageset", "AppIconDark.png"))

print("\nDone.")
