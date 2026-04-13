from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.schemas import DashboardResponse, HealthResponse, InspireItem, ProductItem, ScratchRequest, ScratchReward
from app.services.cache import CacheStore
from app.services.firestore import FirestoreRestClient
from app.services.prelaunch import PrelaunchService

settings = get_settings()
cache_store = CacheStore(settings.redis_url)
firestore_client = FirestoreRestClient(settings, cache_store)
prelaunch_service = PrelaunchService(
    settings=settings,
    cache=cache_store,
    firestore=firestore_client,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield


app = FastAPI(title=settings.app_name, debug=settings.app_debug, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:3002", "http://127.0.0.1:3000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    redis_status = "connected" if await cache_store.ping() else "fallback-memory"
    return HealthResponse(status="ok", app=settings.app_name, redis=redis_status)


@app.get("/api/catalog/inspires", response_model=list[InspireItem])
async def list_inspires() -> list[InspireItem]:
    return await firestore_client.list_inspires()


@app.get("/api/catalog/products", response_model=list[ProductItem])
async def list_products(interest_uid: str | None = None, limit: int | None = None) -> list[ProductItem]:
    return await firestore_client.list_products(
        interest_uid=interest_uid,
        page_size=limit or settings.default_catalog_page_size,
    )


@app.get("/api/prelaunch/dashboard", response_model=DashboardResponse)
async def prelaunch_dashboard(interest_uid: str | None = None) -> DashboardResponse:
    return await prelaunch_service.build_dashboard(interest_uid=interest_uid)


@app.post("/api/prelaunch/scratch", response_model=ScratchReward)
async def scratch_reward(payload: ScratchRequest) -> ScratchReward:
    if not payload.interest_uid:
        raise HTTPException(status_code=400, detail="interest_uid is required")
    return await prelaunch_service.create_scratch_reward(payload.interest_uid)
