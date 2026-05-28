import { apiFetch, ensureOk } from "./http";

export interface WishlistItem {
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
}

export interface WishlistStatus {
  wishlistItemId: number | null;
  productId: number;
  inWishlist: boolean;
}

export interface WishlistPage {
  content: WishlistItem[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export const wishlistApi = {
  async getWishlist(page = 0, size = 12) {
    const response = await apiFetch(`/wishlist?page=${page}&size=${size}`);
    ensureOk(response, "Failed to load wishlist");
    return (await response.json()) as WishlistPage;
  },

  async getWishlistStatus(productId: number) {
    const response = await apiFetch(`/wishlist/${productId}/status`);
    ensureOk(response, "Failed to load wishlist status");
    return (await response.json()) as WishlistStatus;
  },

  async addToWishlist(productId: number) {
    const response = await apiFetch(`/wishlist/${productId}`, {
      method: "POST",
    });
    ensureOk(response, "Failed to add product to wishlist");
    return (await response.json()) as WishlistStatus;
  },

  async removeFromWishlist(productId: number) {
    const response = await apiFetch(`/wishlist/${productId}`, {
      method: "DELETE",
    });
    ensureOk(response, "Failed to remove product from wishlist");
    return (await response.json()) as WishlistStatus;
  },
};
