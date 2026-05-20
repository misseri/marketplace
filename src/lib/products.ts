export type ApiProduct = {
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
};

type ProductsResponse = {
  content?: ApiProduct[];
};

export async function searchProducts(searchQuery: string) {
  const url = new URL("/products", "http://localhost:8080");
  url.searchParams.set("page", "0");
  url.searchParams.set("size", "24");

  const trimmedQuery = searchQuery.trim();
  if (trimmedQuery) {
    url.searchParams.set("query", trimmedQuery);
  }

  const response = await fetch(url.toString(), {
    credentials: "include",
    mode: "cors",
  });

  if (!response.ok) {
    return [];
  }

  const data: ProductsResponse | ApiProduct[] = await response.json();
  return Array.isArray(data) ? data : (data.content ?? []);
}
