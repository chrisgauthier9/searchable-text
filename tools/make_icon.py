"""Draws the Searchable Text app icon: a report page with text lines and a magnifying glass."""
import sys
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white, Color

S = 1024
c = canvas.Canvas(sys.argv[1], pagesize=(S, S))
# macOS icon grid: 824 px rounded square, centred
x0, y0, size, r = 100, 100, 824, 185
p = c.beginPath(); p.roundRect(x0, y0, size, size, r)
c.saveState(); c.clipPath(p, stroke=0, fill=0)
c.linearGradient(0, y0, 0, y0 + size, (HexColor('#0B5CAD'), HexColor('#2FA7D8')), extend=True)
c.restoreState()

# page with folded corner
px, py, pw, ph, fold = 280, 205, 400, 520, 95
c.setFillColor(Color(0, 0, 0, alpha=0.18)); c.roundRect(px + 10, py - 14, pw - 10, ph - fold, 28, stroke=0, fill=1)
c.setFillColor(white)
pg = c.beginPath()
pg.moveTo(px + 28, py); pg.lineTo(px + pw - 28, py); pg.arcTo(px + pw - 56, py, px + pw, py + 56, -90, 90)
pg.lineTo(px + pw, py + ph - fold); pg.lineTo(px + pw - fold, py + ph); pg.lineTo(px + 28, py + ph)
pg.arcTo(px, py + ph - 56, px + 56, py + ph, 90, 90); pg.lineTo(px, py + 28); pg.arcTo(px, py, px + 56, py + 56, 180, 90)
pg.close(); c.drawPath(pg, stroke=0, fill=1)
c.setFillColor(HexColor('#D6E4F0'))
f = c.beginPath(); f.moveTo(px + pw, py + ph - fold); f.lineTo(px + pw - fold, py + ph - fold); f.lineTo(px + pw - fold, py + ph); f.close()
c.drawPath(f, stroke=0, fill=1)

# text lines
c.setFillColor(HexColor('#9FB4C8'))
widths = [230, 300, 270, 310, 190, 290, 250]
for i, w in enumerate(widths):
    c.roundRect(px + 50, py + ph - 150 - i * 50, w, 20, 10, stroke=0, fill=1)

# magnifying glass
cx, cy, rad = 610, 380, 120
c.setStrokeColor(HexColor('#0A2540')); c.setLineCap(1)
c.setLineWidth(52); c.line(cx + 95, cy - 95, cx + 185, cy - 185)
c.setFillColor(white); c.setLineWidth(38); c.circle(cx, cy, rad, stroke=1, fill=1)
c.setFillColor(HexColor('#0B5CAD'))
for i, w in enumerate([120, 150, 95]):
    c.roundRect(cx - 80, cy + 30 - i * 42, w, 20, 10, stroke=0, fill=1)
c.showPage(); c.save()
