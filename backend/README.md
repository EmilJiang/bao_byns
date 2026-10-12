# Backend

This is a minimal runnable FastAPI implementation of the frontend contract. Its in-memory data is intentionally replaceable with a database and fraud-decision service later.

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload --port 8000
```

Interactive API documentation is available at `http://localhost:8000/docs`.

## Contract

- `GET /health`
- `GET /api/v1/brands/{brand_id}/transactions`
- `GET /api/v1/brands/{brand_id}/policy`
- `PUT /api/v1/brands/{brand_id}/policy`

All routes are brand-scoped so authentication and tenant authorization can be added without changing the frontend URLs.
