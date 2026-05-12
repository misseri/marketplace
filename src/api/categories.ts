import { apiClient } from "./client";

export interface Category {
  id: number;
  name: string;
  parentId: number | null;
  hasChildren: boolean;
}

export interface CategoryPage {
  content: Category[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const categoriesApi = {
  async getCategories(params?: {
    parentId?: number;
    page?: number;
    size?: number;
  }): Promise<CategoryPage> {
    const { data } = await apiClient.get<CategoryPage>(
      `/categories/${params?.parentId ?? 0}`,
      {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 20,
        },
      },
    );
    return data;
  },

  async getRootCategories(): Promise<Category[]> {
    const data = await this.getCategories({ parentId: 0, size: 100 });
    return data.content;
  },

  async getChildCategories(parentId: number): Promise<Category[]> {
    const data = await this.getCategories({ parentId, size: 100 });
    return data.content;
  },
};
