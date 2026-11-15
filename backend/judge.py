"""Running Java and Kotlin exercises on a remote compiler (JDoodle).

These languages cannot run in the learner's browser, so their code is sent to JDoodle's compiler
API and graded here. One check costs one JDoodle credit whatever the number of tests: the
learner's program is wrapped in a small harness that runs it once per test inside a single
execution and reports each output on its own line.

Off until JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET are set (see README.md). The plan's daily
credits are few, so they are counted here: per day for the whole site, and per learner.

    python judge.py check ../content     check every Java/Kotlin solution and starter with the
                                         compilers on this machine (javac, kotlinc), no credits
    python judge.py check ../content --remote     the ones without a local compiler go to JDoodle
"""
from __future__ import annotations

import base64
import json
import logging
import os
import re
import secrets
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
from pathlib import Path

log = logging.getLogger("lab.judge")
API_URL = "https://api.jdoodle.com/v1/execute"
# JDoodle's name for the language and the position of the version in its list (JDK 17, Kotlin 1.9).
REMOTE = {"java": ("java", "4"), "kotlin": ("kotlin", "4")}
LANGUAGES = set(REMOTE)
MAX_OUTPUT = 20000  # bytes kept per test


class JudgeError(Exception):
    """The remote compiler could not be used (network, credentials, their daily limit)."""

    def __init__(self, message: str, out_of_credits: bool = False):
        super().__init__(message)
        self.out_of_credits = out_of_credits


# --------------------------------------------------------------------------
# Comparing output (the same rule as frontend/src/grading.js)
# --------------------------------------------------------------------------
def normalize(text: str) -> str:
    lines = [re.sub(r"[ \t]+$", "", line) for line in str(text or "").replace("\r\n", "\n").split("\n")]
    return "\n".join(lines).rstrip("\n")


# --------------------------------------------------------------------------
# The harness: one program that runs the learner's program once per test
# --------------------------------------------------------------------------
def _b64(text: str) -> str:
    return base64.b64encode(text.encode("utf-8")).decode("ascii")


JAVA_HARNESS = """
public class Main {
    public static void main(String[] args) throws Exception {
        String[] inputs = { %(inputs)s };
        java.io.PrintStream console = System.out;
        java.util.Base64.Encoder enc = java.util.Base64.getEncoder();
        for (int i = 0; i < inputs.length; i++) {
            java.io.ByteArrayOutputStream buf = new java.io.ByteArrayOutputStream();
            System.setIn(new java.io.ByteArrayInputStream(java.util.Base64.getDecoder().decode(inputs[i])));
            System.setOut(new java.io.PrintStream(buf, true, "UTF-8"));
            String err = "";
            try {
                LearnerMain.main(new String[0]);
            } catch (Throwable t) {
                err = t.toString();
            }
            System.out.flush();
            System.setOut(console);
            byte[] out = buf.toByteArray();
            if (out.length > %(limit)d) out = java.util.Arrays.copyOf(out, %(limit)d);
            console.println("%(token)s " + i + " " + enc.encodeToString(out) + " ." + enc.encodeToString(err.getBytes("UTF-8")));
        }
    }
}
"""

KOTLIN_HARNESS = """
// JDoodle starts Kotlin programs through a class of this name.
class JDoodle {
    companion object {
        @JvmStatic fun main(args: Array<String>) = runTests()
    }
}

fun main(args: Array<String>) = runTests()

fun runTests() {
    val inputs = arrayOf(%(inputs)s)
    val console = System.out
    val enc = java.util.Base64.getEncoder()
    for ((i, input) in inputs.withIndex()) {
        val buf = java.io.ByteArrayOutputStream()
        System.setIn(java.io.ByteArrayInputStream(java.util.Base64.getDecoder().decode(input)))
        System.setOut(java.io.PrintStream(buf, true, "UTF-8"))
        var err = ""
        try {
            learnerMain(%(args)s)
        } catch (t: Throwable) {
            err = t.toString()
        }
        System.out.flush()
        System.setOut(console)
        var out = buf.toByteArray()
        if (out.size > %(limit)d) out = out.copyOf(%(limit)d)
        console.println("%(token)s " + i + " " + enc.encodeToString(out) + " ." + enc.encodeToString(err.toByteArray()))
    }
}
"""


def build_program(language: str, code: str, inputs: list[str], token: str) -> str:
    """The learner's program with its entry point renamed, followed by the harness that calls it per test."""
    values = {"inputs": ", ".join(f'"{_b64(x if x.endswith(chr(10)) or not x else x + chr(10))}"' for x in inputs),
              "limit": MAX_OUTPUT, "token": token}
    if language == "java":
        # The learner's class is `Main` (as in every lesson); it steps aside for the harness.
        learner = re.sub(r"\bpublic\s+((?:final\s+)?class\s+Main\b)", r"\1", code)
        learner = re.sub(r"\bMain\b", "LearnerMain", learner)
        return learner.rstrip() + "\n" + JAVA_HARNESS % values
    match = re.search(r"\bfun\s+main\s*\(([^)]*)\)", code)
    learner = re.sub(r"\bfun\s+main\s*\(", "fun learnerMain(", code, count=1)
    values["args"] = "arrayOf()" if match and match.group(1).strip() else ""
    return learner.rstrip() + "\n" + KOTLIN_HARNESS % values


def read_report(output: str, token: str, count: int) -> list[dict | None]:
    """Per test: {stdout, error}, or None for a test the program never reached."""
    found: list[dict | None] = [None] * count
    for line in str(output or "").splitlines():
        parts = line.strip().split(" ")
        if len(parts) == 4 and parts[0] == token and parts[1].isdigit() and int(parts[1]) < count and parts[3].startswith("."):
            try:
                found[int(parts[1])] = {"stdout": base64.b64decode(parts[2]).decode("utf-8", "replace"),
                                        "error": base64.b64decode(parts[3][1:]).decode("utf-8", "replace")}
            except ValueError:
                continue
    return found


def grade(language: str, code: str, tests: list[dict], execute) -> dict:
    """Runs `code` against `tests` with `execute(program) -> output text` and compares each output.

    -> {results: [{index, ok, input, expected, actual, error}], passed, total, message}
    `message` is the compiler's or runtime's own text when the program did not get through the tests.
    """
    token = "T" + secrets.token_hex(8)
    output = execute(build_program(language, code, [t.get("input", "") for t in tests], token))
    output = re.sub(r"\b[lL]earnerMain\b", lambda m: "Main" if m.group(0)[0] == "L" else "main", str(output or ""))  # the learner's own names
    report = read_report(output, token, len(tests))
    leftover = "\n".join(line for line in str(output or "").splitlines() if not line.strip().startswith(token)).strip()
    results = []
    for i, (t, r) in enumerate(zip(tests, report)):
        if r is None:
            results.append({"index": i, "ok": False, "input": t.get("input", ""), "expected": t["output"], "actual": "",
                            "error": leftover[:2000] or "The program stopped before this test finished."})
        else:
            ok = not r["error"] and normalize(r["stdout"]) == normalize(t["output"])
            results.append({"index": i, "ok": ok, "input": t.get("input", ""), "expected": t["output"],
                            "actual": r["stdout"], "error": r["error"]})
    return {"results": results, "passed": sum(1 for r in results if r["ok"]), "total": len(tests),
            "message": leftover[:2000] if any(r is None for r in report) else ""}


# --------------------------------------------------------------------------
# Where the program runs: JDoodle, or the compilers on this machine (for checking content)
# --------------------------------------------------------------------------
def jdoodle_execute(client_id: str, client_secret: str, language: str, program: str) -> str:
    """One run on JDoodle = one credit (the tests replace this function)."""
    name, version = REMOTE[language]
    body = json.dumps({"clientId": client_id, "clientSecret": client_secret, "script": program,
                       "language": name, "versionIndex": version}).encode()
    req = urllib.request.Request(API_URL, data=body, method="POST", headers={"Content-Type": "application/json", "User-Agent": "tolie-lab/1.0"})  # their firewall turns away Python's default agent
    try:
        with urllib.request.urlopen(req, timeout=40) as resp:
            data = json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:300]
        raise JudgeError(f"JDoodle answered {exc.code}: {detail}", out_of_credits=exc.code == 429) from exc
    except (urllib.error.URLError, TimeoutError, ValueError) as exc:
        raise JudgeError(f"JDoodle could not be reached: {exc}") from exc
    if not isinstance(data, dict) or "output" not in data:
        message = str(data.get("error", data) if isinstance(data, dict) else data)[:300]
        raise JudgeError(f"JDoodle refused the run: {message}",
                         out_of_credits=isinstance(data, dict) and data.get("statusCode") == 429)
    return str(data["output"] or "")


def local_execute(language: str, program: str) -> str | None:
    """Compiles and runs with javac/kotlinc on this machine. None when the compiler is not installed."""
    with tempfile.TemporaryDirectory() as tmp:
        if language == "java":
            if not (shutil.which("javac") and shutil.which("java")):
                return None
            (Path(tmp) / "Main.java").write_text(program, encoding="utf-8")
            steps = [["javac", "-encoding", "UTF-8", "-d", tmp, str(Path(tmp) / "Main.java")], ["java", "-cp", tmp, "Main"]]
        else:
            if not (shutil.which("kotlinc") and shutil.which("java")):
                return None
            (Path(tmp) / "main.kt").write_text(program, encoding="utf-8")
            steps = [["kotlinc", str(Path(tmp) / "main.kt"), "-include-runtime", "-d", str(Path(tmp) / "main.jar")],
                     ["java", "-jar", str(Path(tmp) / "main.jar")]]
        out = ""
        for step in steps:
            done = subprocess.run(step, capture_output=True, text=True, timeout=180)
            out = done.stdout + done.stderr
            if done.returncode != 0:
                break
        return out


# --------------------------------------------------------------------------
# The API
# --------------------------------------------------------------------------
def register(app, h) -> None:
    from flask import abort, jsonify  # only needed when serving

    def credits_left() -> int:
        row = h.db().execute("SELECT used FROM judge_usage WHERE day = (now() AT TIME ZONE 'UTC')::date").fetchone()
        return max(0, h.judge_daily_credits() - (row["used"] if row else 0))

    @app.post("/api/exercises/<int:exercise_id>/judge")
    @h.login_required
    def api_judge(exercise_id: int):
        user = h.current_user()
        ex, _course = h.load_exercise(exercise_id)
        cfg = h.translation(ex).get("config", ex["config"])
        code = h.json_body().get("code")
        if ex["type"] != "code" or cfg["language"] not in LANGUAGES or not isinstance(code, str) or not code.strip() or len(code) > h.max_code():
            return jsonify(error="Kode tidak valid."), 400
        client_id, client_secret = h.judge_keys()
        if not client_id or not client_secret:
            return jsonify(error="Menjalankan kode untuk bahasa ini belum dibuka."), 503
        if h.rate_blocked(f"judge:{user['id']}", h.judge_user_daily(), 86400):
            return jsonify(error="Jatah menjalankan kode hari ini sudah habis untuk akunmu. Coba lagi besok."), 429
        # JDoodle counts its day in UTC, so the site's count does too.
        reserved = h.db().execute(
            """INSERT INTO judge_usage (day, used) VALUES ((now() AT TIME ZONE 'UTC')::date, 1)
               ON CONFLICT (day) DO UPDATE SET used = judge_usage.used + 1 WHERE judge_usage.used < %s RETURNING used""",
            (h.judge_daily_credits(),)).fetchone()
        h.db().commit()
        if not reserved:
            return jsonify(error="Jatah harian situs untuk menjalankan kode sudah habis. Coba lagi besok."), 429
        h.rate_hit(f"judge:{user['id']}", 86400)
        try:
            out = grade(cfg["language"], code, cfg["tests"],
                        lambda program: jdoodle_execute(client_id, client_secret, cfg["language"], program))
        except JudgeError as exc:
            log.error("judge for exercise %s failed: %s", exercise_id, exc)
            if exc.out_of_credits:  # their count is ahead of ours: stop asking until tomorrow
                h.db().execute("UPDATE judge_usage SET used = %s WHERE day = (now() AT TIME ZONE 'UTC')::date", (h.judge_daily_credits(),))
                h.db().commit()
                return jsonify(error="Jatah harian situs untuk menjalankan kode sudah habis. Coba lagi besok."), 429
            h.db().execute("UPDATE judge_usage SET used = greatest(used - 1, 0) WHERE day = (now() AT TIME ZONE 'UTC')::date")
            h.db().commit()
            return jsonify(error="Kode belum bisa dijalankan sekarang. Coba lagi sebentar lagi."), 502
        ok = out["passed"] == out["total"]
        h.record(user["id"], ex, passed=ok, graded_in="server", tests_passed=out["passed"], tests_total=out["total"], code=code)
        out.update(recorded=True, all_passed=ok, credits_left=credits_left())
        if ok:
            out.update(h.after_pass(user["id"], ex))
        return jsonify(out)


# --------------------------------------------------------------------------
# Checking the content files
# --------------------------------------------------------------------------
def check(content_dir: Path, remote: bool) -> int:
    import content_loader as cl

    keys = (os.environ.get("JDOODLE_CLIENT_ID", ""), os.environ.get("JDOODLE_CLIENT_SECRET", ""))
    problems = checked = skipped = 0
    for course in cl.load_all(content_dir):
        for lesson in course["lessons"]:
            for ex in lesson["exercises"]:
                if ex["type"] != "code" or ex["config"]["language"] not in LANGUAGES:
                    continue
                versions = [("", ex["config"])] + [(f" ({k})", v["config"]) for k, v in ex["i18n"].items()]
                done: dict[tuple, dict] = {}
                for label, cfg in versions:
                    where = f"{course['slug']}/{lesson['slug']}/{ex['slug']}{label}"
                    for role in ("solution", "starter"):
                        # a translation with the same code and tests as the original is not run twice
                        key = (cfg.get(role, ""), json.dumps(cfg["tests"], sort_keys=True))
                        if key not in done:
                            def run(program, language=cfg["language"]):
                                out = local_execute(language, program)
                                if out is None and remote and all(keys):
                                    out = jdoodle_execute(*keys, language, program)
                                if out is None:
                                    raise LookupError
                                return out
                            try:
                                done[key] = grade(cfg["language"], cfg.get(role, ""), cfg["tests"], run)
                            except LookupError:
                                done[key] = None
                        res = done[key]
                        if res is None:
                            skipped += 1
                            continue
                        checked += 1
                        if role == "solution" and res["passed"] != res["total"]:
                            problems += 1
                            bad = next(r for r in res["results"] if not r["ok"])
                            print(f"FAIL {where}: the solution fails {res['total'] - res['passed']}/{res['total']} tests")
                            print("     ", json.dumps({k: bad[k][:200] for k in ("input", "expected", "actual", "error")}, ensure_ascii=False))
                        if role == "starter" and res["passed"] == res["total"]:
                            problems += 1
                            print(f"FAIL {where}: the starter code already passes every test")
    note = f", {skipped} not run (no compiler on this machine; add --remote to use JDoodle credits)" if skipped else ""
    print(f"{checked} Java/Kotlin programs checked, {problems} problem(s){note}")
    return 1 if problems else 0


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "check":
        sys.exit(check(Path(sys.argv[2]), "--remote" in sys.argv))
    print(__doc__)
    sys.exit(2)
