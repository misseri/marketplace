import { apiClient } from "./client";

export interface Category {
  id: number;
  name: string;
  parentId: number | null;
  hasChildren: boolean;
}

export const categoriesApi = {
  async getRootCategories(): Promise<Category[]> {
    const { data } = await apiClient.get<Category[]>("/categories/root");
    return data;
  },

  async getChildCategories(parentId: number): Promise<Category[]> {
    const { data } = await apiClient.get<Category[]>(
      `/categories/${parentId}/children`,
    );
    return data;
  },
};
