#!/usr/bin/env python3
"""Point lab.tolie.space in the Caddyfile at the Docker stack (one reverse proxy line).

Run as root. It backs up the Caddyfile, validates the new config, reloads only if the config is
valid, and restores the backup if anything fails. The other sites in the file (including your
other apps) are left untouched. If there is no lab.tolie.space block yet, one is added at the end.
"""
import os
import re
import shutil
import subprocess
import sys
import time

CADDYFILE = "/etc/caddy/Caddyfile"
HOST = "lab." + "tolie.space"
PORT = 8789

NEW_BLOCK = (
    f"{HOST} {{\n"
    "\tencode zstd gzip\n"
    f"\treverse_proxy 127.0.0.1:{PORT}\n"
    "}"
)


def find_block(text, host):
    match = re.search(r"(?m)^" + re.escape(host) + r"\s*\{", text)
    if not match:
        return None
    depth, i = 1, match.end()
    while i < len(text) and depth:
        depth += (text[i] == "{") - (text[i] == "}")
        i += 1
    return match.start(), i


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def main():
    if os.geteuid() != 0:
        sys.exit("Run this as root (in the Droplet Web Console).")
    text = open(CADDYFILE, encoding="utf-8").read()
    span = find_block(text, HOST)
    if span is not None and f"reverse_proxy 127.0.0.1:{PORT}" in text[span[0]:span[1]] and "root " not in text[span[0]:span[1]]:
        print("Already configured. Nothing to do.")
        return
    backup = f"{CADDYFILE}.bak-lab-{time.strftime('%Y%m%d-%H%M%S')}"
    shutil.copy2(CADDYFILE, backup)
    print(f"Backup saved: {backup}")
    if span is None:
        new_text = text.rstrip("\n") + "\n\n" + NEW_BLOCK + "\n"
    else:
        new_text = text[:span[0]] + NEW_BLOCK + text[span[1]:]
    open(CADDYFILE, "w", encoding="utf-8").write(new_text)
    check = run(["caddy", "validate", "--config", CADDYFILE, "--adapter", "caddyfile"])
    if check.returncode != 0:
        shutil.copy2(backup, CADDYFILE)
        print(check.stderr[-1500:])
        sys.exit("Validation failed. Your old Caddyfile was restored. Nothing changed.")
    reload = run(["systemctl", "reload", "caddy"])
    if reload.returncode != 0:
        shutil.copy2(backup, CADDYFILE)
        print(reload.stderr)
        sys.exit("Reload failed. Your old Caddyfile was restored.")
    print("Done. Caddy now sends", HOST, "to the lab on port", PORT)


if __name__ == "__main__":
    main()
