# local-chat

A minimal fullstack chat app — FastAPI + React + PostgreSQL — that talks to a local [Ollama](https://ollama.com/) model. Past conversations are persisted and listed in a sidebar so you can resume them at any time.

## Requirements

- [uv](https://docs.astral.sh/uv/) (Python backend)
- [Node.js](https://nodejs.org/) + npm (frontend)
- [Docker](https://docs.docker.com/) (PostgreSQL)
- [Ollama](https://ollama.com/) running on `localhost:11434`

## One-time model pull

```bash
ollama pull gemma4:e4b
```

Ollama must be running on the host.

## Setup

### 1. Database

```bash
docker compose up -d postgres
```

### 2. Backend

```bash
cd backend
cp .env.example .env
uv run uvicorn app.main:app --reload
```

Runs on http://localhost:8000. Tables are auto-created on startup.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:5173. API calls to `/api/*` are proxied to the backend.

## Environment variables

All variables are defined in `backend/.env.example`.

| Variable          | Description                                   | Example                                                    |
|-------------------|-----------------------------------------------|------------------------------------------------------------|
| `CORS_ORIGINS`    | JSON list of allowed frontend origins         | `["http://localhost:5173"]`                                |
| `DATABASE_URL`    | PostgreSQL SQLAlchemy URL                     | `postgresql+psycopg://localchat:localchat@localhost:5432/localchat` |
| `OLLAMA_BASE_URL` | URL of the running Ollama instance            | `http://localhost:11434`                                   |
| `OLLAMA_MODEL`    | Ollama model tag used to generate replies     | `gemma4:e4b`                                               |

## API

| Method | Path                                      | Description                                              |
|--------|-------------------------------------------|----------------------------------------------------------|
| GET    | `/health`                                 | Health check                                             |
| GET    | `/api/conversations`                      | List conversations ordered by `updated_at DESC`          |
| POST   | `/api/conversations`                      | Create a new empty conversation                          |
| GET    | `/api/conversations/{id}/messages`        | List all messages in a conversation                      |
| POST   | `/api/conversations/{id}/messages`        | Send a message; backend calls Ollama and stores the reply |

## Lint & typecheck

```bash
# Backend (from backend/)
uv run mypy app/
uv run ruff check app/

# Frontend (from frontend/)
npm run build
```

## Teardown

```bash
docker compose down -v
```
