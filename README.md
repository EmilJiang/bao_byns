# Agent Guard

A brand-scoped agentic transaction risk demo, organized as a frontend/backend monorepo.

```text
frontend/                 Next.js dashboard
  app/                    App Router entry points and styles
  components/             Dashboard UI
  lib/api/                Typed backend adapters
  lib/types.ts            Frontend domain contracts
  lib/mock-data.ts        Fallback when no API is configured

backend/                  FastAPI contract and mock implementation
  app/main.py             Brand-scoped HTTP routes
  app/models.py           Validated API schemas
  app/data.py             Replaceable in-memory data
```

## Frontend only

The dashboard works without a backend and automatically uses mock data.

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Full stack

Start the API:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload --port 8000
```

Then configure and start the frontend:

```bash
cd frontend
cp .env.example .env.local
npm run dev
```

The frontend reads `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_BRAND_ID`. Its adapters expect these routes:

- `GET /api/v1/brands/{brand_id}/transactions`
- `GET /api/v1/brands/{brand_id}/policy`
- `PUT /api/v1/brands/{brand_id}/policy`

The runnable API and its interactive schema are available at `http://localhost:8000/docs`. Replacing the mock service only requires preserving this contract; dashboard components do not call HTTP directly.

## UI system

The interface uses Mastercard's open-source [Made design system](https://github.com/Mastercard/made). The official Made v3 stylesheet is pinned in `frontend/app/globals.css`, with the American Airlines demo theme layered on top.
