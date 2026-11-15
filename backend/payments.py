"""Buying a paid module with Stripe Checkout.

The learner is sent to Stripe's own payment page, so no card data touches this server. Access is
granted only when Stripe calls the webhook with a signed "payment completed" event; the page the
learner comes back to never grants anything by itself.

Payments are off until STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are set (see README.md).
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import time
import urllib.error
import urllib.parse
import urllib.request

from flask import abort, jsonify, request

log = logging.getLogger("lab.payments")
STRIPE_API = "https://api.stripe.com/v1"
SIGNATURE_TOLERANCE = 300  # seconds a webhook signature stays valid


class StripeError(Exception):
    pass


def stripe_post(secret_key: str, path: str, params: dict) -> dict:
    """One form-encoded call to the Stripe API (the tests replace this function)."""
    req = urllib.request.Request(
        f"{STRIPE_API}{path}", data=urllib.parse.urlencode(params).encode(), method="POST",
        headers={"Authorization": "Basic " + base64.b64encode(f"{secret_key}:".encode()).decode(),
                 "Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:500]
        raise StripeError(f"Stripe answered {exc.code}: {detail}") from exc
    except (urllib.error.URLError, TimeoutError, ValueError) as exc:
        raise StripeError(f"Stripe could not be reached: {exc}") from exc


def valid_signature(payload: bytes, header: str, secret: str, now: float | None = None) -> bool:
    """Checks the Stripe-Signature header: t=<unix time>,v1=<hmac of "t.payload">[,v1=...]."""
    parts = [p.split("=", 1) for p in header.split(",") if "=" in p]
    stamp = next((v for k, v in parts if k.strip() == "t"), "")
    sent = [v for k, v in parts if k.strip() == "v1"]
    if not secret or not stamp.isdigit() or not sent:
        return False
    if abs((now if now is not None else time.time()) - int(stamp)) > SIGNATURE_TOLERANCE:
        return False
    expected = hmac.new(secret.encode(), stamp.encode() + b"." + payload, hashlib.sha256).hexdigest()
    return any(hmac.compare_digest(expected, v) for v in sent)


def register(app, h) -> None:
    @app.post("/api/courses/<slug>/checkout")
    @h.login_required
    def api_checkout(slug: str):
        user = h.current_user()
        course = h.published_course(slug)
        if not h.stripe_secret_key():
            return jsonify(error="Pembayaran belum dibuka."), 503
        if course["price_idr"] == 0 or h.has_access(user, course):
            return jsonify(error="Kamu sudah punya akses ke modul ini."), 409
        if h.rate_blocked(f"checkout:{user['id']}", 10, 3600):
            return jsonify(error="Terlalu banyak percobaan pembayaran. Coba lagi satu jam lagi."), 429
        h.rate_hit(f"checkout:{user['id']}", 3600)
        back = f"{h.site_url()}/kursus/{course['slug']}"
        try:
            # Stripe counts rupiah with two decimals, so Rp100.000 is sent as 10000000.
            checkout = stripe_post(h.stripe_secret_key(), "/checkout/sessions", {
                "mode": "payment",
                "success_url": f"{back}?paid=1",
                "cancel_url": back,
                "client_reference_id": str(user["id"]),
                "customer_email": user["email"],
                "line_items[0][quantity]": 1,
                "line_items[0][price_data][currency]": "idr",
                "line_items[0][price_data][unit_amount]": course["price_idr"] * 100,
                "line_items[0][price_data][product_data][name]": course["title"],
                "metadata[user_id]": user["id"],
                "metadata[course_id]": course["id"],
            })
            ref, url = checkout["id"], checkout["url"]
        except (StripeError, KeyError, TypeError) as exc:
            log.error("checkout for %s failed: %s", course["slug"], exc)
            return jsonify(error="Pembayaran belum bisa dimulai. Coba lagi sebentar lagi."), 502
        h.db().execute(
            "INSERT INTO orders (user_id, course_id, provider, provider_ref, amount_idr) VALUES (%s, %s, 'stripe', %s, %s)",
            (user["id"], course["id"], ref, course["price_idr"]))
        h.db().commit()
        return jsonify(url=url)

    @app.post("/api/stripe/webhook")
    def api_stripe_webhook():
        payload = request.get_data()
        if not valid_signature(payload, request.headers.get("Stripe-Signature", ""), h.stripe_webhook_secret()):
            abort(400)
        try:
            event = json.loads(payload)
            kind = event["type"]
            obj = event["data"]["object"]
        except (ValueError, KeyError, TypeError):
            abort(400)
        if kind in ("checkout.session.completed", "checkout.session.async_payment_succeeded") and obj.get("payment_status") == "paid":
            # Only an order this server started counts; the amount must be the one we asked for.
            order = h.db().execute(
                "SELECT * FROM orders WHERE provider = 'stripe' AND provider_ref = %s FOR UPDATE", (str(obj.get("id")),)).fetchone()
            if not order:
                log.warning("stripe webhook for an unknown checkout %s", obj.get("id"))
            elif obj.get("currency") != "idr" or obj.get("amount_total") != order["amount_idr"] * 100:
                log.error("stripe checkout %s paid %s %s, expected Rp%s", obj.get("id"), obj.get("amount_total"),
                          obj.get("currency"), order["amount_idr"])
            else:
                h.db().execute("UPDATE orders SET status = 'paid', paid_at = COALESCE(paid_at, now()) WHERE id = %s", (order["id"],))
                h.db().execute(
                    "INSERT INTO entitlements (user_id, course_id, source) VALUES (%s, %s, 'purchase') ON CONFLICT DO NOTHING",
                    (order["user_id"], order["course_id"]))
                h.db().commit()
        return jsonify(received=True)
