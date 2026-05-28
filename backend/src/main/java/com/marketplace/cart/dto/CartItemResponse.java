package com.marketplace.cart.dto;

import java.math.BigDecimal;

public record CartItemResponse(
        Integer productId,
        String productName,
        Integer quantity,
        BigDecimal price,
        BigDecimal lineTotal,
        Integer stockQuantity
) {
}
