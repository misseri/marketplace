import { API_BASE_URL } from "./client";

export interface AuthUser {
  id?: number;
  email?: string;
  name?: string;
}

export const authApi = {
  async getCurrentUser(): Promise<AuthUser | null> {
    const response = await fetch(`${API_BASE_URL}/auth/whoami`, {
      credentials: "include",
      mode: "cors",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as AuthUser;
  },

  loginWithGoogle() {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  },

  async logout(): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  },
};
