# Backend and Postman testing

FastAPI now combines detection with SQLite persistence. Transactions and policies
survive restarts. The database defaults to `backend/sentra.sqlite3`, independent
of your working directory; set `DATABASE_PATH` to override it.

## Start

Stop the old Python server with Ctrl+C first, then from the repository root:

```bash
source backend/.venv/bin/activate
python -m uvicorn backend.app.main:app --reload --port 8000
```

For a fresh checkout, first run `python3 -m venv backend/.venv` and
`backend/.venv/bin/python -m pip install -e './backend[dev]'`.

## Postman

Import `examples/Sentra.postman_collection.json`. It includes normal and suspicious
POSTs and a GET for stored transactions. Its variables default to
`base_url=http://127.0.0.1:8000` and `brand_id=american-airlines`.

Or create a request manually:

1. POST `http://127.0.0.1:8000/api/v1/brands/american-airlines/detect-fraud`.
2. Body → raw → JSON. Paste `examples/suspicious.json`.
3. Send. Expect 200, `is_fraud: true`, `status: blocked`, and a `transaction_id`.
4. GET `http://127.0.0.1:8000/api/v1/brands/american-airlines/transactions`.
5. Find that ID in `data`. It includes the merchant, amount, reasons, and risk points.
6. Restart the server and repeat the GET. The record remains stored.
7. POST `examples/normal.json`. Expect `is_fraud: false`, `status: approved`.

Every POST creates a new record, including repeated submissions. The initial
American Airlines demo records are seeded once; other brands start empty.
Requests must contain `user_id`, numeric positive `amount`, uppercase three-letter
`currency`, timezone-aware `timestamp`, and `merchant` with `name` and two-letter
`country`. Optional `recent_transactions` contains up to 100 prior transactions.
History must be supplied explicitly; stored requests are not automatically used
as history. Unknown fields, including card credentials, are rejected.

## Dashboard

Configure `frontend/.env.local` using `frontend/.env.example`, then run
`npm run dev` from `frontend`. Refresh the browser after submitting a transaction.
The brand ID must match your POST. Individual records display their submitted
currency and reasons. Existing overview charts and headline metrics remain demo
visualizations, not accounting or fraud performance reports.

## Detection modes

Default mode is `rules`; no external API is called. Demo rule points:
35 for an amount at least 5× the median of 3+ same-currency historical amounts;
60 for 5+ transactions in 10 minutes; 25 for differing merchant countries within
10 minutes; 25 for USD amounts >= 2,000. A total >= 50 predicts fraud.
These are illustrative thresholds, not a trained model or fraud probabilities.

For optional AI classification, export `DETECTION_MODE=ai`, `OPENAI_API_KEY`,
and `OPENAI_MODEL` before starting. Choose a model supporting Responses structured
outputs. AI mode sends supplied transaction evidence (excluding user_id) to OpenAI.
Its risk score remains the baseline rule score, not AI confidence. AI errors return
503 without saving a fabricated decision. Live AI calls have not been verified.
See the [official structured output documentation](https://developers.openai.com/api/docs/guides/structured-outputs).

## Scope

The policy editor controls the new `/checkout` flow. The original `/detect-fraud`
endpoint retains its standalone fraud classification behavior.
`approved` and `blocked` are demo classifications, not payment authorization actions.
This is an unauthenticated local POC with synthetic transactions, not a Mastercard
or Stripe integration. The service stores submitted request data locally in SQLite.

Interactive API docs: http://localhost:8000/docs.
Invalid transaction fields return 400; invalid JSON/body types return 422.

Routes:
- GET /health
- POST /detect-fraud (default brand compatibility route)
- POST /api/v1/brands/{brand_id}/detect-fraud
- GET /api/v1/brands/{brand_id}/transactions (status/search/offset/limit filters)
- GET /api/v1/brands/{brand_id}/policy
- PUT /api/v1/brands/{brand_id}/policy

## Demo checkout page

Start the backend as above, then in a second terminal:

```bash
cd frontend
npm run dev
```

Open http://localhost:3000/checkout. Enter an email and a USD price, then Submit.
The page posts `{ "email": "person@example.com", "price": 100 }` to
`/api/v1/brands/american-airlines/checkout`. The backend computes the score,
evaluates the saved policy, saves the result, and returns it. No emails or real
payments are sent. The dashboard at http://localhost:3000 refreshes its transaction
list every three seconds; email appears in the card/agent column.

Default scoring (a stub for your future model):
- `bot@gmail.com` → score 95, AI agent demo label.
- Every other valid email → score 10, Human demo label.
- These email-based labels are simulated, not proof of who is controlling a browser.

Set `DEMO_BOT_EMAIL` in the backend environment to change the bot email. Matching
ignores case and surrounding whitespace. Bot scoring lives in `app/checkout.py`
inside `score_checkout`; replace that function with a model returning a 0–100 score,
reasons, and an agent classification when ready. This route always uses the demo
scorer, even when `DETECTION_MODE=ai` is set for the original endpoint.

On the dashboard, select Agent policy, adjust the risk controls, and Publish changes:
- **Block high-risk transactions** enables or disables rejection based on score.
- **Rejection score threshold** rejects scores greater than or equal to that value
  when blocking is enabled. Default threshold: 50.
- All other toggles and the amount limit are demo-only; they persist for display
  but do not affect purchase decisions.

Default behavior: normal email → 10 → approved; `bot@gmail.com` → 95 → rejected.
Set threshold to 96 to allow the bot, or turn off risk blocking to allow all valid
submissions. Price does not affect the demo score. Publish changes before testing
again. Existing transactions retain their original decision, and the applied policy
is saved with each checkout assessment in SQLite. `status` is the final decision;
`is_fraud` is the threshold-based score classification even when blocking is disabled.

For bot automation, the form has stable inputs `name="email"`, `name="price"`,
and a submit button labeled “Submit purchase”. You can also POST directly to the
checkout endpoint; email and price are the only accepted fields.
