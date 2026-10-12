import { apiRequest } from "./client";
import { BRAND_ID, getApiBaseUrl } from "@/lib/config";
import { defaultPolicy } from "@/lib/mock-data";
import type { Policy } from "@/lib/types";

type PolicyResponse = {
  data: Policy;
  meta: { brandId: string; updatedAt: string };
};

export async function getPolicy(): Promise<Policy> {
  if (!getApiBaseUrl()) return Promise.resolve(defaultPolicy);

  const response = await apiRequest<PolicyResponse>(
    `/api/v1/brands/${BRAND_ID}/policy`,
  );
  return response.data;
}

export async function publishPolicy(policy: Policy): Promise<Policy> {
  if (!getApiBaseUrl()) {
    await new Promise((resolve) => window.setTimeout(resolve, 250));
    return policy;
  }

  const response = await apiRequest<PolicyResponse>(
    `/api/v1/brands/${BRAND_ID}/policy`,
    { method: "PUT", body: JSON.stringify(policy) },
  );
  return response.data;
}
