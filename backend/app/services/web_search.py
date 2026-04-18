from duckduckgo_search import DDGS

from app.core.settings import settings


def _format_results(results: list[dict[str, str]]) -> str:
    lines: list[str] = []
    for i, r in enumerate(results, start=1):
        title = (r.get("title") or "").strip()
        href = (r.get("href") or "").strip()
        body = (r.get("body") or "").strip()
        lines.append(f"{i}. {title}")
        if href:
            lines.append(f"   URL: {href}")
        if body:
            lines.append(f"   {body}")
        lines.append("")
    return "\n".join(lines).strip()


def _fetch_results(q: str, n: int) -> list[dict[str, str]]:
    """
    duckduckgo-search 8.x forces DDGS.text() to use Bing only. Call lite/html/bing
    explicitly so DuckDuckGo endpoints are used first (real DDG results).
    """
    ddgs = DDGS(timeout=20)
    for name in ("_text_lite", "_text_html", "_text_bing"):
        method = getattr(ddgs, name, None)
        if not callable(method):
            continue
        try:
            results = method(q, None, None, n)
        except Exception:
            continue
        if results:
            return results
    return []


def search_web(query: str, *, max_results: int | None = None) -> tuple[str, int]:
    """
    Run web search and return (compact text for the model, number of result rows).
    On failure or notices, the second value is 0.
    """
    if not settings.web_search_enabled:
        return ("[Web search is disabled by server configuration.]", 0)

    q = query.strip()
    if not q:
        return ("[No search query was provided.]", 0)

    n = max_results if max_results is not None else settings.web_search_max_results
    n = max(1, min(n, 15))

    results = _fetch_results(q, n)
    if not results:
        return ("[Web search failed or returned no results; answer without live web data.]", 0)

    return (_format_results(results), len(results))
