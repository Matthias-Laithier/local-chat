from collections.abc import Iterable

from ollama import Client

from app.core.settings import settings
from app.models.conversation import Message

_client = Client(host=settings.ollama_base_url)


def generate_reply(history: Iterable[Message], user_message: str) -> str:
    messages = [{"role": m.role, "content": m.content} for m in history]
    messages.append({"role": "user", "content": user_message})

    response = _client.chat(model=settings.ollama_model, messages=messages)
    return response["message"]["content"]
