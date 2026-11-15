"""Admin API: courses, lessons and exercises (multiple choice and code) edited from the website.

Everything here needs a signed-in admin and the CSRF header. Rows created or edited here get
source = 'admin', which tells the content-file sync to leave them alone. The same validators as the
content files are used, so a question saved here is as well-formed as one written in a file.
"""
from __future__ import annotations

import re
import unicodedata
from functools import wraps

from flask import abort, jsonify, request
from psycopg.types.json import Jsonb

import content_loader as cl


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")[:60]


def register(app, h) -> None:
    def admin_required(view):
        @h.login_required
        @wraps(view)
        def wrapped(*args, **kwargs):
            if h.current_user()["role"] != "admin":
                return jsonify(error="Hanya admin yang boleh membuka ini."), 403
            return view(*args, **kwargs)
        return wrapped

    def bad(message: str, status: int = 400):
        return jsonify(error=message), status

    def int_arg(raw, default=None):
        return raw if isinstance(raw, int) and not isinstance(raw, bool) else default

    # ------------------------------------------------------------------ overview
    @app.get("/api/admin/overview")
    @admin_required
    def admin_overview():
        courses = h.db().execute(
            """SELECT c.id, c.slug, c.title, c.language, c.locale, c.level, c.kind, c.price_idr, c.status, c.position, c.source,
                      (SELECT count(*) FROM lessons l WHERE l.course_id = c.id) AS lessons,
                      (SELECT count(*) FROM exercises e JOIN lessons l ON l.id = e.lesson_id WHERE l.course_id = c.id) AS exercises,
                      (SELECT count(*) FROM enrollments en WHERE en.course_id = c.id) AS learners,
                      (SELECT count(*) FROM certificates ce WHERE ce.course_id = c.id AND ce.revoked_at IS NULL) AS certificates
               FROM courses c ORDER BY c.position, c.id""").fetchall()
        certs = h.db().execute(
            """SELECT ce.public_id, ce.holder_name, ce.issued_at, ce.revoked_at, c.title AS course_title, u.email
               FROM certificates ce JOIN courses c ON c.id = ce.course_id JOIN users u ON u.id = ce.user_id
               ORDER BY ce.issued_at DESC LIMIT 20""").fetchall()
        for row in certs:
            row["issued_at"] = row["issued_at"].isoformat()
            row["revoked"] = row.pop("revoked_at") is not None
        return jsonify(courses=courses, certificates=certs)

    @app.get("/api/admin/stats")
    @admin_required
    def admin_stats():
        """Numbers for the dashboard: who is learning, where they stop, and which exercises are hardest."""
        tz = h.timezone()
        totals = h.db().execute(
            """SELECT (SELECT count(*) FROM users) AS users,
                      (SELECT count(*) FROM users WHERE created_at > now() - interval '7 days') AS new_users_7d,
                      (SELECT count(DISTINCT user_id) FROM submissions WHERE created_at > now() - interval '7 days') AS active_7d,
                      (SELECT count(*) FROM submissions WHERE created_at > now() - interval '7 days') AS submissions_7d,
                      (SELECT count(*) FROM certificates WHERE revoked_at IS NULL) AS certificates,
                      (SELECT count(*) FROM orders WHERE status = 'paid') AS paid_orders,
                      (SELECT coalesce(sum(amount_idr), 0) FROM orders WHERE status = 'paid') AS revenue_idr""").fetchone()
        signups = h.db().execute(
            """SELECT d::date AS day,
                      (SELECT count(*) FROM users u WHERE (u.created_at AT TIME ZONE %s)::date = d::date) AS users,
                      (SELECT count(DISTINCT s.user_id) FROM submissions s WHERE (s.created_at AT TIME ZONE %s)::date = d::date) AS active
               FROM generate_series((now() AT TIME ZONE %s)::date - 13, (now() AT TIME ZONE %s)::date, interval '1 day') d
               ORDER BY d""", (tz, tz, tz, tz)).fetchall()
        for row in signups:
            row["day"] = row["day"].isoformat()
        # Per lesson: how many learners tried it and how many finished it. A big gap is where people give up.
        lessons = h.db().execute(
            """WITH req AS (SELECT lesson_id, count(*) AS n FROM exercises WHERE required GROUP BY lesson_id),
                    per_user AS (
                      SELECT e.lesson_id, p.user_id, count(*) FILTER (WHERE e.required AND p.passed_at IS NOT NULL) AS passed
                      FROM exercise_progress p JOIN exercises e ON e.id = p.exercise_id GROUP BY e.lesson_id, p.user_id)
               SELECT c.id AS course_id, c.title AS course_title, l.id, l.position, l.title,
                      CASE WHEN coalesce(r.n, 0) = 0 THEN (SELECT count(*) FROM lesson_progress lp WHERE lp.lesson_id = l.id)
                           ELSE (SELECT count(*) FROM per_user u WHERE u.lesson_id = l.id) END AS started,
                      CASE WHEN coalesce(r.n, 0) = 0 THEN (SELECT count(*) FROM lesson_progress lp WHERE lp.lesson_id = l.id)
                           ELSE (SELECT count(*) FROM per_user u WHERE u.lesson_id = l.id AND u.passed = r.n) END AS finished
               FROM lessons l JOIN courses c ON c.id = l.course_id LEFT JOIN req r ON r.lesson_id = l.id
               WHERE c.status = 'published' ORDER BY c.position, c.id, l.position, l.id""").fetchall()
        hardest = h.db().execute(
            """SELECT e.id, e.title, e.type, l.id AS lesson_id, l.title AS lesson_title, c.title AS course_title,
                      count(*) AS learners, count(p.passed_at) AS passed,
                      round(avg(p.attempts)::numeric, 1)::float AS avg_attempts
               FROM exercise_progress p JOIN exercises e ON e.id = p.exercise_id
               JOIN lessons l ON l.id = e.lesson_id JOIN courses c ON c.id = l.course_id
               WHERE p.attempts > 0 GROUP BY e.id, l.id, c.id
               ORDER BY count(p.passed_at)::float / count(*), avg(p.attempts) DESC, e.id LIMIT 10""").fetchall()
        return jsonify(totals=totals, days=signups, lessons=lessons, hardest=hardest)

    # ------------------------------------------------------------------ courses
    def course_row(cid: int) -> dict:
        row = h.db().execute("SELECT * FROM courses WHERE id = %s", (cid,)).fetchone()
        if not row:
            abort(404)
        return row

    def course_payload(row: dict) -> dict:
        return {k: row[k] for k in ("id", "slug", "title", "language", "locale", "level", "kind", "price_idr", "status", "position",
                                    "summary", "perks", "certificate", "source")}

    @app.get("/api/admin/courses/<int:cid>")
    @admin_required
    def admin_course(cid: int):
        course = course_row(cid)
        lessons = h.db().execute(
            """SELECT l.id, l.slug, l.title, l.position, l.source, count(e.id) AS exercises
               FROM lessons l LEFT JOIN exercises e ON e.lesson_id = l.id WHERE l.course_id = %s
               GROUP BY l.id ORDER BY l.position, l.id""", (cid,)).fetchall()
        return jsonify(course=course_payload(course), lessons=lessons)

    def save_course(cid: int | None):
        data = h.json_body()
        if not data.get("slug") and data.get("title"):
            data["slug"] = slugify(str(data["title"]))
        try:
            meta = cl.validate_course_meta(data)
        except cl.ContentError as exc:
            return bad(str(exc))
        clash = h.db().execute("SELECT id FROM courses WHERE slug = %s AND id IS DISTINCT FROM %s", (meta["slug"], cid)).fetchone()
        if clash:
            return bad("Sudah ada kursus dengan slug itu.", 409)
        if cid is None:
            row = h.db().execute(
                """INSERT INTO courses (slug, title, language, locale, level, kind, price_idr, status, position, summary, perks, certificate, source)
                   VALUES (%(slug)s, %(title)s, %(language)s, %(locale)s, %(level)s, %(kind)s, %(price_idr)s, %(status)s, %(position)s,
                           %(summary)s, %(perks)s, %(certificate)s, 'admin') RETURNING *""", {**meta, "perks": Jsonb(meta["perks"])}).fetchone()
        else:
            course_row(cid)
            row = h.db().execute(
                """UPDATE courses SET slug = %(slug)s, title = %(title)s, language = %(language)s, locale = %(locale)s, level = %(level)s, kind = %(kind)s,
                          price_idr = %(price_idr)s, status = %(status)s, position = %(position)s, summary = %(summary)s,
                          perks = %(perks)s, certificate = %(certificate)s, source = 'admin', updated_at = now()
                   WHERE id = %(id)s RETURNING *""", {**meta, "perks": Jsonb(meta["perks"]), "id": cid}).fetchone()
        h.db().commit()
        return jsonify(course=course_payload(row)), 201 if cid is None else 200

    @app.post("/api/admin/courses")
    @admin_required
    def admin_course_create():
        return save_course(None)

    @app.put("/api/admin/courses/<int:cid>")
    @admin_required
    def admin_course_update(cid: int):
        return save_course(cid)

    # ------------------------------------------------------------------ lessons
    def lesson_row(lid: int) -> dict:
        row = h.db().execute("SELECT * FROM lessons WHERE id = %s", (lid,)).fetchone()
        if not row:
            abort(404)
        return row

    def exercise_admin_json(row: dict, submissions: int) -> dict:
        return {"id": row["id"], "slug": row["slug"], "position": row["position"], "type": row["type"], "title": row["title"],
                "prompt": row["prompt_md"], "required": row["required"], "source": row["source"], "config": row["config"],
                "submissions": submissions}

    @app.get("/api/admin/lessons/<int:lid>")
    @admin_required
    def admin_lesson(lid: int):
        lesson = lesson_row(lid)
        course = course_row(lesson["course_id"])
        rows = h.db().execute("SELECT * FROM exercises WHERE lesson_id = %s ORDER BY position, id", (lid,)).fetchall()
        subs = {r["exercise_id"]: r["n"] for r in h.db().execute(
            "SELECT exercise_id, count(*) AS n FROM submissions WHERE exercise_id = ANY(%s) GROUP BY exercise_id",
            ([r["id"] for r in rows] or [0],))}
        return jsonify(
            lesson={"id": lesson["id"], "course_id": lesson["course_id"], "slug": lesson["slug"], "title": lesson["title"],
                    "position": lesson["position"], "body": lesson["body_md"], "source": lesson["source"]},
            course={"id": course["id"], "title": course["title"], "language": course["language"]},
            exercises=[exercise_admin_json(r, subs.get(r["id"], 0)) for r in rows])

    def save_lesson(cid: int, lid: int | None):
        data = h.json_body()
        if not data.get("slug") and data.get("title"):
            data["slug"] = slugify(str(data["title"]))
        try:
            lesson = cl.validate_lesson(data)
        except cl.ContentError as exc:
            return bad(str(exc))
        clash = h.db().execute("SELECT id FROM lessons WHERE course_id = %s AND slug = %s AND id IS DISTINCT FROM %s",
                               (cid, lesson["slug"], lid)).fetchone()
        if clash:
            return bad("Sudah ada pelajaran dengan slug itu di kursus ini.", 409)
        position = int_arg(data.get("position"))
        if lid is None:
            if position is None:
                position = h.db().execute("SELECT coalesce(max(position), 0) + 1 AS n FROM lessons WHERE course_id = %s", (cid,)).fetchone()["n"]
            row = h.db().execute(
                "INSERT INTO lessons (course_id, slug, title, position, body_md, source) VALUES (%s, %s, %s, %s, %s, 'admin') RETURNING id",
                (cid, lesson["slug"], lesson["title"], position, lesson["body"])).fetchone()
        else:
            current = lesson_row(lid)
            row = h.db().execute(
                "UPDATE lessons SET slug = %s, title = %s, position = %s, body_md = %s, source = 'admin' WHERE id = %s RETURNING id",
                (lesson["slug"], lesson["title"], position if position is not None else current["position"], lesson["body"], lid)).fetchone()
        h.db().commit()
        return jsonify(id=row["id"]), 201 if lid is None else 200

    @app.post("/api/admin/courses/<int:cid>/lessons")
    @admin_required
    def admin_lesson_create(cid: int):
        course_row(cid)
        return save_lesson(cid, None)

    @app.put("/api/admin/lessons/<int:lid>")
    @admin_required
    def admin_lesson_update(lid: int):
        return save_lesson(lesson_row(lid)["course_id"], lid)

    def submissions_in(where: str, arg) -> int:
        return h.db().execute(f"SELECT count(*) AS n FROM submissions s JOIN exercises e ON e.id = s.exercise_id WHERE {where}", (arg,)).fetchone()["n"]

    @app.delete("/api/admin/lessons/<int:lid>")
    @admin_required
    def admin_lesson_delete(lid: int):
        lesson_row(lid)
        n = submissions_in("e.lesson_id = %s", lid)
        if n and request.args.get("force") != "1":
            return jsonify(error=f"Pelajaran ini sudah punya {n} jawaban peserta. Menghapusnya ikut menghapus kemajuan mereka.", submissions=n), 409
        h.db().execute("DELETE FROM lessons WHERE id = %s", (lid,))
        h.db().commit()
        return jsonify(ok=True)

    # ------------------------------------------------------------------ exercises
    def save_exercise(lid: int, eid: int | None):
        lesson = lesson_row(lid)
        course = course_row(lesson["course_id"])
        data = h.json_body()
        if not data.get("slug") and data.get("title"):
            data["slug"] = slugify(str(data["title"]))
        try:
            ex = cl.validate_exercise(data, "exercise", course["language"])
        except cl.ContentError as exc:
            return bad(str(exc))
        clash = h.db().execute("SELECT id FROM exercises WHERE lesson_id = %s AND slug = %s AND id IS DISTINCT FROM %s",
                               (lid, ex["slug"], eid)).fetchone()
        if clash:
            return bad("Sudah ada latihan dengan slug itu di pelajaran ini.", 409)
        position = int_arg(data.get("position"))
        if eid is None:
            if position is None:
                position = h.db().execute("SELECT coalesce(max(position), 0) + 1 AS n FROM exercises WHERE lesson_id = %s", (lid,)).fetchone()["n"]
            row = h.db().execute(
                """INSERT INTO exercises (lesson_id, slug, position, type, title, prompt_md, required, config, source)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'admin') RETURNING *""",
                (lid, ex["slug"], position, ex["type"], ex["title"], ex["prompt"], ex["required"], Jsonb(ex["config"]))).fetchone()
        else:
            current = h.db().execute("SELECT * FROM exercises WHERE id = %s AND lesson_id = %s", (eid, lid)).fetchone()
            if not current:
                abort(404)
            n = submissions_in("s.exercise_id = %s", eid)
            if n and current["type"] != ex["type"]:
                return bad("Jenis latihan tidak bisa diubah setelah ada jawaban peserta. Buat latihan baru.", 409)
            row = h.db().execute(
                """UPDATE exercises SET slug = %s, position = %s, type = %s, title = %s, prompt_md = %s, required = %s,
                          config = %s, source = 'admin' WHERE id = %s RETURNING *""",
                (ex["slug"], position if position is not None else current["position"], ex["type"], ex["title"], ex["prompt"],
                 ex["required"], Jsonb(ex["config"]), eid)).fetchone()
        h.db().commit()
        return jsonify(exercise=exercise_admin_json(row, 0)), 201 if eid is None else 200

    @app.post("/api/admin/lessons/<int:lid>/exercises")
    @admin_required
    def admin_exercise_create(lid: int):
        return save_exercise(lid, None)

    @app.put("/api/admin/exercises/<int:eid>")
    @admin_required
    def admin_exercise_update(eid: int):
        row = h.db().execute("SELECT lesson_id FROM exercises WHERE id = %s", (eid,)).fetchone()
        if not row:
            abort(404)
        return save_exercise(row["lesson_id"], eid)

    @app.delete("/api/admin/exercises/<int:eid>")
    @admin_required
    def admin_exercise_delete(eid: int):
        if not h.db().execute("SELECT 1 FROM exercises WHERE id = %s", (eid,)).fetchone():
            abort(404)
        n = submissions_in("s.exercise_id = %s", eid)
        if n and request.args.get("force") != "1":
            return jsonify(error=f"Latihan ini sudah punya {n} jawaban peserta. Menghapusnya ikut menghapus kemajuan mereka.", submissions=n), 409
        h.db().execute("DELETE FROM exercises WHERE id = %s", (eid,))
        h.db().commit()
        return jsonify(ok=True)

    # ------------------------------------------------------------------ helpers for the editor
    @app.post("/api/admin/preview")
    @admin_required
    def admin_preview():
        return jsonify(html=h.render_md(str(h.json_body().get("markdown", ""))[:50000]))

    @app.post("/api/admin/certificates/<public_id>/<action>")
    @admin_required
    def admin_cert_action(public_id: str, action: str):
        if action not in ("revoke", "restore"):
            abort(404)
        stamp = "now()" if action == "revoke" else "NULL"
        n = h.db().execute(f"UPDATE certificates SET revoked_at = {stamp} WHERE public_id = %s", (public_id.upper(),)).rowcount
        if not n:
            abort(404)
        h.db().commit()
        return jsonify(ok=True, revoked=action == "revoke")

    @app.post("/api/admin/grants")
    @admin_required
    def admin_grant():
        data = h.json_body()
        row = h.db().execute(
            "SELECT u.id AS uid, c.id AS cid FROM users u, courses c WHERE lower(u.email) = lower(%s) AND c.slug = %s",
            (str(data.get("email", "")).strip(), str(data.get("course_slug", "")))).fetchone()
        if not row:
            return bad("Tidak ada pengguna dengan email itu, atau kursusnya tidak ditemukan.", 404)
        h.db().execute("INSERT INTO entitlements (user_id, course_id, source) VALUES (%s, %s, 'admin') ON CONFLICT DO NOTHING", (row["uid"], row["cid"]))
        h.db().commit()
        return jsonify(ok=True)
