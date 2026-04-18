# local-chat

A minimal fullstack app — FastAPI backend + React frontend — that returns the current date and time from the server.

## Requirements

- [uv](https://docs.astral.sh/uv/) (Python backend)
- [Node.js](https://nodejs.org/) + npm (frontend)

## Setup

### Backend

```bash
cd backend
cp .env.example .env
uv run uvicorn app.main:app --reload
```

Runs on http://localhost:8000.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:5173. API calls to `/api/*` are proxied to the backend.

## Environment variables

All variables are defined in `backend/.env.example`.

| Variable        | Description                          | Example                          |
|-----------------|--------------------------------------|----------------------------------|
| `CORS_ORIGINS`  | JSON list of allowed frontend origins | `["http://localhost:5173"]`      |

## API

| Method | Path           | Description                  |
|--------|----------------|------------------------------|
| GET    | `/health`      | Health check                 |
| GET    | `/api/datetime`| Returns current UTC datetime |

### Example response

```json
{ "datetime": "2026-04-18T18:00:00.000000+00:00" }
```

## Lint & typecheck

```bash
# Backend (from backend/)
uv run mypy app/
uv run ruff check app/

# Frontend (from frontend/)
npm run build
```
