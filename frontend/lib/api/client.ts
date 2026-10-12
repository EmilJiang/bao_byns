import { getApiBaseUrl } from "@/lib/config";

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: init?.cache ?? "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}
