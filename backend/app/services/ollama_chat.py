from collections.abc import Iterable, Iterator
from dataclasses import dataclass

from ollama import Client

from app.core.settings import settings
from app.models.conversation import Message

_client = Client(host=settings.ollama_base_url)


@dataclass
class ReplyChunk:
    content: str = ""
    thinking: str = ""


def stream_reply(history: Iterable[Message], user_message: str) -> Iterator[ReplyChunk]:
    messages = [{"role": m.role, "content": m.content} for m in history]
    messages.append({"role": "user", "content": user_message})

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
