import { apiFetch, ensureOk } from "./http";

export interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  lineTotal: number;
  stockQuantity: number;
}

export interface CartResponse {
  items: CartItem[];
  total: number;
}

export const cartApi = {
  async getCart() {
    const response = await apiFetch("/cart");
    ensureOk(response, "Failed to load cart");
    return (await response.json()) as CartResponse;
  },

  async addItem(productId: number, quantity = 1) {
    const response = await apiFetch("/cart/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId, quantity }),
    });
    ensureOk(response, "Failed to add product to cart");
    return (await response.json()) as CartResponse;
  },

  async updateQuantity(productId: number, quantity: number) {
    const response = await apiFetch(`/cart/items/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId, quantity }),
    });
    ensureOk(response, "Failed to update cart quantity");
    return (await response.json()) as CartResponse;
  },

  async removeItem(productId: number) {
    const response = await apiFetch(`/cart/items/${productId}`, {
      method: "DELETE",
    });
    ensureOk(response, "Failed to remove product from cart");
  },

  async clearCart() {
    const response = await apiFetch("/cart", {
      method: "DELETE",
    });
    ensureOk(response, "Failed to clear cart");
  },
};
