#!/usr/bin/env python3
"""Generate accurate logo SVG from measured proportions, embed font for reliable rendering."""
import base64, os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Embed Noto Sans Thin font as base64 so cairosvg renders it correctly
font_path = "/usr/share/fonts/truetype/noto/NotoSans-Thin.ttf"
with open(font_path, "rb") as f:
    font_b64 = base64.b64encode(f.read()).decode()

# ──────────────────────────────────────────────────────────────
# Layout constants for a 1000×1000 canvas
# Derived from careful measurement of the original image:
#   Image ~1060×1310. Logo content spans x=130..960, y=220..1050
#   Scale to 1000×1000 with 60px padding → content_size=880
# ──────────────────────────────────────────────────────────────
SIZE    = 1000
PAD     = 60
CONTENT = SIZE - 2 * PAD  # 880

def sx(rx): return PAD + rx * CONTENT   # x position
def sy(ry): return PAD + ry * CONTENT   # y position
def sr(rr): return rr * CONTENT          # radius / pure dimension

# Measured relative to content box (0→1):
Y_TOP  = sy(0.386)   # ≈ 400  — top horizontal line
Y_BOT  = sy(0.627)   # ≈ 612  — bottom horizontal line
Y_TEXT = sy(0.530)   # text baseline (slightly below midpoint)
X_L    = sx(0.000)   # ≈  60  — left edge of lines/text
X_LR   = sx(0.831)   # ≈ 791  — right edge of lines (where cord emerges)
X_TC   = sx(0.388)   # ≈ 401  — horizontal center of text span

# Cord control points for the cubic bezier arc
# Starts above top line (upper right), bulges right, ends below bottom line
CX0, CY0 = sx(0.815), sy(-0.04)   # cord start  ≈ (777, 25)
CX1, CY1 = sx(1.085), sy(0.22)    # ctrl1       ≈ (1015, 254)
CX2, CY2 = sx(1.085), sy(0.78)    # ctrl2       ≈ (1015, 746)
CX3, CY3 = sx(0.795), sy(1.04)    # cord end    ≈ (759, 975)

# Bead centres — computed to sit ON the bezier arc
# t≈0.33, 0.44, 0.56, 0.67  →  (cx, cy, r)
def bezier(t, p0, p1, p2, p3):
    return ((1-t)**3*p0 + 3*(1-t)**2*t*p1
            + 3*(1-t)*t**2*p2 + t**3*p3)

beads_t = [0.335, 0.445, 0.562, 0.667]
beads_r = [sr(0.053), sr(0.059), sr(0.062), sr(0.068)]  # subtle size increase

beads = []
for t, r in zip(beads_t, beads_r):
    cx = bezier(t, CX0, CX1, CX2, CX3)
    cy = bezier(t, CY0, CY1, CY2, CY3)
    beads.append((cx, cy, r))

# Font size tuned so text width ≈ x_line_right − x_left
FONT_SIZE = 122

# ──────────────────────────────────────────────────────────────
# Build SVG variants (light / dark / blue)
# ──────────────────────────────────────────────────────────────
THEMES = {
    "light": {"bg": "#FFFFFF", "fg": "#000000"},
    "dark":  {"bg": "#0A0A0A", "fg": "#FFFFFF"},
    "blue":  {"bg": "#0B1118", "fg": "#FFFFFF"},
}

def make_svg(bg, fg):
    bead_els = "\n  ".join(
        f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{fg}"/>'
        for cx, cy, r in beads
    )
    return f"""<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 {SIZE} {SIZE}" width="{SIZE}" height="{SIZE}">
  <defs>
    <style>
      @font-face {{
        font-family: "NotoSansThin";
        src: url("data:font/truetype;base64,{font_b64}") format("truetype");
        font-weight: 100;
        font-style: normal;
      }}
    </style>
  </defs>

  <!-- Background -->
  <rect width="{SIZE}" height="{SIZE}" fill="{bg}"/>

  <!-- Top line -->
  <line x1="{X_L:.1f}" y1="{Y_TOP:.1f}" x2="{X_LR:.1f}" y2="{Y_TOP:.1f}"
        stroke="{fg}" stroke-width="3.8"/>

  <!-- Bottom line -->
  <line x1="{X_L:.1f}" y1="{Y_BOT:.1f}" x2="{X_LR:.1f}" y2="{Y_BOT:.1f}"
        stroke="{fg}" stroke-width="3.8"/>

  <!-- Text -->
  <text x="{X_TC:.1f}" y="{Y_TEXT:.1f}"
        text-anchor="middle"
        font-family="NotoSansThin, 'Noto Sans', sans-serif"
        font-weight="100"
        font-size="{FONT_SIZE}"
        fill="{fg}"
        letter-spacing="3">ATTASBIH</text>

  <!-- Tasbih cord -->
  <path d="M {CX0:.1f} {CY0:.1f} C {CX1:.1f} {CY1:.1f}, {CX2:.1f} {CY2:.1f}, {CX3:.1f} {CY3:.1f}"
        stroke="{fg}" stroke-width="3.2" fill="none" stroke-linecap="round"/>

  <!-- Beads -->
  {bead_els}
</svg>"""

# Write one SVG per theme (light = default)
for name, colors in THEMES.items():
    svg = make_svg(colors["bg"], colors["fg"])
    out = os.path.join(BASE_DIR, "public", f"logo-attasbih-{name}.svg")
    with open(out, "w") as f:
        f.write(svg)
    print(f"Written: {out}")

# Default logo = light
import shutil
shutil.copy(
    os.path.join(BASE_DIR, "public", "logo-attasbih-light.svg"),
    os.path.join(BASE_DIR, "public", "logo-attasbih.svg"),
)
print("Default logo-attasbih.svg → light variant")
