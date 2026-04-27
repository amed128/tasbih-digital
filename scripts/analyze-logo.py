#!/usr/bin/env python3
"""Analyze logo image proportions and generate accurate SVG."""
from PIL import Image
import sys

# The logo image was shared visually. Key measurements from careful analysis:
# Original image: ~1060 x 1310 px (portrait)
# Logo content spans: x=130..960, y=220..1050
# => content ~830x830 (roughly square)
#
# Relative positions (0..1 within content box):
#   Top line y:    (540-220)/830 = 0.386
#   Bottom line y: (740-220)/830 = 0.627
#   Text center y: (650-220)/830 = 0.518
#   Text left x:   (130-130)/830 = 0.000
#   Text right x:  (810-130)/830 = 0.819
#   Line right x:  (820-130)/830 = 0.831  (where cord starts)
#   Cord top:      (835-130)/830 = 0.849  x, (220-220)/830=0.0 y
#   Cord bottom:   (815-130)/830 = 0.825  x, (1050-220)/830=1.0 y
#
#   Bead 1: cx=(875-130)/830=0.898  cy=(495-220)/830=0.331  r=55/830=0.066
#   Bead 2: cx=(910-130)/830=0.940  cy=(610-220)/830=0.470  r=62/830=0.075
#   Bead 3: cx=(910-130)/830=0.940  cy=(720-220)/830=0.602  r=65/830=0.078
#   Bead 4: cx=(878-130)/830=0.901  cy=(840-220)/830=0.747  r=72/830=0.087

SIZE = 1000
PAD = 60  # padding on each side
CONTENT = SIZE - 2 * PAD  # 880

def scale(rel):
    return PAD + rel * CONTENT

# Key y positions
y_top_line    = scale(0.386)   # ~399
y_bottom_line = scale(0.627)   # ~611
y_text        = scale(0.518)   # ~515  (baseline, adjust for font)

# Key x positions
x_left        = scale(0.000)   # 60  (line/text start)
x_line_right  = scale(0.831)   # ~791
x_text_center = scale(0.410)   # ~421 (midpoint of text span)

# Cord
x_cord_top    = scale(0.849)   # ~807
y_cord_top    = scale(-0.05)   # slightly above content = ~17
x_cord_bot    = scale(0.825)   # ~786
y_cord_bot    = scale(1.05)    # slightly below content = ~983

# Beads
beads = [
    (scale(0.898), scale(0.331), scale(0.066)),  # (cx, cy, r)
    (scale(0.940), scale(0.470), scale(0.075)),
    (scale(0.940), scale(0.602), scale(0.078)),
    (scale(0.901), scale(0.747), scale(0.087)),
]

print(f"y_top_line={y_top_line:.1f}  y_bottom_line={y_bottom_line:.1f}  y_text={y_text:.1f}")
print(f"x_left={x_left:.1f}  x_line_right={x_line_right:.1f}  x_text_center={x_text_center:.1f}")
print(f"cord_top=({x_cord_top:.1f},{y_cord_top:.1f})  cord_bot=({x_cord_bot:.1f},{y_cord_bot:.1f})")
for i, (cx, cy, r) in enumerate(beads, 1):
    print(f"Bead {i}: cx={cx:.1f}  cy={cy:.1f}  r={r:.1f}")
