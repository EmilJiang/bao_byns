"""Deterministic demo scoring and independent client policy evaluation."""
import os

from .models import CheckoutRequest, Policy


def score_checkout(request: CheckoutRequest):
    bot_email = os.getenv("DEMO_BOT_EMAIL", "bot@gmail.com").strip().casefold()
    is_bot = request.email == bot_email
    return {
        "risk_score": 95 if is_bot else 10,
        "is_bot": is_bot,
        "engine": "demo_email",
        "reasons": ["Email matches the configured demo bot" if is_bot else "Email does not match the configured demo bot"],
    }


def evaluate_checkout(request: CheckoutRequest, policy: Policy):
    score = score_checkout(request)
    violations = []
    if policy.block_high_risk and score["risk_score"] >= policy.risk_threshold:
        violations.append(f"Score {score['risk_score']} meets the rejection threshold of {policy.risk_threshold}")
    # Other policy fields are deliberately display-only controls for this POC.
    return {
        **score,
        "is_fraud": score["risk_score"] >= policy.risk_threshold,
        "status": "blocked" if violations else "approved",
        "reasons": score["reasons"] + violations,
        "policy_reasons": violations,
        "risk_threshold": policy.risk_threshold,
        "policy": policy.model_dump(by_alias=True),
    }
