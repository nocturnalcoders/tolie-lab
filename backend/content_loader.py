"""Reads course content from the content/ folder and checks it.

content/<course>/course.yml
content/<course>/<NN-lesson>/lesson.md        (front matter with `title`, then Markdown)
content/<course>/<NN-lesson>/exercises.yml    (list of code and multiple-choice exercises)

Authors only touch these files. `python manage.py check-content` validates them, and the API
imports them into PostgreSQL when it starts. The `solution` of a code exercise is checked by the
frontend script (npm run check-content) and never stored in the database.
"""
from __future__ import annotations

import re
from pathlib import Path

import yaml

SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
LANGUAGES = {"python", "javascript", "sql", "java"}
LOCALES = {"id", "en"}  # the language a course is written in
KINDS = {"course", "module"}
STATUSES = {"draft", "published"}


class ContentError(Exception):
    pass


def _fail(where: str, message: str) -> None:
    raise ContentError(f"{where}: {message}")


def _text(value, where: str, field: str, required: bool = True, limit: int = 20000) -> str:
    if value is None:
        if required:
            _fail(where, f"`{field}` is missing")
        return ""
    if not isinstance(value, str):
        _fail(where, f"`{field}` must be text")
    if required and not value.strip():
        _fail(where, f"`{field}` is empty")
    if len(value) > limit:
        _fail(where, f"`{field}` is longer than {limit} characters")
    return value


def _split_front_matter(raw: str, where: str) -> tuple[dict, str]:
    if not raw.startswith("---\n"):
        _fail(where, "must start with a front matter block (--- title: ... ---)")
    end = raw.find("\n---\n", 4)
    if end == -1:
        _fail(where, "front matter is not closed with ---")
    try:
        meta = yaml.safe_load(raw[4:end]) or {}
    except yaml.YAMLError as exc:
        _fail(where, f"front matter is not valid YAML ({exc})")
    return meta, raw[end + 5:].lstrip("\n")


def validate_exercise(raw: dict, where: str, course_language: str) -> dict:
    if not isinstance(raw, dict):
        _fail(where, "each exercise must be a mapping")
    slug = raw.get("slug")
    if not isinstance(slug, str) or not SLUG.match(slug):
        _fail(where, "`slug` must be lowercase letters, digits and dashes")
    where = f"{where}/{slug}"
    kind = raw.get("type")
    if kind not in ("code", "choice"):
        _fail(where, "`type` must be code or choice")
    ex = {
        "slug": slug,
        "type": kind,
        "title": _text(raw.get("title"), where, "title", limit=120),
        "prompt": _text(raw.get("prompt"), where, "prompt"),
        "required": bool(raw.get("required", True)),
    }
    if kind == "code":
        language = raw.get("language", course_language)
        if language not in LANGUAGES:
            _fail(where, f"`language` must be one of {sorted(LANGUAGES)}")
        tests = raw.get("tests")
        if not isinstance(tests, list) or not tests:
            _fail(where, "`tests` must be a non-empty list")
        clean = []
        for i, t in enumerate(tests, 1):
            if not isinstance(t, dict) or "output" not in t:
                _fail(where, f"test {i} needs an `output`")
            clean.append({"input": str(t.get("input", "")), "output": str(t["output"])})
        ex["config"] = {
            "language": language,
            "solution": _text(raw.get("solution"), where, "solution", limit=8000),  # admin-only, never sent to learners
            "starter": _text(raw.get("starter"), where, "starter", required=False, limit=8000),
            "tests": clean,
            "hint": _text(raw.get("hint"), where, "hint", required=False, limit=600),
        }
    else:
        options = raw.get("options")
        if not isinstance(options, list) or not 2 <= len(options) <= 8 or not all(isinstance(o, str) and o.strip() for o in options):
            _fail(where, "`options` must be 2 to 8 non-empty texts")
        correct = raw.get("correct")
        if (not isinstance(correct, list) or not correct
                or not all(isinstance(i, int) and not isinstance(i, bool) and 0 <= i < len(options) for i in correct)
                or len(set(correct)) != len(correct)):
            _fail(where, "`correct` must list valid option numbers (counting from 0)")
        multiple = bool(raw.get("multiple", False))
        if not multiple and len(correct) != 1:
            _fail(where, "a single-answer question needs exactly one correct option (or set `multiple: true`)")
        ex["config"] = {
            "options": options,
            "correct": sorted(correct),
            "multiple": multiple,
            "hint": _text(raw.get("hint"), where, "hint", required=False, limit=600),
            "explanation": _text(raw.get("explanation"), where, "explanation", limit=1200),
        }
    return ex


def load_course(folder: Path) -> dict:
    where = folder.name
    meta_file = folder / "course.yml"
    if not meta_file.is_file():
        _fail(where, "course.yml is missing")
    try:
        meta = yaml.safe_load(meta_file.read_text(encoding="utf-8")) or {}
    except yaml.YAMLError as exc:
        _fail(where, f"course.yml is not valid YAML ({exc})")
    slug = meta.get("slug")
    if not isinstance(slug, str) or not SLUG.match(slug):
        _fail(where, "`slug` must be lowercase letters, digits and dashes")
    language = meta.get("language")
    if language not in LANGUAGES:
        _fail(where, f"`language` must be one of {sorted(LANGUAGES)}")
    kind = meta.get("kind", "course")
    status = meta.get("status", "draft")
    price = meta.get("price_idr", 0)
    if kind not in KINDS:
        _fail(where, "`kind` must be course or module")
    if status not in STATUSES:
        _fail(where, "`status` must be draft or published")
    if not isinstance(price, int) or isinstance(price, bool) or price < 0:
        _fail(where, "`price_idr` must be a whole number, 0 or more")
    perks = meta.get("perks", [])
    if not isinstance(perks, list) or len(perks) > 12 or not all(isinstance(x, str) and 0 < len(x.strip()) <= 160 for x in perks):
        _fail(where, "`perks` must be a list of up to 12 short texts")
    locale = meta.get("locale", "id")
    if locale not in LOCALES:
        _fail(where, "`locale` must be id or en")
    course = {
        "locale": locale,
        "perks": [x.strip() for x in perks],
        "certificate": bool(meta.get("certificate", True)),
        "slug": slug,
        "title": _text(meta.get("title"), where, "title", limit=120),
        "language": language,
        "level": _text(meta.get("level"), where, "level", limit=40),
        "kind": kind,
        "price_idr": price,
        "status": status,
        "position": int(meta.get("position", 100)),
        "summary": _text(meta.get("summary"), where, "summary", limit=600).strip(),
        "lessons": [],
    }
    seen_lessons: set[str] = set()
    for sub in sorted(p for p in folder.iterdir() if p.is_dir()):
        m = re.match(r"^(\d+)-(.+)$", sub.name)
        if not m or not SLUG.match(m.group(2)):
            _fail(f"{where}/{sub.name}", "lesson folders are named like 01-lesson-slug")
        lslug = m.group(2)
        if lslug in seen_lessons:
            _fail(f"{where}/{sub.name}", "duplicate lesson slug")
        seen_lessons.add(lslug)
        lwhere = f"{where}/{sub.name}"
        md_file = sub / "lesson.md"
        if not md_file.is_file():
            _fail(lwhere, "lesson.md is missing")
        front, body = _split_front_matter(md_file.read_text(encoding="utf-8"), f"{lwhere}/lesson.md")
        lesson = {
            "slug": lslug,
            "title": _text(front.get("title"), f"{lwhere}/lesson.md", "title", limit=120),
            "body": _text(body, f"{lwhere}/lesson.md", "body"),
            "exercises": [],
        }
        ex_file = sub / "exercises.yml"
        if ex_file.is_file():
            try:
                items = yaml.safe_load(ex_file.read_text(encoding="utf-8")) or []
            except yaml.YAMLError as exc:
                _fail(f"{lwhere}/exercises.yml", f"not valid YAML ({exc})")
            if not isinstance(items, list):
                _fail(f"{lwhere}/exercises.yml", "must be a list")
            seen: set[str] = set()
            for raw in items:
                ex = validate_exercise(raw, f"{lwhere}/exercises.yml", language)
                if ex["slug"] in seen:
                    _fail(f"{lwhere}/exercises.yml", f"duplicate exercise slug `{ex['slug']}`")
                seen.add(ex["slug"])
                lesson["exercises"].append(ex)
        course["lessons"].append(lesson)
    if not course["lessons"]:
        _fail(where, "a course needs at least one lesson folder")
    return course


def load_all(content_dir: Path) -> list[dict]:
    if not content_dir.is_dir():
        raise ContentError(f"content folder not found: {content_dir}")
    courses = [load_course(p) for p in sorted(content_dir.iterdir()) if p.is_dir() and not p.name.startswith(".")]
    slugs = [c["slug"] for c in courses]
    if len(set(slugs)) != len(slugs):
        raise ContentError("two courses share the same slug")
    return courses


def validate_course_meta(meta: dict, where: str = "course") -> dict:
    """Checks the settings of a course (used by the admin API; files go through load_course)."""
    slug = meta.get("slug")
    if not isinstance(slug, str) or not SLUG.match(slug):
        _fail(where, "`slug` must be lowercase letters, digits and dashes")
    if meta.get("language") not in LANGUAGES:
        _fail(where, f"`language` must be one of {sorted(LANGUAGES)}")
    if meta.get("kind", "course") not in KINDS:
        _fail(where, "`kind` must be course or module")
    if meta.get("status", "draft") not in STATUSES:
        _fail(where, "`status` must be draft or published")
    price = meta.get("price_idr", 0)
    if not isinstance(price, int) or isinstance(price, bool) or not 0 <= price <= 100_000_000:
        _fail(where, "`price_idr` must be a whole number, 0 or more")
    position = meta.get("position", 100)
    if not isinstance(position, int) or isinstance(position, bool):
        _fail(where, "`position` must be a whole number")
    perks = meta.get("perks", [])
    if not isinstance(perks, list) or len(perks) > 12 or not all(isinstance(x, str) and 0 < len(x.strip()) <= 160 for x in perks):
        _fail(where, "`perks` must be a list of up to 12 short texts")
    if meta.get("locale", "id") not in LOCALES:
        _fail(where, "`locale` must be id or en")
    return {
        "slug": slug,
        "locale": meta.get("locale", "id"),
        "title": _text(meta.get("title"), where, "title", limit=120).strip(),
        "language": meta["language"],
        "level": _text(meta.get("level"), where, "level", limit=40).strip(),
        "kind": meta.get("kind", "course"),
        "price_idr": price,
        "status": meta.get("status", "draft"),
        "position": position,
        "summary": _text(meta.get("summary"), where, "summary", limit=600).strip(),
        "perks": [x.strip() for x in perks],
        "certificate": bool(meta.get("certificate", True)),
    }


def validate_lesson(raw: dict, where: str = "lesson") -> dict:
    slug = raw.get("slug")
    if not isinstance(slug, str) or not SLUG.match(slug):
        _fail(where, "`slug` must be lowercase letters, digits and dashes")
    return {
        "slug": slug,
        "title": _text(raw.get("title"), where, "title", limit=120).strip(),
        "body": _text(raw.get("body"), where, "body"),
    }


def load_plans(content_dir: Path, lang: str = "id") -> list[dict]:
    """content/plans.yml: the free / paid comparison shown on the home page (optional).

    The file has one list per site language:  id: [...]   en: [...]
    A language without a list falls back to Indonesian.
    """
    path = content_dir / "plans.yml"
    if not path.is_file():
        return []
    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    except yaml.YAMLError as exc:
        raise ContentError(f"plans.yml: not valid YAML ({exc})") from exc
    if not isinstance(data, dict):
        raise ContentError("plans.yml: must have one list per language (id, en)")
    plans = data.get(lang) or data.get("id")
    if not isinstance(plans, list) or not 1 <= len(plans) <= 4:
        raise ContentError(f"plans.yml: `{lang}` must be a list of 1 to 4 plans")
    out = []
    for i, p in enumerate(plans, 1):
        where = f"plans.yml/{lang}/plan {i}"
        if not isinstance(p, dict):
            _fail(where, "must be a mapping")
        perks = p.get("perks")
        if not isinstance(perks, list) or not perks or not all(isinstance(x, str) and x.strip() for x in perks):
            _fail(where, "`perks` must be a non-empty list of texts")
        out.append({
            "id": _text(p.get("id"), where, "id", limit=40),
            "name": _text(p.get("name"), where, "name", limit=60),
            "price": _text(p.get("price"), where, "price", limit=80),
            "tagline": _text(p.get("tagline"), where, "tagline", limit=160),
            "perks": [x.strip() for x in perks],
            "highlight": bool(p.get("highlight", False)),
        })
    return out
