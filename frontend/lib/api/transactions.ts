import { apiRequest } from "./client";
import { BRAND_ID, getApiBaseUrl } from "@/lib/config";
import { transactions as mockTransactions } from "@/lib/mock-data";
import type { Transaction } from "@/lib/types";

type TransactionListResponse = {
  data: Transaction[];
  meta: { total: number; brandId: string };
};

export async function getTransactions(): Promise<Transaction[]> {
  if (!getApiBaseUrl()) return Promise.resolve(mockTransactions);

  const response = await apiRequest<TransactionListResponse>(
    `/api/v1/brands/${BRAND_ID}/transactions`,
  );
  return response.data;
}
