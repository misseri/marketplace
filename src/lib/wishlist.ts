import { apiFetch } from "./api";

export type WishlistItem = {
  wishlistItemId: number;
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

export type WishlistStatus = {
  wishlistItemId: number | null;
  productId: number;
  inWishlist: boolean;
};

export type WishlistPage = {
  content: WishlistItem[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
};

export async function getWishlist(page = 0, size = 12) {
  const response = await apiFetch(`/wishlist?page=${page}&size=${size}`);
  if (!response.ok) {
    throw new Error("Failed to load wishlist");
  }

  return (await response.json()) as WishlistPage;
}

export async function getWishlistStatus(productId: number) {
  const response = await apiFetch(`/wishlist/${productId}/status`);
  if (!response.ok) {
    throw new Error("Failed to load wishlist status");
  }

  return (await response.json()) as WishlistStatus;
}

export async function addToWishlist(productId: number) {
  const response = await apiFetch(`/wishlist/${productId}`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to add product to wishlist");
  }

  return (await response.json()) as WishlistStatus;
}

export async function removeFromWishlist(productId: number) {
  const response = await apiFetch(`/wishlist/${productId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to remove product from wishlist");
  }

  return (await response.json()) as WishlistStatus;
}
