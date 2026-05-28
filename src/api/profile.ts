import { apiFetch, ensureOk } from "./http";

export interface Profile {
  id: number;
  lastName: string;
  firstName: string;
  middleName: string | null;
  login: string;
  email: string | null;
}

export interface ProfileUpdatePayload {
  lastName: string;
  firstName: string;
  middleName: string | null;
}

export const profileApi = {
  async getMyProfile(): Promise<Profile | null> {
    const response = await apiFetch("/profile/me");

    if (response.status === 401) {
      return null;
    }

    ensureOk(response, "Failed to load profile");
    return (await response.json()) as Profile;
  },

  async updateMyProfile(payload: ProfileUpdatePayload): Promise<Profile> {
    const response = await apiFetch("/profile/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    ensureOk(response, "Failed to update profile");
    return (await response.json()) as Profile;
  },

  async deleteMyProfile(): Promise<void> {
    const response = await apiFetch("/profile/me", {
      method: "DELETE",
    });

    ensureOk(response, "Failed to delete profile");
  },
};
