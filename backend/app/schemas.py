from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class InspireItem(BaseModel):
    uid: str
    name: str
    description: str
    image: str
    price: str | None = None
    created_at: datetime | None = None


class ProductItem(BaseModel):
    productuid: str
    title: str
    description: str
    price: float
    image_url: str
    category: str
    subcategory: str
    rating: str | None = None
    reviews_count: int = 0
    url: str
    brand: str | None = None
    seller: str | None = None
    interest: str | None = None
    inspires_uid: str | None = None
    all_image_urls: list[str] = Field(default_factory=list)


class PrelaunchUser(BaseModel):
    uid: str
    user_name: str
    full_name: str
    agent_name: str
    avatar_url: str
    balance_pts: int
    selected_interests: list[str] = Field(default_factory=list)
    favorites: list[str] = Field(default_factory=list)
    invite_url: str


class TeamAvatar(BaseModel):
    id: str
    label: str
    gradient: str


class RewardCard(BaseModel):
    id: str
    type: Literal["points", "wildcard", "product"]
    title: str
    subtitle: str
    description: str
    icon: Literal["gem", "wildcard", "product"]
    image_url: str | None = None


class ScratchReward(BaseModel):
    session_id: str
    interest_uid: str
    points_bonus: int
    cash_bonus: int
    wild_card_name: str
    wild_card_description: str
    featured_product: ProductItem
    reward_cards: list[RewardCard]
    balance_before: int
    balance_after: int
    level_after: int
    progress_percent: int
    activities: list[str]


class DashboardResponse(BaseModel):
    source: Literal["firebase-rest"]
    user: PrelaunchUser
    team: list[TeamAvatar]
    interests: list[InspireItem]
    featured_products: list[ProductItem]
    highlight_product: ProductItem | None = None
    scratch_attempts_left: int = 4
    countdown_seconds: int = 10 * 60 * 60 + 8 * 60 + 32
    reward_rules: list[str]
    profile_highlights: list[str]


class ScratchRequest(BaseModel):
    interest_uid: str


class HealthResponse(BaseModel):
    status: str
    app: str
    redis: str
