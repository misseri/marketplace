package com.marketplace.product.service;

public record ProductReviewSummary(
        Integer productId,
        Double averageRating,
        Long reviewCount
) {
    public static ProductReviewSummary empty(Integer productId) {
        return new ProductReviewSummary(productId, 0.0, 0L);
    }
}
