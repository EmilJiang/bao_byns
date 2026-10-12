import os
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import Literal
from uuid import uuid4

from fastapi import FastAPI, Query, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import storage
from .detection import detect, ValidationError, timestamp
from .checkout import evaluate_checkout
from .models import ApiResponse, ListMeta, ListResponse, Policy, ResourceMeta, Transaction, CheckoutRequest

@asynccontextmanager
async def lifespan(app):
    storage.initialize()
    yield


app = FastAPI(
    lifespan=lifespan,
    title="Agent Guard Brand Risk API",
    version="0.1.0",
    description="Backend contract for brand-scoped transactions and agent purchase policies.",
)

frontend_origins = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in frontend_origins],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get(
    "/api/v1/brands/{brand_id}/transactions",
    response_model=ListResponse[Transaction],
)
def list_transactions(
    brand_id: str,
    status: Literal["approved", "blocked", "review"] | None = None,
    search: str | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
) -> ListResponse[Transaction]:
    results = storage.list_transactions(brand_id)
    if status:
        results = [transaction for transaction in results if transaction.status == status]
    if search:
        needle = search.casefold()
        results = [
            transaction
            for transaction in results
            if needle in f"{transaction.id} {transaction.merchant} {transaction.agent}".casefold()
        ]

    total = len(results)
    return ListResponse(
        data=results[offset : offset + limit],
        meta=ListMeta(total=total, brandId=brand_id),
    )


@app.get(
    "/api/v1/brands/{brand_id}/policy",
    response_model=ApiResponse[Policy],
)
def get_policy(brand_id: str) -> ApiResponse[Policy]:
    policy, updated_at = storage.get_policy(brand_id)
    return ApiResponse(
        data=policy,
        meta=ResourceMeta(brandId=brand_id, updatedAt=updated_at or datetime.now(UTC)),
    )


@app.put(
    "/api/v1/brands/{brand_id}/policy",
    response_model=ApiResponse[Policy],
)
def update_policy(brand_id: str, policy: Policy) -> ApiResponse[Policy]:
    updated_at = datetime.now(UTC)
    storage.save_policy(brand_id, policy, updated_at)
    return ApiResponse(
        data=policy,
        meta=ResourceMeta(brandId=brand_id, updatedAt=updated_at),
    )


@app.post("/api/v1/brands/{brand_id}/detect-fraud")
def detect_fraud(brand_id: str, transaction: dict = Body(...)):
    try:
        assessment = detect(transaction, os.getenv("DETECTION_MODE", "rules"))
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    occurred = timestamp(transaction["timestamp"])
    saved = Transaction(
        id=f"TX-{uuid4().hex}", merchant=transaction["merchant"]["name"],
        merchantCode=transaction["merchant"]["name"][:2].upper(),
        category="Uncategorized", location=transaction["merchant"]["country"],
        cardLast4="—", agent="Not supplied", agentType="Unknown",
        amount=transaction["amount"], currency=transaction["currency"],
        time=occurred.strftime("%H:%M %z"), date=occurred.date().isoformat(),
        status="blocked" if assessment["is_fraud"] else "approved",
        riskScore=assessment.get("risk_score", assessment.get("baseline_risk_score", 0)),
        reasons=assessment["reasons"], engine=assessment["engine"],
    )
    storage.save_transaction(brand_id, saved, transaction, assessment)
    return {**assessment, "transaction_id": saved.id, "brand_id": brand_id, "status": saved.status}


@app.post("/detect-fraud")
def detect_fraud_default(transaction: dict = Body(...)):
    """Compatibility route for the original Postman request."""
    return detect_fraud("american-airlines", transaction)


@app.post("/api/v1/brands/{brand_id}/checkout")
def checkout(brand_id: str, request: CheckoutRequest):
    policy, _ = storage.get_policy(brand_id)
    assessment = evaluate_checkout(request, policy)
    now = datetime.now(UTC)
    saved = Transaction(
        id=f"TX-{uuid4().hex}", merchant="Agent Guard Demo Store", merchantCode="SS",
        category="Demo purchase", location="US", cardLast4="—",
        agent=request.email, agentType="AI agent" if assessment["is_bot"] else "Human",
        amount=request.price, currency="USD", date=now.date().isoformat(),
        time=now.strftime("%H:%M UTC"), status=assessment["status"],
        riskScore=assessment["risk_score"], reasons=assessment["reasons"],
        engine=assessment["engine"],
    )
    storage.save_transaction(brand_id, saved, request.model_dump(), assessment)
    return {**assessment, "transaction_id": saved.id, "brand_id": brand_id}
