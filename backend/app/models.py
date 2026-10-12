from datetime import datetime
from typing import Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ApiModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class Transaction(ApiModel):
    id: str
    merchant: str
    merchant_code: str = Field(alias="merchantCode")
    category: str
    location: str
    card_last4: str = Field(alias="cardLast4")
    agent: str
    agent_type: Literal["AI agent", "Human", "Unknown"] = Field(alias="agentType")
    amount: float
    currency: str = "USD"
    reasons: list[str] = Field(default_factory=list)
    engine: str = "demo"
    time: str
    date: str
    status: Literal["approved", "blocked", "review"]
    risk_score: int = Field(alias="riskScore", ge=0, le=100)


class Policy(ApiModel):
    agent_purchases: bool = Field(alias="agentPurchases")
    max_amount: float = Field(alias="maxAmount", gt=0, allow_inf_nan=False)
    trusted_agents_only: bool = Field(alias="trustedAgentsOnly")
    block_high_risk: bool = Field(alias="blockHighRisk")
    block_international: bool = Field(alias="blockInternational")
    risk_threshold: int = Field(default=50, alias="riskThreshold", ge=1, le=100)


class CheckoutRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: str = Field(min_length=3, max_length=254)
    price: float = Field(gt=0, le=1_000_000, allow_inf_nan=False)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value):
        import re
        normalized = value.strip().casefold()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", normalized):
            raise ValueError("Enter a valid email address")
        return normalized

    @field_validator("price", mode="before")
    @classmethod
    def numeric_price(cls, value):
        if type(value) not in (int, float):
            raise ValueError("price must be a number")
        return value


class ListMeta(ApiModel):
    total: int
    brand_id: str = Field(alias="brandId")


class ResourceMeta(ApiModel):
    brand_id: str = Field(alias="brandId")
    updated_at: datetime = Field(alias="updatedAt")


T = TypeVar("T")


class ApiResponse(ApiModel, Generic[T]):
    data: T
    meta: ResourceMeta


class ListResponse(ApiModel, Generic[T]):
    data: list[T]
    meta: ListMeta
