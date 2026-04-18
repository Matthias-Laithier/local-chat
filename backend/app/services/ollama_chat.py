from collections.abc import Iterable, Iterator

from ollama import Client

from app.core.settings import settings
from app.models.conversation import Message

_client = Client(host=settings.ollama_base_url)


def stream_reply(history: Iterable[Message], user_message: str) -> Iterator[str]:
    messages = [{"role": m.role, "content": m.content} for m in history]
    messages.append({"role": "user", "content": user_message})

    for chunk in _client.chat(
        model=settings.ollama_model,
        messages=messages,
        stream=True,
    ):
        content = chunk.get("message", {}).get("content", "")
        if content:
            yield content
