import json
from collections.abc import Iterator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.conversation import Conversation, Message
from app.schemas.conversation import (
    ConversationOut,
    MessageOut,
    SendMessageRequest,
)
from app.services.ollama_chat import stream_reply

router = APIRouter()


@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations(db: Session = Depends(get_db)) -> list[Conversation]:
    return db.query(Conversation).order_by(desc(Conversation.updated_at)).all()


@router.post("/conversations", response_model=ConversationOut, status_code=201)
def create_conversation(db: Session = Depends(get_db)) -> Conversation:
    conversation = Conversation()
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
def list_messages(conversation_id: str, db: Session = Depends(get_db)) -> list[Message]:
    conversation = db.get(Conversation, conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation.messages


def _event(payload: dict) -> str:
    return json.dumps(payload) + "\n"


@router.post("/conversations/{conversation_id}/messages")
def send_message(
    conversation_id: str,
    request: SendMessageRequest,
    db: Session = Depends(get_db),
) -> StreamingResponse:
    conversation = db.get(Conversation, conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    history = list(conversation.messages)
    is_first_message = len(history) == 0

    user_msg = Message(
        conversation_id=conversation_id,
        role="user",
        content=request.message,
    )
    db.add(user_msg)
    if is_first_message:
        conversation.title = request.message[:60]
    db.commit()
    db.refresh(user_msg)
    db.refresh(conversation)

    new_title = conversation.title if is_first_message else None
    user_message_payload = MessageOut.model_validate(user_msg).model_dump(mode="json")

    def event_stream() -> Iterator[str]:
        yield _event({"type": "user_message", "message": user_message_payload})
        if new_title is not None:
            yield _event({"type": "title", "title": new_title})

        full_text = ""
        full_thinking = ""
        try:
            for chunk in stream_reply(history, request.message):
                if chunk.thinking:
                    full_thinking += chunk.thinking
                    yield _event({"type": "thinking_delta", "content": chunk.thinking})
                if chunk.content:
                    full_text += chunk.content
                    yield _event({"type": "delta", "content": chunk.content})
        except Exception as exc:
            yield _event({"type": "error", "detail": f"LLM backend error: {exc}"})
            return

        assistant_msg = Message(
            conversation_id=conversation_id,
            role="assistant",
            content=full_text,
            thinking=full_thinking or None,
        )
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)

        yield _event(
            {
                "type": "assistant_message",
                "message": MessageOut.model_validate(assistant_msg).model_dump(mode="json"),
            }
        )

    return StreamingResponse(event_stream(), media_type="application/x-ndjson")
