from .models import Policy, Transaction


TRANSACTIONS = [
    Transaction(id="AA-94821", merchant="Marriott Bonvoy", merchantCode="MB", category="Hotels", location="Miami, US", cardLast4="3187", agent="Kayak AI", agentType="AI agent", amount=384.20, time="10:42 AM", date="Today", status="approved", riskScore=12),
    Transaction(id="AA-94820", merchant="SkyLux Tickets", merchantCode="ST", category="Air travel", location="Online", cardLast4="6624", agent="Unknown travel bot", agentType="AI agent", amount=2248.00, time="10:31 AM", date="Today", status="blocked", riskScore=94),
    Transaction(id="AA-94819", merchant="Hertz", merchantCode="HZ", category="Car rental", location="Dallas, US", cardLast4="3187", agent="Google Trip Planner", agentType="AI agent", amount=232.45, time="9:58 AM", date="Today", status="approved", riskScore=18),
    Transaction(id="AA-94818", merchant="American Airlines", merchantCode="AA", category="Air travel", location="DFW Airport, US", cardLast4="1058", agent="Elena Rodriguez", agentType="Human", amount=896.00, time="9:17 AM", date="Today", status="approved", riskScore=4),
    Transaction(id="AA-94817", merchant="Global Fare Center", merchantCode="GF", category="Travel agency", location="Singapore, SG", cardLast4="6624", agent="AutoTrip GPT", agentType="AI agent", amount=1784.99, time="8:46 AM", date="Today", status="review", riskScore=71),
    Transaction(id="AA-94816", merchant="Admirals Club", merchantCode="AC", category="Airport lounge", location="Chicago, US", cardLast4="3187", agent="Elena Rodriguez", agentType="Human", amount=79.00, time="8:22 AM", date="Today", status="approved", riskScore=2),
    Transaction(id="AA-94815", merchant="Uber", merchantCode="UB", category="Ground transport", location="New York, US", cardLast4="4409", agent="Expedia Romie", agentType="AI agent", amount=87.64, time="7:54 AM", date="Today", status="approved", riskScore=21),
    Transaction(id="AA-94814", merchant="Miles Exchange", merchantCode="MX", category="Rewards marketplace", location="Online", cardLast4="6624", agent="Unverified agent", agentType="AI agent", amount=750.00, time="7:28 AM", date="Today", status="blocked", riskScore=98),
]

DEFAULT_POLICY = Policy(
    agentPurchases=True,
    maxAmount=750,
    trustedAgentsOnly=False,
    blockHighRisk=True,
    blockInternational=False,
)

POLICIES: dict[str, Policy] = {"american-airlines": DEFAULT_POLICY}
