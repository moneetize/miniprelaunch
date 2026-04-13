import json
import time
from typing import Any

from redis.asyncio import Redis
from redis.exceptions import RedisError


class CacheStore:
    def __init__(self, redis_url: str) -> None:
        self.redis_url = redis_url
        self._redis: Redis | None = None
        self._memory: dict[str, tuple[float, str]] = {}

    async def _get_redis(self) -> Redis | None:
        if self._redis is not None:
            return self._redis

        try:
            self._redis = Redis.from_url(self.redis_url, decode_responses=True)
            await self._redis.ping()
        except RedisError:
            self._redis = None
        return self._redis

    async def get_json(self, key: str) -> Any | None:
        redis = await self._get_redis()
        if redis is not None:
            try:
                cached = await redis.get(key)
                return json.loads(cached) if cached else None
            except RedisError:
                self._redis = None

        entry = self._memory.get(key)
        if not entry:
            return None

        expires_at, payload = entry
        if expires_at < time.time():
            self._memory.pop(key, None)
            return None
        return json.loads(payload)

    async def set_json(self, key: str, value: Any, ttl_seconds: int) -> None:
        payload = json.dumps(value)
        redis = await self._get_redis()
        if redis is not None:
            try:
                await redis.set(key, payload, ex=ttl_seconds)
                return
            except RedisError:
                self._redis = None

        self._memory[key] = (time.time() + ttl_seconds, payload)

    async def ping(self) -> bool:
        redis = await self._get_redis()
        if redis is None:
            return False

        try:
            await redis.ping()
            return True
        except RedisError:
            self._redis = None
            return False
