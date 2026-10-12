# Agent Guard

A local proof of concept for scoring purchases and reviewing decisions in a client dashboard.

The demo checkout collects an email and a USD price, sends them to the FastAPI backend, and saves the decision in SQLite. The dashboard updates its transaction list every three seconds. No real payments are processed or emails sent.

## Run locally

Requirements: Python 3.11+ and a Node.js version supported by Next.js 16.
Run these commands from the repository root in two separate terminals.

**Terminal 1 — backend**

```bash
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -e './backend[dev]'
python -m uvicorn backend.app.main:app --reload --port 8000
```

After the first setup, you only need the activation and uvicorn commands.

**Terminal 2 — frontend**

```bash
cd frontend
npm ci
npm run dev
```

After the first setup, you only need `npm run dev` from `frontend`.
Keep both terminals running. Stop a server with Ctrl+C.

| Page | URL |
| --- | --- |
| Demo checkout | http://localhost:3000/checkout |
| Client dashboard | http://localhost:3000 |
| Interactive API documentation | http://localhost:8000/docs |

The frontend defaults to the API at `http://127.0.0.1:8000` and brand `american-airlines`. To override these, copy `frontend/.env.example` to `frontend/.env.local`, edit it, and restart the frontend.

## Test the demo

1. Open the checkout and submit `person@gmail.com` with a price of `100`.
2. Open the dashboard and select **Transactions**. The purchase appears with score **10** and status **Approved**.
3. Submit `bot@gmail.com` with a price of `100`. It appears with score **95** and status **Rejected**.
4. On the dashboard, select **Agent policy**, set the rejection threshold to **96**, and click **Publish changes**.
5. Submit the bot again. This new purchase is approved because 95 is below 96.
6. Restore the threshold to **50** to reject the bot again.

The checkout intentionally does not display the decision, score, or transaction ID after submitting. Inspect those on the dashboard. Each submission creates a new record; previous decisions are not changed by later policy updates.

## How scoring and policy work

- The configured bot email (`bot@gmail.com` by default) scores **95/100**.
- Other valid emails score **10/100**.
- With **Block high-risk transactions** enabled, scores at or above the client's threshold are rejected. The default threshold is **50**.
- Turning that toggle off allows all valid checkout submissions.
- Other toggles and the amount limit are visual proof-of-concept controls only. Price does not affect the checkout score.

Scoring is deliberately hard-coded, not a trained model or reliable bot detection. Email-based Human/AI agent labels are simulated. Replace `score_checkout` in `backend/app/checkout.py` to connect a future model. Set `DEMO_BOT_EMAIL` in the backend environment to change the demo bot address; matching ignores case and surrounding whitespace.

## API and Postman

The checkout calls:

```http
POST /api/v1/brands/american-airlines/checkout
Content-Type: application/json
```

```json
{
  "email": "bot@gmail.com",
  "price": 100
}
```

The JSON response includes `risk_score`, `risk_threshold`, `status`, `reasons`, and `transaction_id`. The server applies the saved client policy; the browser cannot supply its own score.

Retrieve saved records with:

```http
GET /api/v1/brands/american-airlines/transactions
```

Additional routes:

- `GET /health`
- `GET /api/v1/brands/{brand_id}/policy`
- `PUT /api/v1/brands/{brand_id}/policy`
- `POST /api/v1/brands/{brand_id}/detect-fraud`
- `POST /detect-fraud` — defaults to `american-airlines`

The original `detect-fraud` endpoint accepts transaction details and optional history. It uses separate rule-based detection, with optional AI assessment, and does not use the checkout's email scorer or client policy. Import `examples/Sentra.postman_collection.json` for those original endpoint examples. See [backend documentation](backend/README.md) for details.

## Storage and project layout

Transactions and policies persist in `backend/sentra.sqlite3`, which is excluded from Git. Override its path with `DATABASE_PATH`. Initial sample records are seeded for `american-airlines`; other brands start empty. The demo server has no authentication and is intended for local synthetic data.

```text
frontend/app/checkout/       Email and price form
frontend/components/        Dashboard and policy controls
frontend/lib/api/           Backend adapters
backend/app/main.py         HTTP routes
backend/app/checkout.py     Demo email scoring and active risk policy
backend/app/detection.py    Original transaction fraud detector
backend/app/storage.py      SQLite persistence
backend/app/models.py       API models and validation
examples/                   Sample requests and Postman collection
tests/                      Backend integration and scoring checks
```

The interface uses Mastercard's Made design system with an American Airlines demo theme. Overview charts and headline metrics remain illustrative demo content; the transaction list shows saved API records.

## Checks

From the repository root:

```bash
backend/.venv/bin/python -m unittest discover -s tests -v
./frontend/node_modules/.bin/tsc --noEmit -p frontend/tsconfig.json
```

Tests cover validation, persistence, brand isolation, bot scoring, risk thresholds, and placeholder controls. AI provider calls are mocked; live model accuracy is not verified.
