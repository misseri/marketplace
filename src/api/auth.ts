import { API_BASE_URL } from "./client";
import { apiFetch } from "./http";

export interface AuthUser {
  id: number;
  login: string;
  roles: string[];
}

export const authApi = {
  async getCurrentUser(): Promise<AuthUser | null> {
    const response = await apiFetch("/auth/whoami");

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as AuthUser;
  },

  loginWithGoogle() {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  },

  async logout(): Promise<void> {
    await apiFetch("/auth/logout", {
      method: "POST",
    });
  },
};
