// Утилита для работы с данными пользователя в localStorage

export interface User {
  id: string;
  name: string;
  email: string;
  image: string;
}

const STORAGE_KEY = "marketplace_user";

export const authStorage = {
  // Сохранить пользователя в localStorage
  setUser(user: User): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
  },

  // Получить пользователя из localStorage
  getUser(): User | null {
    if (typeof window === "undefined") {
      return null;
    }
    const userStr = localStorage.getItem(STORAGE_KEY);
    if (!userStr) {
      return null;
    }
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  // Удалить пользователя из localStorage
  removeUser(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  // Проверить, авторизован ли пользователь
  isAuthenticated(): boolean {
    return this.getUser() !== null;
  },
};
