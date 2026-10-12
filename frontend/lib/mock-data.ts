import type { Policy, Transaction } from "./types";

export const defaultPolicy: Policy = {
  agentPurchases: true,
  maxAmount: 750,
  trustedAgentsOnly: false,
  blockHighRisk: true,
  blockInternational: false,
};

export const transactions: Transaction[] = [
  { id: "AA-94821", merchant: "Marriott Bonvoy", merchantCode: "MB", category: "Hotels", location: "Miami, US", cardLast4: "3187", agent: "Kayak AI", agentType: "AI agent", amount: 384.2, time: "10:42 AM", date: "Today", status: "approved", riskScore: 12 },
  { id: "AA-94820", merchant: "SkyLux Tickets", merchantCode: "ST", category: "Air travel", location: "Online", cardLast4: "6624", agent: "Unknown travel bot", agentType: "AI agent", amount: 2248.0, time: "10:31 AM", date: "Today", status: "blocked", riskScore: 94 },
  { id: "AA-94819", merchant: "Hertz", merchantCode: "HZ", category: "Car rental", location: "Dallas, US", cardLast4: "3187", agent: "Google Trip Planner", agentType: "AI agent", amount: 232.45, time: "9:58 AM", date: "Today", status: "approved", riskScore: 18 },
  { id: "AA-94818", merchant: "American Airlines", merchantCode: "AA", category: "Air travel", location: "DFW Airport, US", cardLast4: "1058", agent: "Elena Rodriguez", agentType: "Human", amount: 896.0, time: "9:17 AM", date: "Today", status: "approved", riskScore: 4 },
  { id: "AA-94817", merchant: "Global Fare Center", merchantCode: "GF", category: "Travel agency", location: "Singapore, SG", cardLast4: "6624", agent: "AutoTrip GPT", agentType: "AI agent", amount: 1784.99, time: "8:46 AM", date: "Today", status: "review", riskScore: 71 },
  { id: "AA-94816", merchant: "Admirals Club", merchantCode: "AC", category: "Airport lounge", location: "Chicago, US", cardLast4: "3187", agent: "Elena Rodriguez", agentType: "Human", amount: 79.0, time: "8:22 AM", date: "Today", status: "approved", riskScore: 2 },
  { id: "AA-94815", merchant: "Uber", merchantCode: "UB", category: "Ground transport", location: "New York, US", cardLast4: "4409", agent: "Expedia Romie", agentType: "AI agent", amount: 87.64, time: "7:54 AM", date: "Today", status: "approved", riskScore: 21 },
  { id: "AA-94814", merchant: "Miles Exchange", merchantCode: "MX", category: "Rewards marketplace", location: "Online", cardLast4: "6624", agent: "Unverified agent", agentType: "AI agent", amount: 750.0, time: "7:28 AM", date: "Today", status: "blocked", riskScore: 98 },
];

export const weeklyVolume = [
  { day: "Mon", legitimate: 12800, fraudulent: 1200 },
  { day: "Tue", legitimate: 15400, fraudulent: 1800 },
  { day: "Wed", legitimate: 13700, fraudulent: 900 },
  { day: "Thu", legitimate: 18200, fraudulent: 2100 },
  { day: "Fri", legitimate: 16800, fraudulent: 1400 },
  { day: "Sat", legitimate: 11800, fraudulent: 700 },
  { day: "Sun", legitimate: 14600, fraudulent: 1100 },
];
