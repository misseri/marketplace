export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export function buildApiUrl(path: string) {
  return new URL(path, API_BASE_URL).toString();
}

export async function apiFetch(path: string, init?: RequestInit) {
  return fetch(buildApiUrl(path), {
    credentials: "include",
    mode: "cors",
    ...init,
  });
}
