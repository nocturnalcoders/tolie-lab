"""API tests. They need a PostgreSQL server: set DATABASE_URL (a throwaway schema is created)."""
import json
import os
import re
import secrets
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
os.environ.setdefault("LAB_SECRET_KEY", "k" * 64)
os.environ["LAB_COOKIE_SECURE"] = "0"
os.environ["LAB_DB_SCHEMA"] = "t" + secrets.token_hex(4)
os.environ.setdefault("LAB_CONTENT_DIR", str(HERE.parent.parent / "content"))

import app as lab  # noqa: E402
import content_loader as cl  # noqa: E402
import psycopg  # noqa: E402

failed = 0


def check(name, cond, detail=""):
    global failed
    print(("PASS " if cond else "FAIL ") + name + ("" if cond else f"  {detail}"))
    if not cond:
        failed += 1


class Client:
    def __init__(self, ip="10.0.0.1", lang=None):
        self.c = lab.app.test_client()
        self.ip = ip
        self.lang = lang
        self.csrf = self.get("/api/session").json["csrf"]

    def _headers(self):
        h = {"X-Forwarded-For": self.ip}
        if self.lang:
            h["X-Lang"] = self.lang
        return h

    def get(self, path):
        return self.c.get(path, headers=self._headers())

    def _write(self, method, path, body=None, csrf=True):
        h = self._headers()
        if csrf:
            h["X-CSRF-Token"] = self.csrf
        return getattr(self.c, method)(path, json=body if body is not None else {}, headers=h)

    def put(self, path, body=None, csrf=True):
        return self._write("put", path, body, csrf)

    def delete(self, path, csrf=True):
        return self._write("delete", path, None, csrf)

    def post(self, path, body=None, csrf=True):
        h = self._headers()
        if csrf:
            h["X-CSRF-Token"] = self.csrf
        r = self.c.post(path, json=body if body is not None else {}, headers=h)
        if r.is_json and r.json and r.json.get("csrf"):
            self.csrf = r.json["csrf"]
        return r


def sql(query, args=()):
    with psycopg.connect(lab.DATABASE_URL, row_factory=psycopg.rows.dict_row) as conn:
        conn.execute(f'SET search_path TO "{lab.DB_SCHEMA}"')
        cur = conn.execute(query, args)
        return cur.fetchall() if cur.description else None


def new_user(ip, name="Budi", email=None, password="correct horse battery"):
    c = Client(ip)
    email = email or f"{secrets.token_hex(4)}@example.test"
    r = c.post("/api/register", {"name": name, "email": email, "password": password})
    assert r.status_code == 201, r.json
    return c, email


# ---------------------------------------------------------------- basics
anon = Client("10.1.0.1")
check("healthz is ok", anon.get("/healthz").status_code == 200)
s = anon.get("/api/session").json
check("session starts signed out with a csrf token", s["user"] is None and len(s["csrf"]) > 20)
check("api answers are not cached", anon.get("/api/courses").headers.get("Cache-Control") == "no-store")

# ---------------------------------------------------------------- accounts
check("register needs the csrf header", anon.post("/api/register", {"name": "A", "email": "a@b.co", "password": "x" * 12}, csrf=False).status_code == 400)
for label, body in [("short password", {"name": "A", "email": "a@b.co", "password": "short"}),
                    ("bad email", {"name": "A", "email": "nope", "password": "x" * 12}),
                    ("empty name", {"name": "  ", "email": "a@b.co", "password": "x" * 12})]:
    check(f"register rejects {label}", anon.post("/api/register", body).status_code == 400)
budi, budi_email = new_user("10.1.0.2")
check("register signs the learner in", budi.get("/api/session").json["user"]["name"] == "Budi")
check("learner is verified when verification is off", budi.get("/api/session").json["user"]["verified"] is True)
dup = Client("10.1.0.3").post("/api/register", {"name": "X", "email": budi_email.upper(), "password": "x" * 12})
check("duplicate email (any case) is refused", dup.status_code == 409)
row = sql("SELECT password_hash FROM users WHERE lower(email) = lower(%s)", (budi_email,))[0]
check("password is stored hashed", "correct horse" not in row["password_hash"] and row["password_hash"].count("$") >= 2)

c2 = Client("10.1.0.4")
check("login with a wrong password fails", c2.post("/api/login", {"email": budi_email, "password": "wrong password!"}).status_code == 401)
check("login with an unknown email fails the same way", c2.post("/api/login", {"email": "ghost@example.test", "password": "x" * 12}).status_code == 401)
ok = c2.post("/api/login", {"email": budi_email, "password": "correct horse battery"})
check("login works", ok.status_code == 200 and ok.json["user"]["email"] == budi_email)
c2.post("/api/logout")
check("logout signs out", c2.get("/api/session").json["user"] is None)
spam = Client("10.1.0.99")
codes = [spam.post("/api/login", {"email": "x@y.co", "password": "nope nope nope"}).status_code for _ in range(9)]
check("login is rate limited per address after repeated failures", codes[:8] == [401] * 8 and codes[8] == 429, codes)
check("another address is not affected", Client("10.1.0.98").post("/api/login", {"email": "x@y.co", "password": "nope nope nope"}).status_code == 401)

# ---------------------------------------------------------------- catalog
courses = anon.get("/api/courses").json["courses"]
py = next(c for c in courses if c["slug"] == "python-basics")
check("catalog lists the Python course", py["lesson_count"] == 8 and py["exercise_count"] == 25, py)
check("catalog has no progress when signed out", py["progress"] is None)
check("catalog shows progress when signed in", budi.get("/api/courses").json["courses"][0]["progress"] == {"done": 0, "total": 8, "percent": 0, "next": "hello-coffee-shop"})
detail = anon.get("/api/courses/python-basics").json
check("course page lists the lessons in order", [x["slug"] for x in detail["lessons"]][:2] == ["hello-coffee-shop", "prices-and-numbers"] and not detail["lessons"][0]["locked"])
check("unknown course is a 404", anon.get("/api/courses/nope").status_code == 404)

# ---------------------------------------------------------------- lesson content
r = budi.get("/api/courses/python-basics/lessons/hello-coffee-shop")
lesson = r.json
text = json.dumps(lesson)
check("lesson page is served as html", r.status_code == 200 and "<h2>" in lesson["lesson"]["html"] and "codehilite" in lesson["lesson"]["html"])
ex = {e["slug"]: e for e in lesson["exercises"]}
check("lesson has 2 code and 1 choice exercise", [e["type"] for e in lesson["exercises"]] == ["code", "code", "choice"])
check("code exercise carries starter and tests", "tulis kodemu" in ex["greet-the-customer"]["code"]["starter"] and ex["greet-the-customer"]["code"]["tests"][0]["output"].startswith("Selamat datang"))
check("author solutions are not exposed", 'print("Selamat datang' not in text and "solution" not in text)
quiz = ex["quiz-print"]
check("quiz does not leak the answer", "correct" not in json.dumps(quiz["choice"]) and "explanation" not in json.dumps(quiz) and "hint" not in json.dumps(quiz["choice"]))
check("quiz options are rendered with inline code", "<code>Halo</code>" in quiz["choice"]["options_html"][1] and not quiz["choice"]["options_html"][1].startswith("<p>"))
check("lesson page names previous and next", lesson["prev"] is None and lesson["next"]["slug"] == "prices-and-numbers" and len(lesson["trail"]) == 8)

# ---------------------------------------------------------------- multiple choice grading
qid = quiz["id"]
check("answering needs a sign-in", anon.post(f"/api/exercises/{qid}/answer", {"choice": [1]}).status_code in (400, 401))
check("answering needs the csrf header", budi.post(f"/api/exercises/{qid}/answer", {"choice": [1]}, csrf=False).status_code == 400)
check("empty answer is refused", budi.post(f"/api/exercises/{qid}/answer", {"choice": []}).status_code == 400)
check("out-of-range answer is refused", budi.post(f"/api/exercises/{qid}/answer", {"choice": [9]}).status_code == 400)
wrong = budi.post(f"/api/exercises/{qid}/answer", {"choice": [0]}).json
check("a wrong answer gives a hint and hides the answer", wrong["correct"] is False and wrong.get("hint") and "correct_options" not in wrong and "explanation_html" not in wrong, wrong)
wrong2 = budi.post(f"/api/exercises/{qid}/answer", {"choice": [2]}).json
wrong3 = budi.post(f"/api/exercises/{qid}/answer", {"choice": [3]}).json
check("after three wrong tries the answer is revealed", wrong3["correct"] is False and wrong3["correct_options"] == [1] and "explanation_html" in wrong3, wrong3)
right = budi.post(f"/api/exercises/{qid}/answer", {"choice": [1]}).json
check("the right answer is accepted with its explanation", right["correct"] is True and "dua baris" in right["explanation_html"] and right["correct_options"] == [1], right)
check("attempts are counted", right["attempts"] == 4)
# multiple-select: exact set required
types_lesson = budi.get("/api/courses/python-basics/lessons/prices-and-numbers").json
multi = next(e for e in types_lesson["exercises"] if e["slug"] == "quiz-types")
check("multi-select quiz is flagged", multi["choice"]["multiple"] is True)
check("one of two correct options is not enough", budi.post(f"/api/exercises/{multi['id']}/answer", {"choice": [0]}).json["correct"] is False)
check("all the correct options pass", budi.post(f"/api/exercises/{multi['id']}/answer", {"choice": [2, 0]}).json["correct"] is True)

# ---------------------------------------------------------------- code results
sid = ex["greet-the-customer"]["id"]
did = ex["two-line-menu"]["id"]
check("a result with the wrong test count is refused", budi.post(f"/api/exercises/{sid}/result", {"code": "x", "passed": 1, "total": 5}).status_code == 400)
check("a result passing more tests than exist is refused", budi.post(f"/api/exercises/{sid}/result", {"code": "x", "passed": 2, "total": 1}).status_code == 400)
check("a result without code is refused", budi.post(f"/api/exercises/{sid}/result", {"passed": 1, "total": 1}).status_code == 400)
check("an oversized code is refused", budi.post(f"/api/exercises/{sid}/result", {"code": "x" * 20001, "passed": 1, "total": 1}).status_code == 400)
check("a result is refused for a quiz", budi.post(f"/api/exercises/{qid}/result", {"code": "x", "passed": 1, "total": 1}).status_code == 400)
fail_res = budi.post(f"/api/exercises/{sid}/result", {"code": "print()", "passed": 0, "total": 1}).json
check("a failing result is recorded but not passed", fail_res["recorded"] and fail_res["passed"] is False)
check("lesson is not done yet", budi.get("/api/courses/python-basics/lessons/hello-coffee-shop").json["lesson"]["done"] is False)
ok1 = budi.post(f"/api/exercises/{sid}/result", {"code": 'print("Selamat datang di Warung Kopi Senja!")', "passed": 1, "total": 1}).json
check("a passing result is accepted", ok1["passed"] is True and ok1["lesson_done"] is False)
ok2 = budi.post(f"/api/exercises/{did}/result", {"code": "print('a')", "passed": 1, "total": 1}).json
check("lesson is done once every required exercise passed", ok2["lesson_done"] is True and ok2["progress"]["done"] == 1 and ok2["progress"]["next"] == "prices-and-numbers", ok2)
again = budi.get("/api/courses/python-basics/lessons/hello-coffee-shop").json
check("saved code and passed flags come back", again["lesson"]["done"] and all(e["passed"] for e in again["exercises"]) and again["exercises"][0]["code"]["saved"].startswith("print("))
check("submissions are stored", sql("SELECT count(*) AS n FROM submissions")[0]["n"] >= 8)

# drafts
check("a draft can be saved", budi.post(f"/api/exercises/{ex['greet-the-customer']['id']}/draft", {"code": "print('draft')"}).json["ok"])
check("the draft comes back", budi.get("/api/courses/python-basics/lessons/hello-coffee-shop").json["exercises"][0]["code"]["saved"] == "print('draft')")
check("a draft does not count as an attempt", sql("SELECT attempts FROM exercise_progress WHERE exercise_id = %s", (sid,))[0]["attempts"] == 2)

# ---------------------------------------------------------------- my courses
mine = budi.get("/api/me/courses").json
check("my courses lists the started course with progress", mine["courses"][0]["slug"] == "python-basics" and mine["courses"][0]["progress"]["done"] == 1)
check("my courses needs a sign-in", anon.get("/api/me/courses").status_code == 401)
fresh, _ = new_user("10.1.0.5")
check("a new learner has no courses yet", fresh.get("/api/me/courses").json["courses"] == [])

# ---------------------------------------------------------------- paid modules
sql("""INSERT INTO courses (slug, title, language, level, kind, price_idr, status, position, summary)
       VALUES ('modul-berbayar', 'Modul berbayar', 'python', 'Menengah', 'module', 100000, 'published', 50, 'Contoh')""")
cid = sql("SELECT id FROM courses WHERE slug = 'modul-berbayar'")[0]["id"]
sql("INSERT INTO lessons (course_id, slug, title, position, body_md) VALUES (%s, 'baca-dulu', 'Baca dulu', 1, 'Isi **rahasia**')", (cid,))
lid = sql("SELECT id FROM lessons WHERE course_id = %s", (cid,))[0]["id"]
sql("INSERT INTO lessons (course_id, slug, title, position, body_md) VALUES (%s, 'kasus', 'Kasus', 2, 'Kasus')", (cid,))
l2 = sql("SELECT id FROM lessons WHERE slug = 'kasus' AND course_id = %s", (cid,))[0]["id"]
sql("""INSERT INTO exercises (lesson_id, slug, position, type, title, prompt_md, required, config)
       VALUES (%s, 'soal', 1, 'code', 'Soal', 'Soal', true, '{"language":"python","starter":"","tests":[{"input":"","output":"1"}],"hint":""}')""", (l2,))
eid = sql("SELECT id FROM exercises WHERE lesson_id = %s", (l2,))[0]["id"]
page = budi.get("/api/courses/modul-berbayar").json
check("a paid module shows its lesson titles but locked", page["access"] is False and all(x["locked"] for x in page["lessons"]))
locked = budi.get("/api/courses/modul-berbayar/lessons/baca-dulu")
check("paid lesson text is not sent without access", locked.status_code == 403 and locked.json["locked"] and "rahasia" not in locked.get_data(as_text=True))
check("paid exercise cannot be answered without access", budi.post(f"/api/exercises/{eid}/result", {"code": "x", "passed": 1, "total": 1}).status_code == 403)
check("anonymous visitors are locked out too", anon.get("/api/courses/modul-berbayar/lessons/baca-dulu").status_code == 403)
buyer, buyer_email = new_user("10.1.0.6")
sql("INSERT INTO entitlements (user_id, course_id, source) SELECT id, %s, 'admin' FROM users WHERE email = %s", (cid, buyer_email))
check("an entitlement opens the lesson", buyer.get("/api/courses/modul-berbayar/lessons/baca-dulu").status_code == 200)
check("a reading-only lesson can be completed", buyer.post(f"/api/lessons/{lid}/complete").json["lesson_done"] is True)
check("a lesson with required exercises cannot be skipped", buyer.post(f"/api/lessons/{l2}/complete").status_code == 400)
admin, admin_email = new_user("10.1.0.7")
sql("UPDATE users SET role = 'admin' WHERE email = %s", (admin_email,))
check("admins can open paid lessons", admin.get("/api/courses/modul-berbayar/lessons/baca-dulu").status_code == 200)
check("catalog marks access per learner", {c["slug"]: c["access"] for c in buyer.get("/api/courses").json["courses"]}["modul-berbayar"] is True)
sql("UPDATE courses SET status = 'draft' WHERE slug = 'modul-berbayar'")
check("draft courses are hidden", anon.get("/api/courses/modul-berbayar").status_code == 404 and all(c["slug"] != "modul-berbayar" for c in anon.get("/api/courses").json["courses"]))

# ---------------------------------------------------------------- email verification
mails = []
lab.EMAIL_VERIFICATION = True
lab.send_mail = lambda to, subject, body: mails.append((to, body)) or True
vc = Client("10.1.0.8")
r = vc.post("/api/register", {"name": "Vera", "email": "vera@example.test", "password": "a long password here"})
check("with verification on, the new learner is unverified", r.json["user"]["verified"] is False)
check("a verification email is sent", len(mails) == 1 and "/verify?token=" in mails[0][1])
token = re.search(r"token=([\w-]+)", mails[0][1]).group(1)
check("a wrong token is refused", vc.get("/api/verify?token=nope").status_code == 400)
check("the token verifies the email", vc.get(f"/api/verify?token={token}").status_code == 200 and vc.get("/api/session").json["user"]["verified"] is True)
check("the token works only once", vc.get(f"/api/verify?token={token}").status_code == 400)
lab.EMAIL_VERIFICATION = False

# ---------------------------------------------------------------- content and markdown
html = lab.render_md('<script>alert(1)</script> <img src=x onerror=alert(1)> [x](javascript:alert(1)) **ok**')
check("lesson html is sanitised", "<script" not in html and "onerror" not in html and "javascript:" not in html and "<strong>ok</strong>" in html, html)
before = sql("SELECT count(*) AS n FROM exercises")[0]["n"]
with psycopg.connect(lab.DATABASE_URL, row_factory=psycopg.rows.dict_row) as conn:
    conn.execute(f'SET search_path TO "{lab.DB_SCHEMA}"')
    lab.sync_content(conn, cl.load_all(lab.CONTENT_DIR))
check("syncing content twice changes nothing", sql("SELECT count(*) AS n FROM exercises")[0]["n"] == before)
check("progress survives a content sync", budi.get("/api/courses/python-basics").json["progress"]["done"] == 1)

# ---------------------------------------------------------------- content validation
def course_in(tmp, course_yml, lesson_md, exercises):
    d = Path(tmp) / "c"
    (d / "01-satu").mkdir(parents=True)
    (d / "course.yml").write_text(course_yml)
    (d / "01-satu" / "lesson.md").write_text(lesson_md)
    if exercises is not None:
        (d / "01-satu" / "exercises.yml").write_text(exercises)
    return d


GOOD_COURSE = "slug: c\ntitle: T\nlanguage: python\nlevel: L\nsummary: S\nstatus: published\n"
GOOD_LESSON = "---\ntitle: Satu\n---\nIsi\n"
GOOD_CODE = "- slug: a\n  type: code\n  title: A\n  prompt: P\n  starter: ''\n  tests:\n    - output: '1'\n  solution: print(1)\n"


def rejects(label, course_yml=GOOD_COURSE, lesson_md=GOOD_LESSON, exercises=GOOD_CODE, needle=""):
    with tempfile.TemporaryDirectory() as tmp:
        try:
            cl.load_course(course_in(tmp, course_yml, lesson_md, exercises))
            check(f"content check rejects {label}", False, "was accepted")
        except cl.ContentError as exc:
            check(f"content check rejects {label}", needle in str(exc), str(exc))


with tempfile.TemporaryDirectory() as tmp:
    good = cl.load_course(course_in(tmp, GOOD_COURSE, GOOD_LESSON, GOOD_CODE))
    check("a minimal valid course loads", good["lessons"][0]["exercises"][0]["config"]["tests"] == [{"input": "", "output": "1"}])
rejects("a bad course slug", GOOD_COURSE.replace("slug: c", "slug: Bad Slug"), needle="slug")
rejects("an unknown language", GOOD_COURSE.replace("python", "cobol"), needle="language")
rejects("a lesson without front matter", lesson_md="Isi saja", needle="front matter")
rejects("a code exercise without tests", exercises=GOOD_CODE.replace("  tests:\n    - output: '1'\n", ""), needle="tests")
rejects("a code exercise without a solution", exercises=GOOD_CODE.replace("  solution: print(1)\n", ""), needle="solution")
CHOICE = "- slug: q\n  type: choice\n  title: Q\n  prompt: P\n  options: [a, b]\n  correct: [{c}]\n  explanation: E\n"
rejects("a correct answer outside the options", exercises=CHOICE.replace("{c}", "5"), needle="correct")
rejects("two correct answers without multiple", exercises=CHOICE.replace("[{c}]", "[0, 1]"), needle="exactly one")
rejects("duplicate exercise slugs", exercises=GOOD_CODE + GOOD_CODE, needle="duplicate")
rejects("a choice question without explanation", exercises=CHOICE.replace("{c}", "0").replace("  explanation: E\n", ""), needle="explanation")


# ================================================================ perks and plans
plans = anon.get("/api/plans").json["plans"]
check("the plans comparison is served", [p["id"] for p in plans] == ["gratis", "modul-berbayar"] and plans[1]["highlight"] is True and len(plans[0]["perks"]) >= 4)
cd = anon.get("/api/courses/python-basics").json["course"]
check("a course page carries its perks and certificate flag", len(cd["perks"]) == 3 and cd["certificate"] is True)
with tempfile.TemporaryDirectory() as tmp:
    (Path(tmp) / "plans.yml").write_text("id:\n  - id: a\n    name: A\n    price: Rp0\n    tagline: t\n    perks: []\n")
    try:
        cl.load_plans(Path(tmp)); check("plans without perks are rejected", False)
    except cl.ContentError as exc:
        check("plans without perks are rejected", "perks" in str(exc))
    check("a missing plans file means no plans", cl.load_plans(Path(tmp) / "nowhere") == [])

# ================================================================ certificates
grad, grad_email = new_user("10.2.0.1", name="Siti Aminah")
check("the certificate status says not yet eligible", grad.get("/api/courses/python-basics/certificate").json["eligible"] is False)
check("claiming early is refused", grad.post("/api/courses/python-basics/certificate", {"name": "Siti Aminah"}).status_code == 400)
sql("""INSERT INTO exercise_progress (user_id, exercise_id, attempts, passed_at)
       SELECT u.id, e.id, 1, now() FROM users u, exercises e JOIN lessons l ON l.id = e.lesson_id JOIN courses c ON c.id = l.course_id
       WHERE u.email = %s AND c.slug = 'python-basics' AND e.required""", (grad_email,))
st = grad.get("/api/courses/python-basics/certificate").json
check("finishing every lesson makes the learner eligible", st["eligible"] is True and st["certificate"] is None and st["default_name"] == "Siti Aminah", st)
check("anonymous visitors cannot claim", anon.post("/api/courses/python-basics/certificate", {"name": "X Y"}).status_code in (400, 401))
check("a one-letter name is refused", grad.post("/api/courses/python-basics/certificate", {"name": "S"}).status_code == 400)
check("a name with control characters is refused", grad.post("/api/courses/python-basics/certificate", {"name": "Siti\x07 Aminah"}).status_code == 400)
check("a name without letters is refused", grad.post("/api/courses/python-basics/certificate", {"name": "12345"}).status_code == 400)
lab.EMAIL_VERIFICATION = True
sql("UPDATE users SET email_verified_at = NULL WHERE email = %s", (grad_email,))
check("an unverified email cannot claim when verification is on", grad.post("/api/courses/python-basics/certificate", {"name": "Siti Aminah"}).status_code == 403)
lab.EMAIL_VERIFICATION = False
claim = grad.post("/api/courses/python-basics/certificate", {"name": "  Siti   Aminah "})
cert = claim.json["certificate"]
check("claiming works and tidies the name", claim.status_code == 201 and cert["name"] == "Siti Aminah" and re.fullmatch(r"LAB-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}", cert["id"]), claim.json)
check("the certificate knows its course size", cert["lessons"] == 8 and cert["exercises"] == 25 and cert["course"]["title"].startswith("Python Dasar"))
again = grad.post("/api/courses/python-basics/certificate", {"name": "Nama Lain Sekali"})
check("claiming twice returns the same certificate and keeps the name", again.status_code == 200 and again.json["certificate"]["id"] == cert["id"] and again.json["certificate"]["name"] == "Siti Aminah")
check("my certificates lists it", grad.get("/api/me/certificates").json["certificates"][0]["id"] == cert["id"])
pub = anon.get(f"/api/certificates/{cert['id']}")
check("anyone can verify a certificate", pub.status_code == 200 and pub.json["certificate"]["name"] == "Siti Aminah" and pub.json["certificate"]["revoked"] is False)
check("the public view exposes no email or user id", "email" not in json.dumps(pub.json) and "user" not in json.dumps(pub.json))
check("the id is accepted in lower case", anon.get(f"/api/certificates/{cert['id'].lower()}").status_code == 200)
check("a malformed id is a 404", anon.get("/api/certificates/not-an-id").status_code == 404)
check("an unknown id is a 404", anon.get("/api/certificates/LAB-AAAA-AAAA-AAAA").status_code == 404)
pdf = anon.get(f"/api/certificates/{cert['id']}/pdf")
check("the pdf is a real pdf, shown inline", pdf.status_code == 200 and pdf.mimetype == "application/pdf" and pdf.data.startswith(b"%PDF") and "inline" in pdf.headers["Content-Disposition"])
try:
    import pymupdf
    text = pymupdf.open(stream=pdf.data, filetype="pdf")[0].get_text()
    check("the pdf shows the name, course, id, date and signer", all(x in text for x in ("Siti Aminah", "Python Dasar untuk Warung Kopi", cert["id"], "Christianto Lie", "Sertifikat Penyelesaian")), text[:200])
except ImportError:
    print("SKIP reading the pdf text (pymupdf is not installed)")
# the signature really is drawn: the pdf embeds an image
check("the pdf embeds the signature image and a QR code", pdf.data.count(b"/Subtype /Image") >= 1 and len(pdf.data) > 100_000)

# revoking
check("only admins can revoke", grad.post(f"/api/admin/certificates/{cert['id']}/revoke").status_code == 403)
check("an admin can revoke", admin.post(f"/api/admin/certificates/{cert['id']}/revoke").json["revoked"] is True)
check("a revoked certificate says so", anon.get(f"/api/certificates/{cert['id']}").json["certificate"]["revoked"] is True)
check("a revoked certificate has no pdf", anon.get(f"/api/certificates/{cert['id']}/pdf").status_code == 410)
check("a revoked certificate cannot be claimed again", grad.post("/api/courses/python-basics/certificate", {"name": "Siti Aminah"}).status_code == 403)
admin.post(f"/api/admin/certificates/{cert['id']}/restore")
check("restoring brings the pdf back", anon.get(f"/api/certificates/{cert['id']}/pdf").status_code == 200)
sql("UPDATE courses SET certificate = false WHERE slug = 'python-basics'")
other, other_email = new_user("10.2.0.2")
check("a course can switch certificates off", other.post("/api/courses/python-basics/certificate", {"name": "Budi Santoso"}).status_code == 400)
sql("UPDATE courses SET certificate = true WHERE slug = 'python-basics'")
flood = Client("10.2.0.50")
codes = [flood.get("/api/certificates/LAB-AAAA-AAAA-AAAA").status_code for _ in range(62)]
check("verifying is rate limited per address", codes[:60] == [404] * 60 and codes[60] == 429, codes[58:])

# ================================================================ admin
check("the admin api needs a sign-in", anon.get("/api/admin/overview").status_code == 401)
check("learners cannot use the admin api", grad.get("/api/admin/overview").status_code == 403)
check("admin writes need the csrf header", admin.post("/api/admin/courses", {"title": "X"}, csrf=False).status_code == 400)
ov = admin.get("/api/admin/overview").json
mine = next(c for c in ov["courses"] if c["slug"] == "python-basics")
check("the overview counts lessons, exercises and learners", mine["lessons"] == 8 and mine["exercises"] == 25 and mine["learners"] >= 1 and mine["certificates"] >= 1, mine)
check("the overview lists recent certificates", any(c["public_id"] == cert["id"] for c in ov["certificates"]))

NEW = {"title": "Modul Laporan Bulanan", "language": "python", "level": "Menengah", "kind": "module", "price_idr": 100000,
       "status": "draft", "position": 20, "summary": "Kasus laporan bulanan.", "perks": ["Kasus nyata", "Sertifikat"], "certificate": True}
r = admin.post("/api/admin/courses", NEW)
course_id = r.json["course"]["id"]
check("an admin can create a course; the slug comes from the title", r.status_code == 201 and r.json["course"]["slug"] == "modul-laporan-bulanan" and r.json["course"]["source"] == "admin", r.json)
check("a duplicate course slug is refused", admin.post("/api/admin/courses", NEW).status_code == 409)
check("an unknown language is refused", admin.post("/api/admin/courses", {**NEW, "title": "Lain", "language": "cobol"}).status_code == 400)
check("a negative price is refused", admin.post("/api/admin/courses", {**NEW, "title": "Lain", "price_idr": -5}).status_code == 400)
check("a course can be updated", admin.put(f"/api/admin/courses/{course_id}", {**NEW, "slug": "modul-laporan-bulanan", "status": "published", "price_idr": 150000}).json["course"]["price_idr"] == 150000)
check("the course page lists it for learners once published", "modul-laporan-bulanan" in [c["slug"] for c in anon.get("/api/courses").json["courses"]])

r = admin.post(f"/api/admin/courses/{course_id}/lessons", {"title": "Mengenal data", "body": "## Data\n\nIsi **materi**."})
lesson_id = r.json["id"]
check("an admin can add a lesson", r.status_code == 201)
check("a lesson without a body is refused", admin.post(f"/api/admin/courses/{course_id}/lessons", {"title": "Kosong", "body": ""}).status_code == 400)
check("a duplicate lesson slug is refused", admin.post(f"/api/admin/courses/{course_id}/lessons", {"title": "Mengenal data", "body": "x"}).status_code == 409)
check("a lesson can be updated", admin.put(f"/api/admin/lessons/{lesson_id}", {"title": "Mengenal data lagi", "slug": "mengenal-data", "body": "Baru"}).status_code == 200)
detail = admin.get(f"/api/admin/lessons/{lesson_id}").json
check("the lesson editor gets the markdown source", detail["lesson"]["body"] == "Baru" and detail["lesson"]["source"] == "admin" and detail["course"]["id"] == course_id)

CHOICE = {"type": "choice", "title": "Pilih yang benar", "prompt": "Mana yang `int`?", "options": ["`42`", "`\"42\"`", "`4.2`"],
          "correct": [0], "hint": "Cari angka bulat.", "explanation": "`42` adalah int."}
r = admin.post(f"/api/admin/lessons/{lesson_id}/exercises", CHOICE)
q_id = r.json["exercise"]["id"]
check("an admin can add a multiple-choice question", r.status_code == 201 and r.json["exercise"]["slug"] == "pilih-yang-benar" and r.json["exercise"]["config"]["correct"] == [0], r.json)
check("a correct answer outside the options is refused", admin.post(f"/api/admin/lessons/{lesson_id}/exercises", {**CHOICE, "title": "B", "correct": [7]}).status_code == 400)
check("two correct answers need multiple: true", admin.post(f"/api/admin/lessons/{lesson_id}/exercises", {**CHOICE, "title": "C", "correct": [0, 1]}).status_code == 400)
check("a multiple-answer question can be saved", admin.post(f"/api/admin/lessons/{lesson_id}/exercises", {**CHOICE, "title": "D", "correct": [0, 2], "multiple": True}).status_code == 201)
check("a duplicate exercise slug is refused", admin.post(f"/api/admin/lessons/{lesson_id}/exercises", CHOICE).status_code == 409)
check("a question needs an explanation", admin.post(f"/api/admin/lessons/{lesson_id}/exercises", {k: v for k, v in {**CHOICE, "title": "E"}.items() if k != "explanation"}).status_code == 400)

CODE = {"type": "code", "title": "Hitung pajak", "prompt": "Baca harga, cetak pajak 10%.", "starter": "harga = int(input())\n",
        "tests": [{"input": "100000", "output": "10000"}, {"input": "5000", "output": "500"}], "hint": "Kali 10 bagi 100.",
        "solution": "harga = int(input())\nprint(harga * 10 // 100)\n"}
r = admin.post(f"/api/admin/lessons/{lesson_id}/exercises", CODE)
c_id = r.json["exercise"]["id"]
check("an admin can add a code exercise", r.status_code == 201 and r.json["exercise"]["config"]["solution"].startswith("harga"))
check("a code exercise needs tests", admin.post(f"/api/admin/lessons/{lesson_id}/exercises", {**CODE, "title": "F", "tests": []}).status_code == 400)
check("a code exercise needs a solution", admin.post(f"/api/admin/lessons/{lesson_id}/exercises", {k: v for k, v in {**CODE, "title": "G"}.items() if k != "solution"}).status_code == 400)

# learners see the new questions, without the answers
payer = Client("10.2.0.60")
payer.post("/api/register", {"name": "Dewi", "email": "dewi@example.test", "password": "a long password here"})
sql("INSERT INTO entitlements (user_id, course_id, source) SELECT id, %s, 'admin' FROM users WHERE email = 'dewi@example.test'", (course_id,))
page = payer.get("/api/courses/modul-laporan-bulanan/lessons/mengenal-data")
body = page.get_data(as_text=True)
check("learners see a question added in the admin", page.status_code == 200 and "Pilih yang benar" in body and "Hitung pajak" in body)
check("the admin-added answers and solution stay hidden", "correct" not in json.dumps([e.get("choice") for e in page.json["exercises"]]) and "solution" not in body and "harga * 10" not in body and "42</code> adalah int" not in body)
qid2 = next(e["id"] for e in page.json["exercises"] if e["slug"] == "pilih-yang-benar")
check("an admin-added question is graded by the server", payer.post(f"/api/exercises/{qid2}/answer", {"choice": [1]}).json["correct"] is False and payer.post(f"/api/exercises/{qid2}/answer", {"choice": [0]}).json["correct"] is True)

# editing and deleting
upd = admin.put(f"/api/admin/exercises/{q_id}", {**CHOICE, "title": "Pilih yang benar", "prompt": "Mana yang bertipe `int`?"})
check("a question can be edited", upd.status_code == 200 and "bertipe" in upd.json["exercise"]["prompt"])
check("the type of an answered exercise cannot change", admin.put(f"/api/admin/exercises/{q_id}", {**CODE, "title": "Pilih yang benar"}).status_code == 409)
check("deleting an answered exercise asks first", admin.delete(f"/api/admin/exercises/{q_id}").status_code == 409)
check("deleting with force removes it", admin.delete(f"/api/admin/exercises/{q_id}?force=1").status_code == 200 and admin.delete(f"/api/admin/exercises/{q_id}").status_code == 404)
check("an unanswered exercise deletes without asking", admin.delete(f"/api/admin/exercises/{c_id}").status_code == 200)
r2 = admin.post(f"/api/admin/courses/{course_id}/lessons", {"title": "Pelajaran kedua", "body": "Isi"})
l2_id = r2.json["id"]
q2 = admin.post(f"/api/admin/lessons/{l2_id}/exercises", {**CHOICE, "title": "Soal kedua"}).json["exercise"]["id"]
payer.post(f"/api/exercises/{q2}/answer", {"choice": [0]})
dl = admin.delete(f"/api/admin/lessons/{l2_id}")
check("a lesson with learner answers asks before it is deleted", dl.status_code == 409 and dl.json["submissions"] >= 1)
check("deleting that lesson with force works", admin.delete(f"/api/admin/lessons/{l2_id}?force=1").status_code == 200 and admin.get(f"/api/admin/lessons/{l2_id}").status_code == 404)

# files and the admin do not fight
with tempfile.TemporaryDirectory() as tmp:
    d = course_in(tmp, GOOD_COURSE.replace("slug: c", "slug: tmp-kursus").replace("title: T", "title: Dari file"), GOOD_LESSON, GOOD_CODE)
    def run_sync(course):
        with psycopg.connect(lab.DATABASE_URL, row_factory=psycopg.rows.dict_row) as conn:
            conn.execute(f'SET search_path TO "{lab.DB_SCHEMA}"')
            lab.sync_content(conn, [course])
    run_sync(cl.load_course(d))
    cid = sql("SELECT id FROM courses WHERE slug = 'tmp-kursus'")[0]["id"]
    check("a course from files starts as a file course", sql("SELECT source FROM courses WHERE id = %s", (cid,))[0]["source"] == "file")
    meta = admin.get(f"/api/admin/courses/{cid}").json["course"]
    admin.put(f"/api/admin/courses/{cid}", {**meta, "title": "Diubah di admin"})
    (d / "course.yml").write_text(GOOD_COURSE.replace("slug: c", "slug: tmp-kursus").replace("title: T", "title: Diubah di file lagi"))
    run_sync(cl.load_course(d))
    check("a course edited in the admin is not overwritten by the files", sql("SELECT title, source FROM courses WHERE id = %s", (cid,))[0] == {"title": "Diubah di admin", "source": "admin"})
    lesson_row = sql("SELECT l.id FROM lessons l WHERE l.course_id = %s", (cid,))[0]
    check("lessons from files are still owned by the files", sql("SELECT source FROM lessons WHERE id = %s", (lesson_row["id"],))[0]["source"] == "file")

check("markdown preview is sanitised", "<script" not in admin.post("/api/admin/preview", {"markdown": "<script>x</script> **ok**"}).json["html"])
check("an admin can grant access by email", admin.post("/api/admin/grants", {"email": grad_email, "course_slug": "modul-laporan-bulanan"}).status_code == 200)
check("granting to an unknown learner fails clearly", admin.post("/api/admin/grants", {"email": "ghost@example.test", "course_slug": "modul-laporan-bulanan"}).status_code == 404)
check("the granted learner can open the module", grad.get("/api/courses/modul-laporan-bulanan/lessons/mengenal-data").status_code == 200)


# ================================================================ two languages
cats = {c["slug"]: c for c in anon.get("/api/courses").json["courses"]}
# One course, two languages: the visitor's language (X-Lang) picks the texts.
check("a course is listed once, with the languages it has", cats["python-basics"]["locale"] == "id" and cats["python-basics"]["locales"] == ["id", "en"]
      and "python-dasar" not in cats)
en_cl = Client("10.3.0.20", lang="en")
cats_en = {c["slug"]: c for c in en_cl.get("/api/courses?lang=en").json["courses"]}
check("an English visitor gets the same course in English", cats_en["python-basics"]["title"] == "Python Basics for a Coffee Shop"
      and cats_en["python-basics"]["locale"] == "en" and cats_en["python-basics"]["level"] == "Beginner" and "from scratch" in cats_en["python-basics"]["summary"], cats_en["python-basics"])
check("the Indonesian visitor still gets Indonesian", cats["python-basics"]["title"] == "Python Dasar untuk Warung Kopi")
sql("""INSERT INTO courses (slug, title, language, locale, level, kind, price_idr, status, position, summary, source)
       VALUES ('hanya-indonesia', 'Hanya Indonesia', 'python', 'id', 'Pemula', 'course', 0, 'published', 90, 'Tanpa terjemahan', 'admin')""")
check("lang=en leaves out a course without an English version", "hanya-indonesia" not in [c["slug"] for c in en_cl.get("/api/courses?lang=en").json["courses"]])
both = {c["slug"]: c for c in en_cl.get("/api/courses?lang=all").json["courses"]}
check("lang=all lists it too, in the language it has", both["hanya-indonesia"]["locale"] == "id" and both["hanya-indonesia"]["title"] == "Hanya Indonesia" and both["python-basics"]["locale"] == "en")
check("lang=id lists every Indonesian course", {"python-basics", "hanya-indonesia"} <= {c["slug"] for c in anon.get("/api/courses?lang=id").json["courses"]})
sql("UPDATE courses SET status = 'draft' WHERE slug = 'hanya-indonesia'")
page_en = en_cl.get("/api/courses/python-basics").json
check("the course page is translated", page_en["course"]["title"] == "Python Basics for a Coffee Shop" and page_en["lessons"][0]["title"] == "Hello, Coffee Shop!"
      and page_en["lessons"][0]["slug"] == "hello-coffee-shop" and page_en["course"]["perks"][0].startswith("8 lessons"), page_en["lessons"][0])
les_en = en_cl.get("/api/courses/python-basics/lessons/hello-coffee-shop").json
les_id = anon.get("/api/courses/python-basics/lessons/hello-coffee-shop").json
exs_en = {e["slug"]: e for e in les_en["exercises"]}
check("a lesson is translated: title, text, trail", les_en["lesson"]["title"] == "Hello, Coffee Shop!" and "Senja Coffee Shop" in les_en["lesson"]["html"]
      and les_en["trail"][1]["title"] != les_id["trail"][1]["title"] and les_en["course"]["title"] == "Python Basics for a Coffee Shop")
check("its exercises are translated but keep their identity", [e["id"] for e in les_en["exercises"]] == [e["id"] for e in les_id["exercises"]]
      and exs_en["greet-the-customer"]["title"] == "Greet the customer" and exs_en["greet-the-customer"]["code"]["tests"][0]["output"].startswith("Welcome")
      and les_id["exercises"][0]["code"]["tests"][0]["output"].startswith("Selamat datang"), exs_en["greet-the-customer"])
check("translated quiz options are served", exs_en["quiz-print"]["choice"]["options_html"] != les_id["exercises"][2]["choice"]["options_html"])
enq, _ = new_user("10.3.0.21", name="Quinn")
enq.lang = "en"
a_en = enq.post(f"/api/exercises/{exs_en['quiz-print']['id']}/answer", {"choice": [1]}).json
check("a quiz is graded the same and explained in English", a_en["correct"] is True and "dua baris" not in a_en["explanation_html"] and "line" in a_en["explanation_html"], a_en)
enq.lang = None
check("progress is shared between the languages", next(e for e in enq.get("/api/courses/python-basics/lessons/hello-coffee-shop").json["exercises"] if e["slug"] == "quiz-print")["passed"] is True)
check("English plans come with the English header", [p["id"] for p in Client("10.3.0.1", lang="en").get("/api/plans").json["plans"]] == ["free", "paid-modules"])
check("an unknown language falls back to Indonesian plans", [p["id"] for p in Client("10.3.0.2", lang="xx").get("/api/plans").json["plans"]] == ["gratis", "modul-berbayar"])

en = Client("10.3.0.3", lang="en")
check("an English login error is in English", en.post("/api/login", {"email": "x@y.co", "password": "nope nope nope"}).json["error"] == "The email or password does not match.")
check("the same error is Indonesian by default", Client("10.3.0.4").post("/api/login", {"email": "x@y.co", "password": "nope nope nope"}).json["error"] == "Email atau password tidak cocok.")
check("the language can also come from ?lang=", Client("10.3.0.5").c.get("/api/courses/nope?lang=en").json["error"] == "Not found.")
check("an unknown X-Lang falls back to Indonesian", Client("10.3.0.6", lang="fr").get("/api/courses/nope").json["error"] == "Tidak ditemukan.")
check("English validation errors", en.post("/api/register", {"name": "A", "email": "a@b.co", "password": "short"}).json["error"] == "The password needs at least 10 characters.")
check("a locked paid lesson is explained in English", Client("10.3.0.7", lang="en").get("/api/courses/modul-laporan-bulanan/lessons/mengenal-data").status_code in (403, 404))
sql("UPDATE courses SET status = 'published' WHERE slug = 'modul-laporan-bulanan'")
locked_en = Client("10.3.0.8", lang="en").get("/api/courses/modul-laporan-bulanan/lessons/mengenal-data")
check("a locked module says so in English", locked_en.status_code == 403 and locked_en.json["error"] == "This module is paid. Unlock it to see the lessons.", locked_en.json)
check("a 404 is plain JSON with a translated message", en.get("/api/nope").json["error"] == "Not found.")
check("the translation does not touch successful answers", en.get("/api/courses").status_code == 200)

# every learner-facing message has an English version
import re as _re
missing = []
for f in ("app.py", "certificates.py", "payments.py", "judge.py"):
    src = (HERE.parent / f).read_text(encoding="utf-8")
    for m in _re.finditer(r'(?:error=|bad\()\s*(f?)(["\'])((?:(?!\2).)*)\2', src):
        if not m.group(1) and m.group(3) not in __import__("i18n").EN:
            missing.append(m.group(3))
check("every learner-facing error message has an English translation", not missing, missing)
check("no English entry is left without a message in the code", all(
    any(k in (HERE.parent / f).read_text(encoding="utf-8") for f in ("app.py", "certificates.py", "payments.py", "judge.py")) for k in __import__("i18n").EN))

# A certificate is issued in the language the learner uses when claiming it
grad_en = Client("10.3.0.9", lang="en")
grad_en.post("/api/register", {"name": "Siti Aminah", "email": "grad-en@example.test", "password": "correct horse battery"})
sql("""INSERT INTO exercise_progress (user_id, exercise_id, attempts, passed_at)
       SELECT u.id, e.id, 1, now() FROM users u, exercises e JOIN lessons l ON l.id = e.lesson_id JOIN courses c ON c.id = l.course_id
       WHERE u.email = %s AND c.slug = 'python-basics' AND e.required ON CONFLICT DO NOTHING""", ("grad-en@example.test",))
early = Client("10.3.0.10", lang="en")
early.post("/api/register", {"name": "Early Bird", "email": "early@example.test", "password": "a long password here"})
check("claiming early gives an English message", early.post("/api/courses/python-basics/certificate", {"name": "Early Bird"}).json["error"] == "Finish all the lessons first. The certificate is issued once every lantern is lit.")
claim_en = grad_en.post("/api/courses/python-basics/certificate", {"name": "Siti Aminah"})
cert_en = claim_en.json["certificate"]
check("an English learner gets an English-language certificate", claim_en.status_code == 201 and cert_en["course"]["locale"] == "en"
      and cert_en["course"]["title"] == "Python Basics for a Coffee Shop", cert_en)
check("the certificate stays English for an Indonesian visitor", anon.get(f"/api/certificates/{cert_en['id']}").json["certificate"]["course"]["title"] == "Python Basics for a Coffee Shop")
check("an Indonesian certificate stays Indonesian for an English visitor", en_cl.get(f"/api/certificates/{cert['id']}").json["certificate"]["course"]["title"] == "Python Dasar untuk Warung Kopi")
pdf_en = anon.get(f"/api/certificates/{cert_en['id']}/pdf")
check("its PDF is in English", pdf_en.status_code == 200)
try:
    import pymupdf
    t_en = pymupdf.open(stream=pdf_en.data, filetype="pdf")[0].get_text()
    t_id = pymupdf.open(stream=anon.get(f"/api/certificates/{cert['id']}/pdf").data, filetype="pdf")[0].get_text()
    check("the English PDF reads in English", "Certificate of Completion" in t_en and "has completed the course" in t_en and "Sertifikat Penyelesaian" not in t_en and "Python Basics for a Coffee Shop" in t_en, t_en[:160])
    check("the Indonesian PDF still reads in Indonesian", "Sertifikat Penyelesaian" in t_id and "Certificate of Completion" not in t_id)
except ImportError:
    print("SKIP reading the pdf text (pymupdf is not installed)")

# verification email follows the sign-up language
mails2 = []
lab.EMAIL_VERIFICATION = True
lab.send_mail = lambda to, subject, body: mails2.append((to, subject, body)) or True
Client("10.3.0.11", lang="en").post("/api/register", {"name": "Eve", "email": "eve@example.test", "password": "a long password here"})
Client("10.3.0.12").post("/api/register", {"name": "Evi", "email": "evi@example.test", "password": "a long password here"})
lab.EMAIL_VERIFICATION = False
check("the verification email is in English for English sign-ups", mails2[0][1].startswith("Verify your email") and "Open this link" in mails2[0][2])
check("and in Indonesian otherwise", mails2[1][1].startswith("Verifikasi email") and "Buka tautan" in mails2[1][2])

# course language in the loader and the admin
rejects("an unknown course language (locale)", GOOD_COURSE + "locale: fr\n", needle="locale")
r = admin.post("/api/admin/courses", {**NEW, "title": "English Module", "locale": "en", "slug": "english-module"})
check("an admin can set the language of a course", r.status_code == 201 and r.json["course"]["locale"] == "en", r.json)
check("an unknown locale is refused by the admin api", admin.post("/api/admin/courses", {**NEW, "title": "Lain", "locale": "fr"}).status_code == 400)
check("the language rejects bad plans file languages by falling back", cl.load_plans(HERE.parent.parent / "content", "xx")[0]["id"] == "gratis")

# ---------------------------------------------------------------- password reset
mails3 = []
lab.send_mail = lambda to, subject, body: mails3.append((to, subject, body)) or True
rita, rita_email = new_user("10.4.0.1", name="Rita", password="the old password 1")
other_device = Client("10.4.0.2")
other_device.post("/api/login", {"email": rita_email, "password": "the old password 1"})
fc = Client("10.4.0.3")
check("forgot needs the csrf header", fc.post("/api/password/forgot", {"email": rita_email}, csrf=False).status_code == 400)
check("forgot answers ok for an unknown email and sends nothing", fc.post("/api/password/forgot", {"email": "nobody@example.test"}).json == {"ok": True} and not mails3)
check("forgot answers the same for a known email", fc.post("/api/password/forgot", {"email": rita_email.upper()}).json == {"ok": True})
check("a reset email is sent with a link", len(mails3) == 1 and mails3[0][0] == rita_email and "/reset?token=" in mails3[0][2] and mails3[0][1].startswith("Atur ulang"))
rtoken = re.search(r"token=([\w-]+)", mails3[0][2]).group(1)
check("the reset token is stored hashed", not sql("SELECT 1 FROM email_tokens WHERE token_hash = %s", (rtoken,)))
check("reset refuses a short password", fc.post("/api/password/reset", {"token": rtoken, "password": "short"}).status_code == 400)
check("reset refuses a wrong token", fc.post("/api/password/reset", {"token": "nope", "password": "a brand new password"}).status_code == 400)
check("a verification token cannot reset a password", fc.post("/api/password/reset", {"token": token, "password": "a brand new password"}).status_code == 400)
done = fc.post("/api/password/reset", {"token": rtoken, "password": "a brand new password"})
check("reset sets the password and signs in", done.status_code == 200 and done.json["user"]["email"] == rita_email and fc.get("/api/session").json["user"]["name"] == "Rita")
check("the reset link works only once", Client("10.4.0.4").post("/api/password/reset", {"token": rtoken, "password": "another password 123"}).status_code == 400)
check("the old password no longer works", Client("10.4.0.5").post("/api/login", {"email": rita_email, "password": "the old password 1"}).status_code == 401)
check("the new password works", Client("10.4.0.6").post("/api/login", {"email": rita_email, "password": "a brand new password"}).status_code == 200)
check("sessions from before the reset are signed out", rita.get("/api/session").json["user"] is None and other_device.get("/api/session").json["user"] is None)
fc2 = Client("10.4.0.7", lang="en")
fc2.post("/api/password/forgot", {"email": rita_email})
check("the reset email follows the language", mails3[-1][1].startswith("Reset your") and "valid for 1 hour" in mails3[-1][2])
first_link = re.search(r"token=([\w-]+)", mails3[-1][2]).group(1)
fc2.post("/api/password/forgot", {"email": rita_email})
check("a newer link replaces the older one", fc2.post("/api/password/reset", {"token": first_link, "password": "a brand new password"}).status_code == 400)
n_before = len(mails3)
fc2.post("/api/password/forgot", {"email": rita_email})
check("reset emails are limited per account", len(mails3) == n_before)
codes = [Client("10.4.0.9").post("/api/password/forgot", {"email": f"x{i}@example.test"}).status_code for i in range(6)]
check("forgot is rate limited per address", codes == [200] * 5 + [429], codes)
with lab.app.app_context():
    link = lab.reset_link(sql("SELECT id FROM users WHERE email = %s", (rita_email,))[0]["id"])
check("an admin-made reset link works", Client("10.4.0.10").post("/api/password/reset", {"token": link.split("token=")[1], "password": "from the command line"}).status_code == 200)

# ---------------------------------------------------------------- hints
one = cl.validate_exercise({"slug": "a", "type": "code", "title": "A", "prompt": "p", "solution": "print(1)", "tests": [{"output": "1"}], "hint": "satu"}, "t", "python")
check("a single hint becomes a list of one", one["config"]["hints"] == ["satu"] and one["config"]["hint"] == "satu")
many = cl.validate_exercise({"slug": "a", "type": "code", "title": "A", "prompt": "p", "solution": "print(1)", "tests": [{"output": "1"}], "hints": ["satu", " dua ", "tiga"]}, "t", "python")
check("up to three hints are kept in order", many["config"]["hints"] == ["satu", "dua", "tiga"])
for label, extra in [("four hints", {"hints": ["a", "b", "c", "d"]}), ("an empty hint", {"hints": ["a", " "]}), ("hint and hints together", {"hint": "a", "hints": ["b"]})]:
    try:
        cl.validate_exercise({"slug": "a", "type": "code", "title": "A", "prompt": "p", "solution": "print(1)", "tests": [{"output": "1"}], **extra}, "t", "python")
        check(f"the loader rejects {label}", False)
    except cl.ContentError:
        check(f"the loader rejects {label}", True)
hl = anon.get("/api/courses/python-basics/lessons/discounts").json
hx = next(e for e in hl["exercises"] if e["slug"] == "apply-discount")
check("a lesson sends the hints as a list", hx["code"]["hints"] == ["Bayar 90% dari total dengan total * 90 // 100."] and "hint" not in hx["code"])
sqlx = cl.validate_exercise({"slug": "q", "type": "code", "title": "Q", "prompt": "p", "solution": "SELECT 1", "setup": "CREATE TABLE t (a);", "tests": [{"output": "1"}]}, "t", "sql")
check("an sql exercise keeps its setup", sqlx["config"]["setup"] == "CREATE TABLE t (a);" and sqlx["config"]["language"] == "sql")
check("a python exercise has no setup", "setup" not in one["config"])

# ---------------------------------------------------------------- learning streak
import datetime as _dt
sam, sam_email = new_user("10.5.0.1", name="Sam")
st = sam.get("/api/me/courses").json["streak"]
check("a new learner has no streak", st["current"] == 0 and st["best"] == 0 and st["today"] is False and len(st["week"]) == 7 and not any(d["active"] for d in st["week"]))
sam_id = sql("SELECT id FROM users WHERE email = %s", (sam_email,))[0]["id"]
def practice(days_ago):
    sql("INSERT INTO submissions (user_id, exercise_id, graded_in, status, created_at) VALUES (%s, %s, 'browser', 'failed', now() - make_interval(days => %s))", (sam_id, sid, days_ago))
for d in (1, 2, 3, 6, 7, 8, 9, 10):
    practice(d)
st = sam.get("/api/me/courses").json["streak"]
check("yesterday's streak still counts before today's practice", st["current"] == 3 and st["today"] is False and st["best"] == 5, st)
practice(0)
st = sam.get("/api/me/courses").json["streak"]
check("practising today extends the streak", st["current"] == 4 and st["today"] is True and st["week"][-1]["active"] and st["week"][-1]["date"] == sql("SELECT (now() AT TIME ZONE 'Asia/Jakarta')::date AS d")[0]["d"].isoformat(), st)
check("the week shows which days were active", [d["active"] for d in st["week"]] == [True, False, False, True, True, True, True], st["week"])
sql("DELETE FROM submissions WHERE user_id = %s AND created_at > now() - interval '36 hours'", (sam_id,))
check("a missed day resets the current streak but not the best", (lambda x: x["current"] == 0 and x["best"] == 5)(sam.get("/api/me/courses").json["streak"]))

# ---------------------------------------------------------------- payments (Stripe Checkout)
import hashlib as _hashlib, hmac as _hmac, time as _time
import payments
sql("UPDATE courses SET status = 'published' WHERE slug = 'modul-berbayar'")
pay, pay_email = new_user("10.6.0.1", name="Pay")
check("the session says payments are off without a key", pay.get("/api/session").json["payments"] is False)
check("checkout is refused while payments are off", pay.post("/api/courses/modul-berbayar/checkout").status_code == 503)
lab.STRIPE_SECRET_KEY, lab.STRIPE_WEBHOOK_SECRET = "sk_test_x", "whsec_test"
check("the session says payments are on with a key", pay.get("/api/session").json["payments"] is True)
sent = []
def fake_stripe(key, path, params):
    sent.append((key, path, params))
    return {"id": f"cs_test_{len(sent)}", "url": f"https://checkout.stripe.com/c/pay/cs_test_{len(sent)}"}
payments.stripe_post = fake_stripe
check("checkout needs a sign-in", anon.post("/api/courses/modul-berbayar/checkout").status_code in (400, 401))
check("checkout needs the csrf header", pay.post("/api/courses/modul-berbayar/checkout", csrf=False).status_code == 400)
check("a free course cannot be bought", pay.post("/api/courses/python-basics/checkout").status_code == 409)
check("someone with access cannot buy again", buyer.post("/api/courses/modul-berbayar/checkout").status_code == 409)
co = pay.post("/api/courses/modul-berbayar/checkout")
check("checkout returns the Stripe page", co.status_code == 200 and co.json["url"].startswith("https://checkout.stripe.com/"), co.json)
key, path, params = sent[-1]
check("Stripe is asked for the course price in rupiah", key == "sk_test_x" and path == "/checkout/sessions" and params["line_items[0][price_data][currency]"] == "idr"
      and params["line_items[0][price_data][unit_amount]"] == 10000000 and params["mode"] == "payment" and params["customer_email"] == pay_email
      and params["success_url"].endswith("/kursus/modul-berbayar?paid=1") and params["cancel_url"].endswith("/kursus/modul-berbayar"), params)
order = sql("SELECT * FROM orders WHERE provider_ref = %s", (co.json["url"].rsplit("/", 1)[1],))[0]
check("a pending order is stored", order["status"] == "pending" and order["amount_idr"] == 100000)
check("coming back from Stripe does not unlock anything by itself", pay.get("/api/courses/modul-berbayar?paid=1").json["access"] is False)

def webhook(event, secret="whsec_test", age=0, raw_sig=None):
    body = json.dumps(event).encode()
    t = int(_time.time()) - age
    sig = raw_sig or f"t={t},v1=" + _hmac.new(secret.encode(), f"{t}.".encode() + body, _hashlib.sha256).hexdigest()
    return lab.app.test_client().post("/api/stripe/webhook", data=body, headers={"Stripe-Signature": sig, "Content-Type": "application/json"})
def paid_event(ref, amount=10000000, kind="checkout.session.completed", status="paid", currency="idr"):
    return {"type": kind, "data": {"object": {"id": ref, "payment_status": status, "amount_total": amount, "currency": currency}}}
ref = order["provider_ref"]
check("a webhook without a signature is refused", webhook(paid_event(ref), raw_sig="nope").status_code == 400)
check("a webhook signed with the wrong secret is refused", webhook(paid_event(ref), secret="whsec_other").status_code == 400)
check("an old webhook is refused", webhook(paid_event(ref), age=3600).status_code == 400)
check("nothing was unlocked by the refused webhooks", pay.get("/api/courses/modul-berbayar").json["access"] is False)
check("an unpaid checkout does not unlock", webhook(paid_event(ref, status="unpaid")).status_code == 200 and pay.get("/api/courses/modul-berbayar").json["access"] is False)
check("a wrong amount does not unlock", webhook(paid_event(ref, amount=100)).status_code == 200 and pay.get("/api/courses/modul-berbayar").json["access"] is False)
check("an unknown checkout is ignored", webhook(paid_event("cs_test_unknown")).status_code == 200)
check("other events are acknowledged", webhook({"type": "charge.refunded", "data": {"object": {}}}).status_code == 200)
r = webhook(paid_event(ref))
check("a signed paid event unlocks the module", r.status_code == 200 and pay.get("/api/courses/modul-berbayar").json["access"] is True and pay.get("/api/courses/modul-berbayar/lessons/baca-dulu").status_code == 200)
check("the order is marked paid and the access is a purchase", sql("SELECT status FROM orders WHERE provider_ref = %s", (ref,))[0]["status"] == "paid"
      and sql("SELECT source FROM entitlements e JOIN users u ON u.id = e.user_id WHERE u.email = %s", (pay_email,))[0]["source"] == "purchase")
check("the same event twice is harmless", webhook(paid_event(ref)).status_code == 200 and sql("SELECT count(*) AS n FROM entitlements e JOIN users u ON u.id = e.user_id WHERE u.email = %s", (pay_email,))[0]["n"] == 1)
check("only the buyer got access", fresh.get("/api/courses/modul-berbayar").json["access"] is False)
def boom(*a):
    raise payments.StripeError("down")
payments.stripe_post = boom
r = fresh.post("/api/courses/modul-berbayar/checkout")
check("a Stripe failure is reported without an order", r.status_code == 502 and sql("SELECT count(*) AS n FROM orders")[0]["n"] == 1, r.json)
check("signature check handles several v1 values", payments.valid_signature(b"x", "t=100,v1=bad,v1=" + _hmac.new(b"s", b"100.x", _hashlib.sha256).hexdigest(), "s", now=100))
check("signature check fails closed without a secret", not payments.valid_signature(b"x", "t=100,v1=" + _hmac.new(b"", b"100.x", _hashlib.sha256).hexdigest(), "", now=100))
lab.STRIPE_SECRET_KEY, lab.STRIPE_WEBHOOK_SECRET = "", ""
sql("UPDATE courses SET status = 'draft' WHERE slug = 'modul-berbayar'")

# ---------------------------------------------------------------- admin dashboard numbers
check("stats need an admin", budi.get("/api/admin/stats").status_code == 403 and anon.get("/api/admin/stats").status_code == 401)
stats = admin.get("/api/admin/stats").json
tt = stats["totals"]
check("stats count learners, activity and sales", tt["users"] == sql("SELECT count(*) AS n FROM users")[0]["n"] and tt["new_users_7d"] == tt["users"]
      and tt["active_7d"] >= 2 and tt["submissions_7d"] >= 8 and tt["paid_orders"] == 1 and tt["revenue_idr"] == 100000, tt)
check("stats cover the last 14 days", len(stats["days"]) == 14 and stats["days"][-1]["users"] == tt["users"] and stats["days"][-1]["active"] >= 1, stats["days"][-2:])
halo = next(x for x in stats["lessons"] if x["title"] == lesson["lesson"]["title"] and x["course_title"] == "Python Dasar untuk Warung Kopi")
check("stats show how many started and finished a lesson", halo["started"] >= halo["finished"] >= 1, halo)
check("stats rank the hardest exercises first", stats["hardest"] and all(0 <= x["passed"] <= x["learners"] for x in stats["hardest"])
      and [x["passed"] / x["learners"] for x in stats["hardest"]] == sorted(x["passed"] / x["learners"] for x in stats["hardest"]), stats["hardest"][:3])

# ---------------------------------------------------------------- translations in the content files
TR_COURSE = GOOD_COURSE + "translations:\n  en:\n    title: T en\n    level: L en\n    summary: S en\n"
TR_CHOICE = "- slug: q\n  type: choice\n  title: Q\n  prompt: P\n  options: [a, b, c]\n  correct: [1]\n  explanation: E\n"


def translated(label, en_lesson="---\ntitle: Lesson en\n---\nBody en\n", en_exercises=None, base_exercises=GOOD_CODE, course_yml=TR_COURSE, needle=None):
    """Loads a one-lesson course with English files next to the originals; `needle` is the expected error."""
    with tempfile.TemporaryDirectory() as tmp:
        folder = course_in(tmp, course_yml, GOOD_LESSON, base_exercises)
        lesson_dir = next(p for p in folder.iterdir() if p.is_dir())
        if en_lesson is not None:
            (lesson_dir / "lesson.en.md").write_text(en_lesson, encoding="utf-8")
        if en_exercises is not None:
            (lesson_dir / "exercises.en.yml").write_text(en_exercises, encoding="utf-8")
        try:
            course = cl.load_course(folder)
        except cl.ContentError as exc:
            check(f"content check rejects {label}", needle is not None and needle in str(exc), str(exc))
            return None
        check(f"content check accepts {label}" if needle is None else f"content check rejects {label}", needle is None, "was accepted")
        return course


EN_CODE = GOOD_CODE.replace("title: A", "title: A en").replace("prompt: P", "prompt: P en")
tc = translated("a complete translation", en_exercises=EN_CODE)
check("the translation is loaded next to the original", tc["i18n"]["en"]["title"] == "T en" and tc["lessons"][0]["i18n"]["en"] == {"title": "Lesson en", "body": "Body en\n"}
      and tc["lessons"][0]["exercises"][0]["i18n"]["en"]["title"] == "A en" and tc["lessons"][0]["exercises"][0]["title"] == "A", tc["lessons"][0])
translated("a translation without its lesson file", en_lesson=None, en_exercises=EN_CODE, needle="lesson.en.md is missing")
translated("a translation without its exercises", needle="same exercise slugs")
translated("translated exercises under another slug", en_exercises=EN_CODE.replace("slug: a", "slug: b"), needle="same exercise slugs")
translated("a translation with a different number of tests", en_exercises=EN_CODE.replace("    - output: '1'\n", "    - output: '1'\n    - output: '2'\n"), needle="tests")
translated("a translated quiz with another answer", base_exercises=TR_CHOICE, en_exercises=TR_CHOICE.replace("correct: [1]", "correct: [2]"), needle="same `correct`")
translated("a translated quiz with fewer options", base_exercises=TR_CHOICE, en_exercises=TR_CHOICE.replace("[a, b, c]", "[a, b]"), needle="same number of options")
translated("translation files the course does not declare", en_exercises=EN_CODE, course_yml=GOOD_COURSE, needle="has no `translations: en:`")
translated("a translation into the course's own language", en_exercises=EN_CODE, course_yml=TR_COURSE.replace("  en:", "  id:"), needle="translations")
rejects("a required code exercise in a language that runs on the remote compiler", GOOD_COURSE.replace("python", "kotlin"), needle="required: false")
with tempfile.TemporaryDirectory() as tmp:
    ktc = cl.load_course(course_in(tmp, GOOD_COURSE.replace("python", "kotlin"), GOOD_LESSON, GOOD_CODE + "  required: false\n"))
    check("an optional Kotlin code exercise loads", ktc["lessons"][0]["exercises"][0]["config"]["language"] == "kotlin")
with tempfile.TemporaryDirectory() as tmp:
    kt = cl.load_course(course_in(tmp, GOOD_COURSE.replace("python", "kotlin"), GOOD_LESSON, TR_CHOICE))
    check("a Kotlin course with multiple choice only loads", kt["language"] == "kotlin" and kt["lessons"][0]["exercises"][0]["type"] == "choice")
sqlc = cl.validate_exercise({"slug": "q", "type": "code", "title": "Q", "prompt": "p", "solution": "INSERT INTO t VALUES (1)", "setup": "CREATE TABLE t (a);", "check": "SELECT a FROM t;", "tests": [{"output": "a\n1"}]}, "t", "sql")
check("an sql exercise keeps its check query", sqlc["config"]["check"] == "SELECT a FROM t;")

# ---------------------------------------------------------------- editing a translated lesson in the admin
row = sql("SELECT l.id, l.i18n FROM lessons l JOIN courses c ON c.id = l.course_id WHERE c.slug = 'python-next-steps' ORDER BY l.position LIMIT 1")[0]
check("a file lesson carries its translation", "en" in row["i18n"])
r = admin.put(f"/api/admin/lessons/{row['id']}", {"title": "Judul baru", "slug": "judul-baru", "body": "Isi baru"})
after = sql("SELECT i18n, source FROM lessons WHERE id = %s", (row["id"],))[0]
check("editing it in the admin drops the stale translation", r.status_code == 200 and after["i18n"] == {} and after["source"] == "admin")
check("everyone then sees the edited text", en_cl.get("/api/courses/python-next-steps/lessons/judul-baru").json["lesson"]["title"] == "Judul baru")

# ---------------------------------------------------------------- a course that replaces its separate translation
def tiny(slug, locale, replaces=(), i18n=None):
    ex = lambda n: {"slug": f"{slug}-x{n}", "type": "code", "title": f"X{n}", "prompt": "p", "required": True, "i18n": {},
                    "config": {"language": "python", "solution": "print(1)", "starter": "", "tests": [{"input": "", "output": "1"}], "hints": [], "hint": ""}}
    return {"slug": slug, "title": slug, "language": "python", "locale": locale, "level": "L", "kind": "course", "price_idr": 0, "status": "published",
            "position": 80, "summary": "S", "perks": [], "certificate": True, "i18n": i18n or {}, "replaces": list(replaces),
            "lessons": [{"slug": f"{slug}-l1", "title": "L1", "body": "b", "i18n": {}, "exercises": [ex(1), ex(2)]},
                        {"slug": f"{slug}-l2", "title": "L2", "body": "b", "i18n": {}, "exercises": []}]}


def sync(*courses):
    with psycopg.connect(lab.DATABASE_URL, row_factory=psycopg.rows.dict_row) as conn:
        conn.execute(f'SET search_path TO "{lab.DB_SCHEMA}"')
        lab.sync_content(conn, list(courses))


sync(tiny("lama-en", "en"), tiny("gabung", "id"))
mover, mover_email = new_user("10.7.0.1", name="Mover")
old_l = mover.get("/api/courses/lama-en/lessons/lama-en-l1").json
for e in old_l["exercises"]:
    mover.post(f"/api/exercises/{e['id']}/result", {"code": f"print('{e['slug']}')", "passed": 1, "total": 1})
mover.post(f"/api/lessons/{mover.get('/api/courses/lama-en/lessons/lama-en-l2').json['lesson']['id']}/complete")
old_cert = mover.post("/api/courses/lama-en/certificate", {"name": "Mover Lama"}).json["certificate"]
new_l = mover.get("/api/courses/gabung/lessons/gabung-l1").json
mover.post(f"/api/exercises/{new_l['exercises'][0]['id']}/result", {"code": "x", "passed": 0, "total": 1})  # one failed try in the new course
sync(tiny("gabung", "id", replaces=["lama-en"], i18n={"en": {"title": "Merged", "level": "L", "summary": "S", "perks": []}}))
check("the replaced course is gone", anon.get("/api/courses/lama-en").status_code == 404 and not sql("SELECT 1 FROM courses WHERE slug = 'lama-en'"))
moved = mover.get("/api/courses/gabung").json
check("its learner's progress moved to the matching lessons", moved["progress"] == {"done": 2, "total": 2, "percent": 100, "next": None}, moved["progress"])
ml = mover.get("/api/courses/gabung/lessons/gabung-l1").json["exercises"]
check("passes, attempts and code moved to the matching exercises", [e["passed"] for e in ml] == [True, True] and [e["attempts"] for e in ml] == [2, 1]
      and ml[1]["code"]["saved"] == "print('lama-en-x2')", ml)
mc = anon.get(f"/api/certificates/{old_cert['id']}").json["certificate"]
check("the certificate moved and keeps its language", mc["course"]["slug"] == "gabung" and mc["course"]["locale"] == "en" and mc["course"]["title"] == "Merged" and mc["name"] == "Mover Lama", mc)
check("the learner is enrolled in the new course", "gabung" in [c["slug"] for c in mover.get("/api/me/courses").json["courses"]])
subs = sql("SELECT count(*) AS n FROM submissions s JOIN users u ON u.id = s.user_id WHERE u.email = %s", (mover_email,))[0]["n"]
sync(tiny("gabung", "id", replaces=["lama-en"]))
check("syncing again changes nothing", [e["attempts"] for e in mover.get("/api/courses/gabung/lessons/gabung-l1").json["exercises"]] == [2, 1]
      and sql("SELECT count(*) AS n FROM submissions s JOIN users u ON u.id = s.user_id WHERE u.email = %s", (mover_email,))[0]["n"] == subs == 3)
sql("UPDATE courses SET status = 'draft' WHERE slug = 'gabung'")

# certificates issued before courses had two languages get the language of their course, once
sql("UPDATE certificates SET locale = NULL WHERE public_id = %s", (cert["id"],))
sql(lab.SCHEMA_SQL)
check("an older certificate is given its course's language", sql("SELECT locale FROM certificates WHERE public_id = %s", (cert["id"],))[0]["locale"] == "id"
      and sql("SELECT locale FROM certificates WHERE public_id = %s", (cert_en["id"],))[0]["locale"] == "en")

print("\nall passed" if not failed else f"\n{failed} FAILED")
sys.exit(1 if failed else 0)
