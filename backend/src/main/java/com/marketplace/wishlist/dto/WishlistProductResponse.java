package com.marketplace.wishlist.dto;

import java.math.BigDecimal;

public record WishlistProductResponse(
        Integer wishlistItemId,
        Integer id,
        String name,
        String description,
        Integer categoryId,
        String categoryName,
        Integer sellerId,
        String sellerName,
        BigDecimal sellerRating,
        BigDecimal currentPrice,
        Integer stockQuantity,
        Double averageRating,
        Long reviewCount
) {
}
