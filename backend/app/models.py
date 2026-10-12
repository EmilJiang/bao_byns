from datetime import datetime
from typing import Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict, Field


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
    agent_type: Literal["AI agent", "Human"] = Field(alias="agentType")
    amount: float
    time: str
    date: str
    status: Literal["approved", "blocked", "review"]
    risk_score: int = Field(alias="riskScore", ge=0, le=100)


class Policy(ApiModel):
    agent_purchases: bool = Field(alias="agentPurchases")
    max_amount: float = Field(alias="maxAmount", gt=0)
    trusted_agents_only: bool = Field(alias="trustedAgentsOnly")
    block_high_risk: bool = Field(alias="blockHighRisk")
    block_international: bool = Field(alias="blockInternational")


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
