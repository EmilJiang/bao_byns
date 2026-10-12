"""Small SQLite repository; each operation owns its connection."""
import json
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

from .data import DEFAULT_POLICY, TRANSACTIONS
from .models import Policy, Transaction


@contextmanager
def connection():
    path = Path(os.getenv("DATABASE_PATH", str(Path(__file__).resolve().parents[1] / "sentra.sqlite3")))
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path, timeout=10)
    try:
        with db:
            yield db
    finally:
        db.close()


def initialize():
    with connection() as db:
        db.execute("CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, brand_id TEXT NOT NULL, payload TEXT NOT NULL, request TEXT, assessment TEXT)")
        db.execute("CREATE INDEX IF NOT EXISTS transactions_brand ON transactions(brand_id)")
        db.execute("CREATE TABLE IF NOT EXISTS policies (brand_id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL)")
        for transaction in TRANSACTIONS:
            db.execute("INSERT OR IGNORE INTO transactions (id, brand_id, payload) VALUES (?, ?, ?)",
                       (transaction.id, "american-airlines", transaction.model_dump_json(by_alias=True)))


def list_transactions(brand_id):
    with connection() as db:
        rows = db.execute("SELECT payload FROM transactions WHERE brand_id = ? ORDER BY rowid DESC", (brand_id,)).fetchall()
    return [Transaction.model_validate_json(row[0]) for row in rows]


def save_transaction(brand_id, transaction, request, assessment):
    with connection() as db:
        db.execute("INSERT INTO transactions (id, brand_id, payload, request, assessment) VALUES (?, ?, ?, ?, ?)",
                   (transaction.id, brand_id, transaction.model_dump_json(by_alias=True), json.dumps(request), json.dumps(assessment)))


def get_policy(brand_id):
    with connection() as db:
        row = db.execute("SELECT payload, updated_at FROM policies WHERE brand_id = ?", (brand_id,)).fetchone()
    return (Policy.model_validate_json(row[0]), row[1]) if row else (DEFAULT_POLICY, None)


def save_policy(brand_id, policy, updated_at):
    with connection() as db:
        db.execute("INSERT INTO policies VALUES (?, ?, ?) ON CONFLICT(brand_id) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at",
                   (brand_id, policy.model_dump_json(by_alias=True), updated_at.isoformat()))
