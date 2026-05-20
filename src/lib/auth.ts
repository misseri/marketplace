import { apiFetch } from "./api";

export type AuthUser = {
  id: number;
  login: string;
  roles: string[];
};

export async function getCurrentUser() {
  const response = await apiFetch("/auth/whoami");

  if (!response.ok) {
    return null;
  }

  const user = (await response.json()) as AuthUser;
  return user;
}

export function startGoogleLogin() {
  window.location.href = "http://localhost:8080/oauth2/authorization/google";
}

export async function logout() {
  await apiFetch("/auth/logout", {
    method: "POST",
  });
}
