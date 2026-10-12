export type TransactionStatus = "approved" | "blocked" | "review";

export type Transaction = {
  id: string;
  merchant: string;
  merchantCode: string;
  category: string;
  location: string;
  cardLast4: string;
  agent: string;
  agentType: "AI agent" | "Human";
  amount: number;
  time: string;
  date: string;
  status: TransactionStatus;
  riskScore: number;
};

export type Policy = {
  agentPurchases: boolean;
  maxAmount: number;
  trustedAgentsOnly: boolean;
  blockHighRisk: boolean;
  blockInternational: boolean;
};
