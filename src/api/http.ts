import { API_BASE_URL } from "./client";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch(path: string, init?: RequestInit) {
  const doFetch = () =>
    fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
      mode: "cors",
      ...init,
    });

  const response = await doFetch();
  if (response.status !== 401) {
    return response;
  }

  const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    mode: "cors",
  });

  if (!refreshResponse.ok) {
    return response;
  }

  return doFetch();
}

export function ensureOk(response: Response, message: string) {
  if (!response.ok) {
    throw new ApiError(message, response.status);
  }

  return response;
}
