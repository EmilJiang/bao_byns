export const BRAND_ID = process.env.NEXT_PUBLIC_BRAND_ID ?? "american-airlines";

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";
}
