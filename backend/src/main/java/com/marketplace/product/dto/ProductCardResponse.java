package com.marketplace.product.dto;

import java.math.BigDecimal;

public record ProductCardResponse(
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
