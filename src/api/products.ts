import { API_BASE_URL } from "./client";

export interface Product {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  categoryName: string;
  sellerId: number;
  sellerName: string;
  sellerRating: number | null;
  currentPrice: number | null;
  stockQuantity: number;
  averageRating: number;
  reviewCount: number;
}

export const productsApi = {
  async getProducts(params: {
    query?: string;
    categoryId?: string | null;
    page?: number;
    size?: number;
    signal?: AbortSignal;
  }): Promise<Product[]> {
    const url = new URL(`${API_BASE_URL}/products`);
    url.searchParams.set("page", String(params.page ?? 0));
    url.searchParams.set("size", String(params.size ?? 24));

    if (params.query?.trim()) {
      url.searchParams.set("query", params.query.trim());
    }

    if (params.categoryId) {
      url.searchParams.set("categoryId", params.categoryId);
    }

    const response = await fetch(url.toString(), {
      credentials: "include",
      mode: "cors",
      signal: params.signal,
    });

    if (!response.ok) {
      return [];
    }

    const data: unknown = await response.json();
    if (Array.isArray(data)) {
      return data as Product[];
    }

    if (
      typeof data === "object" &&
      data !== null &&
      "content" in data &&
      Array.isArray((data as { content?: unknown }).content)
    ) {
      return (data as { content: Product[] }).content;
    }

    return [];
  },
};
