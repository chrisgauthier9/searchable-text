"""Fake test PDFs that copy the two hospital layouts. All names, numbers and content are invented."""
import sys
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit

W, H = letter
F, FB, FS = "Helvetica", "Helvetica-Bold", 9.5
LH = 11.5


def wrap(text, width, font=F, size=FS):
    return simpleSplit(text, font, size, width)


# ---------------------------------------------------------------- format A: two columns
def two_col(path):
    c = canvas.Canvas(path, pagesize=letter)
    LX, LW = 40, 285          # left column, wider
    RX, RW = 350, 220         # right column

    def title_box():
        c.rect(40, H - 60 if page > 1 else 0, 0, 0)  # no-op keeps API symmetrical
        y = H - 50 if page > 1 else top_box_y
        c.rect(40, y - 5, W - 80, 18)
        c.setFont("Helvetica-BoldOblique", 12)
        c.drawCentredString(W / 2, y, "ED Note Physician")
        return y

    def footer():
        c.setFont(F, 8)
        c.drawString(40, 30, "Printed: 10/10/2026 16:02")
        c.drawRightString(W - 40, 30, f"Page {page} of 2")

    def col_lines(x, width, y, items):
        """items: (text, kind). kind: h=heading, p=plain, b=bullet, m=med (hanging indent), i=indented item, s=subheading, gap"""
        for text, kind in items:
            if kind == "gap":
                y -= LH
                continue
            if kind in ("h", "s"):
                c.setFont(FB if kind == "h" else F, FS)
                ix = x if kind == "h" else x + 8
                c.drawString(ix, y, text)
                tw = c.stringWidth(text, FB if kind == "h" else F, FS)
                c.line(ix, y - 1.5, ix + tw, y - 1.5)
                y -= LH
                continue
            c.setFont(F, FS)
            if kind == "m":
                lines = wrap(text, width - 16)
                c.drawString(x + 16, y, lines[0]); y -= LH
                rest = " ".join(lines[1:])
                for ln in (wrap(rest, width - 24) if rest else []):
                    c.drawString(x + 24, y, ln); y -= LH
            elif kind == "i":
                for ln in wrap(text, width - 16):
                    c.drawString(x + 16, y, ln); y -= LH
            else:
                for ln in wrap(text, width):
                    c.drawString(x, y, ln); y -= LH
        return y

    # page 1
    page = 1
    c.setFont(FB, 11); c.drawString(40, H - 45, "Lanark Valley District Hospital")
    c.setFont(F, 10)
    for i, t in enumerate(["12 Example Street", "Testville, Ontario K0A 0A0", "     Phone:     (613) 555-0100"]):
        c.drawString(40, H - 59 - i * 12, t)
    rows = [("Name:", "TESTPATIENT, Jane Q", "DOB:  01/02/1950"),
            ("MRN:", "000123456", "Sex:  Female"),
            ("Encounter:", "ENC-999888", "Location: ED Bed 4")]
    for i, (a, b, r) in enumerate(rows):
        y = H - 110 - i * 13
        c.drawString(40, y, a); c.drawString(100, y, b); c.drawString(400, y, r)
    c.drawString(40, H - 160, "Primary Care:"); c.drawString(200, H - 160, "Doctor, Example, MD")
    top_box_y = H - 190
    title_box()
    for i, (a, b) in enumerate([("Document Type:", "ED Note Physician"), ("Service Date/Time:", "10/8/2026 15:27 EDT"), ("Result Status:", "Auth (Verified)")]):
        y = H - 215 - i * 12
        c.drawString(40, y, a); c.drawString(250, y, b)

    left1 = [("Assessment/Plan", "h"), ("", "gap"),
             ("1. Delirium", "p"), ("- Likely secondary to urinary tract infection", "p"), ("-CTX1g IV", "p"), ("- Pan cultured", "p"), ("", "gap"),
             ("2. Atrial fibrillation", "p"),
             ("- Rate control with bisoprolol 10mg- missed several doses as wasn't taking home meds- gave 10mg po bisoprolol and rate was controlled.", "p"),
             ("-New dx, start apix", "p"), ("", "gap"),
             ("3. AKI", "p"), ("likely prerenal", "p"), ("hold perindopril", "p"), ("trend Cr", "p"), ("", "gap"),
             ("History of Present Illness", "h"), ("Subjective:", "p"),
             ("- Progressive malaise over the past month, progressively worsening", "p"),
             ("- Chest pain for 2-3 days, intermittent, brief duration (approximately one minute), non-severe, self-resolving", "p"),
             ("- Low-grade fever reported at one time", "p"),
             ("- Broken toilet in room for approximately 3 weeks with sewage leakage onto bathroom floor", "p"),
             ("- Alcohol use: nil for the past month", "p"), ("", "gap"),
             ("Physical Exam", "h"), ("", "gap"), ("Vitals & Measurements", "s")]
    right1 = [("Problem List/Past Medical History", "h"),
              ("Chronic GERD", "i"), ("COPD", "i"), ("Dilated cardiomyopathy secondary to alcohol use disorder", "i"), ("Gout", "i"),
              ("Historical-Resolved", "s"), ("No qualifying data", "i"), ("", "gap"),
              ("Medications", "h"), ("Inpatient", "s"),
              ("acetaminophen, 1000 mg= 2 tab, PO/FT, q6h, PRN", "m"),
              ("allopurinol, 200 mg= 2 tab, PO, Daily", "m"),
              ("ascorbic acid, 2000 mg= 4 tab, PO, Daily", "m"),
              ("cefTRIAXone", "m"),
              ("Sodium Chloride 0.9% intravenous solution 1,000 mL, 1000 mL, IV-CONTINUOUS", "m"),
              ("Trelegy Ellipta 100 mcg-62.5 mcg-25 mcg/inh inhalation powder, 1 inh, INHALE, Daily", "m"),
              ("zopiclone, 7.5 mg= 1 tab, PO, HS", "m"),
              ("Home", "s"),
              ("allopurinol 200 mg oral tablet, 200 mg= 1 tab, PO, Daily", "m"),
              ("bisoprolol 10 mg oral tablet, 10 mg= 1 tab, PO, Daily, 3 refills", "m")]
    ytop = H - 270
    col_lines(LX, LW, ytop, left1)
    col_lines(RX, RW, ytop, right1)
    footer()
    c.showPage()

    # page 2
    page = 2
    title_box()
    c.setFont(FB, FS); c.drawString(56, H - 80, "T:"); c.setFont(F, FS); c.drawString(68, H - 80, "36.7  °C (Tympanic)")
    c.setFont(FB, FS); c.drawString(160, H - 80, "HR:"); c.setFont(F, FS); c.drawString(180, H - 80, "118(Monitored)")
    c.setFont(FB, FS); c.drawString(250, H - 80, "BP:"); c.setFont(F, FS); c.drawString(268, H - 80, "110/88")
    left2 = [("", "gap"), ("General: alert, oriented to person only, appears dehydrated and unwell", "p"),
             ("CVS: irregularly irregular, no murmurs", "p"), ("Resp: decreased air entry bilateral bases", "p")]
    right2 = [("celecoxib 200 mg oral capsule, 200 mg= 1 cap, PO, Daily", "m"), ("Gentle Iron", "m"),
              ("Magnesium, 250 mg, PO, Daily", "m"),
              ("pantoprazole sodium 40 mg oral delayed release tablet, 40 mg= 1 tab, PO, Daily", "m"),
              ("perindopril 2 mg oral tablet, 2 mg= 1 tab, PO, Daily", "m")]
    col_lines(LX, LW, H - 92, left2)
    y = col_lines(RX, RW, H - 80, right2)
    y = H - 320
    c.setFont(FB, FS); c.drawString(40, y, "Electronically Signed"); c.setFont(F, FS)
    c.drawString(40, y - LH, "Example Physician, MD")
    c.drawString(40, y - 2 * LH, "10/8/2026 18:44 EDT")
    footer()
    c.showPage()
    c.save()


# ---------------------------------------------------------------- format B: single column with tables
def one_col(path):
    c = canvas.Canvas(path, pagesize=letter)
    X, TW = 50, W - 100

    def header(page):
        c.setFont(F, 9)
        c.drawString(X, H - 40, "TESTPATIENT, Jane Q (MRN 000123456)")
        c.drawRightString(W - 50, H - 40, f"Page {page} of 3")
        if page > 1:
            c.drawString(X, H - 52, "Consults by Test Resident, MD at 27/7/2026  9:59 AM (continued)")
        return H - 75

    def para(y, text):
        c.setFont(F, 10)
        for ln in wrap(text, TW, F, 10):
            c.drawString(X + 10, y, ln); y -= 12.5
        return y - 10

    def table(y, cols, rows, size=8.5):
        """cols: list of (x, width). rows: list of tuples. Cells wrap inside their width."""
        for row in rows:
            cells = [wrap(t, w, F, size) or [""] for t, (x, w) in zip(row, cols)]
            n = max(len(cl) for cl in cells)
            c.setFont(F, size)
            for (x, w), cl in zip(cols, cells):
                for k, ln in enumerate(cl):
                    c.drawString(x, y - k * 10, ln)
            y -= n * 10 + 3
        return y

    # page 1
    y = header(1)
    c.setFont(F, 10)
    for i, t in enumerate(["The Example Heart Institute - Intensive Cardiac Care Unit", "B", "1 Sample Rd",
                           "Ottawa ON K0A 0B0", "Phone: 613-555-0199"]):
        c.drawString(200, y - i * 13, t)
    y -= 85
    c.drawString(X + 15, y, "Encounter provider:"); c.drawString(200, y, "No name on file")
    y -= 35
    c.setFont(FB, 10.5); c.drawString(X, y, "Patient Demographics"); c.line(X, y - 3, W - 50, y - 3)
    y -= 15
    y = table(y, [(65, 120), (200, 40), (245, 60), (310, 150), (470, 100)],
              [("Patient Name", "Legal", "DOB", "Address", "Phone"),
               ("TESTPATIENT, Jane Q", "Sex F", "01/02/1950", "12 Example Street Testville ON K0A 0A0", "613-555-0100 (Home)")], 9)
    y -= 10
    c.setFont(FB, 10.5); c.drawString(X, y, "Consults by Test Resident, MD at 27/7/2026  9:59 AM"); c.line(X, y - 3, W - 50, y - 3)
    y -= 15
    c.setFont(F, 9.5)
    grid = [("Author: Test Resident, MD", "Service: Infectious Disease", "Author Type: Resident"),
            ("Filed: 27/7/2026  5:33 PM", "Date of Service: 27/7/2026  9:59 AM", "Status: Attested"),
            ("Editor: Test Resident, MD (Resident)", "", "Cosigner: Test Attending, MD")]
    for row in grid:
        for x, t in zip((65, 250, 420), row):
            c.drawString(x, y, t)
        y -= 12
    y -= 10
    c.drawString(X + 15, y, "Attestation signed by Test Attending, MD at 28/7/2026 11:16 AM"); y -= 22
    y = para(y, "Thanks for your consult. Please see excellent R2 note below.")
    y = para(y, "73F with hx of MRSE BPV IE in the context of an SWI early 2026, followed previously by me!")
    y = para(y, "Now has unfortunately returned with S aureus (presumed MSSA based on PCR testing) bacteremia and likely IE.")
    y = para(y, "Suggest Cefazolin IV (renally-adjusted dosing). Would continue Vancomycin given severity of illness pending formal phenotypic sus (though very likely MSSA).")
    y = para(y, "Suggest repeat blood cultures q48h until clearance.")
    y = para(y, "Sincerely,")
    c.setFont(F, 10)
    for t in ["Test Attending, MD, FRCPC", "Division of Infectious Diseases", "The Example Hospital"]:
        c.drawString(X + 10, y, t); y -= 12.5
    c.showPage()

    # page 2: med table
    y = header(2)
    c.setFont(FB, 10); c.drawString(X, y, "MEDICATIONS"); y -= 15
    cols = [(55, 120), (180, 45), (230, 60), (295, 70), (370, 90), (465, 95)]
    y = table(y, cols, [("Medication", "Dose", "Route", "Frequency", "Provider", "Last Admin"),
                        ("acetaminophen (TYLENOL) tablet 650 mg", "650 mg", "oral", "q4h PRN", "Test Nurse, RN", "27/7/2026 0600"),
                        ("ceFAZolin (ANCEF) 2 g in sodium chloride 0.9 % 100 mL IVPB", "2 g", "intravenous", "q8h", "Test Resident, MD", "27/7/2026 0800"),
                        ("vancomycin 1,250 mg in sodium chloride 0.9 % 250 mL IVPB", "1,250 mg", "intravenous", "q12h", "Test Resident, MD", "27/7/2026 0900"),
                        ("heparin 5,000 unit/mL injection 5,000 Units", "5,000 Units", "subcutaneous", "q12h", "Test Resident, MD", "27/7/2026 0900")])
    y -= 10
    c.setFont(FB, 10); c.drawString(X, y, "ALLERGIES"); y -= 13
    c.setFont(F, 10); c.drawString(X + 10, y, "No Known Allergies")
    c.showPage()

    # page 3: labs and signature
    y = header(3)
    c.setFont(FB, 10); c.drawString(X, y, "INVESTIGATIONS"); y -= 15
    y = table(y, [(55, 80), (140, 70), (215, 70), (290, 70)],
              [("Lab", "27/7/26 0400", "26/7/26 0400", "25/7/26 0400"),
               ("WBC", "14.2 (H)", "16.8 (H)", "18.1 (H)"), ("Hgb", "92 (L)", "95 (L)", "101 (L)"),
               ("Creatinine", "142 (H)", "155 (H)", "160 (H)")], 9)
    y -= 20
    c.setFont(F, 10)
    c.drawString(X, y, "Electronically signed by Test Attending, MD at 28/7/2026 11:16 AM")
    c.showPage()
    c.save()


if __name__ == "__main__":
    out = sys.argv[1]
    two_col(f"{out}/fake_two_column.pdf")
    one_col(f"{out}/fake_one_column.pdf")
