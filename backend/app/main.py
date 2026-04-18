from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import datetime as datetime_router
from app.core.settings import settings

app = FastAPI(title="Local Chat API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(datetime_router.router, prefix="/api")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
