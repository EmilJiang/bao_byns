import os
from datetime import UTC, datetime
from typing import Literal

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from .data import DEFAULT_POLICY, POLICIES, TRANSACTIONS
from .models import ApiResponse, ListMeta, ListResponse, Policy, ResourceMeta, Transaction

app = FastAPI(
    title="Sentra Brand Risk API",
    version="0.1.0",
    description="Backend contract for brand-scoped transactions and agent purchase policies.",
)

frontend_origins = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in frontend_origins],
    allow_credentials=True,
    allow_methods=["GET", "PUT", "OPTIONS"],
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
    results = TRANSACTIONS
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
    return ApiResponse(
        data=POLICIES.get(brand_id, DEFAULT_POLICY),
        meta=ResourceMeta(brandId=brand_id, updatedAt=datetime.now(UTC)),
    )


@app.put(
    "/api/v1/brands/{brand_id}/policy",
    response_model=ApiResponse[Policy],
)
def update_policy(brand_id: str, policy: Policy) -> ApiResponse[Policy]:
    POLICIES[brand_id] = policy
    return ApiResponse(
        data=policy,
        meta=ResourceMeta(brandId=brand_id, updatedAt=datetime.now(UTC)),
    )
