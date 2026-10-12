"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/api/client";
import { BRAND_ID } from "@/lib/config";

export default function Checkout() {
  const [email, setEmail] = useState("");
  const [price, setPrice] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await apiRequest(`/api/v1/brands/${BRAND_ID}/checkout`, {
        method: "POST", body: JSON.stringify({ email, price: Number(price) }),
      });
    } catch {
      setError("Purchase could not be processed. Check that the API is running and your email and price are valid.");
    } finally {
      setPending(false);
    }
  }

  return <div className="checkout-page">
    <header className="checkout-nav"><Link href="/">Agent Guard<span>DEMO STORE</span></Link><Link href="/">View dashboard ↗</Link></header>
    <main className="checkout-layout">
      <section className="checkout-intro"><p className="eyebrow">A SIMPLE PURCHASE. A SMARTER CHECK.</p><h1>Your next trip<br />starts here.</h1><p>Try a purchase with an email and a price. Follow the result in your client dashboard.</p><div className="checkout-ticket"><span>✈</span><div><small>AGENT GUARD TRAVEL</small><h2>A little closer to somewhere new.</h2><p>Demo booking · USD</p></div></div><p className="checkout-disclaimer">Demo only. No payment is collected or email sent.</p></section>
      <section className="checkout-card"><p className="eyebrow">DEMO CHECKOUT</p><h2>Complete your purchase</h2><p>Enter any valid email address and a price.</p>
        <form onSubmit={submit}>
          <label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required maxLength={254} disabled={pending} />
          <label htmlFor="price">Price (USD)</label><div className="checkout-price"><span>$</span><input id="price" name="price" type="number" min="0.01" max="1000000" step="0.01" placeholder="125.00" value={price} onChange={e => setPrice(e.target.value)} required disabled={pending} /></div>
          <button type="submit" disabled={pending}>{pending ? "Processing…" : "Submit purchase"}<span>→</span></button>
        </form>
        {error && <p className="checkout-error" role="alert">{error}</p>}
      </section>
    </main>
  </div>;
}
