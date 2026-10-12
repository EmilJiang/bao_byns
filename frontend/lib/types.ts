export type TransactionStatus = "approved" | "blocked" | "review";

export type Transaction = {
  id: string;
  merchant: string;
  merchantCode: string;
  category: string;
  location: string;
  cardLast4: string;
  agent: string;
  agentType: "AI agent" | "Human" | "Unknown";
  amount: number;
  currency?: string;
  reasons?: string[];
  engine?: string;
  time: string;
  date: string;
  status: TransactionStatus;
  riskScore: number;
};

export type Policy = {
  riskThreshold: number;
  agentPurchases: boolean;
  maxAmount: number;
  trustedAgentsOnly: boolean;
  blockHighRisk: boolean;
  blockInternational: boolean;
};
