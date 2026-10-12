"use client";

import { useMemo, useState } from "react";
import {
  AirplaneTilt, Bell, CaretDown, CaretLeft, CaretRight, Check, CirclesThreePlus, CreditCard,
  DownloadSimple, Gear, List, MagnifyingGlass, Plus, ShieldCheck, SlidersHorizontal,
  TrendDown, TrendUp, Warning, X,
} from "@phosphor-icons/react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { publishPolicy } from "@/lib/api/policies";
import { weeklyVolume } from "@/lib/mock-data";
import type { Policy, Transaction, TransactionStatus } from "@/lib/types";

type View = "overview" | "transactions" | "policy";
type Filter = "all" | TransactionStatus;

const statusLabels: Record<TransactionStatus, string> = {
  approved: "Legitimate",
  blocked: "Fraudulent",
  review: "In review",
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(value);
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <label className="made-c-toggle">
      <input className="made-c-toggle__input" type="checkbox" checked={enabled} onChange={onChange} aria-label={enabled ? "Enabled" : "Disabled"} />
      <span className="made-c-toggle__slider" />
    </label>
  );
}

function StatusPill({ status }: { status: TransactionStatus }) {
  return (
    <span className={`made-c-pill made-c-pill--sm status status-${status}`}>
      <i>{status === "approved" ? <Check weight="bold" /> : status === "blocked" ? <X weight="bold" /> : <Warning weight="fill" />}</i>
      {statusLabels[status]}
    </span>
  );
}

export default function Dashboard({ initialTransactions, initialPolicy }: { initialTransactions: Transaction[]; initialPolicy: Policy }) {
  const [view, setView] = useState<View>("overview");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("Last 7 days");
  const [policy, setPolicy] = useState(initialPolicy);
  const [savedPolicy, setSavedPolicy] = useState(initialPolicy);
  const [toast, setToast] = useState<"success" | "error" | null>(null);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [selected, setSelected] = useState<Transaction | null>(null);

  const filtered = useMemo(() => initialTransactions.filter((transaction) => {
    const matchesFilter = filter === "all" || transaction.status === filter;
    const needle = query.toLowerCase();
    const matchesQuery = !needle || `${transaction.merchant} ${transaction.id} ${transaction.agent}`.toLowerCase().includes(needle);
    return matchesFilter && matchesQuery;
  }), [initialTransactions, filter, query]);

  const approved = initialTransactions.filter((item) => item.status === "approved");
  const blocked = initialTransactions.filter((item) => item.status === "blocked");
  const totalVolume = initialTransactions.reduce((sum, item) => sum + item.amount, 0);
  const blockedVolume = blocked.reduce((sum, item) => sum + item.amount, 0);

  async function savePolicy() {
    setSavingPolicy(true);
    try {
      const saved = await publishPolicy(policy);
      setSavedPolicy(saved);
      setToast("success");
    } catch {
      setToast("error");
    } finally {
      setSavingPolicy(false);
      window.setTimeout(() => setToast(null), 2800);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><ShieldCheck weight="fill" /></span><span>sentra</span><small>DEMO</small></div>
        <div className="workspace-card">
          <span className="aa-mark"><i /><b /></span>
          <div><strong>American Airlines</strong><small>AAdvantage® Mastercard</small></div>
          <CaretDown />
        </div>
        <nav>
          <p>MONITOR</p>
          <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}><CirclesThreePlus />Overview</button>
          <button className={view === "transactions" ? "active" : ""} onClick={() => setView("transactions")}><List />Transactions<span className="nav-count">24</span></button>
          <p>CONTROL</p>
          <button className={view === "policy" ? "active" : ""} onClick={() => setView("policy")}><SlidersHorizontal />Agent policy</button>
          <button><CreditCard />Cards</button>
        </nav>
        <div className="sidebar-bottom">
          <button><Gear />Settings</button>
          <div className="user-card"><span className="avatar">ER</span><div><strong>Elena Rodriguez</strong><small>Risk operations</small></div><CaretDown /></div>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div className="mobile-brand"><span className="aa-mark"><i /><b /></span><span>American</span></div>
          <label className="made-c-search-input__wrapper global-search"><MagnifyingGlass /><input className="made-c-search-input" placeholder="Search transactions, agents..." value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>⌘ K</kbd></label>
          <button className="icon-button"><Bell /><i /></button>
          <button className="help-button">?</button>
        </header>

        <div className="content">
          {view === "policy" ? (
            <PolicyView policy={policy} setPolicy={setPolicy} saved={savedPolicy} onSave={savePolicy} saving={savingPolicy} />
          ) : (
            <>
              <section className="page-heading">
                <div><p className="eyebrow">AADVANTAGE® CARD · RISK OPERATIONS</p><h1>{view === "transactions" ? "Card activity" : "Good morning, Elena"}</h1><p>{view === "transactions" ? "Review every authorization across the AAdvantage card portfolio." : "Here’s how agent-assisted member spend is looking today."}</p></div>
                <div className="heading-actions">
                  <button className="made-c-button made-c-button--secondary made-c-button--small button secondary"><DownloadSimple />Export</button>
                  <div className="select-wrap"><select value={period} onChange={(event) => setPeriod(event.target.value)}><option>Last 7 days</option><option>Last 30 days</option><option>Last 90 days</option></select><CaretDown /></div>
                </div>
              </section>

              {view === "overview" && (
                <>
                  <section className="metric-grid">
                    <Metric label="Member spend" value={money(totalVolume * 22.4)} trend="12.4%" positive icon={<CreditCard />} spark="up" />
                    <Metric label="Trusted authorization rate" value="96.8%" trend="1.2%" positive icon={<ShieldCheck />} spark="up" />
                    <Metric label="Fraud losses avoided" value={money(blockedVolume * 8.7)} trend="8.1%" positive icon={<Warning />} spark="up" />
                    <Metric label="Agent-assisted bookings" value="68.4%" trend="3.6%" positive={false} icon={<AirplaneTilt />} spark="down" />
                  </section>

                  <section className="dashboard-grid">
                    <article className="made-c-card panel chart-panel">
                      <div className="panel-heading"><div><h2>AAdvantage card spend</h2><p>Trusted vs. fraudulent authorizations</p></div><div className="legend"><span><i className="green" />Trusted</span><span><i className="red" />Fraudulent</span></div></div>
                      <div className="chart-wrap">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={weeklyVolume} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                            <defs><linearGradient id="legit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1676b8" stopOpacity={0.22}/><stop offset="95%" stopColor="#1676b8" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid stroke="#edf0ec" vertical={false} />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#7b817e", fontSize: 12 }} dy={8} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9a9f9c", fontSize: 11 }} tickFormatter={(value) => `$${value / 1000}k`} />
                            <Tooltip contentStyle={{ border: "1px solid #e4e7e3", borderRadius: 10, boxShadow: "0 8px 24px rgba(30,40,35,.08)", fontSize: 12 }} formatter={(value) => money(Number(value))} />
                            <Area type="monotone" dataKey="legitimate" stroke="#1676b8" strokeWidth={2.5} fill="url(#legit)" />
                            <Area type="monotone" dataKey="fraudulent" stroke="#d5584f" strokeWidth={2} fill="transparent" strokeDasharray="5 4" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </article>

                    <article className="made-c-card panel risk-panel">
                      <div className="panel-heading"><div><h2>Risk distribution</h2><p>Across 1,284 authorizations</p></div></div>
                      <div className="donut"><div><strong>96.8%</strong><span>legitimate</span></div></div>
                      <div className="risk-rows">
                        <div><span><i className="dot legit" />Legitimate</span><strong>1,243 <small>96.8%</small></strong></div>
                        <div><span><i className="dot review" />In review</span><strong>26 <small>2.0%</small></strong></div>
                        <div><span><i className="dot fraud" />Fraudulent</span><strong>15 <small>1.2%</small></strong></div>
                      </div>
                    </article>
                  </section>
                </>
              )}

              <section className="made-c-card panel transaction-panel">
                <div className="transaction-header">
                  <div><h2>{view === "overview" ? "Recent transactions" : "All transactions"}</h2><p>{filtered.length} authorizations matching your view</p></div>
                  <div className="filters">
                    {(["all", "approved", "blocked", "review"] as Filter[]).map((item) => <button key={item} className={`made-c-pill made-c-pill--sm ${filter === item ? "active" : ""}`} onClick={() => setFilter(item)}>{item === "all" ? "All" : statusLabels[item]}</button>)}
                  </div>
                  {view === "overview" && <button className="view-all" onClick={() => setView("transactions")}>View all <CaretRight /></button>}
                </div>
                <div className="table-scroll">
                  <table className="made-c-table">
                    <thead><tr><th>Merchant</th><th>Card / agent</th><th>Date</th><th>Status</th><th>Risk</th><th className="amount">Amount</th><th /></tr></thead>
                    <tbody>{filtered.map((transaction) => (
                      <tr key={transaction.id} onClick={() => setSelected(transaction)}>
                        <td><div className={`merchant-logo logo-${transaction.merchantCode.length}`}>{transaction.merchantCode}</div><div><strong>{transaction.merchant}</strong><small>{transaction.category} · {transaction.location}</small></div></td>
                        <td><strong className="muted-strong">•••• {transaction.cardLast4}</strong><small>{transaction.agent} · {transaction.agentType}</small></td>
                        <td><strong className="muted-strong">{transaction.time}</strong><small>{transaction.date}</small></td>
                        <td><StatusPill status={transaction.status} /></td>
                        <td><div className="risk-score"><span><i style={{ width: `${transaction.riskScore}%` }} className={transaction.riskScore > 80 ? "high" : transaction.riskScore > 60 ? "medium" : "low"} /></span><b>{transaction.riskScore}</b></div></td>
                        <td className="amount"><strong>{money(transaction.amount)}</strong><small>USD</small></td>
                        <td><button className="row-button"><CaretRight /></button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                {view === "transactions" && <div className="made-c-pagination pagination"><span className="made-c-pagination__count">Showing 1–{filtered.length} of 1,284</span><div className="made-c-pagination__controls"><button className="made-c-pagination__button" disabled><CaretLeft /></button><button className="active">1</button><button>2</button><button>3</button><button className="made-c-pagination__button"><CaretRight /></button></div></div>}
              </section>
            </>
          )}
        </div>
      </main>

      {selected && <TransactionDrawer transaction={selected} onClose={() => setSelected(null)} />}
      {toast && <div className={`made-c-toast made-c-toast--${toast}-light toast`}><span className="made-c-toast__icon">{toast === "success" ? <Check weight="bold" /> : <Warning weight="fill" />}</span><div className="made-c-toast__content"><strong>{toast === "success" ? "Policy published" : "Couldn’t publish policy"}</strong><small>{toast === "success" ? "Your new rules are now protecting every card." : "Check the backend connection and try again."}</small></div><button className="made-c-toast__button-close" onClick={() => setToast(null)}><X /></button></div>}
    </div>
  );
}

function Metric({ label, value, trend, positive, icon, spark }: { label: string; value: string; trend: string; positive: boolean; icon: React.ReactNode; spark: "up" | "down" }) {
  return <article className="metric-card"><div className="metric-top"><span>{icon}</span><small>{label}</small></div><div className="metric-value"><strong>{value}</strong><svg viewBox="0 0 80 30"><path d={spark === "up" ? "M2 25 C12 23, 15 16, 25 18 S38 24, 47 14 S62 12, 78 3" : "M2 6 C13 8, 19 3, 27 10 S40 13, 48 16 S63 14, 78 25"} /></svg></div><p className={positive ? "positive" : "neutral"}>{positive ? <TrendUp /> : <TrendDown />} {trend} <span>vs last period</span></p></article>;
}

function PolicyView({ policy, setPolicy, saved, onSave, saving }: { policy: Policy; setPolicy: (policy: Policy) => void; saved: Policy; onSave: () => Promise<void>; saving: boolean }) {
  const dirty = JSON.stringify(policy) !== JSON.stringify(saved);
  return <>
    <section className="page-heading policy-heading"><div><p className="eyebrow">AADVANTAGE® CARD · CONTROL</p><h1>Agent-assisted travel policy</h1><p>Decide how AI travel agents can use members’ AAdvantage cards.</p></div><div className="heading-actions"><button className="made-c-button made-c-button--secondary made-c-button--small button secondary" onClick={() => setPolicy(saved)} disabled={!dirty || saving}>Discard</button><button className="made-c-button made-c-button--primary made-c-button--small button primary" onClick={onSave} disabled={!dirty || saving}><Check />{saving ? "Publishing…" : "Publish changes"}</button></div></section>
    <div className="policy-layout">
      <div className="policy-main">
        <section className="made-c-card panel policy-card">
          <div className="policy-card-heading"><span className="policy-icon"><AirplaneTilt /></span><div><h2>Travel agent permissions</h2><p>Set the baseline for AI-initiated travel purchases.</p></div></div>
          <PolicyRow title="Allow agent-assisted bookings" description="Permit verified AI travel agents to initiate card transactions."><Toggle enabled={policy.agentPurchases} onChange={() => setPolicy({ ...policy, agentPurchases: !policy.agentPurchases })} /></PolicyRow>
          <PolicyRow title="Only allow trusted travel agents" description="Decline purchases from agents outside the American Airlines allowlist."><Toggle enabled={policy.trustedAgentsOnly} onChange={() => setPolicy({ ...policy, trustedAgentsOnly: !policy.trustedAgentsOnly })} /></PolicyRow>
          <div className="limit-row"><div><strong>Maximum agent booking</strong><p>Send higher-value itineraries to manual review.</p></div><label><span>$</span><input type="number" min="1" value={policy.maxAmount} onChange={(event) => setPolicy({ ...policy, maxAmount: Number(event.target.value) })} /><em>USD</em></label></div>
          <div className="made-c-range-slider range-wrap"><input className="made-c-range-slider__range" type="range" min="50" max="2500" step="50" value={policy.maxAmount} onChange={(event) => setPolicy({ ...policy, maxAmount: Number(event.target.value) })} style={{ "--range": `${((policy.maxAmount - 50) / 2450) * 100}%` } as React.CSSProperties} /><div><span>$50</span><span>$2,500</span></div></div>
        </section>
        <section className="made-c-card panel policy-card">
          <div className="policy-card-heading"><span className="policy-icon warning-icon"><ShieldCheck /></span><div><h2>Automatic safeguards</h2><p>Stop suspicious behavior before authorization.</p></div></div>
          <PolicyRow title="Block high-risk transactions" description="Automatically decline when the Sentra risk score is 80 or higher."><Toggle enabled={policy.blockHighRisk} onChange={() => setPolicy({ ...policy, blockHighRisk: !policy.blockHighRisk })} /></PolicyRow>
          <PolicyRow title="Review international itineraries" description="Route agent-booked international travel for additional verification."><Toggle enabled={policy.blockInternational} onChange={() => setPolicy({ ...policy, blockInternational: !policy.blockInternational })} /></PolicyRow>
        </section>
      </div>
      <aside className="made-c-card policy-preview panel"><div className="preview-top"><span><ShieldCheck weight="fill" /></span><small>LIVE PREVIEW</small></div><h2>Your policy at a glance</h2><div className="preview-score"><div><strong>{policy.agentPurchases ? "Balanced" : "Restricted"}</strong><span>Travel agent tolerance</span></div><i>{policy.agentPurchases ? "B" : "D"}</i></div><ul><li><Check />Agent bookings are <strong>{policy.agentPurchases ? "enabled" : "disabled"}</strong></li><li><Check />Booking limit is <strong>{money(policy.maxAmount)}</strong></li><li><Check />Unknown agents are <strong>{policy.trustedAgentsOnly ? "blocked" : "monitored"}</strong></li><li><Check />High-risk activity is <strong>{policy.blockHighRisk ? "blocked" : "reviewed"}</strong></li></ul><div className="preview-note"><Warning weight="fill" /><p><strong>Estimated impact</strong><br />This policy would approve approximately 94.2% of recent agent-assisted bookings.</p></div></aside>
    </div>
  </>;
}

function PolicyRow({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <div className="policy-row"><div><strong>{title}</strong><p>{description}</p></div>{children}</div>;
}

function TransactionDrawer({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) {
  return <><div className="drawer-backdrop" onClick={onClose} /><aside className="drawer"><div className="drawer-head"><div><span>AADVANTAGE CARD TRANSACTION</span><h2>{transaction.id}</h2></div><button onClick={onClose}><X /></button></div><div className="drawer-amount"><div className="merchant-logo">{transaction.merchantCode}</div><div><small>{transaction.merchant}</small><strong>{money(transaction.amount)}</strong></div><StatusPill status={transaction.status} /></div><section><h3>Risk assessment</h3><div className="large-risk"><div className={`risk-number ${transaction.riskScore > 80 ? "danger" : ""}`}>{transaction.riskScore}</div><div><strong>{transaction.riskScore > 80 ? "High risk" : transaction.riskScore > 60 ? "Needs review" : "Low risk"}</strong><p>Sentra confidence score</p></div></div></section><section><h3>Details</h3><dl><div><dt>Initiated by</dt><dd>{transaction.agent}</dd></div><div><dt>Purchaser type</dt><dd>{transaction.agentType}</dd></div><div><dt>Card</dt><dd>AAdvantage Mastercard •••• {transaction.cardLast4}</dd></div><div><dt>Location</dt><dd>{transaction.location}</dd></div><div><dt>Time</dt><dd>{transaction.date}, {transaction.time}</dd></div></dl></section><div className="drawer-actions"><button className="made-c-button made-c-button--secondary made-c-button--small button secondary">Open investigation</button>{transaction.status !== "blocked" && <button className="made-c-button made-c-button--primary made-c-button--small button danger">Block transaction</button>}</div></aside></>;
}
