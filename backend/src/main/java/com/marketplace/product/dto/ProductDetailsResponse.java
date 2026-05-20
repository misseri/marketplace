package com.marketplace.product.dto;

import com.marketplace.characteristic.dto.ProductCharacteristicResponse;

import java.math.BigDecimal;
import java.util.List;

public record ProductDetailsResponse(
        Integer id,
        String name,
        String description,
        boolean active,
        Integer categoryId,
        String categoryName,
        Integer sellerId,
        String sellerName,
        BigDecimal sellerRating,
        BigDecimal currentPrice,
        Integer stockQuantity,
        Double averageRating,
        Long reviewCount,
        List<ProductCharacteristicResponse> characteristics
) {
}
