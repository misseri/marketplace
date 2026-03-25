package com.marketplace.product.dto;

import java.math.BigDecimal;

public record ProductSearchRequest(
        String query,
        Integer categoryId,
        Integer sellerId,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        Boolean inStock
) {
}
