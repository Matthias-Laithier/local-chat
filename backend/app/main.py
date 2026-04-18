from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import conversations as conversations_router
from app.core.database import Base, engine
from app.core.settings import settings
from app.models import conversation as _models  # noqa: F401 – register ORM models

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Local Chat API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

app.include_router(conversations_router.router, prefix="/api")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
