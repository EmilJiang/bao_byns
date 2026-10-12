import io
import json
from pathlib import Path
import unittest
from unittest.mock import patch
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from backend.app.detection import ValidationError, detect
from backend.app.main import app
from fastapi.testclient import TestClient
from tempfile import TemporaryDirectory


ROOT = Path(__file__).resolve().parents[1]


def sample(name="normal"):
    return json.loads((ROOT / "examples" / f"{name}.json").read_text())


class DetectionTests(unittest.TestCase):
    def test_normal_and_suspicious(self):
        self.assertFalse(detect(sample())["is_fraud"])
        self.assertTrue(detect(sample("suspicious"))["is_fraud"])

    def test_velocity(self):
        value = sample()
        value["recent_transactions"] = [
            {"amount": 30, "currency": "USD", "timestamp": f"2026-10-12T15:{minute}:00Z", "merchant_country": "US"}
            for minute in range(26, 30)
        ]
        self.assertTrue(detect(value)["is_fraud"])
        value["recent_transactions"] = value["recent_transactions"][:3]
        self.assertFalse(detect(value)["is_fraud"])

    def test_currency_and_sparse_history(self):
        value = sample("suspicious")
        value["currency"] = "JPY"
        self.assertEqual(detect(value)["risk_score"], 25)
        value["currency"] = "USD"
        self.assertEqual(detect(value)["risk_score"], 50)

    def test_amount_anomaly_with_sufficient_history(self):
        value = sample("suspicious")
        value["recent_transactions"] = [
            {"amount": 35, "currency": "USD", "timestamp": f"2026-10-0{day}T15:20:00Z", "merchant_country": "US"}
            for day in range(1, 4)
        ]
        self.assertEqual(detect(value)["risk_score"], 60)
        for entry in value["recent_transactions"]:
            entry["currency"] = "GBP"
        self.assertEqual(detect(value)["risk_score"], 25)

    def test_validation(self):
        for amount in (-1, 0, True, "35", float("nan"), float("inf")):
            with self.subTest(amount=amount), self.assertRaises(ValidationError):
                detect({**sample(), "amount": amount})
        with self.assertRaises(ValidationError):
            detect({**sample(), "timestamp": "2026-10-12T15:30:00"})
        with self.assertRaises(ValidationError):
            detect({**sample(), "card_number": "not accepted"})
        value = sample("suspicious")
        value["recent_transactions"][0]["timestamp"] = value["timestamp"]
        with self.assertRaises(ValidationError):
            detect(value)

    @patch.dict("os.environ", {"OPENAI_API_KEY": "test-only", "OPENAI_MODEL": "test-model"})
    def test_ai_success(self):
        result = {"status": "completed", "output": [{"type": "message", "content": [
            {"type": "output_text", "text": json.dumps({"is_fraud": True, "reasons": ["Synthetic assessment"]})}
        ]}]}
        with patch("backend.app.detection.urlopen", return_value=io.BytesIO(json.dumps(result).encode())) as call:
            self.assertEqual(detect(sample(), "ai")["engine"], "ai")
        payload = json.loads(call.call_args.args[0].data)
        self.assertNotIn("user_id", json.loads(payload["input"])["transaction"])
        self.assertFalse(payload["store"])

    @patch.dict("os.environ", {"OPENAI_API_KEY": "test-only", "OPENAI_MODEL": "test-model"})
    def test_ai_failure_does_not_return_safe(self):
        with patch("backend.app.detection.urlopen", side_effect=URLError("unavailable")):
            with self.assertRaises(RuntimeError):
                detect(sample(), "ai")
        for output in ({"status": "incomplete"}, {"status": "completed", "output": []}):
            with patch("backend.app.detection.urlopen", return_value=io.BytesIO(json.dumps(output).encode())):
                with self.assertRaises(RuntimeError):
                    detect(sample(), "ai")


class HTTPTests(unittest.TestCase):
    def setUp(self):
        self.directory = TemporaryDirectory()
        self.env = patch.dict("os.environ", {"DATABASE_PATH": self.directory.name + "/test.sqlite3", "DETECTION_MODE": "rules"})
        self.env.start()
        self.client = TestClient(app)
        self.client.__enter__()

    def tearDown(self):
        self.client.__exit__(None, None, None)
        self.env.stop()
        self.directory.cleanup()

    def test_post_and_persistence(self):
        response = self.client.post("/detect-fraud", json=sample("suspicious"))
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertTrue(result["is_fraud"])
        self.client.__exit__(None, None, None)
        self.client = TestClient(app)
        self.client.__enter__()
        rows = self.client.get("/api/v1/brands/american-airlines/transactions").json()["data"]
        saved = next(row for row in rows if row["id"] == result["transaction_id"])
        self.assertEqual(saved["status"], "blocked")
        self.assertEqual(saved["reasons"], result["reasons"])
        self.assertEqual(saved["currency"], "USD")

    def test_brand_isolation_and_filters(self):
        response = self.client.post("/api/v1/brands/test-brand/detect-fraud", json=sample())
        self.assertEqual(response.status_code, 200)
        tx_id = response.json()["transaction_id"]
        rows = self.client.get("/api/v1/brands/test-brand/transactions").json()
        self.assertEqual(rows["meta"]["total"], 1)
        self.assertEqual(rows["data"][0]["id"], tx_id)
        self.assertEqual(self.client.get("/api/v1/brands/other/transactions").json()["data"], [])
        self.assertEqual(self.client.get("/api/v1/brands/test-brand/transactions?status=blocked").json()["data"], [])
        self.assertEqual(self.client.get("/api/v1/brands/test-brand/transactions?search=Example&limit=1").json()["meta"]["total"], 1)

    def test_invalid_input_not_saved(self):
        response = self.client.post("/api/v1/brands/test-brand/detect-fraud", json={**sample(), "amount": -1})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.client.get("/api/v1/brands/test-brand/transactions").json()["data"], [])
        self.assertEqual(self.client.post("/detect-fraud", content="{", headers={"Content-Type": "application/json"}).status_code, 422)

    def test_ai_failure_not_saved(self):
        with patch.dict("os.environ", {"DETECTION_MODE": "ai"}), patch("backend.app.main.detect", side_effect=RuntimeError("AI unavailable")):
            self.assertEqual(self.client.post("/api/v1/brands/test-brand/detect-fraud", json=sample()).status_code, 503)
        self.assertEqual(self.client.get("/api/v1/brands/test-brand/transactions").json()["data"], [])

    def test_policy_persistence(self):
        url = "/api/v1/brands/test-brand/policy"
        policy = self.client.get(url).json()["data"]
        policy["maxAmount"] = 123
        saved = self.client.put(url, json=policy).json()
        self.client.__exit__(None, None, None)
        self.client = TestClient(app)
        self.client.__enter__()
        self.assertEqual(self.client.get(url).json(), saved)
        self.assertNotEqual(self.client.get("/api/v1/brands/other/policy").json()["data"]["maxAmount"], 123)

    def test_checkout_human_bot_and_storage(self):
        url = "/api/v1/brands/checkout-demo/checkout"
        with patch.dict("os.environ", {"DEMO_BOT_EMAIL": "bot@gmail.com"}):
            human = self.client.post(url, json={"email": "person@example.com", "price": 100}).json()
            bot = self.client.post(url, json={"email": "  BOT@gmail.com  ", "price": 100}).json()
        self.assertEqual((human["status"], human["risk_score"]), ("approved", 10))
        self.assertEqual((bot["status"], bot["risk_score"]), ("blocked", 95))
        rows = self.client.get("/api/v1/brands/checkout-demo/transactions").json()["data"]
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["agent"], "bot@gmail.com")
        self.assertEqual(rows[0]["agentType"], "AI agent")
        self.assertEqual(rows[1]["agentType"], "Human")
        self.assertEqual(rows[0]["reasons"], bot["reasons"])

    def test_checkout_only_score_policy_is_enforced(self):
        base = "/api/v1/brands/checkout-demo"
        policy = self.client.get(base + "/policy").json()["data"]
        policy.update(maxAmount=1, agentPurchases=False, trustedAgentsOnly=True,
                      blockInternational=True, riskThreshold=95, blockHighRisk=True)
        self.assertEqual(self.client.put(base + "/policy", json=policy).status_code, 200)
        def buy(email="person@example.com"):
            return self.client.post(base + "/checkout", json={"email": email, "price": 1000}).json()
        self.assertEqual(buy()["status"], "approved")  # fake controls do not apply
        with patch.dict("os.environ", {"DEMO_BOT_EMAIL": "bot@gmail.com"}):
            self.assertEqual(buy("bot@gmail.com")["status"], "blocked")  # score == threshold
            policy["riskThreshold"] = 96
            self.client.put(base + "/policy", json=policy)
            self.assertEqual(buy("bot@gmail.com")["status"], "approved")
            policy.update(riskThreshold=10, blockHighRisk=False)
            self.client.put(base + "/policy", json=policy)
            self.assertEqual(buy("bot@gmail.com")["status"], "approved")
        policy["blockHighRisk"] = True
        self.client.put(base + "/policy", json=policy)
        self.assertEqual(buy()["status"], "blocked")
        policy["riskThreshold"] = 101
        self.assertEqual(self.client.put(base + "/policy", json=policy).status_code, 422)

    def test_checkout_invalid_input_and_configured_bot(self):
        url = "/api/v1/brands/checkout-demo/checkout"
        for payload in ({"email": "no-email", "price": 10}, {"email": "a@b.com", "price": -1},
                        {"email": "a@b.com", "price": True}, {"email": "a@b.com", "price": "10"},
                        {"email": "a@b.com", "price": 10, "risk_score": 0}):
            self.assertEqual(self.client.post(url, json=payload).status_code, 422)
        with patch.dict("os.environ", {"DEMO_BOT_EMAIL": "custom@example.com"}):
            result = self.client.post(url, json={"email": "custom@example.com", "price": 10}).json()
            self.assertEqual(result["risk_score"], 95)
        self.assertEqual(len(self.client.get("/api/v1/brands/checkout-demo/transactions").json()["data"]), 1)


if __name__ == "__main__":
    unittest.main()
