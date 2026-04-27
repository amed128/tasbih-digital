#!/usr/bin/env python3
"""Generate all app icons from the logo SVG."""
import os
import struct
import zlib
import cairosvg
from PIL import Image
import io

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SVG_PATH = os.path.join(BASE_DIR, "public", "logo-attasbih.svg")

with open(SVG_PATH, "r") as f:
    SVG_BASE = f.read()

# --- Theme SVG variants ---
# Light: black on white (original)
SVG_LIGHT = SVG_BASE

# Dark: white elements on #0A0A0A
SVG_DARK = SVG_BASE.replace('fill="white"', 'fill="#0A0A0A"') \
                   .replace('fill="#000000"', 'fill="#FFFFFF"') \
                   .replace('stroke="#000000"', 'stroke="#FFFFFF"')

# Blue: white elements on #0B1118
SVG_BLUE = SVG_BASE.replace('fill="white"', 'fill="#0B1118"') \
                   .replace('fill="#000000"', 'fill="#FFFFFF"') \
                   .replace('stroke="#000000"', 'stroke="#FFFFFF"')


def svg_to_png(svg_content: str, size: int) -> bytes:
    return cairosvg.svg2png(
        bytestring=svg_content.encode(),
        output_width=size,
        output_height=size,
    )


def save_png(data: bytes, path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(data)
    print(f"  {path}")


def make_ico(png_data_32: bytes) -> bytes:
    img = Image.open(io.BytesIO(png_data_32)).convert("RGBA")
    ico_buf = io.BytesIO()
    img.save(ico_buf, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    return ico_buf.getvalue()


print("=== Generating PWA icons (public/) ===")
for size, name in [
    (192, "icon-192.png"),
    (512, "icon-512.png"),
    (180, "apple-touch-icon.png"),
]:
    data = svg_to_png(SVG_LIGHT, size)
    save_png(data, os.path.join(BASE_DIR, "public", name))

# Theme variants
for svg, suffix in [(SVG_LIGHT, "light"), (SVG_DARK, "dark"), (SVG_BLUE, "blue")]:
    for size, prefix in [(192, "icon-192"), (512, "icon-512")]:
        data = svg_to_png(svg, size)
        save_png(data, os.path.join(BASE_DIR, "public", f"{prefix}-{suffix}.png"))

print("\n=== Generating favicon (app/) ===")
favicon_data = svg_to_png(SVG_LIGHT, 48)
ico_data = make_ico(favicon_data)
with open(os.path.join(BASE_DIR, "app", "favicon.ico"), "wb") as f:
    f.write(ico_data)
print(f"  app/favicon.ico")

print("\n=== Generating Android icons ===")
ANDROID_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}
ANDROID_BASE = os.path.join(BASE_DIR, "android", "app", "src", "main", "res")

for density, size in ANDROID_SIZES.items():
    ddir = os.path.join(ANDROID_BASE, density)
    # Default launcher (light — black on white)
    save_png(svg_to_png(SVG_LIGHT, size), os.path.join(ddir, "ic_launcher.png"))
    save_png(svg_to_png(SVG_LIGHT, size), os.path.join(ddir, "ic_launcher_round.png"))
    # Dark variant
    save_png(svg_to_png(SVG_DARK, size), os.path.join(ddir, "ic_launcher_dark.png"))
    # Blue variant
    save_png(svg_to_png(SVG_BLUE, size), os.path.join(ddir, "ic_launcher_blue.png"))
    # Foreground (no background, beads in primary gold on transparent)
    fg_svg = SVG_BASE.replace('<rect width="1000" height="1000" fill="white"/>', '')
    fg_size = int(size * 108 / 48)  # adaptive icon foreground is 108dp at mdpi
    save_png(svg_to_png(fg_svg, fg_size), os.path.join(ddir, "ic_launcher_foreground.png"))

print("\n=== Generating iOS icon ===")
ios_path = os.path.join(
    BASE_DIR, "ios", "App", "App", "Assets.xcassets",
    "AppIcon.appiconset", "AppIcon-512@2x.png"
)
save_png(svg_to_png(SVG_LIGHT, 1024), ios_path)

ios_blue_path = os.path.join(
    BASE_DIR, "ios", "App", "App", "Assets.xcassets",
    "AppIconBlue.imageset", "AppIconBlue.png"
)
save_png(svg_to_png(SVG_BLUE, 1024), ios_blue_path)

ios_dark_path = os.path.join(
    BASE_DIR, "ios", "App", "App", "Assets.xcassets",
    "AppIconDark.imageset", "AppIconDark.png"
)
save_png(svg_to_png(SVG_DARK, 1024), ios_dark_path)

print("\nDone.")
