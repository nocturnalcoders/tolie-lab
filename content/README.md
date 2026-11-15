# Writing a course

One folder per course. A course is written once, in its main language (`locale`), and can carry
a translation next to it. It stays one course: one progress, one certificate. The site shows it in
the visitor's language (the ID / EN switch) and falls back to the main language.

```
content/<course-slug>/course.yml
content/<course-slug>/<NN-lesson-slug>/lesson.md          front matter (title), then Markdown
content/<course-slug>/<NN-lesson-slug>/exercises.yml      list of exercises (optional)
content/<course-slug>/<NN-lesson-slug>/lesson.en.md       the translation of lesson.md
content/<course-slug>/<NN-lesson-slug>/exercises.en.yml   the translation of exercises.yml
```

Folder names and slugs are in English whatever language the course is written in: they are the
addresses of the course (`/kursus/python-basics/hello-coffee-shop`), shared by both languages.

`sql-basics` (SQL), `python-next-steps` (Python) are complete examples of everything below.

## course.yml

```yaml
slug: sql-basics                # same as the folder name; never change it once learners use it
title: SQL Dasar untuk Warung Kopi
language: sql                   # python | sql | javascript run in the browser; java | kotlin are multiple choice only
locale: id                      # the language the course is written in
level: Pemula
kind: course
price_idr: 0
status: published
position: 5                     # order in the catalog
summary: >-
  Two or three sentences.
perks:
  - 6 pelajaran, 12 latihan kode, dan 6 soal pilihan ganda   # real counts
  - Semua latihan dijalankan langsung di browser
  - Sertifikat penyelesaian dari tolie.space dengan tanda tangan Christianto Lie
translations:
  en:
    title: SQL Basics for a Coffee Shop
    level: Beginner
    summary: >-
      The same, in English.
    perks:
      - 6 lessons, 12 coding exercises and 6 multiple-choice questions
      - Every exercise runs right in your browser, nothing to install
      - A completion certificate from tolie.space, signed by Christianto Lie
```

A translation is all or nothing: with `translations: en:` every lesson needs `lesson.en.md`, and
`exercises.en.yml` wherever there is an `exercises.yml`.

## Exercises

```yaml
- slug: apply-discount          # English; lowercase, digits, dashes; unique in the lesson; never change it later
  type: code
  title: Hitung diskon
  prompt: |
    Markdown. Say exactly what to print.
  starter: |
    total = int(input())
    # must NOT already pass every test
  hints:                        # up to 3, opened one at a time: a nudge, a bigger step, nearly the answer
    - "..."
  tests:                        # 3 to 5, with an edge case
    - input: "50000"
      output: "Bayar: Rp50000"
  solution: |
    # must pass every test; never sent to learners

- slug: quiz-conditions
  type: choice
  title: Kondisi yang benar
  prompt: Jika `x = 10`, kondisi mana yang bernilai `True`?
  options: ["`x > 10`", "`x == 10`", "`x != 10`"]
  correct: [1]                  # counting from 0; add `multiple: true` for several correct options
  hint: Optional, shown after a wrong answer.
  explanation: Shown once answered.
```

Output is compared as text. Trailing spaces and blank lines at the end are ignored; everything
else must match exactly, so keep outputs deterministic.

What `input` means depends on the language:

| Language | The learner's code | A test's `input` | Output |
| --- | --- | --- | --- |
| `python` | a program | the lines that `input()` reads | what it prints |
| `javascript` | a program, usually functions | JavaScript run right after the program, in the same scope, e.g. `console.log(total(15000, 2))` | one line per `console.log`: text as it is, numbers as written, arrays and objects as compact JSON (`[1,2,3]`, `{"nama":"Kopi"}`) |
| `sql` | one or more statements | extra SQL run after `setup` and before the learner's script (more rows, so a hard-coded answer fails) | each result table: a header line, then one line per row, values split by `\|`; `NULL` for null |

JavaScript: synchronous code only (no `setTimeout`, promises or `fetch`), strict mode, no `prompt()`.
Because the test's code runs after the program, teach functions early and let the tests call them.
The test shares the program's scope, so a test that needs its own variable wraps it in a block,
`{ const data = [...]; console.log(total(data)); }`, or a learner who used the same name gets a
"has already been declared" error.

SQL exercises also take:

- `setup:` the tables and rows every test starts from (learners can see it). SQLite dialect.
- `check:` optional, for exercises that change data (`INSERT`, `UPDATE`, `DELETE`, `CREATE TABLE`):
  SQL that runs after the learner's script. When set, only its result tables are the output.

Always ask for `ORDER BY` when more than one row comes back, and name the expected columns.

Java and Kotlin cannot run in the browser, so their courses use `type: choice` only: show code
in the lesson and ask what it prints, which line is wrong, or what fills the blank.

## Translating

`exercises.en.yml` lists the same exercises in the same order with the **same slugs**. Translate
everything a learner reads, including variable names, printed texts and data, so the English
version reads naturally. The translation must be graded the same way as the original:

- code: the same number of tests (inputs and outputs may be translated)
- choice: the same number of options, the same `correct`, the same `multiple`

Each language's `solution` must pass its own tests and its `starter` must not.

## Checking

```bash
cd frontend && npm run check-content                      # runs every solution and starter, both languages
docker compose exec api python manage.py check-content    # format, and that translations match
```
