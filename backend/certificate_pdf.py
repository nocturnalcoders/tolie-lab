"""Draws the completion certificate as a one-page A4 landscape PDF (ReportLab, no other tools needed)."""
from __future__ import annotations

import io
from pathlib import Path

from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ASSETS = Path(__file__).resolve().parent / "assets"
TEXT = {
    "id": {
        "months": ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
        "tagline": "Lab: belajar coding lewat kasus kerja nyata", "title": "Sertifikat Penyelesaian", "awarded": "diberikan kepada",
        "completed": "telah menyelesaikan kursus", "detail": "{lessons} pelajaran  ·  {exercises} latihan  ·  {language}  ·  {level}",
        "signer": "Penerbit, tolie.space Lab", "issued": "Diterbitkan pada", "number": "Nomor sertifikat", "verify": "Periksa keasliannya:",
        "footer": "Sertifikat ini menyatakan penyelesaian kursus di tolie.space Lab. Ini bukan akreditasi resmi.", "pdf_title": "Sertifikat penyelesaian",
    },
    "en": {
        "months": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        "tagline": "Lab: learn to code through real work cases", "title": "Certificate of Completion", "awarded": "awarded to",
        "completed": "has completed the course", "detail": "{lessons} lessons  ·  {exercises} exercises  ·  {language}  ·  {level}",
        "signer": "Publisher, tolie.space Lab", "issued": "Issued on", "number": "Certificate number", "verify": "Verify its authenticity:",
        "footer": "This certificate states completion of a course at tolie.space Lab. It is not an official accreditation.", "pdf_title": "Certificate of completion",
    },
}

CREAM, CLAY, INK, SOFT = HexColor("#fff6e2"), HexColor("#5a3b2e"), HexColor("#34243a"), HexColor("#6b5a60")
AMBER, NIGHT, CORAL = HexColor("#ffb454"), HexColor("#0a1030"), HexColor("#e8744f")

_fonts_ready = False


def _register_fonts() -> None:
    global _fonts_ready
    if _fonts_ready:
        return
    for name, file in [("Serif", "DejaVuSerif.ttf"), ("Serif-Bold", "DejaVuSerif-Bold.ttf"), ("Serif-Italic", "DejaVuSerif-Italic.ttf"),
                       ("Sans", "DejaVuSans.ttf"), ("Sans-Bold", "DejaVuSans-Bold.ttf")]:
        pdfmetrics.registerFont(TTFont(name, str(ASSETS / "fonts" / file)))
    _fonts_ready = True


def _safe(text: str, font: str) -> str:
    """Replace characters the font cannot draw (for example Chinese) so they do not turn into boxes."""
    glyphs = pdfmetrics.getFont(font).face.charToGlyph
    return "".join(ch if ord(ch) in glyphs else "?" for ch in text)


def _fit(text: str, font: str, size: float, width: float, minimum: float) -> float:
    while size > minimum and pdfmetrics.stringWidth(text, font, size) > width:
        size -= 0.5
    return size


def _wrap(text: str, font: str, size: float, width: float, lines: int = 2) -> list[str]:
    words, out, cur = text.split(), [], ""
    for w in words:
        trial = f"{cur} {w}".strip()
        if pdfmetrics.stringWidth(trial, font, size) <= width or not cur:
            cur = trial
        else:
            out.append(cur)
            cur = w
    out.append(cur)
    if len(out) > lines:  # too long even when wrapped: cut the last line
        out = out[:lines]
        while out[-1] and pdfmetrics.stringWidth(out[-1] + "…", font, size) > width:
            out[-1] = out[-1][:-1]
        out[-1] += "…"
    return out


def _lantern(c: canvas.Canvas, cx: float, top: float, scale: float = 1.0) -> None:
    c.saveState()
    c.setStrokeColor(AMBER)
    c.setLineWidth(1.2 * scale)
    c.line(cx, top, cx, top - 6 * scale)
    c.setFillColor(HexColor("#3a2314"))
    c.roundRect(cx - 8 * scale, top - 9 * scale, 16 * scale, 3.5 * scale, 1.2 * scale, fill=1, stroke=0)
    c.setFillColor(AMBER)
    c.ellipse(cx - 11 * scale, top - 29 * scale, cx + 11 * scale, top - 9 * scale, fill=1, stroke=0)
    c.setFillColor(HexColor("#3a2314"))
    c.roundRect(cx - 8 * scale, top - 31 * scale, 16 * scale, 3.5 * scale, 1.2 * scale, fill=1, stroke=0)
    c.restoreState()


def render(*, holder: str, course_title: str, language_label: str, level: str, lessons: int, exercises: int,
           issued_at, public_id: str, verify_url: str, locale: str = "id") -> bytes:
    _register_fonts()
    T = TEXT.get(locale, TEXT["id"])
    W, H = landscape(A4)
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(W, H))
    c.setTitle(f"{T['pdf_title']}: {_safe(course_title, 'Sans')}")
    c.setAuthor("Christianto Lie, tolie.space")
    c.setSubject(f"{T['pdf_title']} {public_id}")

    # paper and double frame
    c.setFillColor(CREAM)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setStrokeColor(CLAY)
    c.setLineWidth(3)
    c.roundRect(20, 20, W - 40, H - 40, 16, fill=0, stroke=1)
    c.setStrokeColor(AMBER)
    c.setLineWidth(1)
    c.roundRect(30, 30, W - 60, H - 60, 11, fill=0, stroke=1)

    # night strip with the brand, like the site header
    c.saveState()
    p = c.beginPath()
    p.roundRect(30, H - 98, W - 60, 68, 11)
    c.clipPath(p, stroke=0, fill=0)
    c.setFillColor(NIGHT)
    c.rect(30, H - 98, W - 60, 68, fill=1, stroke=0)
    c.setFillColor(HexColor("#1d2a66"))
    c.rect(30, H - 98, W - 60, 22, fill=1, stroke=0)
    c.restoreState()
    for cx, col in ((70, AMBER), (W - 70, CORAL)):
        _lantern(c, cx, H - 31, 0.9)
    c.setFillColor(CREAM)
    c.setFont("Sans-Bold", 17)
    c.drawCentredString(W / 2, H - 62, "tolie.space")
    c.setFillColor(HexColor("#b9b4cf"))
    c.setFont("Sans", 11)
    c.drawCentredString(W / 2, H - 91, T["tagline"])

    # title
    c.setFillColor(HexColor("#3a2314"))
    c.setFont("Serif-Bold", 34)
    c.drawCentredString(W / 2, H - 150, T["title"])
    c.setStrokeColor(AMBER)
    c.setLineWidth(2)
    c.line(W / 2 - 40, H - 163, W / 2 + 40, H - 163)

    # holder
    c.setFillColor(SOFT)
    c.setFont("Sans", 12.5)
    c.drawCentredString(W / 2, H - 192, T["awarded"])
    name = _safe(holder, "Serif-Italic")
    size = _fit(name, "Serif-Italic", 44, W - 170, 18)
    c.setFillColor(INK)
    c.setFont("Serif-Italic", size)
    c.drawCentredString(W / 2, H - 238, name)
    width = min(pdfmetrics.stringWidth(name, "Serif-Italic", size) + 40, W - 150)
    c.setStrokeColor(AMBER)
    c.setLineWidth(1)
    c.line(W / 2 - width / 2, H - 250, W / 2 + width / 2, H - 250)

    # course
    c.setFillColor(SOFT)
    c.setFont("Sans", 12.5)
    c.drawCentredString(W / 2, H - 278, T["completed"])
    title = _safe(course_title, "Serif-Bold")
    tsize = 25
    lines = _wrap(title, "Serif-Bold", tsize, W - 190)
    c.setFillColor(HexColor("#3a2314"))
    c.setFont("Serif-Bold", tsize)
    y = H - 312
    for ln in lines:
        c.drawCentredString(W / 2, y, ln)
        y -= 30
    c.setFillColor(SOFT)
    c.setFont("Sans", 11.5)
    detail = T["detail"].format(lessons=lessons, exercises=exercises, language=_safe(language_label, "Sans"), level=_safe(level, "Sans"))
    c.drawCentredString(W / 2, y - 4, detail)

    # signature block (bottom left)
    sig_h = 62
    c.drawImage(str(ASSETS / "signature.png"), 82, 94, width=sig_h * 520 / 350, height=sig_h, mask="auto", preserveAspectRatio=True)
    c.setStrokeColor(CLAY)
    c.setLineWidth(0.8)
    c.line(76, 92, 262, 92)
    c.setFillColor(INK)
    c.setFont("Sans-Bold", 11.5)
    c.drawCentredString(169, 77, "Christianto Lie")
    c.setFillColor(SOFT)
    c.setFont("Sans", 9.5)
    c.drawCentredString(169, 64, T["signer"])

    # date (bottom centre)
    date = f"{issued_at.day} {T['months'][issued_at.month - 1]} {issued_at.year}"
    c.setFillColor(SOFT)
    c.setFont("Sans", 10.5)
    c.drawCentredString(W / 2 - 60, 92, T["issued"])
    c.setFillColor(INK)
    c.setFont("Serif-Bold", 14)
    c.drawCentredString(W / 2 - 60, 74, date)

    # verification (bottom right): number, address and QR code
    qr = QrCodeWidget(verify_url)
    x0, y0, x1, y1 = qr.getBounds()
    box = 82
    d = Drawing(box, box, transform=[box / (x1 - x0), 0, 0, box / (y1 - y0), 0, 0])
    d.add(qr)
    renderPDF.draw(d, c, W - 76 - box, 58)
    right = W - 76 - box - 14
    c.setFillColor(SOFT)
    c.setFont("Sans", 9.5)
    c.drawRightString(right, 130, T["number"])
    c.setFillColor(INK)
    c.setFont("Sans-Bold", 12)
    c.drawRightString(right, 115, public_id)
    c.setFillColor(SOFT)
    c.setFont("Sans", 9.5)
    c.drawRightString(right, 99, T["verify"])
    short = verify_url.replace("https://", "").replace("http://", "")
    c.setFont("Sans", 8.2)
    c.drawRightString(right, 87, short)

    # honest footer
    c.setFillColor(SOFT)
    c.setFont("Serif-Italic", 9)
    c.drawCentredString(W / 2, 42, T["footer"])
    c.showPage()
    c.save()
    return buf.getvalue()
