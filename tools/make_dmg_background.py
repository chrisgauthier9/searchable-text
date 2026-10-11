"""Background for the installer window: an arrow from the app to the Applications folder."""
import sys
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

W, H = 640, 400
c = canvas.Canvas(sys.argv[1], pagesize=(W, H))
c.setFillColor(HexColor('#F3F7FB')); c.rect(0, 0, W, H, stroke=0, fill=1)
c.setFillColor(HexColor('#10243A')); c.setFont('Helvetica-Bold', 22)
c.drawCentredString(W / 2, H - 62, 'Drag Searchable Text into Applications')
c.setFillColor(HexColor('#4F6378')); c.setFont('Helvetica', 14)
c.drawCentredString(W / 2, 48, 'Then open it from your Applications folder.')
# arrow between the two icons (icons sit at y = 200 from the top, x = 170 and 470)
c.setStrokeColor(HexColor('#0B5CAD')); c.setFillColor(HexColor('#0B5CAD')); c.setLineWidth(6); c.setLineCap(1)
y = H - 200
c.line(255, y, 370, y)
p = c.beginPath(); p.moveTo(392, y); p.lineTo(366, y + 16); p.lineTo(366, y - 16); p.close(); c.drawPath(p, stroke=0, fill=1)
c.showPage(); c.save()
