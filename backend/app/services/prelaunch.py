from __future__ import annotations

import random
import uuid

from app.config import Settings
from app.schemas import DashboardResponse, PrelaunchUser, RewardCard, ScratchReward, TeamAvatar
from app.services.cache import CacheStore
from app.services.firestore import FirestoreRestClient


def calculate_level(points: int) -> tuple[int, int]:
    max_points = 250
    percentage = max(0, min(100, round((points / max_points) * 100)))

    if percentage < 20:
        level = 1
    elif percentage < 40:
        level = 2
    elif percentage < 60:
        level = 3
    elif percentage < 80:
        level = 4
    else:
        level = 5

    return level, percentage


class PrelaunchService:
    def __init__(
        self,
        *,
        settings: Settings,
        cache: CacheStore,
        firestore: FirestoreRestClient,
    ) -> None:
        self.settings = settings
        self.cache = cache
        self.firestore = firestore
        self.random = random.Random(7)

    async def build_dashboard(self, interest_uid: str | None = None) -> DashboardResponse:
        inspires = await self.firestore.list_inspires()
        selected_interest_uid = interest_uid or (inspires[0].uid if inspires else "")
        products = await self.firestore.list_products(
            interest_uid=selected_interest_uid or None,
            page_size=6,
        )

        if not products:
            products = await self.firestore.list_products(page_size=6)

        profile = self._demo_profile(selected_interest_uid)
        highlight = products[0] if products else None

        return DashboardResponse(
            source="firebase-rest",
            user=profile,
            team=self._team_avatars(),
            interests=inspires,
            featured_products=products,
            highlight_product=highlight,
            reward_rules=[
                "Non-transferable and non-divisible.",
                "Split across multiple purchases.",
                "Expires 90 days after marketplace launch.",
            ],
            profile_highlights=[
                "Live product catalog is being pulled from the existing Moneetize Firestore project.",
                "Points and level progression follow the balance model used in the current Flutter app.",
                "Scratch rewards can target a real product category based on the selected inspire.",
            ],
        )

    async def create_scratch_reward(self, interest_uid: str) -> ScratchReward:
        products = await self.firestore.list_products(interest_uid=interest_uid, page_size=8)
        if not products:
            products = await self.firestore.list_products(page_size=8)
        if not products:
            raise ValueError("No live products are available to power the scratch reward.")

        featured_product = products[0]
        profile = self._demo_profile(interest_uid)

        points_bonus = 5 + min(10, max(0, featured_product.reviews_count // 5000))
        cash_bonus = min(327, max(42, int(round(featured_product.price * 8.1))))
        balance_before = profile.balance_pts
        balance_after = balance_before + points_bonus
        level_after, progress_percent = calculate_level(balance_after)
        wild_card_name = f"{featured_product.category} Wild Card"
        wild_card_description = (
            f"Boosts discovery rewards for {featured_product.category.lower()} picks and share actions."
        )

        reward = ScratchReward(
            session_id=f"scratch-{uuid.uuid4().hex[:10]}",
            interest_uid=interest_uid,
            points_bonus=points_bonus,
            cash_bonus=cash_bonus,
            wild_card_name=wild_card_name,
            wild_card_description=wild_card_description,
            featured_product=featured_product,
            reward_cards=[
                RewardCard(
                    id="points",
                    type="points",
                    title=f"+ {points_bonus}",
                    subtitle="Moneetize points",
                    description="Applied to your launch balance and level progression.",
                    icon="gem",
                ),
                RewardCard(
                    id="wildcard",
                    type="wildcard",
                    title=wild_card_name,
                    subtitle="Live category boost",
                    description=wild_card_description,
                    icon="wildcard",
                ),
                RewardCard(
                    id="product",
                    type="product",
                    title=self._truncate(featured_product.title, 26),
                    subtitle=f"${featured_product.price:.2f} / {featured_product.category}",
                    description="Featured live product tied to this scratch result.",
                    icon="product",
                    image_url=featured_product.image_url,
                ),
            ],
            balance_before=balance_before,
            balance_after=balance_after,
            level_after=level_after,
            progress_percent=progress_percent,
            activities=[
                f"Banked {cash_bonus} C$ against {featured_product.brand or 'featured'} catalog rewards.",
                f"Unlocked {wild_card_name} for {featured_product.category.lower()} discovery actions.",
                f"Applied +{points_bonus} points to the launch balance.",
            ],
        )

        await self.cache.set_json(
            f"scratch-session:{reward.session_id}",
            reward.model_dump(mode="json"),
            self.settings.scratch_session_ttl_seconds,
        )
        return reward

    def _demo_profile(self, selected_interest_uid: str) -> PrelaunchUser:
        return PrelaunchUser(
            uid="prelaunch-demo",
            user_name="moneetize_rookie",
            full_name="Moneetize Rookie",
            agent_name="Launch Agent",
            avatar_url="",
            balance_pts=15,
            selected_interests=[selected_interest_uid] if selected_interest_uid else [],
            favorites=[],
            invite_url="https://moneetize.com/r/...392D",
        )

    def _team_avatars(self) -> list[TeamAvatar]:
        return [
            TeamAvatar(id="aj", label="AJ", gradient="linear-gradient(135deg, #f6f8fb 0%, #ccd6e6 100%)"),
            TeamAvatar(id="te", label="TE", gradient="linear-gradient(135deg, #7e5e52 0%, #ddbba9 100%)"),
            TeamAvatar(id="rw", label="RW", gradient="linear-gradient(135deg, #f3e6d0 0%, #cab48d 100%)"),
            TeamAvatar(id="ml", label="ML", gradient="linear-gradient(135deg, #f796ad 0%, #ffe0ea 100%)"),
        ]

    def _truncate(self, value: str, limit: int) -> str:
        if len(value) <= limit:
            return value
        return f"{value[: limit - 3].rstrip()}..."
