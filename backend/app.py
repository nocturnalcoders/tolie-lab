"""tolie.space lab backend: accounts, courses, progress and quiz grading (Flask + PostgreSQL).

Code exercises in the free courses run in the learner's browser, so this API stores what the
browser reports. Multiple-choice answers are graded here: the correct answers never leave the
server until a question has been answered.

  GET  /api/session                       {user, csrf}
  POST /api/register  /api/login  /api/logout
  GET  /api/verify?token=  POST /api/verify/resend
  POST /api/password/forgot  /api/password/reset
  GET  /api/courses                       catalog (with the learner's progress when signed in)
  GET  /api/courses/<slug>                lesson list, progress, next lesson
  GET  /api/courses/<slug>/lessons/<slug> lesson text and exercises
  POST /api/exercises/<id>/answer         multiple choice -> graded here
  POST /api/exercises/<id>/result         code result reported by the browser
  POST /api/exercises/<id>/draft          save the code being written
  POST /api/lessons/<id>/complete         finish a reading-only lesson
  GET  /api/me/courses                    the learner's courses, progress and learning streak
  POST /api/courses/<slug>/checkout       start a Stripe payment for a paid module (payments.py)
  POST /api/stripe/webhook                Stripe tells us a payment went through
  GET  /healthz
"""
from __future__ import annotations

import hashlib
import hmac
import logging
import os
import re
import secrets
import smtplib
import ssl
import time
from datetime import timedelta
from email.message import EmailMessage
from functools import wraps
from pathlib import Path

import markdown as md
import nh3
import psycopg
from flask import Flask, Response, abort, g, jsonify, request, session
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from psycopg_pool import ConnectionPool
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.security import check_password_hash, generate_password_hash

import content_loader
import i18n

BASE_DIR = Path(__file__).resolve().parent
log = logging.getLogger("lab")


def load_env(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())


load_env(BASE_DIR / ".env")

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://lab:lab@localhost:5432/lab")
DB_SCHEMA = os.environ.get("LAB_DB_SCHEMA", "")  # optional, used by the tests
SECRET = os.environ.get("LAB_SECRET_KEY", "")
SITE_URL = os.environ.get("LAB_SITE_URL", "https://lab.tolie.space").rstrip("/")
COOKIE_SECURE = os.environ.get("LAB_COOKIE_SECURE", "1") != "0"
CONTENT_DIR = Path(os.environ.get("LAB_CONTENT_DIR", str(BASE_DIR.parent / "content")))
EMAIL_VERIFICATION = os.environ.get("LAB_EMAIL_VERIFICATION", "0") == "1"
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "465"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
SMTP_FROM = os.environ.get("SMTP_FROM", SMTP_USER)
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
TIMEZONE = os.environ.get("LAB_TIMEZONE", "Asia/Jakarta")  # a learning day starts at midnight here
MAX_CODE = 20000
DUMMY_HASH = generate_password_hash(secrets.token_hex(8))
EMAIL_RE = re.compile(r"^[^@\s]{1,64}@[^@\s]{1,190}\.[^@\s]{2,}$")

if DB_SCHEMA and not re.fullmatch(r"[a-z0-9_]+", DB_SCHEMA):
    raise SystemExit("LAB_DB_SCHEMA may only contain a-z, 0-9 and _")

app = Flask(__name__, static_folder=None)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)  # behind Caddy and nginx
app.config.update(
    SECRET_KEY=SECRET or secrets.token_hex(32),
    SESSION_COOKIE_NAME="tolie_lab",
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=COOKIE_SECURE,
    PERMANENT_SESSION_LIFETIME=timedelta(days=30),
    MAX_CONTENT_LENGTH=256 * 1024,
)

# --------------------------------------------------------------------------
# Database
# --------------------------------------------------------------------------
SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower ON users (lower(email));
CREATE TABLE IF NOT EXISTS email_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS courses (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  language TEXT NOT NULL,
  level TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'course',
  price_idr INTEGER NOT NULL DEFAULT 0 CHECK (price_idr >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  position INTEGER NOT NULL DEFAULT 100,
  summary TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lessons (
  id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  body_md TEXT NOT NULL,
  UNIQUE (course_id, slug)
);
CREATE TABLE IF NOT EXISTS exercises (
  id BIGSERIAL PRIMARY KEY,
  lesson_id BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  position INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('code', 'choice')),
  title TEXT NOT NULL,
  prompt_md TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL,
  UNIQUE (lesson_id, slug)
);
CREATE TABLE IF NOT EXISTS submissions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id BIGINT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  graded_in TEXT NOT NULL CHECK (graded_in IN ('browser', 'server')),
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed')),
  tests_passed INTEGER,
  tests_total INTEGER,
  code TEXT,
  answer JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS submissions_user_ex ON submissions (user_id, exercise_id, created_at DESC);
CREATE TABLE IF NOT EXISTS exercise_progress (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id BIGINT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  attempts INTEGER NOT NULL DEFAULT 0,
  passed_at TIMESTAMPTZ,
  last_code TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, exercise_id)
);
CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);
CREATE TABLE IF NOT EXISTS enrollments (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);
CREATE TABLE IF NOT EXISTS entitlements (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('purchase', 'admin')),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  first_at TIMESTAMPTZ NOT NULL
);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS perks JSONB NOT NULL DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS certificate BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'file';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'id' CHECK (locale IN ('id', 'en'));
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'file';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'file';
CREATE TABLE IF NOT EXISTS certificates (
  public_id TEXT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  holder_name TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  UNIQUE (user_id, course_id)
);
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_ref TEXT NOT NULL UNIQUE,
  amount_idr INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);
"""


def _configure(conn: psycopg.Connection) -> None:
    if DB_SCHEMA:
        conn.execute(f'SET search_path TO "{DB_SCHEMA}"')
    conn.commit()


pool = ConnectionPool(DATABASE_URL, min_size=1, max_size=8, kwargs={"row_factory": dict_row},
                      configure=_configure, open=False)


def db() -> psycopg.Connection:
    if "db" not in g:
        g.db = pool.getconn()
    return g.db


@app.teardown_appcontext
def release_db(_exc) -> None:
    conn = g.pop("db", None)
    if conn is not None:
        try:
            conn.rollback()
        finally:
            pool.putconn(conn)


def sync_content(conn: psycopg.Connection, courses: list[dict]) -> None:
    """Make the database match the content files. Progress is never deleted.

    Rows that were created or edited in the admin (source = 'admin') are never overwritten.
    """
    kept = 0
    for c in courses:
        conn.execute(
            """INSERT INTO courses (slug, title, language, locale, level, kind, price_idr, status, position, summary, perks, certificate, updated_at)
               VALUES (%(slug)s, %(title)s, %(language)s, %(locale)s, %(level)s, %(kind)s, %(price_idr)s, %(status)s, %(position)s,
                       %(summary)s, %(perks)s, %(certificate)s, now())
               ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, language = EXCLUDED.language, locale = EXCLUDED.locale,
                 level = EXCLUDED.level, kind = EXCLUDED.kind, price_idr = EXCLUDED.price_idr,
                 status = EXCLUDED.status, position = EXCLUDED.position, summary = EXCLUDED.summary,
                 perks = EXCLUDED.perks, certificate = EXCLUDED.certificate, updated_at = now()
               WHERE courses.source = 'file'""", {**c, "perks": Jsonb(c["perks"])})
        cid = conn.execute("SELECT id FROM courses WHERE slug = %s", (c["slug"],)).fetchone()["id"]
        for li, lesson in enumerate(c["lessons"], 1):
            conn.execute(
                """INSERT INTO lessons (course_id, slug, title, position, body_md) VALUES (%s, %s, %s, %s, %s)
                   ON CONFLICT (course_id, slug) DO UPDATE SET title = EXCLUDED.title,
                     position = EXCLUDED.position, body_md = EXCLUDED.body_md
                   WHERE lessons.source = 'file'""", (cid, lesson["slug"], lesson["title"], li, lesson["body"]))
            lid = conn.execute("SELECT id FROM lessons WHERE course_id = %s AND slug = %s", (cid, lesson["slug"])).fetchone()["id"]
            for ei, ex in enumerate(lesson["exercises"], 1):
                conn.execute(
                    """INSERT INTO exercises (lesson_id, slug, position, type, title, prompt_md, required, config)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                       ON CONFLICT (lesson_id, slug) DO UPDATE SET position = EXCLUDED.position,
                         type = EXCLUDED.type, title = EXCLUDED.title, prompt_md = EXCLUDED.prompt_md,
                         required = EXCLUDED.required, config = EXCLUDED.config
                       WHERE exercises.source = 'file'""",
                    (lid, ex["slug"], ei, ex["type"], ex["title"], ex["prompt"], ex["required"], Jsonb(ex["config"])))
                kept += 1
    log.info("content synced: %d courses, %d exercises", len(courses), kept)


def init_db() -> None:
    last_error: Exception | None = None
    for _ in range(30):  # the database container may still be starting
        try:
            with psycopg.connect(DATABASE_URL, row_factory=dict_row) as conn:
                conn.execute("SELECT pg_advisory_xact_lock(727002)")
                if DB_SCHEMA:
                    conn.execute(f'CREATE SCHEMA IF NOT EXISTS "{DB_SCHEMA}"')
                    conn.execute(f'SET LOCAL search_path TO "{DB_SCHEMA}"')
                conn.execute(SCHEMA_SQL)
                try:
                    sync_content(conn, content_loader.load_all(CONTENT_DIR))
                except content_loader.ContentError as exc:
                    log.error("content not loaded: %s", exc)
            break
        except psycopg.OperationalError as exc:
            last_error = exc
            time.sleep(1)
    else:
        raise RuntimeError(f"Could not reach the database: {last_error}")
    pool.open()
    pool.wait(timeout=30)


# --------------------------------------------------------------------------
# Markdown
# --------------------------------------------------------------------------
MD_EXTENSIONS = ["fenced_code", "codehilite", "tables", "sane_lists", "attr_list"]
MD_CONFIG = {"codehilite": {"guess_lang": False, "css_class": "codehilite"}}
ALLOWED_TAGS = set(nh3.ALLOWED_TAGS) | {"div", "span", "pre", "code", "table", "thead", "tbody", "tr", "th", "td", "hr", "br", "kbd", "del", "ins"}
ALLOWED_ATTRS = {"*": {"class"}, "a": {"href", "title"}, "td": {"align"}, "th": {"align"}}


def render_md(text: str) -> str:
    html = md.Markdown(extensions=MD_EXTENSIONS, extension_configs=MD_CONFIG).convert(text or "")
    return nh3.clean(html, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS, url_schemes={"http", "https", "mailto"})


def render_inline(text: str) -> str:
    html = render_md(text).strip()
    m = re.fullmatch(r"<p>(.*)</p>", html, flags=re.S)
    return m.group(1) if m else html


# --------------------------------------------------------------------------
# Security helpers
# --------------------------------------------------------------------------
@app.after_request
def security_headers(resp: Response) -> Response:
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    resp.headers.setdefault("X-Frame-Options", "DENY")
    resp.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    if request.path.startswith("/api/"):
        resp.headers["Cache-Control"] = "no-store"
        lang = i18n.lang_of(request)
        if lang == "en" and resp.status_code >= 400 and resp.is_json:
            data = resp.get_json(silent=True)
            if isinstance(data, dict) and isinstance(data.get("error"), str):
                data["error"] = i18n.translate(data["error"], lang)
                resp.set_data(app.json.dumps(data) + "\n")
    return resp


def csrf_token() -> str:
    if "csrf" not in session:
        session["csrf"] = secrets.token_urlsafe(32)
    return session["csrf"]


def check_csrf() -> None:
    sent = request.headers.get("X-CSRF-Token", "")
    expected = session.get("csrf", "")
    if not expected or not hmac.compare_digest(sent.encode("utf-8"), expected.encode("utf-8")):
        abort(400)


def rate_blocked(key: str, limit: int, window: int) -> bool:
    row = db().execute(
        "SELECT count FROM rate_limits WHERE key = %s AND first_at > now() - make_interval(secs => %s)",
        (key, window)).fetchone()
    return bool(row and row["count"] >= limit)


def rate_hit(key: str, window: int) -> None:
    db().execute(
        """INSERT INTO rate_limits (key, count, first_at) VALUES (%s, 1, now())
           ON CONFLICT (key) DO UPDATE SET
             count = CASE WHEN rate_limits.first_at < now() - make_interval(secs => %s) THEN 1 ELSE rate_limits.count + 1 END,
             first_at = CASE WHEN rate_limits.first_at < now() - make_interval(secs => %s) THEN now() ELSE rate_limits.first_at END""",
        (key, window, window))
    db().commit()


def rate_clear(key: str) -> None:
    db().execute("DELETE FROM rate_limits WHERE key = %s", (key,))
    db().commit()


def client_ip() -> str:
    return request.remote_addr or "?"


def password_stamp(password_hash: str) -> str:
    return hashlib.sha256(password_hash.encode()).hexdigest()[:16]


def sign_in(user: dict) -> None:
    """Starts a session. It carries a stamp of the password, so changing the password ends every older session."""
    session.clear()
    session["uid"] = user["id"]
    session["pv"] = password_stamp(user["password_hash"])
    session.permanent = True
    g.user = user


def current_user() -> dict | None:
    if "user" in g:
        return g.user
    uid = session.get("uid")
    g.user = None
    if uid:
        row = db().execute(
            "SELECT id, email, name, role, email_verified_at, password_hash FROM users WHERE id = %s", (uid,)).fetchone()
        if row and hmac.compare_digest(str(session.get("pv", "")), password_stamp(row["password_hash"])):
            g.user = row
        else:
            session.pop("uid", None)
            session.pop("pv", None)
    return g.user


def user_json(u: dict | None) -> dict | None:
    if not u:
        return None
    return {"id": u["id"], "name": u["name"], "email": u["email"], "role": u["role"],
            "verified": u["email_verified_at"] is not None}


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not current_user():
            return jsonify(error="Masuk dulu untuk melanjutkan."), 401
        if request.method not in ("GET", "HEAD", "OPTIONS"):
            check_csrf()
        return view(*args, **kwargs)
    return wrapped


def json_body() -> dict:
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


# --------------------------------------------------------------------------
# Email (verification and password reset)
# --------------------------------------------------------------------------
def send_mail(to: str, subject: str, body: str) -> bool:
    if not SMTP_HOST:
        log.warning("SMTP is not configured; email to %s not sent:\n%s", to, body)
        return False
    msg = EmailMessage()
    msg["From"] = SMTP_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    try:
        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=ssl.create_default_context(), timeout=15) as s:
                if SMTP_USER:
                    s.login(SMTP_USER, SMTP_PASS)
                s.send_message(msg)
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as s:
                s.starttls(context=ssl.create_default_context())
                if SMTP_USER:
                    s.login(SMTP_USER, SMTP_PASS)
                s.send_message(msg)
        return True
    except Exception:  # noqa: BLE001 - never let a mail problem break sign-up
        log.exception("could not send email to %s", to)
        return False


def send_verification(user: dict, lang: str = "id") -> bool:
    token = secrets.token_urlsafe(32)
    digest = hashlib.sha256(token.encode()).hexdigest()
    db().execute("DELETE FROM email_tokens WHERE user_id = %s AND kind = 'verify'", (user["id"],))
    db().execute(
        "INSERT INTO email_tokens (token_hash, user_id, kind, expires_at) VALUES (%s, %s, 'verify', now() + interval '2 days')",
        (digest, user["id"]))
    db().commit()
    link = f"{SITE_URL}/verify?token={token}"
    if lang == "en":
        return send_mail(user["email"], "Verify your email for tolie.space Lab",
                         f"Hi {user['name']},\n\nOpen this link to verify your email (valid for 2 days):\n{link}\n\n"
                         "If you did not sign up, ignore this email.\n")
    return send_mail(user["email"], "Verifikasi email Lab tolie.space",
                     f"Halo {user['name']},\n\nBuka tautan ini untuk memverifikasi emailmu (berlaku 2 hari):\n{link}\n\n"
                     "Kalau kamu tidak mendaftar, abaikan email ini.\n")


def reset_link(user_id: int) -> str:
    """A fresh one-hour link to choose a new password. Any older link of this account stops working."""
    token = secrets.token_urlsafe(32)
    digest = hashlib.sha256(token.encode()).hexdigest()
    db().execute("DELETE FROM email_tokens WHERE user_id = %s AND kind = 'reset'", (user_id,))
    db().execute(
        "INSERT INTO email_tokens (token_hash, user_id, kind, expires_at) VALUES (%s, %s, 'reset', now() + interval '1 hour')",
        (digest, user_id))
    db().commit()
    return f"{SITE_URL}/reset?token={token}"


def send_reset(user: dict, lang: str = "id") -> bool:
    link = reset_link(user["id"])
    if lang == "en":
        return send_mail(user["email"], "Reset your tolie.space Lab password",
                         f"Hi {user['name']},\n\nOpen this link to choose a new password (valid for 1 hour):\n{link}\n\n"
                         "If you did not ask for this, ignore this email. Your password stays the same.\n")
    return send_mail(user["email"], "Atur ulang password Lab tolie.space",
                     f"Halo {user['name']},\n\nBuka tautan ini untuk membuat password baru (berlaku 1 jam):\n{link}\n\n"
                     "Kalau kamu tidak memintanya, abaikan email ini. Passwordmu tidak berubah.\n")


# --------------------------------------------------------------------------
# Accounts
# --------------------------------------------------------------------------
@app.get("/api/session")
def api_session():
    return jsonify(user=user_json(current_user()), csrf=csrf_token(), verification=EMAIL_VERIFICATION,
                   payments=bool(STRIPE_SECRET_KEY))


@app.post("/api/register")
def api_register():
    check_csrf()
    ip = client_ip()
    if rate_blocked(f"reg:{ip}", 8, 3600):
        return jsonify(error="Terlalu banyak pendaftaran dari jaringan ini. Coba lagi satu jam lagi."), 429
    data = json_body()
    name = re.sub(r"\s+", " ", str(data.get("name", ""))).strip()
    email = str(data.get("email", "")).strip()
    password = str(data.get("password", ""))
    if not 1 <= len(name) <= 60:
        return jsonify(error="Isi namamu (maksimal 60 karakter)."), 400
    if not EMAIL_RE.match(email) or len(email) > 254:
        return jsonify(error="Alamat email tidak valid."), 400
    if len(password) < 10:
        return jsonify(error="Password minimal 10 karakter."), 400
    if len(password) > 200:
        return jsonify(error="Password terlalu panjang."), 400
    rate_hit(f"reg:{ip}", 3600)
    exists = db().execute("SELECT 1 FROM users WHERE lower(email) = lower(%s)", (email,)).fetchone()
    if exists:
        return jsonify(error="Email itu sudah terdaftar. Coba masuk."), 409
    verified_sql = "NULL" if EMAIL_VERIFICATION else "now()"
    user = db().execute(
        f"INSERT INTO users (email, name, password_hash, email_verified_at) VALUES (%s, %s, %s, {verified_sql}) "
        "RETURNING id, email, name, role, email_verified_at, password_hash",
        (email, name, generate_password_hash(password))).fetchone()
    db().commit()
    sign_in(user)
    if EMAIL_VERIFICATION:
        send_verification(user, i18n.lang_of(request))
    return jsonify(user=user_json(user), csrf=csrf_token()), 201


@app.post("/api/login")
def api_login():
    check_csrf()
    ip = client_ip()
    if rate_blocked(f"login:{ip}", 8, 900):
        return jsonify(error="Terlalu banyak percobaan. Tunggu 15 menit lalu coba lagi."), 429
    data = json_body()
    email = str(data.get("email", "")).strip()
    password = str(data.get("password", ""))
    row = db().execute(
        "SELECT id, email, name, role, email_verified_at, password_hash FROM users WHERE lower(email) = lower(%s)",
        (email,)).fetchone()
    ok = check_password_hash(row["password_hash"] if row else DUMMY_HASH, password)
    if row and ok:
        sign_in(row)
        rate_clear(f"login:{ip}")
        return jsonify(user=user_json(row), csrf=csrf_token())
    rate_hit(f"login:{ip}", 900)
    return jsonify(error="Email atau password tidak cocok."), 401


@app.post("/api/logout")
def api_logout():
    check_csrf()
    session.clear()
    return jsonify(user=None, csrf=csrf_token())


@app.post("/api/password/forgot")
def api_password_forgot():
    """Always answers the same way, so it does not reveal which emails have an account."""
    check_csrf()
    ip = client_ip()
    if rate_blocked(f"forgot:{ip}", 5, 3600):
        return jsonify(error="Terlalu banyak permintaan atur ulang password. Coba lagi satu jam lagi."), 429
    email = str(json_body().get("email", "")).strip()
    if not EMAIL_RE.match(email) or len(email) > 254:
        return jsonify(error="Alamat email tidak valid."), 400
    rate_hit(f"forgot:{ip}", 3600)
    user = db().execute("SELECT id, email, name FROM users WHERE lower(email) = lower(%s)", (email,)).fetchone()
    if user and not rate_blocked(f"forgot-user:{user['id']}", 3, 3600):
        rate_hit(f"forgot-user:{user['id']}", 3600)
        send_reset(user, i18n.lang_of(request))
    return jsonify(ok=True)


@app.post("/api/password/reset")
def api_password_reset():
    check_csrf()
    ip = client_ip()
    if rate_blocked(f"reset:{ip}", 10, 3600):
        return jsonify(error="Terlalu banyak percobaan. Coba lagi satu jam lagi."), 429
    data = json_body()
    password = str(data.get("password", ""))
    if len(password) < 10:
        return jsonify(error="Password minimal 10 karakter."), 400
    if len(password) > 200:
        return jsonify(error="Password terlalu panjang."), 400
    digest = hashlib.sha256(str(data.get("token", "")).encode()).hexdigest()
    row = db().execute(
        "SELECT user_id FROM email_tokens WHERE token_hash = %s AND kind = 'reset' AND expires_at > now()",
        (digest,)).fetchone()
    if not row:
        rate_hit(f"reset:{ip}", 3600)
        return jsonify(error="Tautan atur ulang password tidak berlaku lagi. Minta tautan baru."), 400
    # The link arrived by email, so opening it also proves the address is theirs.
    user = db().execute(
        "UPDATE users SET password_hash = %s, email_verified_at = COALESCE(email_verified_at, now()) WHERE id = %s "
        "RETURNING id, email, name, role, email_verified_at, password_hash",
        (generate_password_hash(password), row["user_id"])).fetchone()
    db().execute("DELETE FROM email_tokens WHERE user_id = %s AND kind = 'reset'", (row["user_id"],))
    db().commit()
    sign_in(user)  # the new password stamp signs out every other session of this account
    return jsonify(user=user_json(user), csrf=csrf_token())


@app.get("/api/verify")
def api_verify():
    token = request.args.get("token", "")
    digest = hashlib.sha256(token.encode()).hexdigest()
    row = db().execute(
        "SELECT user_id FROM email_tokens WHERE token_hash = %s AND kind = 'verify' AND expires_at > now()",
        (digest,)).fetchone()
    if not row:
        return jsonify(error="Tautan verifikasi tidak berlaku lagi. Minta tautan baru dari halaman Belajar Saya."), 400
    db().execute("UPDATE users SET email_verified_at = COALESCE(email_verified_at, now()) WHERE id = %s", (row["user_id"],))
    db().execute("DELETE FROM email_tokens WHERE token_hash = %s", (digest,))
    db().commit()
    return jsonify(ok=True)


@app.post("/api/verify/resend")
@login_required
def api_verify_resend():
    user = current_user()
    if user["email_verified_at"] is not None:
        return jsonify(ok=True, already=True)
    if rate_blocked(f"resend:{user['id']}", 3, 3600):
        return jsonify(error="Sudah tiga kali dikirim. Coba lagi satu jam lagi."), 429
    rate_hit(f"resend:{user['id']}", 3600)
    return jsonify(ok=True, sent=send_verification(user, i18n.lang_of(request)))


# --------------------------------------------------------------------------
# Courses and progress
# --------------------------------------------------------------------------
def has_access(user: dict | None, course: dict) -> bool:
    if course["price_idr"] == 0:
        return True
    if not user:
        return False
    if user["role"] == "admin":
        return True
    return bool(db().execute(
        "SELECT 1 FROM entitlements WHERE user_id = %s AND course_id = %s", (user["id"], course["id"])).fetchone())


def published_course(slug: str) -> dict:
    row = db().execute("SELECT * FROM courses WHERE slug = %s AND status = 'published'", (slug,)).fetchone()
    if not row:
        abort(404)
    return row


def lesson_states(user_id: int | None, course_id: int) -> list[dict]:
    """Every lesson of a course with its exercise counts and whether the learner finished it."""
    lessons = db().execute(
        "SELECT id, slug, title, position FROM lessons WHERE course_id = %s ORDER BY position", (course_id,)).fetchall()
    ids = [x["id"] for x in lessons]
    counts = {}
    done_lessons: set[int] = set()
    if ids:
        for r in db().execute(
                """SELECT e.lesson_id, count(*) AS total, count(*) FILTER (WHERE e.required) AS required,
                          count(*) FILTER (WHERE e.required AND p.passed_at IS NOT NULL) AS required_passed
                   FROM exercises e LEFT JOIN exercise_progress p ON p.exercise_id = e.id AND p.user_id = %s
                   WHERE e.lesson_id = ANY(%s) GROUP BY e.lesson_id""", (user_id, ids)).fetchall():
            counts[r["lesson_id"]] = r
        if user_id:
            done_lessons = {r["lesson_id"] for r in db().execute(
                "SELECT lesson_id FROM lesson_progress WHERE user_id = %s AND lesson_id = ANY(%s)", (user_id, ids))}
    out = []
    for x in lessons:
        c = counts.get(x["id"], {"total": 0, "required": 0, "required_passed": 0})
        if c["required"] > 0:
            done = c["required_passed"] == c["required"]
        else:
            done = x["id"] in done_lessons
        out.append({"id": x["id"], "slug": x["slug"], "title": x["title"], "position": x["position"],
                    "exercise_count": c["total"], "done": bool(user_id) and done})
    return out


def progress_summary(lessons: list[dict]) -> dict:
    total = len(lessons)
    done = sum(1 for x in lessons if x["done"])
    nxt = next((x["slug"] for x in lessons if not x["done"]), None)
    return {"done": done, "total": total, "percent": round(100 * done / total) if total else 0, "next": nxt}


def course_json(c: dict) -> dict:
    return {"slug": c["slug"], "title": c["title"], "language": c["language"], "locale": c["locale"], "level": c["level"],
            "kind": c["kind"], "price_idr": c["price_idr"], "summary": c["summary"]}


@app.get("/api/courses")
def api_courses():
    user = current_user()
    lang = request.args.get("lang", "all")
    if lang in i18n.LANGS:
        rows = db().execute("SELECT * FROM courses WHERE status = 'published' AND locale = %s ORDER BY position, id", (lang,)).fetchall()
    else:
        rows = db().execute("SELECT * FROM courses WHERE status = 'published' ORDER BY position, id").fetchall()
    out = []
    for c in rows:
        item = course_json(c)
        lessons = lesson_states(user["id"] if user else None, c["id"])
        item["lesson_count"] = len(lessons)
        item["exercise_count"] = sum(x["exercise_count"] for x in lessons)
        item["progress"] = progress_summary(lessons) if user else None
        item["access"] = has_access(user, c)
        out.append(item)
    return jsonify(courses=out)


@app.get("/api/courses/<slug>")
def api_course(slug: str):
    user = current_user()
    c = published_course(slug)
    access = has_access(user, c)
    lessons = lesson_states(user["id"] if user else None, c["id"])
    summary = progress_summary(lessons) if user else None
    return jsonify(
        course={**course_json(c), "perks": c["perks"], "certificate": c["certificate"]}, access=access, progress=summary,
        lessons=[{"slug": x["slug"], "title": x["title"], "position": x["position"],
                  "exercise_count": x["exercise_count"], "done": x["done"], "locked": not access} for x in lessons])


def exercise_json(row: dict, prog: dict | None) -> dict:
    cfg = row["config"]
    out = {"id": row["id"], "slug": row["slug"], "type": row["type"], "title": row["title"],
           "prompt_html": render_md(row["prompt_md"]), "required": row["required"],
           "passed": bool(prog and prog["passed_at"]), "attempts": prog["attempts"] if prog else 0}
    if row["type"] == "code":
        hints = cfg.get("hints") or ([cfg["hint"]] if cfg.get("hint") else [])
        out["code"] = {"language": cfg["language"], "starter": cfg["starter"], "hints": hints,
                       "tests": cfg["tests"], "saved": (prog or {}).get("last_code")}
        if cfg["language"] == "sql":
            out["code"]["setup"] = cfg.get("setup", "")
    else:
        out["choice"] = {"options_html": [render_inline(o) for o in cfg["options"]], "multiple": cfg["multiple"]}
    return out


@app.get("/api/courses/<slug>/lessons/<lesson_slug>")
def api_lesson(slug: str, lesson_slug: str):
    user = current_user()
    c = published_course(slug)
    if not has_access(user, c):
        return jsonify(error="Modul ini berbayar. Buka aksesnya untuk melihat pelajaran.", locked=True,
                       price_idr=c["price_idr"]), 403
    lesson = db().execute("SELECT * FROM lessons WHERE course_id = %s AND slug = %s", (c["id"], lesson_slug)).fetchone()
    if not lesson:
        abort(404)
    states = lesson_states(user["id"] if user else None, c["id"])
    index = next(i for i, x in enumerate(states) if x["id"] == lesson["id"])
    exercises = db().execute("SELECT * FROM exercises WHERE lesson_id = %s ORDER BY position", (lesson["id"],)).fetchall()
    progress = {}
    if user:
        progress = {r["exercise_id"]: r for r in db().execute(
            "SELECT * FROM exercise_progress WHERE user_id = %s AND exercise_id = ANY(%s)",
            (user["id"], [e["id"] for e in exercises] or [0]))}
        db().execute("INSERT INTO enrollments (user_id, course_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (user["id"], c["id"]))
        db().commit()
    prev_l = states[index - 1] if index > 0 else None
    next_l = states[index + 1] if index + 1 < len(states) else None
    return jsonify(
        course={"slug": c["slug"], "title": c["title"], "language": c["language"]},
        lesson={"id": lesson["id"], "slug": lesson["slug"], "title": lesson["title"], "position": lesson["position"],
                "total": len(states), "html": render_md(lesson["body_md"]), "done": states[index]["done"]},
        exercises=[exercise_json(e, progress.get(e["id"])) for e in exercises],
        prev={"slug": prev_l["slug"], "title": prev_l["title"]} if prev_l else None,
        next={"slug": next_l["slug"], "title": next_l["title"]} if next_l else None,
        trail=[{"slug": x["slug"], "title": x["title"], "done": x["done"]} for x in states],
        signed_in=bool(user))


def load_exercise(exercise_id: int) -> tuple[dict, dict]:
    row = db().execute(
        """SELECT e.*, l.course_id, l.id AS lesson_id_ FROM exercises e JOIN lessons l ON l.id = e.lesson_id
           JOIN courses c ON c.id = l.course_id WHERE e.id = %s AND c.status = 'published'""", (exercise_id,)).fetchone()
    if not row:
        abort(404)
    course = db().execute("SELECT * FROM courses WHERE id = %s", (row["course_id"],)).fetchone()
    if not has_access(current_user(), course):
        abort(403)
    return row, course


def after_pass(user_id: int, exercise: dict) -> dict:
    """Called when an exercise is passed for the first time or again; returns lesson/course status."""
    states = lesson_states(user_id, exercise["course_id"])
    this = next(x for x in states if x["id"] == exercise["lesson_id"])
    summary = progress_summary(states)
    return {"lesson_done": this["done"], "course_done": summary["done"] == summary["total"], "progress": summary}


def record(user_id: int, exercise: dict, *, passed: bool, graded_in: str, tests_passed=None, tests_total=None,
           code=None, answer=None) -> None:
    db().execute(
        "INSERT INTO submissions (user_id, exercise_id, graded_in, status, tests_passed, tests_total, code, answer) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
        (user_id, exercise["id"], graded_in, "passed" if passed else "failed", tests_passed, tests_total, code,
         Jsonb(answer) if answer is not None else None))
    db().execute(
        """INSERT INTO exercise_progress (user_id, exercise_id, attempts, passed_at, last_code, updated_at)
           VALUES (%s, %s, 1, CASE WHEN %s THEN now() END, %s, now())
           ON CONFLICT (user_id, exercise_id) DO UPDATE SET
             attempts = exercise_progress.attempts + 1,
             passed_at = COALESCE(exercise_progress.passed_at, CASE WHEN %s THEN now() END),
             last_code = COALESCE(%s, exercise_progress.last_code),
             updated_at = now()""",
        (user_id, exercise["id"], passed, code, passed, code))
    db().execute("INSERT INTO enrollments (user_id, course_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                 (user_id, exercise["course_id"]))
    db().commit()


@app.post("/api/exercises/<int:exercise_id>/answer")
@login_required
def api_answer(exercise_id: int):
    user = current_user()
    ex, _course = load_exercise(exercise_id)
    if ex["type"] != "choice":
        return jsonify(error="Latihan ini bukan pilihan ganda."), 400
    if rate_blocked(f"run:{user['id']}", 120, 60):
        return jsonify(error="Pelan-pelan sebentar, terlalu banyak percobaan dalam semenit."), 429
    rate_hit(f"run:{user['id']}", 60)
    cfg = ex["config"]
    chosen = json_body().get("choice")
    if (not isinstance(chosen, list) or not chosen or len(chosen) > len(cfg["options"])
            or not all(isinstance(i, int) and not isinstance(i, bool) and 0 <= i < len(cfg["options"]) for i in chosen)):
        return jsonify(error="Pilih jawabanmu dulu."), 400
    correct = sorted(set(chosen)) == cfg["correct"]
    already = db().execute("SELECT attempts FROM exercise_progress WHERE user_id = %s AND exercise_id = %s",
                           (user["id"], exercise_id)).fetchone()
    attempts = (already["attempts"] if already else 0) + 1
    record(user["id"], ex, passed=correct, graded_in="server", answer=sorted(set(chosen)))
    reveal = correct or attempts >= 3
    out = {"correct": correct, "attempts": attempts}
    if reveal:
        out["explanation_html"] = render_md(cfg["explanation"])
        out["correct_options"] = cfg["correct"]
    elif cfg.get("hint"):
        out["hint"] = cfg["hint"]
    if correct:
        out.update(after_pass(user["id"], ex))
    return jsonify(out)


@app.post("/api/exercises/<int:exercise_id>/result")
@login_required
def api_result(exercise_id: int):
    user = current_user()
    ex, _course = load_exercise(exercise_id)
    if ex["type"] != "code":
        return jsonify(error="Latihan ini bukan latihan kode."), 400
    if rate_blocked(f"run:{user['id']}", 120, 60):
        return jsonify(error="Pelan-pelan sebentar, terlalu banyak percobaan dalam semenit."), 429
    rate_hit(f"run:{user['id']}", 60)
    data = json_body()
    code = data.get("code")
    total = len(ex["config"]["tests"])
    passed_count = data.get("passed")
    if (not isinstance(code, str) or len(code) > MAX_CODE or isinstance(passed_count, bool)
            or not isinstance(passed_count, int) or not 0 <= passed_count <= total or data.get("total") != total):
        return jsonify(error="Hasil tes tidak valid."), 400
    ok = passed_count == total
    record(user["id"], ex, passed=ok, graded_in="browser", tests_passed=passed_count, tests_total=total, code=code)
    out = {"recorded": True, "passed": ok}
    if ok:
        out.update(after_pass(user["id"], ex))
    return jsonify(out)


@app.post("/api/exercises/<int:exercise_id>/draft")
@login_required
def api_draft(exercise_id: int):
    user = current_user()
    ex, _course = load_exercise(exercise_id)
    code = json_body().get("code")
    if ex["type"] != "code" or not isinstance(code, str) or len(code) > MAX_CODE:
        return jsonify(error="Kode tidak valid."), 400
    if rate_blocked(f"draft:{user['id']}", 240, 60):
        return jsonify(ok=False), 429
    rate_hit(f"draft:{user['id']}", 60)
    db().execute(
        """INSERT INTO exercise_progress (user_id, exercise_id, attempts, last_code) VALUES (%s, %s, 0, %s)
           ON CONFLICT (user_id, exercise_id) DO UPDATE SET last_code = EXCLUDED.last_code, updated_at = now()""",
        (user["id"], exercise_id, code))
    db().commit()
    return jsonify(ok=True)


@app.post("/api/lessons/<int:lesson_id>/complete")
@login_required
def api_lesson_complete(lesson_id: int):
    user = current_user()
    lesson = db().execute(
        "SELECT l.id, l.course_id, c.price_idr FROM lessons l JOIN courses c ON c.id = l.course_id "
        "WHERE l.id = %s AND c.status = 'published'", (lesson_id,)).fetchone()
    if not lesson:
        abort(404)
    course = db().execute("SELECT * FROM courses WHERE id = %s", (lesson["course_id"],)).fetchone()
    if not has_access(user, course):
        abort(403)
    required = db().execute("SELECT count(*) AS n FROM exercises WHERE lesson_id = %s AND required", (lesson_id,)).fetchone()["n"]
    if required:
        return jsonify(error="Pelajaran ini selesai setelah semua latihan wajibnya lulus."), 400
    db().execute("INSERT INTO lesson_progress (user_id, lesson_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (user["id"], lesson_id))
    db().execute("INSERT INTO enrollments (user_id, course_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (user["id"], lesson["course_id"]))
    db().commit()
    states = lesson_states(user["id"], lesson["course_id"])
    summary = progress_summary(states)
    return jsonify(lesson_done=True, course_done=summary["done"] == summary["total"], progress=summary)


def learning_streak(user_id: int) -> dict:
    """Days in a row with at least one attempt or finished lesson. Today not done yet does not break it."""
    today = db().execute("SELECT (now() AT TIME ZONE %s)::date AS d", (TIMEZONE,)).fetchone()["d"]
    days = {r["d"] for r in db().execute(
        """SELECT (created_at AT TIME ZONE %s)::date AS d FROM submissions WHERE user_id = %s
           UNION SELECT (completed_at AT TIME ZONE %s)::date FROM lesson_progress WHERE user_id = %s""",
        (TIMEZONE, user_id, TIMEZONE, user_id))}
    one = timedelta(days=1)
    current = 0
    day = today if today in days else today - one
    while day in days:
        current += 1
        day -= one
    best = run = 0
    prev = None
    for d in sorted(days):
        run = run + 1 if prev is not None and d - prev == one else 1
        best = max(best, run)
        prev = d
    week = [{"date": (today - one * i).isoformat(), "active": (today - one * i) in days} for i in range(6, -1, -1)]
    return {"current": current, "best": best, "today": today in days, "week": week}


@app.get("/api/me/courses")
@login_required
def api_my_courses():
    user = current_user()
    rows = db().execute(
        """SELECT c.* FROM courses c JOIN enrollments e ON e.course_id = c.id
           WHERE e.user_id = %s AND c.status = 'published' ORDER BY e.started_at DESC""", (user["id"],)).fetchall()
    out = []
    for c in rows:
        item = course_json(c)
        item["progress"] = progress_summary(lesson_states(user["id"], c["id"]))
        out.append(item)
    return jsonify(courses=out, user=user_json(user), streak=learning_streak(user["id"]))


@app.get("/api/plans")
def api_plans():
    try:
        return jsonify(plans=content_loader.load_plans(CONTENT_DIR, i18n.lang_of(request)))
    except content_loader.ContentError as exc:
        log.error("plans not loaded: %s", exc)
        return jsonify(plans=[])


@app.get("/healthz")
def healthz():
    try:
        db().execute("SELECT 1").fetchone()
    except Exception:  # noqa: BLE001
        return Response("database unavailable", status=503, mimetype="text/plain")
    return Response("ok", mimetype="text/plain")


@app.errorhandler(400)
def bad_request(_exc):
    return jsonify(error="Permintaan tidak valid. Muat ulang halaman lalu coba lagi."), 400


@app.errorhandler(403)
def forbidden(_exc):
    return jsonify(error="Kamu tidak punya akses ke ini."), 403


@app.errorhandler(404)
def not_found(_exc):
    return jsonify(error="Tidak ditemukan."), 404


@app.errorhandler(429)
def too_many(_exc):
    return jsonify(error="Terlalu banyak permintaan. Coba lagi sebentar lagi."), 429


@app.errorhandler(500)
def server_error(exc):
    log.exception("unhandled error: %s", exc)
    return jsonify(error="Terjadi kesalahan di server. Coba lagi sebentar lagi."), 500


@app.errorhandler(413)
def too_large(_exc):
    return jsonify(error="Data terlalu besar."), 413


import types  # noqa: E402

_helpers = types.SimpleNamespace(
    db=db, current_user=current_user, login_required=login_required, check_csrf=check_csrf, json_body=json_body,
    rate_blocked=rate_blocked, rate_hit=rate_hit, client_ip=client_ip, lesson_states=lesson_states,
    progress_summary=progress_summary, published_course=published_course, has_access=has_access,
    render_md=render_md, user_json=user_json, site_url=lambda: SITE_URL,
    email_verification=lambda: EMAIL_VERIFICATION, base_dir=BASE_DIR,
    stripe_secret_key=lambda: STRIPE_SECRET_KEY, stripe_webhook_secret=lambda: STRIPE_WEBHOOK_SECRET,
    timezone=lambda: TIMEZONE,
)
import certificates  # noqa: E402
import admin  # noqa: E402
import payments  # noqa: E402

certificates.register(app, _helpers)
admin.register(app, _helpers)
payments.register(app, _helpers)

init_db()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=False)
