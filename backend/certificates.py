"""Completion certificates: claim, public verification page data, and the PDF."""
from __future__ import annotations

import re
import secrets
from datetime import timezone

from flask import Response, abort, jsonify, request

import certificate_pdf

ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no 0/O or 1/I
LANGUAGE_LABEL = {"python": "Python", "javascript": "JavaScript", "sql": "SQL", "java": "Java", "kotlin": "Kotlin"}


def new_public_id() -> str:
    raw = "".join(secrets.choice(ALPHABET) for _ in range(12))
    return f"LAB-{raw[:4]}-{raw[4:8]}-{raw[8:]}"


def iso(value) -> str | None:
    return value.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ") if value else None


def register(app, h) -> None:
    def counts(course_id: int) -> tuple[int, int]:
        row = h.db().execute(
            """SELECT count(DISTINCT l.id) AS lessons, count(e.id) AS exercises
               FROM lessons l LEFT JOIN exercises e ON e.lesson_id = l.id WHERE l.course_id = %s""", (course_id,)).fetchone()
        return row["lessons"], row["exercises"]

    def in_cert_language(row: dict, course: dict) -> dict:
        """The course as the certificate names it: in the language the learner had when claiming it."""
        return h.course_view(course, row.get("locale") or course["locale"])

    def cert_json(row: dict, course: dict) -> dict:
        lessons, exercises = counts(course["id"])
        v = in_cert_language(row, course)
        return {"id": row["public_id"], "name": row["holder_name"], "issued_at": iso(row["issued_at"]),
                "revoked": row["revoked_at"] is not None, "lessons": lessons, "exercises": exercises,
                "course": {"slug": course["slug"], "title": v["title"], "language": course["language"], "level": v["level"], "locale": v["shown_locale"]},
                "verify_url": f"{h.site_url()}/verifikasi/{row['public_id']}",
                "pdf_url": f"/api/certificates/{row['public_id']}/pdf"}

    def course_of(row: dict) -> dict:
        return h.db().execute("SELECT * FROM courses WHERE id = %s", (row["course_id"],)).fetchone()

    def status(user: dict, course: dict) -> dict:
        states = h.lesson_states(user["id"], course["id"])
        eligible = bool(states) and all(x["done"] for x in states)
        existing = h.db().execute("SELECT * FROM certificates WHERE user_id = %s AND course_id = %s", (user["id"], course["id"])).fetchone()
        return {"enabled": course["certificate"], "eligible": eligible,
                "needs_verification": h.email_verification() and user["email_verified_at"] is None,
                "certificate": cert_json(existing, course) if existing else None,
                "default_name": user["name"]}

    @app.get("/api/courses/<slug>/certificate")
    @h.login_required
    def api_cert_status(slug: str):
        course = h.published_course(slug)
        return jsonify(status(h.current_user(), course))

    @app.post("/api/courses/<slug>/certificate")
    @h.login_required
    def api_cert_claim(slug: str):
        user = h.current_user()
        course = h.published_course(slug)
        if not h.has_access(user, course):
            abort(403)
        if not course["certificate"]:
            return jsonify(error="Kursus ini tidak menerbitkan sertifikat."), 400
        st = status(user, course)
        if st["certificate"]:
            if st["certificate"]["revoked"]:
                return jsonify(error="Sertifikatmu untuk kursus ini sudah dicabut. Hubungi admin."), 403
            return jsonify(certificate=st["certificate"], created=False)
        if st["needs_verification"]:
            return jsonify(error="Verifikasi emailmu dulu. Tautannya dikirim saat kamu mendaftar."), 403
        if not st["eligible"]:
            return jsonify(error="Selesaikan semua pelajaran dulu. Sertifikat terbit setelah semua lentera menyala."), 400
        name = re.sub(r"\s+", " ", str(h.json_body().get("name", ""))).strip()
        if not 2 <= len(name) <= 80 or any(ord(ch) < 32 for ch in name) or not any(ch.isalpha() for ch in name):
            return jsonify(error="Tulis nama lengkapmu untuk sertifikat (2 sampai 80 karakter)."), 400
        row = None
        for _ in range(5):  # the id is random; a clash is practically impossible but cheap to handle
            try:
                row = h.db().execute(
                    "INSERT INTO certificates (public_id, user_id, course_id, holder_name, locale) VALUES (%s, %s, %s, %s, %s) RETURNING *",
                    (new_public_id(), user["id"], course["id"], name, h.course_view(course)["shown_locale"])).fetchone()
                break
            except Exception as exc:  # noqa: BLE001
                h.db().rollback()
                if "certificates_pkey" not in str(exc):
                    raise
        if row is None:
            abort(500)
        h.db().commit()
        return jsonify(certificate=cert_json(row, course), created=True), 201

    def find_public(public_id: str) -> tuple[dict, dict]:
        ip = h.client_ip()
        if h.rate_blocked(f"verify:{ip}", 60, 60):
            abort(429)
        h.rate_hit(f"verify:{ip}", 60)
        pid = public_id.strip().upper()
        if not re.fullmatch(r"LAB-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}", pid):
            abort(404)
        row = h.db().execute("SELECT * FROM certificates WHERE public_id = %s", (pid,)).fetchone()
        if not row:
            abort(404)
        return row, course_of(row)

    @app.get("/api/certificates/<public_id>")
    def api_cert_public(public_id: str):
        row, course = find_public(public_id)
        data = cert_json(row, course)
        return jsonify(certificate=data)

    @app.get("/api/certificates/<public_id>/pdf")
    def api_cert_pdf(public_id: str):
        row, course = find_public(public_id)
        if row["revoked_at"] is not None:
            return jsonify(error="Sertifikat ini sudah dicabut."), 410
        data = cert_json(row, course)
        pdf = certificate_pdf.render(
            holder=row["holder_name"], course_title=data["course"]["title"], language_label=LANGUAGE_LABEL.get(course["language"], course["language"]),
            level=data["course"]["level"], lessons=data["lessons"], exercises=data["exercises"], issued_at=row["issued_at"].astimezone(timezone.utc),
            public_id=row["public_id"], verify_url=data["verify_url"], locale=data["course"]["locale"])
        resp = Response(pdf, mimetype="application/pdf")
        resp.headers["Content-Disposition"] = f'inline; filename="sertifikat-{course["slug"]}-{row["public_id"]}.pdf"'
        return resp

    @app.get("/api/me/certificates")
    @h.login_required
    def api_my_certs():
        user = h.current_user()
        rows = h.db().execute("SELECT * FROM certificates WHERE user_id = %s ORDER BY issued_at DESC", (user["id"],)).fetchall()
        return jsonify(certificates=[cert_json(r, course_of(r)) for r in rows])
