/**
 * SahajCredit API configuration.
 * Returns base URL for the backend API Gateway.
 * In development, defaults to http://127.0.0.1:8000.
 * In production, uses NEXT_PUBLIC_API_URL configured in Vercel.
 */
export const getApiBaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (url && url.trim() !== "") {
    return url.replace(/\/+$/, "");
  }
  return "http://127.0.0.1:8000";
};
