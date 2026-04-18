from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

HARDCODED_REPLY = "I am a hardcoded answer from the backend."


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    return ChatResponse(reply=HARDCODED_REPLY)
