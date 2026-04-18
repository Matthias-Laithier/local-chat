from collections.abc import Iterable, Iterator
from dataclasses import dataclass
from typing import Any

from ollama import Client

from app.core.settings import settings
from app.models.conversation import Message

_client = Client(host=settings.ollama_base_url)


@dataclass
class ReplyChunk:
    content: str = ""
    thinking: str = ""


def _strip_data_url(data_url: str) -> str:
    """Strip the `data:image/...;base64,` prefix; leave raw base64 as-is."""
    if data_url.startswith("data:") and "," in data_url:
        return data_url.split(",", 1)[1]
    return data_url


def _message_payload(msg: Message) -> dict[str, Any]:
    payload: dict[str, Any] = {"role": msg.role, "content": msg.content}
    if msg.image_data_url:
        payload["images"] = [_strip_data_url(msg.image_data_url)]
    return payload


def stream_reply(
    history: Iterable[Message],
    user_message: str,
    user_image_data_url: str | None = None,
) -> Iterator[ReplyChunk]:
    messages: list[dict[str, Any]] = [_message_payload(m) for m in history]
    user_payload: dict[str, Any] = {"role": "user", "content": user_message}
    if user_image_data_url:
        user_payload["images"] = [_strip_data_url(user_image_data_url)]
    messages.append(user_payload)

    for chunk in _client.chat(
        model=settings.ollama_model,
        messages=messages,
        stream=True,
        think=True,
    ):
        msg = chunk.get("message") or {}
        content = msg.get("content") or ""
        thinking = msg.get("thinking") or ""
        if content or thinking:
            yield ReplyChunk(content=content, thinking=thinking)
