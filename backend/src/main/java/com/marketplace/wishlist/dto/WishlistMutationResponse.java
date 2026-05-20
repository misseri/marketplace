package com.marketplace.wishlist.dto;

public record WishlistMutationResponse(
        Integer wishlistItemId,
        Integer productId,
        boolean inWishlist
) {
}
