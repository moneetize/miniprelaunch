from __future__ import annotations

from typing import Any

import httpx

from app.config import Settings
from app.schemas import InspireItem, ProductItem
from app.services.cache import CacheStore


def unwrap_firestore_value(value: dict[str, Any]) -> Any:
    if "stringValue" in value:
        return value["stringValue"]
    if "integerValue" in value:
        return int(value["integerValue"])
    if "doubleValue" in value:
        return float(value["doubleValue"])
    if "booleanValue" in value:
        return bool(value["booleanValue"])
    if "timestampValue" in value:
        return value["timestampValue"]
    if "arrayValue" in value:
        values = value.get("arrayValue", {}).get("values", [])
        return [unwrap_firestore_value(item) for item in values]
    if "mapValue" in value:
        fields = value.get("mapValue", {}).get("fields", {})
        return {key: unwrap_firestore_value(item) for key, item in fields.items()}
    if "nullValue" in value:
        return None
    return value


def normalize_document(document: dict[str, Any]) -> dict[str, Any]:
    fields = document.get("fields", {})
    normalized = {key: unwrap_firestore_value(value) for key, value in fields.items()}
    normalized["document_name"] = document.get("name", "")
    normalized["createTime"] = document.get("createTime")
    normalized["updateTime"] = document.get("updateTime")
    return normalized


class FirestoreRestClient:
    def __init__(self, settings: Settings, cache: CacheStore) -> None:
        self.settings = settings
        self.cache = cache
        self.base_url = (
            f"https://firestore.googleapis.com/v1/projects/"
            f"{settings.firestore_project_id}/databases/(default)/documents"
        )

    async def list_inspires(self) -> list[InspireItem]:
        cache_key = "catalog:inspires"
        cached = await self.cache.get_json(cache_key)
        if cached:
            return [InspireItem.model_validate(item) for item in cached]

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(
                f"{self.base_url}/inspires",
                params={"key": self.settings.firestore_api_key},
            )
            response.raise_for_status()
            payload = response.json()

        inspires = [
            InspireItem(
                uid=item.get("uid", ""),
                name=item.get("name", ""),
                description=item.get("description", ""),
                image=item.get("image", ""),
                price=item.get("price"),
                created_at=item.get("createdAt"),
            )
            for item in (normalize_document(doc) for doc in payload.get("documents", []))
        ]

        await self.cache.set_json(
            cache_key,
            [item.model_dump(mode="json") for item in inspires],
            self.settings.cache_ttl_seconds,
        )
        return inspires

    async def list_products(
        self,
        *,
        interest_uid: str | None = None,
        page_size: int | None = None,
    ) -> list[ProductItem]:
        page_size = page_size or self.settings.default_catalog_page_size
        cache_key = f"catalog:products:{interest_uid or 'all'}:{page_size}"
        cached = await self.cache.get_json(cache_key)
        if cached:
            return [ProductItem.model_validate(item) for item in cached]

        if interest_uid:
            payload = await self._run_products_query(interest_uid=interest_uid, page_size=page_size)
            documents = [item.get("document") for item in payload if item.get("document")]
        else:
            documents = await self._list_product_documents(page_size=page_size)

        products = [
            ProductItem(
                productuid=item.get("productuid", item["document_name"].split("/")[-1]),
                title=item.get("title", ""),
                description=item.get("description", ""),
                price=float(item.get("price", 0)),
                image_url=item.get("image_url", ""),
                category=item.get("category", ""),
                subcategory=item.get("subcategory", ""),
                rating=item.get("rating"),
                reviews_count=int(item.get("reviews_count", 0)),
                url=item.get("url", ""),
                brand=item.get("brand"),
                seller=item.get("seller"),
                interest=item.get("Interest"),
                inspires_uid=item.get("inspiresUid"),
                all_image_urls=item.get("all_image_urls", []),
            )
            for item in (normalize_document(doc) for doc in documents)
        ]

        await self.cache.set_json(
            cache_key,
            [item.model_dump(mode="json") for item in products],
            self.settings.cache_ttl_seconds,
        )
        return products

    async def _list_product_documents(self, *, page_size: int) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(
                f"{self.base_url}/products",
                params={
                    "key": self.settings.firestore_api_key,
                    "pageSize": page_size,
                },
            )
            response.raise_for_status()
            payload = response.json()
        return payload.get("documents", [])

    async def _run_products_query(self, *, interest_uid: str, page_size: int) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                f"{self.base_url}:runQuery",
                params={"key": self.settings.firestore_api_key},
                json={
                    "structuredQuery": {
                        "from": [{"collectionId": "products"}],
                        "where": {
                            "fieldFilter": {
                                "field": {"fieldPath": "inspiresUid"},
                                "op": "EQUAL",
                                "value": {"stringValue": interest_uid},
                            }
                        },
                        "limit": page_size,
                    }
                },
            )
            response.raise_for_status()
            return response.json()
