"""Small admin commands. Run inside the container:

    docker compose exec api python manage.py check-content
    docker compose exec api python manage.py load-content
    docker compose exec api python manage.py make-admin you@example.com
    docker compose exec api python manage.py grant you@example.com python-dasar
    docker compose exec api python manage.py reset-link you@example.com   (a password reset link, when email is not set up)
"""
from __future__ import annotations

import sys

import psycopg
from psycopg.rows import dict_row

import content_loader


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    cmd = argv[1]
    if cmd == "check-content":
        import app  # noqa: F401  (reads CONTENT_DIR)
        courses = content_loader.load_all(app.CONTENT_DIR)
        for c in courses:
            n = sum(len(x["exercises"]) for x in c["lessons"])
            print(f"ok  {c['slug']}: {len(c['lessons'])} lessons, {n} exercises")
        return 0
    import app
    with psycopg.connect(app.DATABASE_URL, row_factory=dict_row) as conn:
        if app.DB_SCHEMA:
            conn.execute(f'SET search_path TO "{app.DB_SCHEMA}"')
        if cmd == "load-content":
            app.sync_content(conn, content_loader.load_all(app.CONTENT_DIR))
            print("Content loaded.")
        elif cmd == "make-admin" and len(argv) == 3:
            n = conn.execute("UPDATE users SET role = 'admin' WHERE lower(email) = lower(%s)", (argv[2],)).rowcount
            print("Done." if n else "No user with that email.")
        elif cmd == "grant" and len(argv) == 4:
            row = conn.execute(
                "SELECT u.id AS uid, c.id AS cid FROM users u, courses c WHERE lower(u.email) = lower(%s) AND c.slug = %s",
                (argv[2], argv[3])).fetchone()
            if not row:
                print("No such user or course.")
                return 1
            conn.execute("INSERT INTO entitlements (user_id, course_id, source) VALUES (%s, %s, 'admin') ON CONFLICT DO NOTHING",
                         (row["uid"], row["cid"]))
            print("Access granted.")
        elif cmd == "reset-link" and len(argv) == 3:
            row = conn.execute("SELECT id FROM users WHERE lower(email) = lower(%s)", (argv[2],)).fetchone()
            if not row:
                print("No user with that email.")
                return 1
            conn.commit()
            with app.app.app_context():
                print("Valid for 1 hour:", app.reset_link(row["id"]))
        else:
            print(__doc__)
            return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
