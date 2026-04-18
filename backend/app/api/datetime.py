from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class DateTimeResponse(BaseModel):
    datetime: str


@router.get("/datetime", response_model=DateTimeResponse)
def get_datetime() -> DateTimeResponse:
    now = datetime.now(tz=timezone.utc).isoformat()
    return DateTimeResponse(datetime=now)
