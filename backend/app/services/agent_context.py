from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.core.settings import settings


def build_agent_system_preamble(web_excerpt: str | None = None) -> str:
    """Ephemeral system text: current date/time in the configured zone, optional web snippets."""
    try:
        tz = ZoneInfo(settings.agent_timezone)
    except ZoneInfoNotFoundError:
        tz = ZoneInfo("UTC")
    now = datetime.now(tz)
    lines = [
        "You are a helpful assistant. Use the following as the current date and time; do not assume a different time unless the user corrects you.",
        f"ISO-8601: {now.isoformat()}",
        f"Human-readable: {now.strftime('%A, %Y-%m-%d %H:%M:%S')} ({now.tzname()})",
    ]
    if web_excerpt:
        lines.append("")
        lines.append(
            "The user enabled web search. Snippets below are from DuckDuckGo (or a short status line if search failed). "
            "Use them to answer factual or current questions; say when results are missing or unreliable."
        )
        lines.append(web_excerpt.strip())
    return "\n".join(lines)
